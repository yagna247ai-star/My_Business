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
2. `prisma migrate deploy` — applies any new migrations in `packages/db/prisma/migrations` to production. **This runs before the new code is live, so migrations must work with the old code too** (add columns as optional, remove columns in a later release).
3. `seed:content` — upserts the data-analytics journey content (`seed-data-analytics.ts`) into the `DEFAULT_TENANT_SLUG` institution. Idempotent.
4. `smoke:role` — does nothing unless `SMOKE_ROLE_EMAIL` and `SMOKE_ROLE` are set for that build.
5. `next build`.

If any step fails, the build fails and the current production deployment stays live.

## How to deploy

Deploys are currently made from a local checkout with the Vercel CLI. It is **not confirmed** that pushes to GitHub deploy automatically (check Vercel → Settings → Git).

```bash
# once
npm i -g vercel
vercel login
cd ai-accelerator-hub && vercel link      # pick team nachiketha, project ai-accelerator-hub

# each release
git status                                 # commit first: a deploy uses your working tree, committed or not
npm run test:pure --workspace=apps/web
vercel deploy                              # preview: check it before production
vercel deploy --prod                       # production
```

Preview deployments share the Neon database URLs but **not** the app, auth and AI variables (those are set for Production only), so previews may not work fully.

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
