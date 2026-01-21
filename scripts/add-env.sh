#!/usr/bin/env bash
set -euo pipefail

# Interactive helper to add common environment variables to Vercel for this project
# Usage: ./scripts/add-env.sh
# It will prompt which environments (production/preview/development) to add to and then
# run `vercel env add` for each variable and environment, one by one (you'll be asked to paste values).

VARS=(
  "NEWSAPI_KEY"
  "ADMIN_TOKEN"
  "NEWSAPI_CACHE"
  "NEWSAPI_CACHE_TTL"
  "PREFER_DEPARTEMENT"
)

if ! command -v vercel >/dev/null 2>&1; then
  echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel or use npx vercel"
  exit 1
fi

echo "This helper will run 'vercel env add' for the following variables:"
for v in "${VARS[@]}"; do echo " - $v"; done

read -rp "Enter environments to add to (space-separated: production preview development) [production preview]: " ENVS_INPUT
ENVS_INPUT=${ENVS_INPUT:-"production preview"}

read -rp "Proceed and add vars to: $ENVS_INPUT ? (y/N) " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

read -rp "Do you want to run in non-interactive mode using VERCEL_TOKEN env var if set? (y/N) " NONINT
NONINT=${NONINT:-N}

for env in $ENVS_INPUT; do
  for var in "${VARS[@]}"; do
    echo
    echo "Adding $var to $env..."
    if [[ "$NONINT" == "y" || "$NONINT" == "Y" ]] && [[ -n "${VERCEL_TOKEN:-}" ]]; then
      # In non-interactive mode, we can try to use the API via vercel CLI, but vercel env add remains interactive
      # so we still call it and rely on interactive prompt for value.
      VERCEL_TOKEN="$VERCEL_TOKEN" vercel env add "$var" "$env"
    else
      vercel env add "$var" "$env"
    fi
  done
done

echo
echo "✅ Done. Use 'vercel env ls' to confirm or 'vercel env pull .env.local --environment=development' to fetch them locally."