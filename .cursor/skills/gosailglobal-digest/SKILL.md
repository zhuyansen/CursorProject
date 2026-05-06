---
name: gosailglobal-digest
description: One-shot pipeline that watches English AI X creators (low-follower + authority + a curated X List), filters fresh high-view AI posts, posts a Top-N digest to Discord, then generates GoSailGlobal-style Chinese drafts via Fluxnode (OpenAI-compatible) and uploads them to Typefully (with image edits and video upload). Trigger this skill when the user wants to "run the digest", "get today's English AI posts to Typefully", "build Chinese drafts from X", "fire the GoSailGlobal pipeline", or asks to populate Typefully drafts from English creators.
---

# gosailglobal-digest

End-to-end pipeline for the GoSailGlobal Chinese repost account. Combines `scripts/source_watch/fetch_en_top10_discord.py` and `scripts/source_watch/generate_cn_drafts_fluxnode.py` behind one runner: `scripts/source_watch/run_pipeline.sh`.

## When to use

Use whenever the user wants to:

- Find today's English AI posts that fit a low-follower repost target.
- Push the filtered Top-N to Discord with a Chinese intro.
- Generate full Chinese drafts (chat + cover image / video upload) and create Typefully drafts in one go.
- Re-run with looser thresholds (24h, 20k views, etc.) without editing JSON.

Do **not** use this skill for the gpt-image standalone tool, or for ad-hoc Twitter scraping; use the relevant scripts directly instead.

## Required environment (Cursor Secrets or `scripts/source_watch/.env`)

| Variable | Purpose |
|----------|---------|
| `TWITTERAPI_KEY` | twitterapi.io API key — fetch tweets and X List members |
| `DISCORD_WEBHOOK_URL` | Discord channel webhook (post digest + draft links) |
| `NEWAPI_KEY` | OpenAI-compatible gateway bearer (Fluxnode by default) |
| `TYPEFULLY_API_KEY` | Typefully API token |

Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEWAPI_BASE_URL` | `https://api.fluxnode.org/v1` | Override gateway base |
| `NEWAPI_CHAT_MODEL` | `claude-opus-4-7-thinking` | Chat model id available on the gateway |
| `NEWAPI_IMAGE_MODEL` | (unset → no images) | e.g. `gpt-image-2`. When set, script auto-generates a cover for `text_only` / `text_with_image` posts |
| `NEWAPI_IMAGE_KEY` | falls back to `NEWAPI_KEY` | Separate bearer for `images/generations` |
| `TYPEFULLY_X_USERNAME` | first social set | e.g. `GoSailGlobal` |
| `TYPEFULLY_PUBLISH_AT` | `draft` | `draft`, `now`, `next-free-slot`, or ISO datetime |
| `SOURCE_WATCH_TOP_N` | `meta.top_n` (10) | Limit batch size |
| `SOURCE_WATCH_WINDOW_HOURS` | `meta.window_hours` (12) | Recency filter |
| `SOURCE_WATCH_MIN_VIEW_COUNT` | `meta.min_view_count` (100000) | View threshold |
| `SOURCE_WATCH_MAX_AUTHOR_FOLLOWERS` | `meta.max_author_followers` (50000) | Follower cap (allowlist excepted) |

If a key has been pasted into chat, treat it as leaked and rotate it before saving to Cursor Secrets.

## Steps

1. Confirm secrets are present (no values printed):
   ```bash
   for k in TWITTERAPI_KEY NEWAPI_KEY TYPEFULLY_API_KEY DISCORD_WEBHOOK_URL; do
     v="${!k-}"; [ -n "$v" ] && echo "$k=set(len=${#v})" || echo "$k=unset"
   done
   ```
2. Verify upstream: a 402 from twitterapi.io means credits are exhausted on that key. Resolve before continuing.
3. Run the strict pipeline:
   ```bash
   cd scripts/source_watch
   ./run_pipeline.sh
   ```
4. If strict run reports `No new tweets to post.`, retry with relaxed thresholds:
   ```bash
   SOURCE_WATCH_TOP_N=3 SOURCE_WATCH_WINDOW_HOURS=24 SOURCE_WATCH_MIN_VIEW_COUNT=20000 \
     ./run_pipeline.sh
   ```
5. Inspect outputs (gitignored):
   - `scripts/source_watch/en_digest_last_batch.json` — picks (rank, url, media_kind)
   - `scripts/source_watch/cn_drafts_text_last.json` — final Chinese drafts (`draft_zh`)
   - `scripts/source_watch/cn_drafts_typefully_last.json` — Typefully API responses
   - `scripts/source_watch/downloaded_videos/<tweet_id>.mp4` — for video tweets
6. Confirm in Typefully: open each `typefully_private_url` from `cn_drafts_text_last.json`.

## Source pool (configurable)

Edit `scripts/source_watch/en_sources_by_category.json`:

- `top_authority` — official accounts; bypass the 50k follower cap
- `tool_workflow` / `niche_tool_recap` / `indie_ai_creators` — low-follower creators
- `x_lists` — additional X lists to expand at runtime (current: `2003366813665767870`)
- `meta.ai_keywords` — required tweet text keywords (AI / agent / Claude / Cursor / Stripe / MRR …)

Re-run the pipeline after editing.

## Dedupe (two layers)

The pipeline never re-publishes the same tweet:

1. `fetch_en_top10_discord.py` writes selected tweet ids to `en_digest_posted_ids.json`. Future fetch runs skip ids in that file before ranking.
2. `generate_cn_drafts_fluxnode.py` writes successfully-drafted tweet ids to `cn_drafts_posted_ids.json`. On the next run, items already in this file are dropped from the batch before any Fluxnode/Typefully call. If every item was drafted before, the script exits early with `Done. All batch items were already drafted in a previous run.`

Both state files live under `scripts/source_watch/` and are gitignored. Delete the file you want to "re-send" if you intentionally need to repost a tweet.

## Behavior notes

- Media routing in `generate_cn_drafts_fluxnode.py`:
  - `text_only` — generate cover via `images/generations`
  - `text_with_image` — download photo, run `images/edits`, fall back to generations
  - `video` — download mp4 to `downloaded_videos/`, upload to Typefully via presigned S3, append CapCut subtitle workflow to draft text
  - `other` — skip image generation
- Discord webhook is required so each Top-N item is published with author + view count + Chinese lead, plus the Typefully draft URL afterwards.
- Cursor Secrets are injected only when a new cloud agent VM starts; rotating a secret requires a new agent run to take effect.
