#!/usr/bin/env python3
"""
Collect up to ~90 days of tweets per user via twitterapi.io advanced_search,
then summarize hit tweets and information sources.

Requires: TWITTERAPI_KEY in environment (header X-API-Key).

Optional argv: usernames to re-fetch only (merge into existing tweets_90d.jsonl + summary).
  Example: python3 twitterapi_90d_research.py op7418
  No argv: full refresh of DEFAULT_USERS (berryxia, AYi_AInotes, dotey, lxfater, op7418).

Docs: GET /twitter/tweet/advanced_search — use since_time/until_time in query;
      avoid relying on cursor; keep windows small enough to not miss >20 tweets/window.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any


API_BASE = "https://api.twitterapi.io"
DEFAULT_USERS = ("berryxia", "AYi_AInotes", "dotey", "lxfater", "op7418", "gosailglobal")


def _epoch_utc(dt: datetime) -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp())


def _parse_created_at(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in (
        "%a %b %d %H:%M:%S %z %Y",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
    ):
        try:
            return datetime.strptime(value.replace("Z", "+00:00"), fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _host(url: str) -> str | None:
    if not url:
        return None
    try:
        p = urllib.parse.urlparse(url)
        host = (p.netloc or "").lower()
        if host.startswith("www."):
            host = host[4:]
        return host or None
    except Exception:
        return None


def _request(path: str, params: dict[str, str], api_key: str) -> dict[str, Any]:
    query = urllib.parse.urlencode(params, safe=":+%")
    url = f"{API_BASE}{path}?{query}"
    req = urllib.request.Request(
        url,
        headers={"X-API-Key": api_key},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def advanced_search_window(
    api_key: str,
    *,
    username: str,
    since_ts: int,
    until_ts: int,
    query_type: str = "Latest",
) -> list[dict[str, Any]]:
    q = f"from:{username} since_time:{since_ts} until_time:{until_ts}"
    body = _request(
        "/twitter/tweet/advanced_search",
        {"query": q, "queryType": query_type},
        api_key,
    )
    tweets = body.get("tweets")
    if not isinstance(tweets, list):
        return []
    return tweets


def collect_user_tweets_slot_scan(
    api_key: str,
    username: str,
    since_ts: int,
    until_ts: int,
    *,
    slot_seconds: int = 43200,
    min_step: int = 120,
    sleep_s: float = 0.1,
    max_calls: int = 15000,
) -> tuple[dict[str, dict[str, Any]], int]:
    """
    Scan the 90d range in fixed slots (default 2h). If a slot returns 20 tweets (API cap),
    split that slot in half until <20 or width <= min_step. Avoids exponential blowups on
    sparse windows while still subdividing dense bursts.
    """
    by_id: dict[str, dict[str, Any]] = {}
    calls = 0
    stack: list[tuple[int, int]] = []
    t = since_ts
    while t < until_ts:
        stack.append((t, min(t + slot_seconds, until_ts)))
        t += slot_seconds

    while stack:
        if calls >= max_calls:
            print(f"  {username}: max_calls={max_calls} reached (partial data)", flush=True)
            break
        a, b = stack.pop()
        if b <= a:
            continue
        tweets = advanced_search_window(api_key, username=username, since_ts=a, until_ts=b)
        calls += 1
        time.sleep(sleep_s)
        width = b - a
        if len(tweets) >= 20 and width > min_step:
            mid = a + width // 2
            if mid <= a or mid >= b:
                mid = a + min(width // 2, min_step)
            if mid <= a or mid >= b:
                for tw in tweets:
                    tid = str(tw.get("id") or "")
                    if tid:
                        by_id[tid] = tw
                continue
            stack.append((mid, b))
            stack.append((a, mid))
            continue
        for tw in tweets:
            tid = str(tw.get("id") or "")
            if tid:
                by_id[tid] = tw

    print(f"  {username}: advanced_search calls ≈ {calls}, tweets={len(by_id)}", flush=True)
    return by_id, calls


def engagement_score(t: dict[str, Any]) -> float:
    likes = int(t.get("likeCount") or 0)
    replies = int(t.get("replyCount") or 0)
    rts = int(t.get("retweetCount") or 0)
    quotes = int(t.get("quoteCount") or 0)
    views = int(t.get("viewCount") or 0)
    bookmarks = int(t.get("bookmarkCount") or 0)
    return likes + 2 * replies + 3 * rts + 2 * quotes + 0.001 * views + 1.5 * bookmarks


def extract_sources(t: dict[str, Any]) -> dict[str, set[str]]:
    out: dict[str, set[str]] = {
        "url_hosts": set(),
        "quoted_authors": set(),
        "rt_authors": set(),
        "mentioned": set(),
        "article_urls": set(),
    }
    for ent in (t.get("entities") or {}).get("urls") or []:
        exp = ent.get("expanded_url") or ""
        host = _host(exp)
        if host:
            out["url_hosts"].add(host)
    for m in (t.get("entities") or {}).get("user_mentions") or []:
        sn = (m.get("screen_name") or "").strip()
        if sn:
            out["mentioned"].add(sn.lower())
    qt = t.get("quoted_tweet")
    if isinstance(qt, dict):
        au = (qt.get("author") or {}).get("userName")
        if au:
            out["quoted_authors"].add(au.lower())
        for ent in (qt.get("entities") or {}).get("urls") or []:
            exp = ent.get("expanded_url") or ""
            host = _host(exp)
            if host:
                out["url_hosts"].add(f"quoted:{host}")
    rt = t.get("retweeted_tweet")
    if isinstance(rt, dict):
        au = (rt.get("author") or {}).get("userName")
        if au:
            out["rt_authors"].add(au.lower())
    art = t.get("article")
    if isinstance(art, dict):
        title = art.get("title") or ""
        if title:
            out["article_urls"].add(f"article:{title[:120]}")
    return out


def _load_jsonl(path: str) -> list[dict[str, Any]]:
    if not os.path.isfile(path):
        return []
    rows: list[dict[str, Any]] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def main() -> None:
    api_key = os.environ.get("TWITTERAPI_KEY", "").strip()
    if not api_key:
        raise SystemExit("Set TWITTERAPI_KEY in the environment.")

    argv_users = tuple(
        dict.fromkeys(a.strip().lstrip("@").lower() for a in sys.argv[1:] if a.strip() and not a.startswith("-"))
    )
    users_to_fetch = argv_users if argv_users else DEFAULT_USERS

    now = datetime.now(timezone.utc)
    since_dt = now - timedelta(days=90)
    since_ts = _epoch_utc(since_dt)
    until_ts = _epoch_utc(now)

    out_dir = "/workspace/twitterapi_90d_report"
    os.makedirs(out_dir, exist_ok=True)
    jsonl_path = f"{out_dir}/tweets_90d.jsonl"

    if argv_users:
        prior = _load_jsonl(jsonl_path)
        all_rows = [r for r in prior if str(r.get("user") or "").lower() not in argv_users]
        print(f"merge mode: keeping {len(all_rows)} rows, re-fetching {list(argv_users)}", flush=True)
    else:
        all_rows = []
        print(f"full refresh: {list(users_to_fetch)}", flush=True)

    per_user_sources: dict[str, dict[str, Counter[str]]] = {}

    for user in users_to_fetch:
        print(f"collecting {user} ...", flush=True)
        by_id, _calls = collect_user_tweets_slot_scan(api_key, user, since_ts, until_ts)
        hosts: Counter[str] = Counter()
        quoted: Counter[str] = Counter()
        rted: Counter[str] = Counter()
        mentions: Counter[str] = Counter()

        for tid, t in by_id.items():
            au = (t.get("author") or {}).get("userName") or user
            if str(au).lower() != user.lower():
                continue
            src = extract_sources(t)
            hosts.update(src["url_hosts"])
            quoted.update(src["quoted_authors"])
            rted.update(src["rt_authors"])
            mentions.update(src["mentioned"])

            created = _parse_created_at(t.get("createdAt"))
            all_rows.append(
                {
                    "user": user,
                    "id": tid,
                    "url": t.get("url") or f"https://x.com/{user}/status/{tid}",
                    "createdAt": t.get("createdAt"),
                    "isReply": bool(t.get("isReply")),
                    "lang": t.get("lang"),
                    "text": (t.get("text") or "")[:500],
                    "likeCount": int(t.get("likeCount") or 0),
                    "replyCount": int(t.get("replyCount") or 0),
                    "retweetCount": int(t.get("retweetCount") or 0),
                    "quoteCount": int(t.get("quoteCount") or 0),
                    "viewCount": int(t.get("viewCount") or 0),
                    "bookmarkCount": int(t.get("bookmarkCount") or 0),
                    "score": engagement_score(t),
                }
            )

        per_user_sources[user] = {
            "url_hosts": hosts,
            "quoted_authors": quoted,
            "rt_authors": rted,
            "mentions": mentions,
        }
        print(f"  {user}: {len(by_id)} unique tweets", flush=True)

    report_users = sorted({str(r.get("user") or "").lower() for r in all_rows if r.get("user")})

    summary_prev_path = f"{out_dir}/summary.json"
    if argv_users and os.path.isfile(summary_prev_path):
        with open(summary_prev_path, encoding="utf-8") as f:
            prev_summary = json.load(f)
        for u in report_users:
            if u in per_user_sources:
                continue
            block = (prev_summary.get("users") or {}).get(u) or {}
            src_old = block.get("sources") or {}
            h = Counter(dict(src_old.get("url_hosts_top") or []))
            q = Counter(dict(src_old.get("quoted_authors_top") or []))
            rt = Counter(dict(src_old.get("retweeted_authors_top") or []))
            m = Counter(dict(src_old.get("mentions_top") or []))
            per_user_sources[u] = {
                "url_hosts": h,
                "quoted_authors": q,
                "rt_authors": rt,
                "mentions": m,
            }

    with open(jsonl_path, "w", encoding="utf-8") as f:
        for row in sorted(all_rows, key=lambda r: r["createdAt"] or ""):
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    summary: dict[str, Any] = {
        "window_utc": {"since": since_dt.isoformat(), "until": now.isoformat()},
        "users": {},
    }

    for user in report_users:
        rows_u = [r for r in all_rows if str(r.get("user") or "").lower() == user]
        rows_u.sort(key=lambda r: r.get("score", 0), reverse=True)
        top = rows_u[:25]
        summary["users"][user] = {
            "tweet_count": len(rows_u),
            "top_by_engagement_score": top,
            "sources": {
                "url_hosts_top": per_user_sources[user]["url_hosts"].most_common(80),
                "quoted_authors_top": per_user_sources[user]["quoted_authors"].most_common(60),
                "retweeted_authors_top": per_user_sources[user]["rt_authors"].most_common(40),
                "mentions_top": per_user_sources[user]["mentions"].most_common(40),
            },
        }

    with open(f"{out_dir}/summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # Markdown report for humans
    lines: list[str] = []
    lines.append("# Twitter 近 90 天调研（twitterapi.io advanced_search）\n")
    lines.append(f"- 采集窗口（UTC）：`{since_dt.isoformat()}` → `{now.isoformat()}`\n")
    lines.append("- 方法：`from:<user> since_time:<unix> until_time:<unix>`，时间窗自适应拆分（避免单窗 ≥20 条丢数据）。\n")
    lines.append("- 原始行：`twitterapi_90d_report/tweets_90d.jsonl`；聚合：`summary.json`。\n")
    for user in report_users:
        su = summary["users"][user]
        lines.append(f"\n## @{user}\n")
        lines.append(f"- 推文数（去重 id，作者匹配 @{user}）：**{su['tweet_count']}**\n")
        lines.append("\n### 爆款 Top（按 engagement_score = like + 2*reply + 3*rt + 2*quote + 0.001*view + 1.5*bookmark）\n")
        for i, r in enumerate(su["top_by_engagement_score"][:15], 1):
            lines.append(
                f"{i}. [{r['likeCount']}♥ {r['replyCount']}💬 {r['retweetCount']}🔁 "
                f"{r['viewCount']}👁]({r['url']}) — reply={r['isReply']} lang={r['lang']}\n"
            )
            preview = (r.get("text") or "").replace("\n", " ")[:180]
            if preview:
                lines.append(f"   > {preview}\n")
        lines.append("\n### 信源汇总（URL 域名 / 引用作者 / 转推作者 / @提及）\n")
        lines.append("**URL 域名（含 quoted: 前缀表示来自引用推里的链接）**\n")
        for host, c in su["sources"]["url_hosts_top"][:35]:
            lines.append(f"- `{host}` — {c}\n")
        lines.append("\n**引用推作者（quoted_tweet.author）**\n")
        for name, c in su["sources"]["quoted_authors_top"][:25]:
            lines.append(f"- @{name} — {c}\n")
        lines.append("\n**转推作者（retweeted_tweet.author）**\n")
        for name, c in su["sources"]["retweeted_authors_top"][:15]:
            lines.append(f"- @{name} — {c}\n")
        lines.append("\n**高频 @提及（对话信源）**\n")
        for name, c in su["sources"]["mentions_top"][:20]:
            lines.append(f"- @{name} — {c}\n")

    with open(f"{out_dir}/REPORT.md", "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"Wrote {out_dir}/REPORT.md and summary.json ({len(all_rows)} total tweets)", flush=True)


if __name__ == "__main__":
    main()
