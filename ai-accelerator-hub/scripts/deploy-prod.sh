#!/bin/bash
# Guarded production deploy from a laptop (CI does the same from GitHub):
#   1. every check in scripts/ci/verify.sh   2. clean, pushed working tree
#   3. vercel deploy --prod                  4. smoke test; on failure, automatic rollback
set -euo pipefail
cd "$(dirname "$0")/.."
PROD_URL="${PROD_URL:-https://aiachub.nachikethaenterprises.business}"
VERCEL="${VERCEL_BIN:-npx --yes vercel@66.2.0}"

[ -z "$(git status --porcelain .)" ] || { echo "Commit your changes first: production must match a commit."; exit 1; }
git fetch -q origin 2>/dev/null || true
[ "$(git rev-parse HEAD)" = "$(git rev-parse '@{u}' 2>/dev/null || echo none)" ] || { echo "Push first: production must match what is on GitHub."; exit 1; }

scripts/ci/verify.sh

echo; echo "▶ Deploying $(git rev-parse --short HEAD) to production"
$VERCEL deploy --prod --yes >/tmp/aihub-deploy.log 2>&1 || { tail -20 /tmp/aihub-deploy.log; echo "Deploy failed; production is unchanged."; exit 1; }
grep -oE 'https://[a-z0-9-]+\.vercel\.app' /tmp/aihub-deploy.log | head -1

echo; echo "▶ Smoke test"
if ! scripts/ci/smoke.sh "$PROD_URL"; then
  echo "Smoke test failed — rolling back to the previous production deployment"
  $VERCEL rollback --yes
  exit 1
fi
echo "✔ Deployed and verified"
