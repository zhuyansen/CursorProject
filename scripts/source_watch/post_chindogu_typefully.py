#!/usr/bin/env python3
"""
One-shot script: scrape rarehistoricalphotos.com/weird-japanese-inventions/,
turn each section (title + body + photo) into a Chinese short Typefully draft.

Outputs: scripts/source_watch/jp_chindogu_typefully_last.json
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from uuid import uuid4

_script_path = Path(__file__).resolve()
_scripts_dir = _script_path.parent.parent
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))

from local_env_file import activate_script_env

activate_script_env(_script_path)

_script_dir_str = str(_script_path.parent)
if _script_dir_str not in sys.path:
    sys.path.insert(0, _script_dir_str)

from generate_cn_drafts_fluxnode import (
    _chat_completion,
    _fluxnode_effective_chat_model,
    _normalize_gateway_base_url,
    _typefully_create_draft,
    _typefully_resolve_social_set,
    _typefully_upload_media,
)

SCRIPT_DIR = _script_path.parent
PHOTO_DIR = SCRIPT_DIR / "downloaded_photos"
OUT_LOG = SCRIPT_DIR / "jp_chindogu_typefully_last.json"
STATE_PATH = SCRIPT_DIR / "jp_chindogu_posted_titles.json"
SOURCE_URL = "https://rarehistoricalphotos.com/weird-japanese-inventions/"


def _fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


class _Sectioner(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.events: list[tuple[str, dict]] = []
        self._capture: dict | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        d = {k: (v or "") for k, v in attrs}
        if tag in ("h2", "h3"):
            self.events.append((tag, {"text": ""}))
            self._capture = self.events[-1][1]
        elif tag == "p":
            self.events.append((tag, {"text": ""}))
            self._capture = self.events[-1][1]
        elif tag == "img":
            self.events.append((tag, d))
            self._capture = None

    def handle_endtag(self, tag: str) -> None:
        if tag in ("h2", "h3", "p"):
            self._capture = None

    def handle_data(self, data: str) -> None:
        if self._capture is not None:
            self._capture["text"] += data


def _extract_sections(page_html: str) -> list[dict]:
    start = re.search(r"<h2[^>]*>Hair Protector", page_html, flags=re.I)
    end = re.search(r"Photo credit", page_html, flags=re.I)
    slice_ = page_html[start.start(): end.start()] if (start and end) else page_html
    p = _Sectioner()
    p.feed(slice_)
    items: list[dict] = []
    current: dict | None = None
    for tag, attrs in p.events:
        if tag in ("h2", "h3"):
            title = html.unescape((attrs.get("text") or "").strip())
            if not title:
                continue
            if current and (current.get("title") or current.get("body")):
                items.append(current)
            current = {"title": title, "body": "", "images": []}
        elif tag == "p" and current is not None:
            text = html.unescape((attrs.get("text") or "").strip())
            if text:
                current["body"] = (current["body"] + "\n\n" + text).strip()
        elif tag == "img" and current is not None:
            src = (
                attrs.get("data-lazy-src")
                or attrs.get("data-src")
                or attrs.get("src")
                or ""
            ).strip()
            if src and "rarehistoricalphotos" in src and src.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                if src not in current["images"]:
                    current["images"].append(src)
    if current and (current.get("title") or current.get("body")):
        items.append(current)
    return items


def _download_image(url: str, dest: Path, timeout: int = 60) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        dest.write_bytes(resp.read())
    return dest


def _slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fa5]+", "-", text.strip()).strip("-").lower()
    return s[:60] or uuid4().hex[:10]


def _system_prompt() -> str:
    handle = (os.environ.get("TYPEFULLY_X_USERNAME") or "the-account").strip()
    return (
        f"你是中文推特账号「{handle}」的代笔。读到下面这条来自 rarehistoricalphotos.com 的「奇葩日本发明」介绍，"
        "请写一条单图配文（短帖），约 80～180 字：\n"
        "1) 开头一行抛钩子或体感，可以略夸张但别假；\n"
        "2) 1～2 句客观解释这玩意儿干嘛用的；\n"
        "3) 用一句吐槽收尾，可以适度玩梗；\n"
        "4) 末尾另起一行写：via @rarehistoricalphotos\n"
        "5) 不要写「转载」「翻译」等字样；不要 hashtag；不要 emoji 堆砌（最多 1～2 个）。\n"
        "只输出正文，不要 markdown 标题。"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Cap items processed (0 = all).")
    parser.add_argument("--dry-run", action="store_true", help="Print drafts without calling Typefully.")
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Skip first N items (useful for resuming).",
    )
    args = parser.parse_args()

    newapi_key = (os.environ.get("NEWAPI_KEY") or os.environ.get("OPENAI_API_KEY") or "").strip()
    base = _normalize_gateway_base_url(
        (os.environ.get("NEWAPI_BASE_URL") or "https://api.fluxnode.org/v1").strip()
    )
    chat_model = _fluxnode_effective_chat_model(
        (os.environ.get("NEWAPI_CHAT_MODEL") or "claude-opus-4-7-thinking").strip(),
        api_base=base,
    )
    tf_key = (os.environ.get("TYPEFULLY_API_KEY") or "").strip()
    publish_raw = (os.environ.get("TYPEFULLY_PUBLISH_AT") or "draft").strip().lower()
    publish_at: str | None = None
    if publish_raw not in ("", "draft", "false", "0", "no"):
        publish_at = publish_raw

    if not newapi_key:
        raise SystemExit("Set NEWAPI_KEY for chat generation.")
    if not args.dry_run and not tf_key:
        raise SystemExit("Set TYPEFULLY_API_KEY for Typefully (or pass --dry-run).")

    print(f"Scraping {SOURCE_URL}", flush=True)
    page_html = _fetch_html(SOURCE_URL)
    items = _extract_sections(page_html)
    if not items:
        raise SystemExit("No items parsed from the article.")

    if args.start:
        items = items[args.start:]
    if args.limit:
        items = items[: args.limit]

    posted_titles: set[str] = set()
    if STATE_PATH.is_file():
        try:
            posted_titles = {str(x) for x in json.loads(STATE_PATH.read_text(encoding="utf-8"))}
        except Exception:
            posted_titles = set()

    social_set_id: int | None = None
    if not args.dry_run:
        social_set_id = _typefully_resolve_social_set(tf_key)
        print(f"Typefully social_set_id={social_set_id}", flush=True)

    results: list[dict] = []

    for idx, item in enumerate(items, 1):
        title = item.get("title", "").strip()
        body = item.get("body", "").strip()
        images = item.get("images") or []
        print(f"[{idx}/{len(items)}] {title}", flush=True)

        if title in posted_titles:
            print("  skip (already drafted in a previous run)", flush=True)
            continue
        if not images:
            print("  skip (no image)", flush=True)
            continue

        messages = [
            {"role": "system", "content": _system_prompt()},
            {
                "role": "user",
                "content": f"标题：{title}\n英文说明：\n{body}\n\n请输出中文短帖正文。",
            },
        ]
        try:
            draft = _chat_completion(base, newapi_key, chat_model, messages)
        except Exception as exc:
            print(f"  chat failed: {exc}", flush=True)
            draft = f"{title}（生成失败：{exc}）\nvia @rarehistoricalphotos"

        media_ids: list[str] = []
        local_paths: list[str] = []
        for img_idx, img_url in enumerate(images[:1]):
            ext = ".webp"
            low = img_url.lower()
            if low.endswith(".jpg") or low.endswith(".jpeg"):
                ext = ".jpg"
            elif low.endswith(".png"):
                ext = ".png"
            dest = PHOTO_DIR / f"jp-chindogu-{_slugify(title)}-{img_idx}{ext}"
            try:
                _download_image(img_url, dest, timeout=60)
                local_paths.append(str(dest))
            except Exception as exc:
                print(f"  image download failed ({img_url}): {exc}", flush=True)
                continue
            if not args.dry_run:
                try:
                    media_id = _typefully_upload_media(
                        tf_key, social_set_id, dest.read_bytes(), dest.name  # type: ignore[arg-type]
                    )
                    media_ids.append(media_id)
                except Exception as exc:
                    print(f"  Typefully upload failed: {exc}", flush=True)

        tf_resp: dict = {}
        if not args.dry_run:
            try:
                tf_resp = _typefully_create_draft(
                    tf_key,
                    social_set_id,  # type: ignore[arg-type]
                    draft,
                    media_ids,
                    draft_title=f"奇葩日本发明 {idx} {title[:60]}",
                    publish_at=publish_at,
                )
            except Exception as exc:
                tf_resp = {"error": str(e := exc)}

        results.append(
            {
                "idx": idx,
                "title": title,
                "image_url": images[0] if images else "",
                "draft_zh": draft,
                "local_paths": local_paths,
                "typefully_draft_id": tf_resp.get("draft_id") or tf_resp.get("id"),
                "typefully_private_url": tf_resp.get("private_url") or "",
                "media_ids": media_ids,
                "error": tf_resp.get("error") or "",
            }
        )
        if not args.dry_run and (tf_resp.get("draft_id") or tf_resp.get("id")):
            posted_titles.add(title)
            STATE_PATH.write_text(
                json.dumps(sorted(posted_titles), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        time.sleep(0.6)

    OUT_LOG.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {OUT_LOG} ({len(results)} items).", flush=True)


if __name__ == "__main__":
    main()
