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
| `SOURCE_WATCH_RATE_DELAY` | `0.4` | Seconds between per-account fetches; raise to `0.6`+ when twitterapi.io returns `429` |

If a key has been pasted into chat, treat it as leaked and rotate it before saving to Cursor Secrets.

## Steps (canonical run)

Always use `run_pipeline.sh`. Do not run `fetch_en_top10_discord.py` or `generate_cn_drafts_fluxnode.py` ad-hoc unless explicitly asked.

1. **Pre-flight**. Print fingerprints (no values), then probe twitterapi.io:
   ```bash
   python3 - <<'PY'
   import hashlib, os
   for k in ['TWITTERAPI_KEY','NEWAPI_KEY','TYPEFULLY_API_KEY','DISCORD_WEBHOOK_URL']:
       v=os.environ.get(k,'')
       print(f"{k}={'set len='+str(len(v))+' sha8='+hashlib.sha256(v.encode()).hexdigest()[:8] if v else 'unset'}")
   PY
   curl -sS -o /tmp/twapi.json -w "HTTP_STATUS:%{http_code}\n" \
     -H "X-API-Key: $TWITTERAPI_KEY" \
     "https://api.twitterapi.io/twitter/user/last_tweets?userName=OpenAI&includeReplies=false"
   ```
   - `HTTP_STATUS:200` → continue.
   - `HTTP_STATUS:402 Credits is not enough` → recharge or rotate the twitterapi.io key, then start a **new** cloud agent (Cursor Secrets only inject on VM start).
   - Any required secret is `unset` → ask the user to add it to Cursor Secrets, then restart the agent.
2. **Strict run**:
   ```bash
   cd scripts/source_watch
   ./run_pipeline.sh
   ```
3. **Relaxed retry** only if strict run reports `No new tweets to post.`:
   ```bash
   SOURCE_WATCH_TOP_N=3 \
     SOURCE_WATCH_WINDOW_HOURS=24 \
     SOURCE_WATCH_MIN_VIEW_COUNT=20000 \
     SOURCE_WATCH_RATE_DELAY=0.6 \
     ./run_pipeline.sh
   ```
4. **Verify** outputs (gitignored):
   - `scripts/source_watch/en_digest_last_batch.json` — picks (rank, url, media_kind). Empty `items` ⇒ runner correctly skipped Typefully.
   - `scripts/source_watch/cn_drafts_text_last.json` — final Chinese drafts (`draft_zh`).
   - `scripts/source_watch/cn_drafts_typefully_last.json` — Typefully API responses (`typefully_private_url` per item).
   - `scripts/source_watch/downloaded_videos/<tweet_id>.mp4` — for video tweets.
5. **Confirm in Typefully** by opening each `typefully_private_url`. Never re-run the strict + relaxed combo back-to-back unless the user explicitly asks; the persistent state files already prevent duplicates.

## Source pool (configurable)

Edit `scripts/source_watch/en_sources_by_category.json`:

- `top_authority` — official accounts; bypass the 50k follower cap
- `tool_workflow` / `niche_tool_recap` / `indie_ai_creators` — low-follower creators
- `x_lists` — additional X lists to expand at runtime (current: `2003366813665767870`)
- `meta.ai_keywords` — required tweet text keywords (AI / agent / Claude / Cursor / Stripe / MRR …)

Re-run the pipeline after editing.

## Dedupe (two layers — load-bearing)

The pipeline must never re-publish the same tweet. Two state files cooperate:

| Layer | State file | Owner script | Behavior |
|-------|------------|--------------|----------|
| Fetch | `scripts/source_watch/en_digest_posted_ids.json` | `fetch_en_top10_discord.py` | Skip tweet ids already picked in past digests **before** ranking. If nothing remains, write `items: []` to `en_digest_last_batch.json` so generate is skipped. |
| Generate | `scripts/source_watch/cn_drafts_posted_ids.json` | `generate_cn_drafts_fluxnode.py` | Drop batch items whose tweet ids are already drafted **before** any Fluxnode/Typefully call. If all items are dedup'd, exit with `Done. All batch items were already drafted in a previous run.` |

Both files are gitignored and persist across runs.

Rules for the agent:

- Do **not** delete either state file unless the user explicitly asks to re-send a specific tweet.
- If the user wants to re-send one tweet, remove just its tweet id from both files; do not wipe everything.
- After a successful run, commit nothing (state files are gitignored on purpose) — they belong to the local agent VM, not the repo.

The runner also enforces this: `run_pipeline.sh` calls fetch, then inspects `en_digest_last_batch.json`; if `items` is empty it prints `[2/2] skipped — no fresh batch from fetch step` and exits without invoking generate.

## Behavior notes

- Media routing in `generate_cn_drafts_fluxnode.py`:
  - `text_only` — generate cover via `images/generations`
  - `text_with_image` — download photo, run `images/edits`, fall back to generations
  - `video` — download mp4 to `downloaded_videos/`, upload to Typefully via presigned S3, append CapCut subtitle workflow to draft text
  - `other` — skip image generation
- Discord webhook is required so each Top-N item is published with author + view count + Chinese lead, plus the Typefully draft URL afterwards.
- Cursor Secrets are injected only when a new cloud agent VM starts; rotating a secret requires a new agent run to take effect.

## Bulk article → Thread mode

For curated listicles (e.g. `rarehistoricalphotos.com/weird-japanese-inventions/`), use `scripts/source_watch/post_chindogu_typefully.py`:

- Default: one Typefully draft per section (image attached).
- `--thread`: bundle the whole article into ONE Typefully thread draft (intro post + 1 post per section with that section's photo + outro post). Generates each post via Fluxnode with a thread-aware system prompt and strips any meta paragraphs (e.g. unsolicited "prompt injection" warnings) that the model occasionally appends.
- `--limit N`, `--start K`, `--dry-run` available.

Example (Cursor agent prompt: *"放到一条 thread 里"*):

```bash
python3 scripts/source_watch/post_chindogu_typefully.py --thread
```

State files for this workflow:

- `scripts/source_watch/jp_chindogu_typefully_last.json` — last run summary (single drafts or `thread_draft`).
- `scripts/source_watch/jp_chindogu_posted_titles.json` — per-section dedupe state (single-draft mode only).

For other curated articles, copy the script and replace `_extract_sections` / `SOURCE_URL` (or generalize with `--source-url` when needed).

## Common failures (resolution playbook)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Need DISCORD_WEBHOOK_URL` | Webhook missing or placeholder | Set Cursor Secret `DISCORD_WEBHOOK_URL`; restart cloud agent |
| `HTTP 402 Credits is not enough` from twitterapi.io | Account out of credits, or batch burned the bonus | Recharge / rotate the key, restart cloud agent. Also bump `SOURCE_WATCH_RATE_DELAY` so subsequent runs use fewer parallel calls |
| `HTTP 429 Too Many Requests` | twitterapi.io rate limit | The script already retries with exponential backoff; if still failing, increase `SOURCE_WATCH_RATE_DELAY` |
| `HTTP 401 Invalid token` from Fluxnode | Model not allowed for the key | Verify `NEWAPI_CHAT_MODEL` against the gateway console; the script remaps `gpt-4` to `claude-opus-4-7-thinking` on `api.fluxnode.org` |
| `SignatureDoesNotMatch` on Typefully media | Some proxy added headers | Already mitigated by raw `http.client` PUT; ensure no extra headers are injected |
| `No new tweets to post.` then runner exits | All candidates dedup'd or filtered out | Try the relaxed retry above; do not delete dedupe state |
| Duplicate Typefully drafts | Stale `en_digest_last_batch.json` reused | Already prevented by the empty-items + runner-skip path in this skill version; if it recurs, check that `run_pipeline.sh` is the entry point |
