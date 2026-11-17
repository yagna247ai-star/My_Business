# 04 — Tenant isolation and Row-Level Security

**Status:** isolation is enforced only by application code. Database RLS is not applied.

## Current state

- `apps/web/lib/prisma.ts:26`: `withTenant(tenantId, fn)` only checks that `tenantId` is set and then calls `fn(prisma)`. Its comment says the Postgres `SET LOCAL app.current_tenant` step is **not** done.
- `tenantWhere(tenantId)` returns `{ tenantId }`. Queries must include it by hand.
- `packages/db/pg/rls.sql` (209 lines) was never executed before. The first run failed:
  - Its policies use snake_case columns (`tenant_id`, `user_id`). Prisma generates camelCase (`tenantId`, `userId`), so the policies reference columns that do not exist.
  - It uses `FORCE ROW LEVEL SECURITY`. The app connects as the table owner, so forced RLS would block every query that does not set `app.current_tenant`. The app never sets it.
  - The run enabled RLS on `tenants` and then failed on `memberships`. I reverted `tenants` and verified `tenants_rls: false`.
  - **Update 2026-11-17:** the production seed upserted `memberships` rows successfully, and admin sign-in returns a tenant ID from the membership lookup. Both indicate `memberships` is not blocking the app. Still confirm in the Neon console (Steps item 0).
  - **Original note:** the `memberships` block ran `ENABLE` and `FORCE ROW LEVEL SECURITY` before its `CREATE POLICY` failed. My revert did not touch `memberships`. If the earlier run was not rolled back as a whole, `memberships` has RLS forced with no policy, which blocks every row for the app's connection, including sign-in lookups. This is unverified. Check it first (see Steps).
- `packages/db/pg/README.md` says RLS must pass a cross-tenant test on staging Postgres 16 before production. That has not happened.

## Gap

- No database-level isolation. A missed `tenantId` filter in any query leaks data across tenants.
- No tests prove cross-tenant reads fail. The README lists the checks; none have been run.
- The app's database role is the owner, which bypasses RLS even when enabled.

## Risk

- High for multi-institution use. Acceptable for a single institution with trusted staff, but it is not defence in depth.

## Decision needed

- Approve a rewrite of `rls.sql` and a staging Postgres database for testing. Without a staging database, the rewrite cannot be verified.

## Steps to close

0. **Check production now.** In the Neon console SQL editor (production branch), run:
   ```sql
   SELECT relname, relrowsecurity, relforcerowsecurity
   FROM pg_class WHERE relname IN ('tenants', 'memberships') AND relnamespace = 'public'::regnamespace;
   ```
   If `memberships` shows `relrowsecurity = true`, run this immediately to restore access:
   ```sql
   ALTER TABLE memberships NO FORCE ROW LEVEL SECURITY;
   ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS memberships_isolation ON memberships;
   ```
   Then sign in as a test user to confirm login works.
1. Provision a staging Postgres (Neon branch is the simplest: branch the production database).
2. Rewrite `rls.sql` with the Prisma column names (`"tenantId"`, `"userId"`). Use `ENABLE` without `FORCE` at first, so the owner role keeps working while policies are tested.
3. Change `withTenant` to run inside a transaction: `SET LOCAL app.current_tenant = $tenantId` and `SET LOCAL app.current_user`. Keep the app-layer filters as a second layer.
4. Create a non-owner application role. Grant it only the needed privileges and point `DATABASE_URL` at it in production.
5. Run the README verification queries on staging, plus cross-tenant integration tests: tenant A cannot read tenant B's submissions, XP ledger, or posts.
6. Only after staging passes, apply to production and switch to `FORCE` if desired.
