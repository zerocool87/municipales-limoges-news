#!/usr/bin/env bash
set -euo pipefail

# Simple deploy helper for municipales-limoges-news
# Usage:
#  - Interactive deploy: ./scripts/deploy.sh
#  - Non-interactive (with VERCEL_TOKEN env): VERCEL_TOKEN=… ./scripts/deploy.sh
#  - To add envs: see README / manually run `vercel env add NAME production`

echo "📦 municipales-limoges-news — deploy helper"

if ! command -v vercel >/dev/null 2>&1; then
  echo "⚠️  Vercel CLI not found. Install with:
  npm i -g vercel
or use npx: npx vercel" >&2
  exit 1
fi

# Use VERCEL_TOKEN if set for non-interactive mode
if [ -n "${VERCEL_TOKEN:-}" ]; then
  TOKEN_ARGS=(--token "$VERCEL_TOKEN")
else
  TOKEN_ARGS=()
fi

echo "🔗 Linking project (may be interactive if not already linked)..."
# `vercel link` is more explicit, but `vercel` will link interactively as needed
vercel "${TOKEN_ARGS[@]}" --confirm

echo "🚀 Deploying to production..."
vercel "${TOKEN_ARGS[@]}" --prod --confirm

echo "✅ Deployment finished. Use 'vercel open --prod' to open the deployed site, or check the Vercel dashboard."

echo
cat <<'USAGE'
Notes:
- Add runtime environment variables in the Vercel dashboard: Project → Settings → Environment Variables
  (recommended: NEWSAPI_KEY, ADMIN_TOKEN, NEWSAPI_CACHE, NEWSAPI_CACHE_TTL, PREFER_DEPARTEMENT)
- You can add env vars via CLI (interactive): vercel env add NAME production
- For CI, prefer setting secrets in GitHub or Vercel rather than embedding tokens in files.
USAGE
