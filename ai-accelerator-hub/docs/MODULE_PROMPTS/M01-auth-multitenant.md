# M01 — Auth & Multi-Tenancy (BRD-02 · §4 §23 · REQ-AUTH-01..03)

## 1. Objective
Build secure tenant-isolated access for 10 roles across institutions and cohorts.

## 2. Prerequisites
- Read `packages/db/prisma/schema.prisma` (Tenant, User, Role, Membership, AbacPolicy).
- Read `apps/web/lib/auth.ts` and `apps/web/middleware.ts`.
- Seed has 10 roles and `demo` tenant.

## 3. Build steps
1. Verify `Membership UNIQUE(tenant,user)` is enforced in schema.
2. Verify `withTenant()` resolver fails closed (no tenant → no rows).
3. Verify registration creates user + membership + enrollment + progress + streak.
4. Verify JWT 15m + httpOnly refresh; MFA flag exists for privileged roles.
5. Verify GitHub OAuth links `githubId` without breaking credential login.

## 4. ARB gate
- Is every query tenant-scoped at app layer and RLS at DB layer?
- Are roles resolved via CASL/CASBIN, not `if role === 'admin'` sprinkled in handlers?
- Can a new institution be added without code change?
- Is there exactly one tenant-resolution path (middleware), not three?

## 5. NFR gate
- p95 login < 2s under load. Brute-force protection on login/register.
- Session cookies `httpOnly; Secure; SameSite=Lax`. Security headers in middleware.
- No tenant leakage in logs or error messages.

## 6. Red-team review
- Try cross-tenant read: user A fetches user B's progress in another tenant. Must return 0 rows.
- Try role escalation: student calls admin route. Must 403 + audit log.
- Try OAuth callback CSRF and replay. Must reject.
- Try registering twice with same email. Must not duplicate or leak.

## 7. Acceptance
- `POST /api/register` → login works; `GET /api/health` shows db ok.
- Tenant isolation test passes (see `verify.mjs` auth group).
- Commands (from hub root unless noted):
  - `cd apps/web && ../../node_modules/.bin/vitest run`
  - `node --import tsx/esm verify.mjs`

## 8. Done criteria
All build steps + ARB + NFR + red-team + acceptance green. No placeholder auth.
