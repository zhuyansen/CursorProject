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

batch_count=$("$PY" - <<'PY'
import json, os
from pathlib import Path
p = Path("en_digest_last_batch.json")
if not p.is_file():
    print(0); raise SystemExit
data = json.loads(p.read_text(encoding="utf-8"))
print(len(data.get("items") or []))
PY
)

if [ "${batch_count}" = "0" ]; then
  echo "[2/2] skipped — no fresh batch from fetch step"
  exit 0
fi

echo "[2/2] generate_cn_drafts_fluxnode.py"
"$PY" generate_cn_drafts_fluxnode.py

echo "Done. See cn_drafts_text_last.json (drafts) and cn_drafts_typefully_last.json (Typefully responses)."
