# 11 — Vercel deployment and configuration

**Status:** production deploys and serves. Several configuration items are still open.

## Current state

- Vercel project `nachiketha/ai-accelerator-hub` (`prj_txks7xDUPMKgfhJAmFPe0q42qCgd`).
- Project settings changed on 2026-11-17: root directory `apps/web`, framework `nextjs`, Node `22.x` (matches `.nvmrc`).
- Production URL: `https://ai-accelerator-hub-one.vercel.app`. Last ready deployment: `ai-accelerator-2o38c0ndk-nachiketha.vercel.app`.
- Deploys are made from the local working tree with `vercel deploy --prod` from the repo root. Whether the project is connected to a Git repo is **unverified**: the CLI inspect output did not show it. Check in the Vercel dashboard (Settings → Git). Until confirmed, assume pushes may not deploy.
- Build fixes made on 2026-11-17 (uncommitted):
  - `turbo.json`: `pipeline` renamed to `tasks` (Turbo 2). Build task declares `passThroughEnv` for the app's variables, because strict env mode strips undeclared variables.
  - Root `package.json`: added `packageManager` (Turbo requires it).
  - `apps/web/package.json`: build runs `prisma generate` against the shared schema first.
- Production env: 15 variables set earlier, plus `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (Neon, via the Marketplace integration), and `GEMINI_API_KEY`.
- The CLI cannot remove `FEATURE_PAYMENTS_MOCK_FALLBACK` without human approval. It is unused by code (see file 01).
- `apps/web/.vercel/project.json.stale-backup` holds the old link, gitignored.
- `apps/web/.env.local` was created by `vercel link`. It holds `VERCEL_OIDC_TOKEN` and is gitignored.
- `.env.production.local` was pulled and then deleted. Do not recreate it in the project folder. Use `vercel env pull` to a path outside the repo.

## Gap

- **Uncommitted build changes.** The deploy works only from this working tree. A teammate or a clean checkout cannot reproduce production.
- **No git-based deploys.** Production changes depend on someone running the CLI on this machine.
- **Custom domain `aiachub.nachikethaenterprises.business`** is attached, verified, and serving over HTTPS (certificate issued 2026-11-17). `/api/health` returns db ok on it.
- **`APP_URL` and `NEXTAUTH_URL` now point to `https://aiachub.nachikethaenterprises.business`** (updated 2026-11-17, then redeployed). `/api/auth/providers` returns sign-in URLs on the custom domain. A full credential sign-in test is still pending, because no user account exists yet (see file 06).
- Previously there was no custom domain. The public URL was the `.vercel.app` address. `next.config.js` and `PENDING_CREDENTIALS.md` expect other domains (`aihub.in`, `nachikethaenterpries.business`), and the auth callbacks depend on the domain.
- **Preview and development environments:** `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (Neon) are set for all environments. The app and AI variables are set for Production only, so previews will not have them.
- `local` config mismatch: the root `.env` is the local source and is not synced with Vercel.
- Build warnings (`<img>` and `@ts-ignore` lint warnings) are not blocking, but are not clean.

## Risk

- Medium. The deployment works, but it is fragile to reproduce and to change safely.

## Decision needed

- Final public domain, and whether to connect the GitHub repo to Vercel for automatic deploys.

## Steps to close

1. Commit the build changes on a branch (`turbo.json`, root and `apps/web` `package.json`, `schema.prisma`, the new `docs/enterprise-gaps/`). Do not commit `.env*`, `.vercel/`, or any pulled env file.
2. If not already connected, connect the GitHub repo to the Vercel project, so pushes to `main` build and deploy.
3. Add the custom domain in Vercel and update `APP_URL`, `NEXTAUTH_URL`, and the GitHub OAuth callback.
4. Decide whether preview deployments need their own database branch (Neon branching) and their own variables.
5. Remove `FEATURE_PAYMENTS_MOCK_FALLBACK` in the dashboard and redeploy.
