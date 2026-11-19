#!/bin/bash
# Local quality + security gate: the same checks CI runs before anything can deploy.
# Usage: scripts/ci/verify.sh            (quick: no database)
#        TEST_DATABASE_URL=postgresql://... scripts/ci/verify.sh   (also runs DB tests + migration drift check)
set -euo pipefail
cd "$(dirname "$0")/../.."
step() { printf '\n▶ %s\n' "$1"; }

step "Dependency audit (deployed app, high and critical block)"
npm audit --omit=dev --workspace=web --audit-level=high

step "Lint (errors block)";            npm run lint:ci --workspace=web
step "Type check";                     npm run typecheck --workspace=web
step "Unit tests";                     npm run test:pure --workspace=web
step "Prisma schema validate";         (cd packages/db && DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost:5432/ci}" DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-postgresql://ci:ci@localhost:5432/ci}" npx prisma validate)

if [ -n "${TEST_DATABASE_URL:-}" ]; then
  step "Migration drift (schema must match migrations)"
  (cd packages/db && DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$TEST_DATABASE_URL" --exit-code >/dev/null) || { echo "schema.prisma has changes without a migration"; exit 1; }
  step "Integration tests (Postgres)"; npm run test:db --workspace=web
else
  printf '\n(skipping DB tests and migration drift: set TEST_DATABASE_URL to a disposable Postgres to run them)\n'
fi

step "Production build"
(cd apps/web && DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost:5432/ci}" DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-postgresql://ci:ci@localhost:5432/ci}" NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-ci-build-secret-ci-build-secret-123456}" NEXT_DIST_DIR=.next-verify npm run build >/tmp/aihub-build.log 2>&1) || { tail -40 /tmp/aihub-build.log; exit 1; }
rm -rf apps/web/.next-verify
printf '\n✔ All checks passed\n'
