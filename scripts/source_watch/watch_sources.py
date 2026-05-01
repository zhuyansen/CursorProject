#!/usr/bin/env python3
"""
Poll RSS/Atom feeds and twitterapi.io user timelines; notify on new items.

Env:
  TWITTERAPI_KEY   Required for twitter_users (header X-API-Key).

Config JSON (path from argv or SOURCE_WATCH_CONFIG):
  discord_webhook_url  Optional POST JSON {content}
  ntfy_topic           Optional e.g. my-secret-topic -> POST to ntfy.sh/topic
  ntfy_base_url        Default https://ntfy.sh
  rss_feeds            [{name, url}, ...]
  twitter_users        ["handle", ...] without @
  twitter_include_replies  default false
  twitter_max_per_user     default 5 (only newest N ids compared to state)

State file: alongside config, name <config>.state.json

First run: records current heads without sending (no spam). Second run onward: pushes new only.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

# Discord 走 Cloudflare；urllib 默认 User-Agent 易触发 403（body: error code: 1010）。
_DISCORD_HEADERS = {
    "User-Agent": "curl/8.5.0",
    "Content-Type": "application/json",
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _http_json(method: str, url: str, headers: dict | None = None, body: dict | None = None, timeout: int = 60):
    req_data = None
    hdrs = dict(headers or {})
    if body is not None:
        req_data = json.dumps(body).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=req_data, headers=hdrs, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_get_text(url: str, timeout: int = 45) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "source-watch/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def _strip_ns(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _parse_feed(xml_text: str) -> list[dict]:
    """Return list of {id, title, link, published} newest first (best effort)."""
    root = ET.fromstring(xml_text)
    root_tag = _strip_ns(root.tag).lower()
    items: list[dict] = []

    if root_tag == "rss":
        channel = root.find("channel")
        if channel is None:
            return []
        for it in channel.findall("item"):
            title_el = it.find("title")
            link_el = it.find("link")
            guid_el = it.find("guid")
            pub_el = it.find("pubDate")
            title = (title_el.text or "").strip() if title_el is not None else ""
            link = (link_el.text or "").strip() if link_el is not None else ""
            guid = (guid_el.text or "").strip() if guid_el is not None else ""
            pub = (pub_el.text or "").strip() if pub_el is not None else ""
            item_id = guid or link or hashlib.sha256((title + pub).encode()).hexdigest()[:16]
            items.append({"id": item_id, "title": title, "link": link, "published": pub})
    elif root_tag == "feed":
        for entry in root:
            if _strip_ns(entry.tag) != "entry":
                continue
            title = ""
            link = ""
            item_id = ""
            published = ""
            for child in entry:
                tag = _strip_ns(child.tag)
                if tag == "title" and child.text:
                    title = child.text.strip()
                elif tag == "id" and child.text:
                    item_id = child.text.strip()
                elif tag == "published" and child.text:
                    published = child.text.strip()
                elif tag == "updated" and not published and child.text:
                    published = child.text.strip()
                elif tag == "link":
                    href = child.attrib.get("href", "")
                    rel = child.attrib.get("rel", "alternate")
                    if href and rel in ("alternate", ""):
                        link = href
            if not item_id:
                item_id = link or hashlib.sha256((title + published).encode()).hexdigest()[:16]
            items.append({"id": item_id, "title": title, "link": link, "published": published})
    return items


def _fetch_last_tweets(api_key: str, username: str, include_replies: bool, max_n: int) -> list[dict]:
    q = urllib.parse.urlencode(
        {
            "userName": username,
            "includeReplies": "true" if include_replies else "false",
        }
    )
    url = f"https://api.twitterapi.io/twitter/user/last_tweets?{q}"
    req = urllib.request.Request(url, headers={"X-API-Key": api_key})
    with urllib.request.urlopen(req, timeout=90) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    data = body.get("data") or body
    tweets = data.get("tweets") or []
    out = []
    for t in tweets[:max_n]:
        tid = str(t.get("id") or "")
        if not tid:
            continue
        out.append(
            {
                "id": tid,
                "url": t.get("url") or f"https://x.com/{username}/status/{tid}",
                "text": (t.get("text") or "")[:400],
                "createdAt": t.get("createdAt") or "",
            }
        )
    return out


def _post_discord_webhook(webhook: str, payload: dict) -> None:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(webhook, data=data, headers=dict(_DISCORD_HEADERS), method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        if raw:
            json.loads(raw.decode("utf-8"))


def _notify_discord(webhook: str, text: str) -> None:
    _post_discord_webhook(webhook, {"content": text[:1900]})


def _notify_ntfy(base: str, topic: str, title: str, message: str) -> None:
    url = f"{base.rstrip('/')}/{urllib.parse.quote(topic, safe='')}"
    req = urllib.request.Request(
        url,
        data=message.encode("utf-8"),
        headers={"Title": title[:200]},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30):
        pass


def main() -> None:
    argv = [a for a in sys.argv[1:] if a]
    test_discord = "--test-discord" in argv
    argv = [a for a in argv if a != "--test-discord"]

    config_path = Path(os.environ.get("SOURCE_WATCH_CONFIG", "config.json"))
    if argv:
        config_path = Path(argv[0])
    if not config_path.is_file():
        raise SystemExit(f"Missing config: {config_path} (copy config.example.json)")

    cfg = _load_json(config_path)

    if test_discord:
        discord_url = (cfg.get("discord_webhook_url") or "").strip()
        if not discord_url or "0000000000" in discord_url or "xxxxxxxx" in discord_url:
            raise SystemExit(
                "请在 config.json 填写真实的 discord_webhook_url（不要用 config.example 里的占位符）。"
            )
        body = (
            "source-watch：Discord 推送测试 OK（可删除本条）。\n"
            f"配置：{config_path}\n"
            f"时间：{_utc_now_iso()}"
        )
        try:
            _notify_discord(discord_url, body)
        except urllib.error.HTTPError as e:
            raise SystemExit(f"Discord 返回错误 {e.code}：请检查 Webhook 是否有效、是否已在 Discord 删除。") from e
        except urllib.error.URLError as e:
            raise SystemExit(f"无法连接 Discord：{e}") from e
        print("已发送测试消息，请到 Discord 对应频道查看。", flush=True)
        return
    state_path = config_path.with_suffix(".state.json")
    state = _load_json(state_path) if state_path.is_file() else {"initialized": False, "rss": {}, "twitter": {}}

    discord_url = (cfg.get("discord_webhook_url") or "").strip()
    ntfy_topic = (cfg.get("ntfy_topic") or "").strip()
    ntfy_base = (cfg.get("ntfy_base_url") or "https://ntfy.sh").strip()

    api_key = os.environ.get("TWITTERAPI_KEY", "").strip()
    tw_users = cfg.get("twitter_users") or []
    if tw_users and not api_key:
        raise SystemExit("TWITTERAPI_KEY is required when twitter_users is non-empty.")

    first_run = not state.get("initialized")
    messages: list[tuple[str, str]] = []

    for feed in cfg.get("rss_feeds") or []:
        name = feed.get("name") or "RSS"
        feed_url = feed.get("url")
        if not feed_url:
            continue
        try:
            xml_text = _http_get_text(feed_url)
        except urllib.error.URLError as e:
            messages.append((f"[RSS ERROR] {name}", str(e)))
            continue
        try:
            items = _parse_feed(xml_text)
        except ET.ParseError as e:
            messages.append((f"[RSS PARSE] {name}", str(e)))
            continue
        if not items:
            continue
        newest = items[0]
        key = feed_url
        prev = state["rss"].get(key)
        state["rss"][key] = {"last_id": newest["id"], "last_check": _utc_now_iso()}
        if first_run:
            continue
        if prev and prev.get("last_id"):
            new_items = []
            for it in items:
                if it["id"] == prev.get("last_id"):
                    break
                new_items.append(it)
            new_items.reverse()
            for it in new_items:
                title = it.get("title") or "(no title)"
                link = it.get("link") or ""
                line = f"**[RSS] {name}**\n{title}\n{link}".strip()
                messages.append((f"RSS: {name}", line))

    include_replies = bool(cfg.get("twitter_include_replies", False))
    max_per = int(cfg.get("twitter_max_per_user", 5))

    for user in tw_users:
        user = str(user).lstrip("@").strip()
        if not user:
            continue
        try:
            tweets = _fetch_last_tweets(api_key, user, include_replies, max_per)
        except urllib.error.HTTPError as e:
            messages.append((f"[X ERROR] @{user}", f"{e.code} {e.reason}"))
            continue
        except urllib.error.URLError as e:
            messages.append((f"[X ERROR] @{user}", str(e)))
            continue
        if not tweets:
            continue
        newest_id = tweets[0]["id"]
        prev_last = (state["twitter"].get(user) or {}).get("last_id")
        state["twitter"][user] = {"last_id": newest_id, "last_check": _utc_now_iso()}
        if first_run:
            continue
        if not prev_last:
            continue
        new_tweets = []
        for t in tweets:
            if t["id"] == prev_last:
                break
            new_tweets.append(t)
        new_tweets.reverse()
        for t in new_tweets:
            preview = t.get("text", "").replace("\n", " ")[:280]
            line = f"**[X] @{user}**\n{t['url']}\n{preview}".strip()
            messages.append((f"X @{user}", line))

    state["initialized"] = True
    _save_json(state_path, state)

    for title, body in messages:
        print(f"--- {title}\n{body}\n", flush=True)
        if discord_url:
            try:
                _notify_discord(discord_url, f"{title}\n{body}")
                time.sleep(0.4)
            except urllib.error.URLError as e:
                print(f"Discord notify failed: {e}", file=sys.stderr)
        if ntfy_topic:
            try:
                _notify_ntfy(ntfy_base, ntfy_topic, title, body)
                time.sleep(0.4)
            except urllib.error.URLError as e:
                print(f"ntfy notify failed: {e}", file=sys.stderr)

    if not messages:
        print(f"No new items ({_utc_now_iso()})", flush=True)


if __name__ == "__main__":
    main()
