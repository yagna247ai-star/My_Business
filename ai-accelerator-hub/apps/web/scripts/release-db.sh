#!/bin/sh
# Database release steps for a Vercel build: migrations, content seed, role smoke check.
# Runs ONLY for production builds. Preview and development builds never change the database schema or data,
# because preview currently shares the production database (see docs/CI_CD_DEVSECOPS_SPEC.md §4).
set -eu
SCHEMA=../../packages/db/prisma/schema.prisma
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "release-db: VERCEL_ENV=${VERCEL_ENV:-unset} — skipping migrations and seed (production builds only)."
  exit 0
fi
echo "release-db: production — applying migrations"
# One-off recovery (2026-11-26): the first release of 0019 named the table "Content" instead of "contents" and
# failed before changing anything. Mark that failed attempt rolled back so the corrected 0019 applies.
# Prisma refuses this for a migration that is applied or absent, so on later builds it is a no-op.
npx prisma migrate resolve --rolled-back 0019_day5_customers_city --schema "$SCHEMA" 2>/dev/null || true
npx prisma migrate deploy --schema "$SCHEMA"
npm run seed:content
npm run seed:domains   # 17 domain journeys; skips unchanged domains (content hash)
npm run smoke:role
# Missing interface translations are filled by the daily cron /api/cron/i18n-fill (vercel.json), not during
# the build: the AI key is rate limited and shared with the AI coaches. Run by hand: npm run i18n:fill.
