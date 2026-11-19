# Enterprise Production Gaps — AI Accelerator Hub

**Scope:** production deployment at `https://ai-accelerator-hub-one.vercel.app` (Vercel team `nachiketha`, project `ai-accelerator-hub`).
**Snapshot:** 2026-11-17. Verified: production build passes, `/api/health` reports `db: ok`, `/login` returns 200, HSTS / CSP / X-Frame-Options headers present.

Each file covers one component: its current state (with code evidence), the gap, the risk, the decision needed from you, and the steps that close it.

| # | Component | Status | Blocking decision? |
|---|-----------|--------|--------------------|
| 01 | [Payments (Razorpay)](01-payments.md) | Fails closed, not live | Yes: Razorpay account and keys |
| 02 | [AI coach assistants](02-ai-coach.md) | Not set up | Yes: which provider key |
| 03 | [Redis, rate limits, leaderboard](03-redis-rate-limit-leaderboard.md) | In-memory fallback | Yes: Redis provider |
| 04 | [Tenant isolation and RLS](04-tenancy-rls.md) | App-layer only; RLS not applied | Partly: approve rewrite and staging test |
| 05 | [Database and migrations](05-database-migrations.md) | Schema live, no migration history | Yes: commit migration? backups? |
| 06 | [Seed data and admin accounts](06-seed-and-admin-accounts.md) | Not run; default passwords in source | Yes: which accounts, if any |
| 07 | [File uploads, AV scanning, storage](07-file-uploads-and-storage.md) | Images live on Vercel Blob; PDF/video refused | Yes: scanner for PDF/video |
| 08 | [Graph database (Neo4j)](08-graph-neo4j.md) | Disabled; optional | Yes: needed or not |
| 09 | [GitHub OAuth](09-github-oauth.md) | Disabled | Yes: create OAuth app |
| 10 | [Observability](10-observability.md) | None in code | Yes: pick a provider |
| 11 | [Vercel deployment and configuration](11-vercel-deployment.md) | Working, with open items | Partly: custom domain, git deploys |

## Corrections to earlier reports

- **`FEATURE_PAYMENTS_MOCK_FALLBACK=true` has no effect.** No active code reads it. It appears only in `apps/web/_retired/`. Payments are off because the Razorpay keys are absent, and the route throws `notConfigured` ("Online payments are not enabled yet"). It is still worth deleting from Vercel to avoid confusion, but it is not a live risk.
- **AI assistants do not show mocks.** With no provider configured, `lib/ai/coach.ts` throws `notConfigured` ("AI coaches are not set up for this institution yet"). Learners see that message. `GEMINI_API_KEY` is set on production but no code reads it.

## Urgent: check the `memberships` table first

The RLS run may have left RLS forced on `memberships` in production, which could block sign-in. Run the check and, if needed, the restore in `04-tenancy-rls.md` (Steps, item 0) before anything else.

## Decisions needed (summary)

1. Razorpay account and keys, or leave payments off for launch.
2. An AI provider key: Anthropic is wired and ready; Gemini needs a new adapter.
3. Redis provider and `REDIS_URL`.
4. Approve the RLS rewrite plan (file 04) and a staging database for testing.
5. Migration policy: commit a fresh Postgres migration and set up backups.
6. Seed policy: which accounts, if any, go to production.
7. Scanner and storage choice for uploads.
8. Whether Neo4j is needed for leaderboards and social graph.
9. GitHub OAuth app.
10. Observability provider.
11. Custom domain and git-based deploys.
