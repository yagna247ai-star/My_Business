# Postgres RLS — apply & verify guide

**Status: reviewed, NOT applied.** There is no live Postgres in this environment
(dev runs SQLite, no Docker here), so `rls.sql` has never been executed. Do not
claim tenant isolation via RLS until the steps below pass on staging Postgres 16.

## Apply (staging first, then production)

```sh
# 1. Migrate schema to Postgres (from packages/db)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 2. Apply RLS (service role / superuser only)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/db/pg/rls.sql
```

## Verify (must all pass before production)

```sql
-- 1. Every tenant table has RLS forced on:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '%_prisma_%'
EXCEPT
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity;
-- expect: zero rows (all user tables covered)

-- 2. Tenant A cannot read tenant B (as app role, no service bypass):
SET LOCAL app.current_tenant = '<TENANT_A_ID>';
SET LOCAL app.role = 'app';
SELECT count(*) FROM submissions;  -- expect: only A's rows
SELECT count(*) FROM xp_ledger;    -- expect: only A's rows
SELECT count(*) FROM posts;        -- expect: only A's rows

-- 3. Unset tenant sees nothing:
RESET app.current_tenant;
SELECT count(*) FROM submissions;  -- expect: 0

-- 4. Service bypass works for jobs:
SET LOCAL app.role = 'service';
SELECT count(*) FROM submissions;  -- expect: all rows
```

## App contract

Every transaction touching tenant data must `SET LOCAL app.current_tenant`
(and `app.current_user` for membership checks) before querying. Prisma-level
`tenantId` scoping stays as the primary guard; RLS is defense in depth.

## Rollback

```sql
-- Re-run rls.sql (all statements are DROP IF EXISTS + CREATE), or disable per table:
-- ALTER TABLE <t> DISABLE ROW LEVEL SECURITY;
```

## Backups / restore drill (still pending)

Nightly `pg_dump --format=custom` to object storage, 30-day retention, monthly
restore drill to a scratch database with row-count + checksum comparison.
Runbook lives here once the first drill passes — do not mark complete before that.
