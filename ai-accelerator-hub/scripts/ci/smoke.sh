#!/bin/bash
# Post-deploy smoke test. Read-only: no sign-in, no writes. Exits non-zero on any unexpected response.
# Usage: scripts/ci/smoke.sh https://aiachub.nachikethaenterprises.business
set -uo pipefail
BASE="${1:?usage: smoke.sh BASE_URL}"
BASE="${BASE%/}"
fail=0
code() { curl -s -o /dev/null -m 30 --retry 3 --retry-delay 3 --retry-all-errors -w '%{http_code}' "$@"; }
expect() { # expect LABEL WANT [curl args...]
  local label="$1" want="$2"; shift 2
  local got; got=$(code "$@")
  if [[ " $want " == *" $got "* ]]; then printf '  ok    %-44s %s\n' "$label" "$got"
  else printf '  FAIL  %-44s got %s, want %s\n' "$label" "$got" "$want"; fail=1; fi
}

echo "Smoke test: $BASE"
health=$(curl -s -m 30 --retry 5 --retry-delay 5 --retry-all-errors "$BASE/api/health" || true)
if echo "$health" | grep -q '"status":"ok"' && echo "$health" | grep -q '"db":{"status":"ok"'; then echo "  ok    /api/health (db ok)"
else echo "  FAIL  /api/health: $health"; fail=1; fi

for p in / /login /register /privacy; do expect "GET $p" "200" "$BASE$p"; done
for p in /dashboard /levels /settings /settings/people /settings/institute /admin /admin/people; do expect "GET $p (signed out → login)" "307" "$BASE$p"; done
for p in /api/v1/settings/people /api/v1/settings/institute /api/v1/settings/cohorts /api/v1/admin/members; do expect "GET $p (signed out)" "401" "$BASE$p"; done
expect "POST /api/v1/files (signed out)" "401" -X POST -H "origin: $BASE" "$BASE/api/v1/files"
expect "GET /api/v1/register/journeys" "200" "$BASE/api/v1/register/journeys"

if [ "$fail" -ne 0 ]; then echo "Smoke test FAILED"; exit 1; fi
echo "Smoke test passed"
