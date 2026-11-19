# Deployment

How production is built, deployed, checked and rolled back. For the open configuration issues, see [11-vercel-deployment.md](./enterprise-gaps/11-vercel-deployment.md).

| | |
|---|---|
| Host | Vercel, team `nachiketha`, project `ai-accelerator-hub` |
| Root directory | `apps/web` (Next.js 15) |
| Node | 22.x (`.nvmrc`) |
| Production URL | https://aiachub.nachikethaenterprises.business (also https://ai-accelerator-hub-one.vercel.app) |
| Database | Neon Postgres, see [PRODUCTION_DATABASE.md](./PRODUCTION_DATABASE.md) |
| Code | `ai-accelerator-hub/` folder inside the `yagna247ai-star/My_Business` GitHub repo |

## What a deploy does

Vercel runs `npm run vercel-build` in `apps/web` (`apps/web/vercel.json`), which runs in order:

1. `prisma generate` — builds the database client from `packages/db/prisma/schema.prisma`.
2. `prisma migrate deploy` (**production builds only**, via `scripts/release-db.sh`; preview builds skip steps 2–4) — applies any new migrations in `packages/db/prisma/migrations` to production. **This runs before the new code is live, so migrations must work with the old code too** (add columns as optional, remove columns in a later release).
3. `seed:content` — upserts the data-analytics journey content (`seed-data-analytics.ts`) into the `DEFAULT_TENANT_SLUG` institution. Idempotent.
4. `smoke:role` — does nothing unless `SMOKE_ROLE_EMAIL` and `SMOKE_ROLE` are set for that build.
5. `next build`.

If any step fails, the build fails and the current production deployment stays live.

## How to deploy

**Normal path — CI (GitHub Actions).** Open a pull request into `main`. The pipeline in `.github/workflows/ai-accelerator-hub.yml` runs secret scanning, the dependency audit, SAST, lint, type check, unit tests, the build, migrations, the drift check and the integration tests on Postgres, then deploys a Vercel preview. Merging to `main` deploys to production after your approval, runs the smoke test, and rolls back automatically if it fails. Full design: [CI_CD_DEVSECOPS_SPEC.md](./CI_CD_DEVSECOPS_SPEC.md).

**From a laptop (only if CI is unavailable).** Never call `vercel deploy --prod` directly. Use:

```bash
cd ai-accelerator-hub
scripts/deploy-prod.sh          # clean+pushed tree → all checks → deploy → smoke → auto-rollback on failure
```

Run the checks without deploying: `scripts/ci/verify.sh` (add `TEST_DATABASE_URL=postgresql://…` for a disposable local Postgres to include integration tests and the drift check). Smoke-test any URL: `scripts/ci/smoke.sh https://…`.

Preview builds never run migrations or seeds (`apps/web/scripts/release-db.sh`). Vercel's own git auto-deploy is off (`apps/web/vercel.json`).

## Release checklist

Before:
- [ ] Changes committed and pushed. Never deploy uncommitted work: nobody else could reproduce it.
- [ ] `npm run test:pure --workspace=apps/web` passes.
- [ ] New env vars added in Vercel **and** to `passThroughEnv` in `turbo.json` if needed at build time. Documented in [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).
- [ ] New migration committed, and it doesn't break the code that's currently live.
- [ ] Risky migration tested on a Neon branch first.

After:
- [ ] `curl -s https://aiachub.nachikethaenterprises.business/api/health` returns `"status":"ok"` and `"db":{"status":"ok"}`. HTTP 503 means the database is unreachable.
- [ ] Sign in works with an admin account.
- [ ] Optional full smoke test (read-only):
  ```bash
  cd apps/web
  BASE_URL=https://aiachub.nachikethaenterprises.business \
  SMOKE_EMAIL=… SMOKE_PASSWORD=… ADMIN_EMAIL=… ADMIN_PASSWORD=… \
  npx playwright test e2e/prod
  ```
- [ ] Check Vercel → Logs for new errors in the first few minutes.

## Rollback

- **Code:** Vercel dashboard → Deployments → pick the last good one → **Promote to Production** (or `vercel rollback`). Takes seconds.
- **Database:** rolling back the code does **not** undo a migration. Fix forward with a new migration, or restore from Neon's point-in-time history into a branch, check it, then switch over. Get a second person to review before restoring production.

## Changing environment variables

```bash
vercel env ls production
vercel env add NAME production       # prompts for the value
vercel env rm NAME production
```

Env changes apply only to **new** deployments. Redeploy after changing them.

## Known issues

- Deploys depend on someone's machine (no confirmed Git-based deploys).
- No error tracking or alerting yet ([10-observability.md](./enterprise-gaps/10-observability.md)). Watch Vercel logs manually.
- No staging environment. Use a preview deployment plus a Neon branch.
