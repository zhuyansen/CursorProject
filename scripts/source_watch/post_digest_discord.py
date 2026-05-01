#!/usr/bin/env python3
"""
Read twitterapi_90d_report (summary + tweets jsonl), then post to Discord:
  1) All merged source domains (from summary url_hosts), sorted by frequency
  2) Global top 10 tweets by viewCount with links

Uses discord_webhook_url from scripts/source_watch/config.json (or DISCORD_WEBHOOK_URL env).
Same User-Agent as watch_sources.py for Cloudflare.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
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

REPORT_DIR = Path("/workspace/twitterapi_90d_report")
SUMMARY = REPORT_DIR / "summary.json"
TWEETS = REPORT_DIR / "tweets_90d.jsonl"
DEFAULT_CONFIG = Path(__file__).resolve().parent / "config.json"


def _post_discord(webhook: str, content: str) -> None:
    data = json.dumps({"content": content[:1990]}).encode("utf-8")
    req = urllib.request.Request(webhook, data=data, headers=dict(_DISCORD_HEADERS), method="POST")
    with urllib.request.urlopen(req, timeout=45) as resp:
        resp.read()


def _norm_host(host: str) -> str:
    host = (host or "").strip()
    if host.startswith("quoted:"):
        host = host[7:]
    return host


def _merge_all_sources(summary: dict) -> list[tuple[str, int]]:
    counts: dict[str, int] = defaultdict(int)
    for _user, block in (summary.get("users") or {}).items():
        for host, c in (block.get("sources") or {}).get("url_hosts_top") or []:
            h = _norm_host(str(host))
            if not h:
                continue
            counts[h] += int(c)
    return sorted(counts.items(), key=lambda x: (-x[1], x[0]))


def _chunk_lines(lines: list[str], max_chars: int = 1850) -> list[str]:
    chunks: list[str] = []
    buf: list[str] = []
    n = 0
    for line in lines:
        line = line.rstrip() + "\n"
        if n + len(line) > max_chars and buf:
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
        raise SystemExit(
            "Set DISCORD_WEBHOOK_URL or put a real discord_webhook_url in config.json"
        )

    if not SUMMARY.is_file() or not TWEETS.is_file():
        raise SystemExit(f"Missing {SUMMARY} or {TWEETS} — run twitterapi_90d_research.py first.")

    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    merged = _merge_all_sources(summary)

    lines_src = [f"**信源域名全集**（五人报告合并，`quoted:` 已并入主域名）共 **{len(merged)}** 个，按出现次数降序："]
    for host, c in merged:
        lines_src.append(f"{c:5d}  `{host}`")

    rows: list[dict] = []
    with TWEETS.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    rows.sort(key=lambda r: int(r.get("viewCount") or 0), reverse=True)
    top10 = rows[:10]

    lines_top = ["", "**全局浏览量 Top10**（jsonl 全量，按 viewCount）："]
    for i, r in enumerate(top10, 1):
        u = r.get("user") or "?"
        url = r.get("url") or ""
        v = int(r.get("viewCount") or 0)
        likes = int(r.get("likeCount") or 0)
        rep = int(r.get("replyCount") or 0)
        rt = int(r.get("retweetCount") or 0)
        prev = (r.get("text") or "").replace("\n", " ")[:220]
        lines_top.append(f"\n**Top{i}** @{u}  👁{v:,}  ♥{likes} 💬{rep} 🔁{rt}")
        lines_top.append(url)
        if prev:
            lines_top.append(f"> {prev}")

    # Post: header + source chunks + top10 (may split top10 if huge)
    window = (summary.get("window_utc") or {})
    header = (
        "📊 **Twitter 90d 摘要**（自动投递）\n"
        f"窗口: `{window.get('since', '')}` → `{window.get('until', '')}`\n"
        f"信源条数: **{len(merged)}** 域名 | Top10 推文来自 `tweets_90d.jsonl` 全量\n"
        "— — —"
    )
    _post_discord(webhook, header)
    time.sleep(0.5)

    src_chunks = _chunk_lines(lines_src)
    for idx, chunk in enumerate(src_chunks, 1):
        _post_discord(webhook, f"**[信源 {idx}/{len(src_chunks)}]**\n```\n{chunk}\n```")
        time.sleep(0.6)

    top_chunks = _chunk_lines(lines_top)
    for idx, chunk in enumerate(top_chunks, 1):
        _post_discord(webhook, f"**[Top10 分段 {idx}/{len(top_chunks)}]**\n{chunk}")
        time.sleep(0.6)

    print("Posted to Discord OK.", flush=True)


if __name__ == "__main__":
    main()
