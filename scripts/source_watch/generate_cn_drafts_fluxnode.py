#!/usr/bin/env python3
"""
1) Read en_digest_last_batch.json (from fetch_en_top10_discord.py)
2) Few-shot style from @gosailglobal zh hits in tweets_90d.jsonl
3) Chat: POST {NEWAPI_BASE}/chat/completions (default https://api.fluxnode.org/v1; optional docs.newapi remap)
4) Image (optional): POST .../images/generations (tries with/without trailing slash)
5) Push each Chinese draft to Typefully: upload image → create X draft (default: no publish_at = saved draft)

Outputs (gitignored):
  cn_drafts_text_last.json — full Chinese body per item (`draft_zh`), easiest to copy-paste.
  cn_drafts_typefully_last.json — Typefully API responses + source URLs.

Secrets — use environment variables ONLY (never commit). Repo-root `.env`
and `scripts/source_watch/.env` are auto-loaded if present (never override existing env).

  NEWAPI_KEY or OPENAI_API_KEY     Bearer for your OpenAI-compatible gateway (chat)
  NEWAPI_IMAGE_KEY                 optional; if set, images/generations uses this key instead of NEWAPI_KEY
  NEWAPI_BASE_URL or FLUXNODE_BASE_URL  default https://api.fluxnode.org/v1
  NEWAPI_CHAT_MODEL                default claude-opus-4-7-thinking (Fluxnode; override if needed)
  NEWAPI_IMAGE_MODEL               optional e.g. gpt-image-2
  NEWAPI_EXTRA_HEADERS             optional JSON object merged into chat/image POST headers (provider-specific)

  TYPEFULLY_API_KEY                Bearer for https://api.typefully.com/v2
  TYPEFULLY_SOCIAL_SET_ID          integer; if unset, first social set from GET /social-sets
  TYPEFULLY_X_USERNAME             optional filter when auto-picking social set (e.g. GoSailGlobal)
  TYPEFULLY_PUBLISH_AT             optional: omit or "draft" = save draft only; "now" | "next-free-slot" | ISO datetime

Discord (optional): discord_webhook_url in config.json or DISCORD_WEBHOOK_URL
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from uuid import uuid4

_script_path = Path(__file__).resolve()
_scripts_dir = _script_path.parent.parent if _script_path.parent.name == "source_watch" else _script_path.parent
_scripts_str = str(_scripts_dir)
if _scripts_str not in sys.path:
    sys.path.insert(0, _scripts_str)

from local_env_file import activate_script_env

activate_script_env(_script_path)

SCRIPT_DIR = _script_path.parent
BATCH_PATH = SCRIPT_DIR / "en_digest_last_batch.json"
TWEETS_PATH = Path("/workspace/twitterapi_90d_report/tweets_90d.jsonl")
DEFAULT_CONFIG = SCRIPT_DIR / "config.json"
OUT_LOG = SCRIPT_DIR / "cn_drafts_typefully_last.json"
OUT_TEXT = SCRIPT_DIR / "cn_drafts_text_last.json"

TYPEFULLY_BASE = "https://api.typefully.com/v2"
# Fluxnode OpenAI-compatible gateway (chat + images share this host unless you override).
_DEFAULT_NEWAPI = "https://api.fluxnode.org/v1"


def _normalize_gateway_base_url(base: str) -> str:
    """Ensure https scheme, map legacy doc host to public API host, ensure path ends with /v1."""
    b = base.strip().rstrip("/")
    if not re.match(r"(?i)^https?://", b):
        b = "https://" + b.lstrip("/")
    low = b.lower()
    if "docs.newapi.pro" in low:
        # Doc/marketing host is not the API; Fluxnode keys use api.fluxnode.org (same as default gateway).
        b = re.sub(r"(?i)docs\.newapi\.pro", "api.fluxnode.org", b, count=1)
    if not b.lower().endswith("/v1"):
        b = b.rstrip("/") + "/v1"
    return b


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _post_discord(webhook: str, content: str) -> None:
    body = json.dumps({"content": content[:1990]}).encode("utf-8")
    req = urllib.request.Request(
        webhook,
        data=body,
        headers={"User-Agent": "curl/8.5.0", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        resp.read()


def _extra_headers_from_env() -> dict[str, str]:
    raw = (os.environ.get("NEWAPI_EXTRA_HEADERS") or "").strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(parsed, dict):
        return {}
    return {str(k): str(v) for k, v in parsed.items() if v is not None}


def _openai_gateway_browser_headers(api_base: str) -> dict[str, str]:
    """Some gateways (Cloudflare / WAF) expect browser-like Origin + Accept, not bare urllib."""
    b = api_base.strip()
    if not re.match(r"(?i)^https?://", b):
        b = "https://" + b.lstrip("/")
    parsed = urllib.parse.urlparse(b)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    return {
        "Accept": "application/json, text/plain, */*",
        "Origin": origin,
        "Referer": origin + "/",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        ),
    }


def _http_request(
    url: str,
    *,
    method: str = "GET",
    headers: dict | None = None,
    body: bytes | None = None,
    timeout: int = 120,
    max_redirects: int = 8,
) -> tuple[int, bytes]:
    """
    urllib does not follow 307/308 on POST by default; gateways may redirect to a trailing-slash URL.
    Non-redirect HTTP errors read the response body (urllib often hides it on HTTPError).
    """
    hdrs = {"User-Agent": "curl/8.5.0", **(headers or {})}
    current_url = url
    for _ in range(max_redirects + 1):
        req = urllib.request.Request(current_url, data=body, headers=hdrs, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as err:
            if err.code in (301, 302, 303, 307, 308):
                location = (err.headers.get("Location") or "").strip()
                if not location:
                    raise
                current_url = urllib.parse.urljoin(current_url, location)
                continue
            err_body = b""
            try:
                err_body = err.read()
            except Exception:
                pass
            err_text = err_body.decode("utf-8", errors="replace")[:1500]
            hint = ""
            if err.code == 403:
                hint = (
                    " Often: WAF/geo block from datacenter IP, or model/channel disabled on gateway; "
                    "try the same curl from your laptop, or set NEWAPI_EXTRA_HEADERS (JSON object) if your provider requires extra headers."
                )
            elif err.code == 401:
                hint = (
                    " Check NEWAPI_KEY / NEWAPI_IMAGE_KEY and NEWAPI_BASE_URL; "
                    "token must match the gateway host (e.g. https://api.fluxnode.org/v1)."
                )
            raise RuntimeError(f"HTTP {err.code} {current_url}: {err_text}{hint}") from err
    raise RuntimeError(f"Too many redirects starting from {url}")


def _http_post_json(
    url: str,
    auth_bearer: str,
    payload: dict,
    timeout: int = 180,
    *,
    openai_compat_base: str | None = None,
) -> dict:
    data = json.dumps(payload).encode("utf-8")
    hdrs: dict[str, str] = {"Authorization": f"Bearer {auth_bearer}", "Content-Type": "application/json"}
    if openai_compat_base:
        hdrs = {**_openai_gateway_browser_headers(openai_compat_base), **hdrs}
        hdrs = {**hdrs, **_extra_headers_from_env()}
    status, raw = _http_request(
        url,
        method="POST",
        headers=hdrs,
        body=data,
        timeout=timeout,
    )
    text = raw.decode("utf-8", errors="replace")
    if status >= 400:
        raise RuntimeError(f"HTTP {status} {url}: {text[:1200]}")
    if text.lstrip().startswith("<!DOCTYPE") or text.lstrip().startswith("<html"):
        raise RuntimeError(
            f"Non-JSON response from {url} (wrong path or HTML error page; "
            "set NEWAPI_BASE_URL to your gateway root, e.g. https://api.fluxnode.org/v1)."
        )
    return json.loads(text) if text.strip() else {}


def _http_get_json(url: str, auth_bearer: str, timeout: int = 60) -> dict:
    status, raw = _http_request(
        url,
        method="GET",
        headers={"Authorization": f"Bearer {auth_bearer}"},
        timeout=timeout,
    )
    text = raw.decode("utf-8", errors="replace")
    if status >= 400:
        raise RuntimeError(f"HTTP {status} {url}: {text[:800]}")
    return json.loads(text) if text.strip() else {}


def _style_samples_gosailglobal(limit: int = 6) -> list[str]:
    if not TWEETS_PATH.is_file():
        return []
    rows = []
    with TWEETS_PATH.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            if str(r.get("user") or "").lower() != "gosailglobal":
                continue
            if r.get("isReply"):
                continue
            if str(r.get("lang") or "").lower() != "zh":
                continue
            txt = (r.get("text") or "").strip()
            if len(txt) < 60:
                continue
            rows.append((int(r.get("viewCount") or 0), txt))
    rows.sort(key=lambda x: -x[0])
    return [t for _, t in rows[:limit]]


def _chat_completion(base: str, api_key: str, model: str, messages: list[dict]) -> str:
    url = base.rstrip("/") + "/chat/completions"
    body = _http_post_json(
        url,
        api_key,
        {"model": model, "messages": messages, "temperature": 0.7, "max_tokens": 4096},
        timeout=240,
        openai_compat_base=base,
    )
    choices = body.get("choices") or []
    if not choices:
        raise RuntimeError(f"No choices: {json.dumps(body)[:800]}")
    msg = choices[0].get("message") or {}
    return (msg.get("content") or "").strip()


def _images_generate(base: str, api_key: str, model: str, prompt: str, size: str) -> str | None:
    paths = ["/images/generations", "/images/generations/"]
    last_err = None
    for p in paths:
        url = base.rstrip("/") + p
        try:
            body = _http_post_json(
                url,
                api_key,
                {"model": model, "prompt": prompt[:900], "n": 1, "size": size},
                timeout=300,
                openai_compat_base=base,
            )
        except Exception as e:
            last_err = e
            continue
        data = body.get("data") or []
        if not data:
            continue
        row0 = data[0]
        if row0.get("url"):
            return str(row0["url"]).strip()
        b64 = row0.get("b64_json")
        if b64:
            import base64

            return "b64:" + b64
        return None
    if last_err:
        raise last_err
    return None


def _download_bytes(image_url: str) -> tuple[bytes, str]:
    if image_url.startswith("b64:"):
        import base64

        raw = base64.standard_b64decode(image_url[4:])
        return raw, f"cover-{uuid4().hex[:10]}.png"
    status, raw = _http_request(image_url, method="GET", timeout=120)
    if status >= 400:
        raise RuntimeError(f"download image HTTP {status}")
    ext = ".png"
    if "jpeg" in image_url or "jpg" in image_url:
        ext = ".jpg"
    elif "webp" in image_url:
        ext = ".webp"
    return raw, f"cover-{uuid4().hex[:10]}{ext}"


def _typefully_resolve_social_set(api_key: str) -> int:
    explicit = (os.environ.get("TYPEFULLY_SOCIAL_SET_ID") or "").strip()
    if explicit.isdigit():
        return int(explicit)
    data = _http_get_json(f"{TYPEFULLY_BASE}/social-sets", api_key)
    results = data.get("results") or []
    if not results:
        raise RuntimeError("Typefully: no social sets — connect X in Typefully first.")
    want = (os.environ.get("TYPEFULLY_X_USERNAME") or "").lstrip("@").strip().lower()
    if want:
        for r in results:
            if str(r.get("username") or "").lower() == want:
                return int(r["id"])
    return int(results[0]["id"])


def _typefully_upload_image(api_key: str, social_set_id: int, file_bytes: bytes, file_name: str) -> str:
    init = _http_post_json(
        f"{TYPEFULLY_BASE}/social-sets/{social_set_id}/media/upload",
        api_key,
        {"file_name": file_name},
        timeout=60,
    )
    media_id = init.get("media_id")
    upload_url = init.get("upload_url")
    if not media_id or not upload_url:
        raise RuntimeError(f"Typefully media/upload: {json.dumps(init)[:600]}")
    status, _ = _http_request(upload_url, method="PUT", body=file_bytes, timeout=180)
    if status not in (200, 204):
        raise RuntimeError(f"S3 PUT failed HTTP {status}")
    for _ in range(45):
        st = _http_get_json(f"{TYPEFULLY_BASE}/social-sets/{social_set_id}/media/{media_id}", api_key)
        if st.get("status") == "ready":
            return str(media_id)
        if st.get("status") == "failed":
            raise RuntimeError(f"Typefully media failed: {st}")
        time.sleep(2)
    raise RuntimeError("Typefully media processing timeout")


def _typefully_create_draft(
    api_key: str,
    social_set_id: int,
    text: str,
    media_ids: list[str],
    draft_title: str,
    publish_at: str | None,
) -> dict:
    payload: dict = {
        "platforms": {
            "x": {
                "enabled": True,
                "posts": [{"text": text[:24000], **({"media_ids": media_ids} if media_ids else {})}],
            }
        },
        "draft_title": draft_title[:200],
    }
    if publish_at:
        payload["publish_at"] = publish_at
    return _http_post_json(
        f"{TYPEFULLY_BASE}/social-sets/{social_set_id}/drafts",
        api_key,
        payload,
        timeout=90,
    )


def _chunks(text: str, size: int = 1850) -> list[str]:
    lines = text.split("\n")
    buf: list[str] = []
    n = 0
    out: list[str] = []
    for line in lines:
        line = line.rstrip() + "\n"
        if n + len(line) > size and buf:
            out.append("".join(buf).rstrip())
            buf = []
            n = 0
        buf.append(line)
        n += len(line)
    if buf:
        out.append("".join(buf).rstrip())
    return out


def main() -> None:
    newapi_key = (
        os.environ.get("NEWAPI_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("FLUXNODE_API_KEY")
        or ""
    ).strip()
    newapi_image_key = (
        os.environ.get("NEWAPI_IMAGE_KEY")
        or os.environ.get("OPENAI_IMAGE_API_KEY")
        or newapi_key
    ).strip()
    base = _normalize_gateway_base_url(
        (os.environ.get("NEWAPI_BASE_URL") or os.environ.get("FLUXNODE_BASE_URL") or _DEFAULT_NEWAPI).strip()
    ).rstrip("/")
    chat_model = (
        os.environ.get("NEWAPI_CHAT_MODEL")
        or os.environ.get("FLUXNODE_CLAUDE_MODEL")
        or "claude-opus-4-7-thinking"
    ).strip()
    image_model = (os.environ.get("NEWAPI_IMAGE_MODEL") or os.environ.get("FLUXNODE_IMAGE_MODEL") or "").strip()
    image_size = (os.environ.get("NEWAPI_IMAGE_SIZE") or os.environ.get("FLUXNODE_IMAGE_SIZE") or "1024x1024").strip()

    tf_key = (os.environ.get("TYPEFULLY_API_KEY") or "").strip()
    publish_raw = (os.environ.get("TYPEFULLY_PUBLISH_AT") or "draft").strip().lower()
    publish_at: str | None = None
    if publish_raw in ("", "draft", "false", "0", "no"):
        publish_at = None
    elif publish_raw in ("now", "next-free-slot") or "T" in publish_raw:
        publish_at = publish_raw if publish_raw != "draft" else None

    if not newapi_key:
        raise SystemExit("Set NEWAPI_KEY (or OPENAI_API_KEY) — never commit keys.")
    if not tf_key:
        raise SystemExit("Set TYPEFULLY_API_KEY for Typefully.")

    if not BATCH_PATH.is_file():
        raise SystemExit(f"Missing {BATCH_PATH} — run fetch_en_top10_discord.py first.")

    batch = _load_json(BATCH_PATH)
    items = batch.get("items") or []
    if not items:
        raise SystemExit("Batch has no items.")

    cfg_path = Path(os.environ.get("SOURCE_WATCH_CONFIG", str(DEFAULT_CONFIG)))
    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook and cfg_path.is_file():
        webhook = (_load_json(cfg_path).get("discord_webhook_url") or "").strip()

    social_set_id = _typefully_resolve_social_set(tf_key)

    samples = _style_samples_gosailglobal(6)
    sample_block = "\n\n---\n\n".join(f"【样例{i+1}】\n{s[:500]}" for i, s in enumerate(samples))
    if not sample_block:
        sample_block = "（未找到 gosailglobal 中文样例 tweets。）"

    system = (
        "你是中文推特账号「GoSailGlobal」的代笔。根据给定的英文推文，写「可直接发布」的中文长帖草稿。\n"
        "要求：\n"
        "1) 不是机翻腔：先一句钩子/暴论或体感，再给 3～6 条要点，最后「对我/小白的意义」一句；可适度口语。\n"
        "2) 必须单独一行写：原文链接：<url>\n"
        "3) 必须写：via @英文作者handle\n"
        "4) 不要编造原文没有的数字；不确定就写「待核对」。\n"
        "5) 约 400～900 字（不含链接行）。\n"
        "6) 「风格样例」只学语气与结构，不要复制事实与句子。\n"
    )

    if webhook:
        _post_discord(
            webhook,
            f"🤖 **中文草稿 + Typefully** · `{batch.get('window_label', '')}` · chat=`{chat_model}` · social_set=`{social_set_id}`",
        )
        time.sleep(0.4)

    results: list[dict] = []
    text_rows: list[dict] = []

    for it in items:
        rank = it.get("rank", 0)
        url = it.get("url") or ""
        author = it.get("author") or ""
        text = it.get("text") or ""
        cat = it.get("category") or ""
        user_msg = (
            f"分类：{cat}\n英文作者：@{author}\n原文链接：{url}\n英文原文：\n{text}\n\n请输出完整中文草稿。"
        )
        messages = [
            {"role": "system", "content": system + "\n\n【风格样例】\n" + sample_block},
            {"role": "user", "content": user_msg},
        ]
        try:
            draft = _chat_completion(base, newapi_key, chat_model, messages)
        except Exception as e:
            draft = f"（生成失败：{e}）\n原文链接：{url}\nvia @{author}"

        media_ids: list[str] = []
        if image_model:
            try:
                ip = (
                    os.environ.get("NEWAPI_IMAGE_PROMPT", "").strip()
                    or f"Minimal abstract editorial cover for AI news, no text, no logos, topic: {text[:100]}"
                )
                img_url = _images_generate(base, newapi_image_key, image_model, ip, image_size)
                if img_url:
                    img_bytes, fname = _download_bytes(img_url)
                    media_ids.append(_typefully_upload_image(tf_key, social_set_id, img_bytes, fname))
            except Exception as e:
                draft += f"\n\n（配图未附上：{e}）"

        try:
            tf_resp = _typefully_create_draft(
                tf_key,
                social_set_id,
                draft,
                media_ids,
                draft_title=f"EN digest Top{rank} @{author}",
                publish_at=publish_at,
            )
        except Exception as e:
            tf_resp = {"error": str(e)}

        row: dict = {
            "rank": rank,
            "source_url": url,
            "typefully_response": tf_resp,
        }
        results.append(row)
        text_rows.append(
            {
                "rank": rank,
                "author": author,
                "category": cat,
                "source_url": url,
                "draft_zh": draft,
                "typefully_draft_id": tf_resp.get("draft_id") or tf_resp.get("id"),
                "typefully_private_url": tf_resp.get("private_url") or "",
            }
        )

        if webhook:
            did = tf_resp.get("draft_id") or tf_resp.get("id")
            prv = tf_resp.get("private_url") or ""
            _post_discord(webhook, f"**Top{rank}** Typefully draft_id=`{did}`\n{prv}")
            time.sleep(0.35)
            for ch in _chunks(draft):
                _post_discord(webhook, ch)
                time.sleep(0.4)

    _save_json(
        OUT_LOG,
        {"batch": batch.get("window_label"), "social_set_id": social_set_id, "results": results},
    )
    _save_json(
        OUT_TEXT,
        {
            "batch": batch.get("window_label"),
            "social_set_id": social_set_id,
            "items": text_rows,
        },
    )
    print(f"Done. Typefully log: {OUT_LOG}\nFull Chinese text: {OUT_TEXT}", flush=True)


if __name__ == "__main__":
    main()
