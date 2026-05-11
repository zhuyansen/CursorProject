#!/usr/bin/env python3
"""
Post to Discord the **Top 10 English (lang=en) tweets on X** by viewCount,
with each tweet's **x.com status URL** (not RSS / not off-X article links).

Data: twitterapi_90d_report/tweets_90d.jsonl (all users in file).

If fewer than 10 English tweets exist, backfills from highest-view tweets
in any language and labels them as non-English.

Config: config.json → discord_webhook_url or DISCORD_WEBHOOK_URL
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

_script_path = Path(__file__).resolve()
_scripts_dir = _script_path.parent.parent if _script_path.parent.name == "source_watch" else _script_path.parent
_scripts_str = str(_scripts_dir)
if _scripts_str not in sys.path:
    sys.path.insert(0, _scripts_str)

from local_env_file import activate_script_env

activate_script_env(_script_path)

_DISCORD_HEADERS = {
    "User-Agent": "curl/8.5.0",
    "Content-Type": "application/json",
}

TWEETS = Path("/workspace/twitterapi_90d_report/tweets_90d.jsonl")
DEFAULT_CONFIG = Path(__file__).resolve().parent / "config.json"


def _post_discord(webhook: str, content: str) -> None:
    body = json.dumps({"content": content[:1990]}).encode("utf-8")
    req = urllib.request.Request(webhook, data=body, headers=dict(_DISCORD_HEADERS), method="POST")
    with urllib.request.urlopen(req, timeout=45) as resp:
        resp.read()


def _chunks(lines: list[str], size: int = 1850) -> list[str]:
    chunks: list[str] = []
    buf: list[str] = []
    n = 0
    for line in lines:
        line = line.rstrip() + "\n"
        if n + len(line) > size and buf:
            chunks.append("".join(buf).rstrip())
            buf = []
            n = 0
        buf.append(line)
        n += len(line)
    if buf:
        chunks.append("".join(buf).rstrip())
    return chunks


def main() -> None:
    cfg_path = Path(os.environ.get("SOURCE_WATCH_CONFIG", str(DEFAULT_CONFIG)))
    if len(sys.argv) > 1:
        cfg_path = Path(sys.argv[1])

    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook and cfg_path.is_file():
        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        webhook = (cfg.get("discord_webhook_url") or "").strip()
    if not webhook or "0000000000" in webhook or "xxxxxxxx" in webhook:
        raise SystemExit("Need real discord_webhook_url in config.json or DISCORD_WEBHOOK_URL")

    if not TWEETS.is_file():
        raise SystemExit(f"Missing {TWEETS}")

    rows: list[dict] = []
    with TWEETS.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))

    def view(r: dict) -> int:
        return int(r.get("viewCount") or 0)

    en = [r for r in rows if str(r.get("lang") or "").lower() == "en"]
    en.sort(key=view, reverse=True)
    picked: list[tuple[dict, str]] = [(r, "en") for r in en[:10]]

    if len(picked) < 10:
        used = {r.get("id") for r, _ in picked}
        rest = sorted([r for r in rows if r.get("id") not in used], key=view, reverse=True)
        for r in rest:
            if len(picked) >= 10:
                break
            picked.append((r, "backfill"))

    intro = (
        "🌍 **英文推文（X）浏览量 Top10**\n"
        f"数据源: `{TWEETS}` 共 **{len(rows)}** 条\n"
        "规则: `lang == en` 按 `viewCount` 降序；不足 10 条时用其它语言高浏览帖补足（标注 **补足**）。\n"
        "每条均为 **X 推文链接**（status URL）。"
    )
    _post_discord(webhook, intro)
    time.sleep(0.5)

    lines: list[str] = []
    for i, (r, kind) in enumerate(picked[:10], 1):
        url = r.get("url") or ""
        u = r.get("user") or "?"
        lg = r.get("lang") or "?"
        v = view(r)
        likes = int(r.get("likeCount") or 0)
        tag = "" if kind == "en" else " **（补足·非 en）**"
        prev = (r.get("text") or "").replace("\n", " ")[:280]
        lines.append(f"\n**Top{i}**{tag}  @{u}  `lang={lg}`  👁`{v:,}`  ♥{likes}")
        lines.append(url)
        if prev:
            lines.append(f"> {prev}")

    for ch in _chunks(lines):
        _post_discord(webhook, ch)
        time.sleep(0.5)

    print("Discord: posted English X top10 by views.", flush=True)


if __name__ == "__main__":
    main()
