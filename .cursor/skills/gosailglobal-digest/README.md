# GoSailGlobal Digest Skill

Cursor skill that wraps the English-AI → Discord → Typefully pipeline already in this repository.

## What it does

1. **Fetch English AI posts** (`scripts/source_watch/fetch_en_top10_discord.py`)
   - Pulls `last_tweets` for accounts in `scripts/source_watch/en_sources_by_category.json` (top authority + low-follower creators) and expands every X List under `meta.x_lists` (default: `https://x.com/i/lists/2003366813665767870`).
   - Filters: `lang=en`, fresh window (default 12h), `viewCount ≥ 100k`, author followers `≤ 50k` unless allowlisted, AI/tool keyword hit.
   - Writes `en_digest_last_batch.json` and posts the Top-N to Discord with a Chinese repost lead-in.
2. **Generate Chinese drafts** (`scripts/source_watch/generate_cn_drafts_fluxnode.py`)
   - Reads the batch and uses `tweets_90d.jsonl` to pull `@gosailglobal` style samples for few-shot prompting.
   - Calls `https://api.fluxnode.org/v1/chat/completions` (default model `claude-opus-4-7-thinking`).
   - For `text_only` / `text_with_image` posts: optional cover via `images/generations` or `images/edits` with the original photo as reference.
   - For `video` posts: downloads the mp4, uploads to Typefully as media, attaches to the draft, and appends a CapCut subtitle workflow to the body.
   - Creates a Typefully draft per item (kept as draft by default; can be scheduled with `TYPEFULLY_PUBLISH_AT`).
3. **One-shot runner** (`scripts/source_watch/run_pipeline.sh`)
   - Loads `scripts/source_watch/.env` if present, validates required env vars, runs both scripts in order, and prints output paths.

## Required Cursor Secrets

| Variable | Purpose |
|----------|---------|
| `TWITTERAPI_KEY` | twitterapi.io key (needs credits — a 402 means recharge or rotate) |
| `DISCORD_WEBHOOK_URL` | Channel webhook for the digest |
| `NEWAPI_KEY` | OpenAI-compatible gateway bearer (Fluxnode by default) |
| `TYPEFULLY_API_KEY` | Typefully token |

Optional:

| Variable | Default |
|----------|---------|
| `NEWAPI_BASE_URL` | `https://api.fluxnode.org/v1` |
| `NEWAPI_CHAT_MODEL` | `claude-opus-4-7-thinking` |
| `NEWAPI_IMAGE_MODEL` | unset (no images) — set e.g. `gpt-image-2` |
| `NEWAPI_IMAGE_KEY` | falls back to `NEWAPI_KEY` |
| `TYPEFULLY_X_USERNAME` | first social set; e.g. `GoSailGlobal` |
| `TYPEFULLY_PUBLISH_AT` | `draft` (default), `now`, `next-free-slot`, ISO datetime |

Cursor Secrets are injected only when a new cloud agent VM starts. Rotating values needs a new agent run.

## Quick start

Strict run (12h, low-follower, ≥100k views):

```bash
cd scripts/source_watch
./run_pipeline.sh
```

Loosened test run (24h, ≥20k views, Top 3):

```bash
cd scripts/source_watch
SOURCE_WATCH_TOP_N=3 \
  SOURCE_WATCH_WINDOW_HOURS=24 \
  SOURCE_WATCH_MIN_VIEW_COUNT=20000 \
  ./run_pipeline.sh
```

## Outputs (gitignored)

- `scripts/source_watch/en_digest_last_batch.json` — selected tweets with `media_kind`
- `scripts/source_watch/cn_drafts_text_last.json` — final Chinese drafts (`draft_zh`)
- `scripts/source_watch/cn_drafts_typefully_last.json` — Typefully API responses (with `private_url`)
- `scripts/source_watch/downloaded_videos/<tweet_id>.mp4` — for video tweets

## Customizing the pool

Edit `scripts/source_watch/en_sources_by_category.json`:

- `top_authority` — bypass follower cap (OpenAI, OpenAIDevs, AndrewYNg, AnthropicAI, claudeai, GoogleDeepMind, GoogleAI, AIatMeta, nvidia, MistralAI, Cohere, PerplexityAI, xai, grok, GitHub, GitHubCopilot, cursor_ai, deepseek_ai, etc.)
- `tool_workflow`, `niche_tool_recap`, `indie_ai_creators` — low-follower English creators
- `x_lists` — extra X lists to expand at runtime (id, label, max_members)
- `meta.ai_keywords` — keyword whitelist that the tweet text must hit
- `meta.window_hours`, `meta.min_view_count`, `meta.max_author_followers` — base thresholds (env vars override at runtime)

## Troubleshooting

- `Need DISCORD_WEBHOOK_URL` — set the webhook secret or add it to `config.json`/`.env`.
- `HTTP 402 Credits is not enough` from twitterapi.io — recharge or rotate the key in Cursor Secrets, then start a new cloud agent.
- `HTTP 401 Invalid token` from Fluxnode — usually a model not allowed for the key; the script auto-remaps `gpt-4` → `claude-opus-4-7-thinking` on `api.fluxnode.org`. Confirm the model id in your Fluxnode console.
- `SignatureDoesNotMatch` from Typefully S3 — already handled by the script's raw PUT; if it returns, ensure no proxy is rewriting headers.
- `No new tweets to post.` — strict thresholds did not match. Re-run with the loosened env vars above.

## Files in this skill

- `SKILL.md` — Cursor frontmatter (description) used by the agent runtime.
- `README.md` — this file.

The actual implementation lives under `scripts/source_watch/` so it can be invoked outside Cursor too (e.g. cron).
