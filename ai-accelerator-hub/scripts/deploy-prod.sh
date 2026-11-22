#!/bin/bash
# Guarded production deploy from a laptop (CI does the same from GitHub):
#   1. every check in scripts/ci/verify.sh   2. clean, pushed working tree
#   3. vercel deploy --prod, and make sure the domain really serves the new build
#   4. smoke test (retried once after a short wait, so one network blip does not undo a good release);
#      if it still fails, roll back to the deployment that was live before, and verify the domain serves it again
set -euo pipefail
cd "$(dirname "$0")/.."
PROD_URL="${PROD_URL:-https://aiachub.nachikethaenterprises.business}"
PROD_HOST="${PROD_URL#https://}"
VERCEL="${VERCEL_BIN:-npx --yes vercel@66.2.0}"

# The deployment the production domain serves right now (its *.vercel.app URL).
serving() { $VERCEL inspect "$PROD_HOST" 2>&1 | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | head -1; }

[ -z "$(git status --porcelain .)" ] || { echo "Commit your changes first: production must match a commit."; exit 1; }
git fetch -q origin 2>/dev/null || true
[ "$(git rev-parse HEAD)" = "$(git rev-parse '@{u}' 2>/dev/null || echo none)" ] || { echo "Push first: production must match what is on GitHub."; exit 1; }

scripts/ci/verify.sh

PREV="$(serving)"
[ -n "$PREV" ] || { echo "Could not find the deployment production serves now; refusing to deploy without a rollback target."; exit 1; }
echo; echo "Live before this deploy (rollback target): $PREV"

echo; echo "▶ Deploying $(git rev-parse --short HEAD) to production"
$VERCEL deploy --prod --yes >/tmp/aihub-deploy.log 2>&1 || { tail -20 /tmp/aihub-deploy.log; echo "Deploy failed; production is unchanged."; exit 1; }
NEW="$(grep -oE 'https://[a-z0-9-]+\.vercel\.app' /tmp/aihub-deploy.log | head -1)"
echo "$NEW"

# After an earlier rollback Vercel stops moving the domain to new deploys until one is promoted. Make sure it moved.
if [ "$(serving)" != "$NEW" ]; then
  echo "The domain still serves the old build; promoting $NEW"
  $VERCEL promote "$NEW" --yes >/dev/null 2>&1 || true
  sleep 10
  [ "$(serving)" = "$NEW" ] || { echo "Could not point $PROD_HOST at the new build. Production still serves $(serving)."; exit 1; }
fi

echo; echo "▶ Smoke test"
if ! scripts/ci/smoke.sh "$PROD_URL"; then
  echo "Smoke test failed; trying again in 20 seconds in case it was a network blip"
  sleep 20
  if ! scripts/ci/smoke.sh "$PROD_URL"; then
    echo "Smoke test failed twice — rolling back to $PREV"
    $VERCEL rollback "$PREV" --yes --timeout 3m || true
    sleep 5
    NOW="$(serving)"
    if [ "$NOW" = "$PREV" ]; then echo "↩ Rolled back: production serves $PREV again."; else echo "⚠ ROLLBACK DID NOT TAKE EFFECT: production serves $NOW. Roll back by hand: $VERCEL rollback $PREV"; fi
    echo "Note: after a rollback, the next deploy is promoted by this script automatically."
    exit 1
  fi
fi
echo "✔ Deployed and verified: $PROD_HOST serves $NEW"
