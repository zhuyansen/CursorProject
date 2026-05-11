#!/usr/bin/env python3
"""
Every run (e.g. cron every 8h):
  - Load English source handles from en_sources_by_category.json (categories with non-empty lists)
  - Fetch last tweets per user via twitterapi.io last_tweets
  - Among tweets not yet posted (state file), filter by freshness, English, views, followers, AI relevance
  - Pick top N by viewCount
  - Post to Discord with a short GoSailGlobal-style Chinese lead + links

Env: TWITTERAPI_KEY
Config: config.json → discord_webhook_url (or DISCORD_WEBHOOK_URL)
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

_script_path = Path(__file__).resolve()
_scripts_dir = _script_path.parent.parent if _script_path.parent.name == "source_watch" else _script_path.parent
_scripts_str = str(_scripts_dir)
if _scripts_str not in sys.path:
    sys.path.insert(0, _scripts_str)

from local_env_file import activate_script_env

activate_script_env(_script_path)

_sw_dir = str(Path(__file__).resolve().parent)
if _sw_dir not in sys.path:
    sys.path.insert(0, _sw_dir)

from tweet_media_utils import enrich_batch_items

_DISCORD_HEADERS = {
    "User-Agent": "curl/8.5.0",
    "Content-Type": "application/json",
}

SCRIPT_DIR = Path(__file__).resolve().parent
SOURCES_JSON = SCRIPT_DIR / "en_sources_by_category.json"
DEFAULT_CONFIG = SCRIPT_DIR / "config.json"
STATE_PATH = SCRIPT_DIR / "en_digest_posted_ids.json"
BATCH_PATH = SCRIPT_DIR / "en_digest_last_batch.json"
API = "https://api.twitterapi.io/twitter/user/last_tweets"
LIST_MEMBERS_API = "https://api.twitterapi.io/twitter/list/members"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _save_json(path: Path, data: dict | list) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _post_discord(webhook: str, content: str) -> None:
    body = json.dumps({"content": content[:1990]}).encode("utf-8")
    req = urllib.request.Request(webhook, data=body, headers=dict(_DISCORD_HEADERS), method="POST")
    with urllib.request.urlopen(req, timeout=45) as resp:
        resp.read()


def _fetch_user_tweets(api_key: str, username: str, include_replies: bool, limit: int) -> list[dict]:
    q = urllib.parse.urlencode(
        {
            "userName": username,
            "includeReplies": "true" if include_replies else "false",
        }
    )
    url = f"{API}?{q}"
    req = urllib.request.Request(url, headers={"X-API-Key": api_key})
    with urllib.request.urlopen(req, timeout=90) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    data = body.get("data") or body
    tweets = data.get("tweets") or []
    return tweets[:limit]


def _fetch_list_members(api_key: str, list_id: str, limit: int) -> list[dict]:
    members: list[dict] = []
    cursor = ""
    while len(members) < limit:
        q = {"list_id": list_id}
        if cursor:
            q["cursor"] = cursor
        url = f"{LIST_MEMBERS_API}?{urllib.parse.urlencode(q)}"
        req = urllib.request.Request(url, headers={"X-API-Key": api_key, "User-Agent": "curl/8.5.0"})
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        rows = body.get("members") or body.get("data") or []
        if not rows:
            break
        members.extend([r for r in rows if isinstance(r, dict)])
        if not body.get("has_next_page"):
            break
        cursor = str(body.get("next_cursor") or "").strip()
        if not cursor:
            break
        time.sleep(0.2)
    return members[:limit]


def _parse_twitter_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%a %b %d %H:%M:%S %z %Y")
    except ValueError:
        return None


def _lead_cn(tweet: dict) -> str:
    """One-line Chinese cue for repost account (template, not machine translation of full text)."""
    text = (tweet.get("text") or "").replace("\n", " ").strip()[:160]
    author = (tweet.get("author") or {}).get("userName") or "?"
    if not text:
        return f"@{author} 更新了一条动态，可看原文。"
    return f"【搬运候选】@{author} 这条在海外圈里在传 —— 要点我用自己的话会放在正式发推里；先存原文：{text}"


def _author_username(tweet: dict) -> str:
    return str((tweet.get("author") or {}).get("userName") or "").lstrip("@")


def _author_followers(tweet: dict) -> int:
    author = tweet.get("author") or {}
    for key in ("followers", "followersCount", "followerCount"):
        try:
            return int(author.get(key) or 0)
        except (TypeError, ValueError):
            continue
    return 0


def _contains_any_keyword(text: str, keywords: list[str]) -> bool:
    low = (text or "").lower()
    return any(str(k).lower() in low for k in keywords if str(k).strip())


def _collect_handles(bundle: dict) -> tuple[list[str], dict[str, str]]:
    labels = bundle.get("category_labels") or {}
    handles: list[str] = []
    seen: set[str] = set()
    cat_map: dict[str, str] = {}
    for key, values in bundle.items():
        if key in {"meta", "category_labels", "x_lists"} or not isinstance(values, list):
            continue
        cat = str(labels.get(key) or key)
        for h in values:
            u = str(h).lstrip("@").strip()
            if not u:
                continue
            lu = u.lower()
            if lu not in seen:
                handles.append(u)
                seen.add(lu)
            cat_map[lu] = cat
    return handles, cat_map


def _fetch_list_members(api_key: str, list_id: str, max_pages: int = 10) -> list[dict]:
    members: list[dict] = []
    cursor = ""
    for _ in range(max_pages):
        q = {"list_id": list_id}
        if cursor:
            q["cursor"] = cursor
        url = "https://api.twitterapi.io/twitter/list/members?" + urllib.parse.urlencode(q)
        req = urllib.request.Request(url, headers={"X-API-Key": api_key, "User-Agent": "curl/8.5.0"})
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        page = body.get("members") or body.get("data") or []
        if isinstance(page, list):
            members.extend([m for m in page if isinstance(m, dict)])
        if not body.get("has_next_page"):
            break
        cursor = str(body.get("next_cursor") or "").strip()
        if not cursor:
            break
    return members


def _extend_handles_from_lists(
    *,
    api_key: str,
    bundle: dict,
    handles: list[str],
    cat_map: dict[str, str],
    max_followers: int,
    authority_allowlist: set[str],
) -> tuple[list[str], int, list[str]]:
    seen = {h.lower() for h in handles}
    added = 0
    errors: list[str] = []
    labels = bundle.get("category_labels") or {}
    for row in bundle.get("x_lists") or []:
        if not isinstance(row, dict):
            continue
        list_id = str(row.get("id") or "").strip()
        if not list_id:
            continue
        label = str(row.get("label") or labels.get("x_lists") or "X List扩展")
        max_pages = int(row.get("max_pages") or 10)
        try:
            members = _fetch_list_members(api_key, list_id, max_pages=max_pages)
        except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
            errors.append(f"list:{list_id} {e}")
            continue
        for m in members:
            u = str(m.get("userName") or "").strip().lstrip("@")
            if not u:
                continue
            lu = u.lower()
            if lu in seen:
                continue
            followers = int(m.get("followers") or m.get("followersCount") or 0)
            if max_followers > 0 and lu not in authority_allowlist and followers > max_followers:
                continue
            handles.append(u)
            seen.add(lu)
            cat_map[lu] = label
            added += 1
    return handles, added, errors


def main() -> None:
    api_key = os.environ.get("TWITTERAPI_KEY", "").strip()
    if not api_key:
        raise SystemExit("Set TWITTERAPI_KEY")

    cfg_path = Path(os.environ.get("SOURCE_WATCH_CONFIG", str(DEFAULT_CONFIG)))
    if len(sys.argv) > 1:
        cfg_path = Path(sys.argv[1])

    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook and cfg_path.is_file():
        cfg = _load_json(cfg_path)
        webhook = (cfg.get("discord_webhook_url") or "").strip()
    if not webhook or "0000000000" in webhook or "xxxxxxxx" in webhook:
        raise SystemExit("Need DISCORD_WEBHOOK_URL (env or config.json: discord_webhook_url)")

    if not SOURCES_JSON.is_file():
        raise SystemExit(f"Missing {SOURCES_JSON}")

    bundle = _load_json(SOURCES_JSON)
    meta = bundle.get("meta") or {}
    top_n = int(os.environ.get("SOURCE_WATCH_TOP_N") or meta.get("top_n", 10))
    prefer_en = bool(meta.get("prefer_lang", True))
    include_replies = bool(meta.get("include_replies", False))
    per_user = int(meta.get("max_tweets_per_user", 12))
    window_hours = float(os.environ.get("SOURCE_WATCH_WINDOW_HOURS") or meta.get("window_hours", 8))
    min_views = int(os.environ.get("SOURCE_WATCH_MIN_VIEW_COUNT") or meta.get("min_view_count", 0))
    max_followers = int(os.environ.get("SOURCE_WATCH_MAX_AUTHOR_FOLLOWERS") or meta.get("max_author_followers", 0))
    authority_allowlist = {str(x).lower().lstrip("@") for x in meta.get("authority_allowlist", [])}
    keywords = [str(x).lower() for x in meta.get("ai_keywords", []) if str(x).strip()]

    handles, cat_map = _collect_handles(bundle)
    handles, added_from_lists, list_errors = _extend_handles_from_lists(
        api_key=api_key,
        bundle=bundle,
        handles=handles,
        cat_map=cat_map,
        max_followers=max_followers,
        authority_allowlist=authority_allowlist,
    )

    posted: set[str] = set()
    if STATE_PATH.is_file():
        posted = set(_load_json(STATE_PATH))

    all_tweets: dict[str, dict] = {}
    errors: list[str] = []
    errors.extend(list_errors)

    rate_delay = float(os.environ.get("SOURCE_WATCH_RATE_DELAY", "0.4"))
    for i, user in enumerate(handles):
        attempt = 0
        backoff = 1.0
        while True:
            attempt += 1
            try:
                tws = _fetch_user_tweets(api_key, user, include_replies, per_user)
                break
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < 4:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                errors.append(f"@{user} HTTP {e.code}")
                tws = []
                break
            except urllib.error.URLError as e:
                errors.append(f"@{user} {e}")
                tws = []
                break
        for t in tws:
            tid = str(t.get("id") or "")
            if not tid:
                continue
            au = (t.get("author") or {}).get("userName") or user
            if str(au).lower() != user.lower():
                continue
            if tid not in all_tweets:
                all_tweets[tid] = t
        time.sleep(rate_delay)
        if (i + 1) % 20 == 0:
            time.sleep(rate_delay * 2)

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=window_hours)

    def in_window(t: dict) -> bool:
        dt = _parse_twitter_time(t.get("createdAt"))
        if dt is None:
            return True
        return dt >= cutoff

    fresh = [t for tid, t in all_tweets.items() if tid not in posted and in_window(t)]

    def passes_filters(t: dict) -> bool:
        au = _author_username(t).lower()
        if str(t.get("lang") or "").lower() != "en":
            return False
        if int(t.get("viewCount") or 0) < min_views:
            return False
        if max_followers > 0 and au not in authority_allowlist:
            followers = _author_followers(t)
            if followers > max_followers:
                return False
        if keywords and not _contains_any_keyword(t.get("text") or "", keywords):
            return False
        return True

    filtered = [t for t in fresh if passes_filters(t)]
    en_f = filtered
    non_f: list[dict] = []

    def by_view(t: dict) -> int:
        return int(t.get("viewCount") or 0)

    en_f.sort(key=by_view, reverse=True)
    non_f.sort(key=by_view, reverse=True)
    if prefer_en:
        pool = en_f + [t for t in non_f if t not in en_f]
    else:
        pool = filtered
        pool.sort(key=by_view, reverse=True)
    pick = pool[:top_n]

    window_label = now.strftime("%Y-%m-%d %H:%M UTC")
    header = (
        f"🌊 **【GoSailGlobal 搬运池 · 近{int(window_hours)}h 英文热帖】** `{window_label}`\n"
        f"扫描 **{len(handles)}** 个信源号，本轮窗口内新帖 **{len(fresh)}** 条（未在 Discord 记录过）；"
        f"过滤后 **{len(filtered)}** 条；取 **浏览 Top{top_n}**。\n"
        f"过滤：`lang=en` · 近 `{int(window_hours)}h` · 👁 ≥ `{min_views:,}` · "
        f"粉丝 ≤ `{max_followers:,}` · AI/工具关键词命中。\n"
        "发推时请 **转述成你的口吻** + 图/视频另做中文字幕或重制图。"
    )
    if errors:
        header += "\n⚠️ 部分账号拉取失败: " + "; ".join(errors[:5])

    _post_discord(webhook, header)
    time.sleep(0.5)

    if not pick:
        _post_discord(
            webhook,
            "（本轮没有符合条件的低粉英文 AI 热帖：12h / >100k views / <50k followers / AI关键词。下轮再试。）",
        )
        _save_json(
            BATCH_PATH,
            {"window_label": window_label, "window_hours": window_hours, "items": []},
        )
        print("No new tweets to post.", flush=True)
        return

    batch_items = []
    for rank, t in enumerate(pick, 1):
        tid = str(t.get("id") or "")
        batch_items.append(
            {
                "rank": rank,
                "id": tid,
                "url": t.get("url") or "",
                "author": (t.get("author") or {}).get("userName") or "",
                "lang": t.get("lang") or "",
                "viewCount": int(t.get("viewCount") or 0),
                "category": cat_map.get(((t.get("author") or {}).get("userName") or "").lower(), "其它"),
                "text": t.get("text") or "",
            }
        )
    batch_items = enrich_batch_items(batch_items, api_key)
    _save_json(
        BATCH_PATH,
        {"window_label": window_label, "window_hours": window_hours, "items": batch_items},
    )

    for rank, t in enumerate(pick, 1):
        tid = str(t.get("id") or "")
        url = t.get("url") or ""
        u = (t.get("author") or {}).get("userName") or "?"
        v = int(t.get("viewCount") or 0)
        lg = t.get("lang") or "?"
        cat = cat_map.get(u.lower(), "其它")
        lead = _lead_cn(t)
        block = (
            f"**Top{rank}** · `{cat}` · `lang={lg}` · 👁 `{v:,}`\n"
            f"{lead}\n"
            f"{url}"
        )
        _post_discord(webhook, block)
        posted.add(tid)
        time.sleep(0.45)

    posted_list = list(posted)
    if len(posted_list) > 4000:
        posted_list = posted_list[-4000:]
    _save_json(STATE_PATH, posted_list)

    print(f"Posted {len(pick)} tweets to Discord; state={len(posted_list)} ids", flush=True)


if __name__ == "__main__":
    main()
