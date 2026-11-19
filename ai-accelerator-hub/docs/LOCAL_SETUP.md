# Local setup

How to run AI Accelerator Hub on your own machine. Last checked 2026-11-19 on macOS with Node 24.

> **The README's "zero external deps" SQLite quick start no longer works.** The Prisma schema and migrations are Postgres-only (`migration_lock.toml` says `postgresql`). You need a Postgres database locally.

## What you need

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 or later (24 recommended) | `package.json` `engines` requires ≥ 22 |
| npm | 10 or later | the repo pins `npm@11.17.0` |
| PostgreSQL | 16 | one of the three options in step 3 |
| Google Chrome | any recent | only for Playwright end-to-end tests |
| Vercel CLI | optional | `npm i -g vercel`; only to pull shared env vars |

Not required for local work: Neo4j, Redis, S3/MinIO, LiteLLM, Razorpay. When their env vars are empty the app falls back to safe local behaviour (graph features off, in-memory cache, uploads to `./uploads`, labelled mock AI, test-mode payments).

## Repo layout

```
apps/web        Next.js 15 app (App Router) — the product. Runs on :3000
apps/api        NestJS service (optional, not needed for the web app)
packages/db     Prisma schema, migrations, seed scripts
packages/config Shared config
docs/           Specs and guides (data model: docs/DATA_MODEL.md)
```

## 1. Install

```bash
git clone <repo-url> ai-accelerator-hub
cd ai-accelerator-hub
npm install
```

## 2. Create `.env` at the repo root

```bash
cp .env.example .env
```

The web app reads this root `.env` too (`apps/web/next.config.js` loads it). Set at least:

```bash
DATABASE_URL="postgresql://aihub:aihub_dev_password@localhost:5432/aihub"
DATABASE_URL_UNPOOLED="postgresql://aihub:aihub_dev_password@localhost:5432/aihub"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<any random string of 32+ characters>
DEFAULT_TENANT_SLUG=demo
```

- `DATABASE_URL_UNPOOLED` is required. The schema uses it as `directUrl` for migrations. Locally it is the same as `DATABASE_URL`.
- Generate a secret with `openssl rand -base64 32`.
- Leave AI, payment, Redis and S3 keys empty unless you are working on those features.
- Never commit `.env`.

## 3. Start Postgres

Pick one.

**A. Docker** (if Docker Desktop is installed)

```bash
docker compose up -d postgres
```

The credentials in `docker-compose.yml` match the URL above.

**B. Homebrew** (no Docker)

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s aihub
psql -d postgres -c "ALTER USER aihub PASSWORD 'aihub_dev_password';"
createdb -O aihub aihub
```

**C. A Neon dev branch** (no local database)

Create a branch of the Neon project in the Neon console and put its pooled and direct URLs in `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Never point local development at the production branch.

## 4. Create tables and seed data

```bash
npm run db:generate                     # build the Prisma client for Postgres
cd packages/db
npx prisma migrate deploy               # apply all migrations
npx tsx prisma/seed.ts                  # roles, demo tenant, 15-level journey, badges, AI assistants, plans, demo users
TENANT_SLUG=demo npx tsx prisma/seed-data-analytics.ts   # the data-analytics journey (what production runs)
cd ../..
```

All seed scripts are idempotent, so re-running them is safe.

**Demo logins created by `seed.ts`** (local only, never production):

| Email | Password | Role |
|---|---|---|
| admin@aihub.in | Admin@12345 | Super Admin |
| student@aihub.in | Student@12345 | Learner |
| mentor@aihub.in | Mentor@12345 | Cohort Mentor |
| instructor@aihub.in | Instructor@12345 | Instructor |
| finance@aihub.in | Finance@12345 | Finance |

Optional extra data in `packages/db/prisma`: `demo-area-learners.ts` (learners for area rankings), `demo-data-analytics-learner.ts` (a learner part-way through), `reset-demo-journey.ts` / `reset-demo-module1.ts` (reset demo progress).

## 5. Run the app

```bash
npm run dev:web
```

Open http://localhost:3000 and sign in with a demo login.

If Turbopack misbehaves, use webpack instead: `npm run dev:webpack --workspace=apps/web`.

## 6. Tests

```bash
npm run test:pure --workspace=apps/web    # unit tests, no database — use this
npm run test:e2e  --workspace=apps/web    # Playwright, against a running app
```

- **Integration tests (`npm test` in `apps/web`) are currently broken.** `test/global-setup.ts` builds a SQLite `test.db`, which the Postgres migrations can't create. They need moving to a Postgres test database.
- Playwright expects the app at `http://localhost:3100` by default. Start a second dev server on that port (`npx next dev -p 3100` in `apps/web`) or set `BASE_URL=http://localhost:3000`. It uses your installed Chrome, because Playwright's bundled Chromium doesn't support macOS 12.

## 7. Changing the database schema

See "Changing the schema" in [DATA_MODEL.md](./DATA_MODEL.md#changing-the-schema). In short: edit `schema.prisma`, run `npx prisma migrate dev --name <name>` in `packages/db`, commit the migration folder.

## Working with production

- **Env vars:** `cd apps/web && vercel env pull .env.production.local --environment=production`. Delete the file when done. Several values are marked sensitive in Vercel and come back as `[SENSITIVE]`.
- **Admin accounts:** use `packages/db/prisma/provision-staff.ts`, not `seed.ts`. See [06-seed-and-admin-accounts.md](./enterprise-gaps/06-seed-and-admin-accounts.md).
- **Deploys** run `vercel-build` (in `apps/web/package.json`): generate the client, run `prisma migrate deploy`, seed the data-analytics content, then `next build`.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `DATABASE_URL is not set` when starting the app | No root `.env`. Do step 2. |
| `Environment variable not found: DATABASE_URL_UNPOOLED` | Add it to `.env` (same value as `DATABASE_URL` locally). |
| `the URL must start with the protocol file:` | The Prisma client was generated from an old SQLite schema. Run `npm run db:generate`. |
| `the URL must start with the protocol postgresql://` | `DATABASE_URL` still says `file:./dev.db`. Point it at Postgres. |
| `Can't reach database server at ….neon.tech` | Your network's DNS can't resolve Neon hostnames. Check with `dig +short <host>` vs `dig +short @8.8.8.8 <host>`; if only the second works, switch the Mac's DNS to 8.8.8.8 or 1.1.1.1 in System Settings → Network. |
| `npx tsx` fails with `EPERM listen` | Sandboxed shell. Use `node --import tsx/esm <script>` instead. |
| Port 3000 in use | `lsof -i :3000` and stop the other process, or run `npx next dev -p 3001` in `apps/web`. |
