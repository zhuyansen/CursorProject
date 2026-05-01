"""
Classify X posts for digest pipeline: text-only / text+image / video (and other).

Uses twitterapi.io GET /twitter/tweets?tweet_ids=... when TWITTERAPI_KEY is set;
otherwise falls back on URL patterns in tweet text.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

TWITTERAPI_TWEETS = "https://api.twitterapi.io/twitter/tweets"

# For Typefully / digest JSON: stable labels
MEDIA_TEXT_ONLY = "text_only"
MEDIA_TEXT_WITH_IMAGE = "text_with_image"
MEDIA_VIDEO = "video"
MEDIA_OTHER = "other"


def _http_get_json(url: str, api_key: str, timeout: int = 45) -> dict:
    req = urllib.request.Request(url, headers={"X-API-Key": api_key, "User-Agent": "curl/8.5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_tweet_by_id(api_key: str, tweet_id: str) -> dict[str, Any] | None:
    if not api_key or not tweet_id:
        return None
    q = urllib.parse.urlencode({"tweet_ids": tweet_id})
    url = f"{TWITTERAPI_TWEETS}?{q}"
    try:
        body = _http_get_json(url, api_key)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None
    tweets = body.get("tweets") or body.get("data") or []
    if not tweets:
        return None
    row = tweets[0]
    return row if isinstance(row, dict) else None


def tweet_body_for_media(tweet: dict[str, Any]) -> dict[str, Any]:
    """Use inner status for RT media (outer wrapper often has no extendedEntities)."""
    rt = tweet.get("retweeted_tweet")
    if isinstance(rt, dict):
        return rt
    return tweet


def _media_entries(tweet: dict[str, Any]) -> list[dict[str, Any]]:
    ee = tweet.get("extendedEntities") or tweet.get("extended_entities")
    if isinstance(ee, dict):
        media = ee.get("media") or []
        if isinstance(media, list):
            return [m for m in media if isinstance(m, dict)]
    ent = tweet.get("entities")
    if isinstance(ent, dict):
        media = ent.get("media") or []
        if isinstance(media, list):
            return [m for m in media if isinstance(m, dict)]
    return []


def _best_mp4_from_video_info(video_info: dict[str, Any]) -> str | None:
    variants = video_info.get("variants") or []
    if not isinstance(variants, list):
        return None
    mp4s: list[tuple[int, str]] = []
    for v in variants:
        if not isinstance(v, dict):
            continue
        u = (v.get("url") or "").strip()
        if not u or ".mp4" not in u.lower():
            continue
        br = int(v.get("bitrate") or 0)
        mp4s.append((br, u))
    if not mp4s:
        return None
    mp4s.sort(key=lambda x: -x[0])
    return mp4s[0][1]


def extract_primary_photo_url(tweet: dict[str, Any]) -> str | None:
    """First photo media_url_https or media_url (large)."""
    for m in _media_entries(tweet_body_for_media(tweet)):
        if str(m.get("type") or "").lower() != "photo":
            continue
        u = (m.get("media_url_https") or m.get("media_url") or "").strip()
        if u:
            return u
    return None


def extract_primary_video_url(tweet: dict[str, Any]) -> str | None:
    """Return one HTTPS mp4 URL if present (first video media)."""
    for m in _media_entries(tweet_body_for_media(tweet)):
        mtype = str(m.get("type") or "").lower()
        if mtype not in ("video", "animated_gif"):
            continue
        vi = m.get("video_info")
        if isinstance(vi, dict):
            u = _best_mp4_from_video_info(vi)
            if u:
                return u
    return None


def classify_tweet_media(tweet: dict[str, Any]) -> str:
    """
    text_only: no photo/video media (link cards / plain text ok).
    text_with_image: at least one photo (with or without text).
    video: native video or GIF-as-video.
    other: e.g. poll-only or unknown media types we skip for image gen.
    """
    kinds: set[str] = set()
    for m in _media_entries(tweet_body_for_media(tweet)):
        mtype = str(m.get("type") or "").lower()
        if mtype == "photo":
            kinds.add("photo")
        elif mtype in ("video", "animated_gif"):
            kinds.add("video")
        else:
            kinds.add("other")
    if "video" in kinds:
        return MEDIA_VIDEO
    if "photo" in kinds:
        return MEDIA_TEXT_WITH_IMAGE
    if "other" in kinds and not kinds.intersection({"photo", "video"}):
        return MEDIA_OTHER
    return MEDIA_TEXT_ONLY


def heuristic_media_kind_from_text(text: str) -> str:
    """When tweet detail is unavailable: best-effort from visible URLs."""
    low = (text or "").lower()
    if "video.twimg.com" in low or "/video/" in low or "amplify_video" in low:
        return MEDIA_VIDEO
    if "pic.twitter.com" in low or "pbs.twimg.com/media/" in low:
        return MEDIA_TEXT_WITH_IMAGE
    return MEDIA_TEXT_ONLY


def download_url_to_file(url: str, dest: Path, timeout: int = 120) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        dest.write_bytes(resp.read())


def resolve_media_kind_for_batch_item(
    *,
    tweet_id: str,
    tweet_text: str,
    twitterapi_key: str,
) -> str:
    detail = fetch_tweet_by_id(twitterapi_key, tweet_id) if twitterapi_key else None
    if detail:
        return classify_tweet_media(detail)
    return heuristic_media_kind_from_text(tweet_text)


def enrich_batch_items(items: list[dict[str, Any]], twitterapi_key: str) -> list[dict[str, Any]]:
    """Add media_kind to each item (for downstream image-gen / CapCut routing)."""
    out: list[dict[str, Any]] = []
    for row in items:
        if not isinstance(row, dict):
            continue
        tid = str(row.get("id") or "").strip()
        txt = str(row.get("text") or "")
        kind = resolve_media_kind_for_batch_item(
            tweet_id=tid, tweet_text=txt, twitterapi_key=twitterapi_key
        )
        merged = {**row, "media_kind": kind}
        out.append(merged)
    return out


def capcut_instruction_block(
    *,
    draft_zh: str,
    video_path: Path | None,
    source_url: str,
) -> str:
    """Chinese checklist for CapCut 剪映 — user adds video + Chinese subtitles."""
    lines = [ln.strip() for ln in (draft_zh or "").splitlines() if ln.strip()]
    subtitle_guess = lines[:12] if lines else ["（根据正文自行拆句）"]
    sub_bullets = "\n".join(f"- {s[:80]}" for s in subtitle_guess[:10])
    vp = str(video_path.resolve()) if video_path and video_path.is_file() else "（若自动下载失败，请从 X 客户端导出或第三方保存原视频后放到此路径）"
    return (
        "\n\n---\n"
        "【剪映 CapCut · 中文字幕工作流】\n"
        f"原推链接：{source_url}\n"
        f"本地视频文件：{vp}\n"
        "步骤建议：\n"
        "1) 剪映 → 导入上述视频到时间线。\n"
        "2) 文本 → 识别字幕（或手动添加），语言选中文；按口语断句校对。\n"
        "3) 样式：字号略大、底部安全区、描边/背景条提高可读性。\n"
        "4) 对照下方「字幕候选句」从正文里拆成多条字幕（不必逐字相同）。\n"
        "字幕候选句（来自当前中文稿）：\n"
        f"{sub_bullets}\n"
    )
