#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${TWITTERAPI_KEY:?TWITTERAPI_KEY is required}"
: "${NEWAPI_KEY:?NEWAPI_KEY is required}"
: "${TYPEFULLY_API_KEY:?TYPEFULLY_API_KEY is required}"
: "${DISCORD_WEBHOOK_URL:?DISCORD_WEBHOOK_URL is required}"

PY="${PYTHON:-python3}"

echo "[1/2] fetch_en_top10_discord.py"
"$PY" fetch_en_top10_discord.py

echo "[2/2] generate_cn_drafts_fluxnode.py"
"$PY" generate_cn_drafts_fluxnode.py

echo "Done. See cn_drafts_text_last.json (drafts) and cn_drafts_typefully_last.json (Typefully responses)."
