# CI/CD and DevSecOps pipeline — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-20 |
| Trigger | "Why is it failing in production? Strengthen the CI/CD process; follow a DevSecOps approach for all checks with Vercel CI." |
| Size | L (production release process) |
| Builds on | `docs/DEPLOYMENT.md`, `docs/enterprise-gaps/11-vercel-deployment.md` |
| Code | `../.github/workflows/ai-accelerator-hub.yml`, `../.github/dependabot.yml`, `.gitleaks.toml`, `scripts/ci/verify.sh`, `scripts/ci/smoke.sh`, `scripts/deploy-prod.sh`, `apps/web/scripts/release-db.sh`, `apps/web/vercel.json`, `apps/web/test/global-setup.ts`, `apps/web/vitest.config.ts` |
| Tests | All 228 tests (93 unit + 135 integration on Postgres) run in CI |

---

## 1. Problem

Production deploys were made from a laptop with `vercel deploy --prod`, running whatever checks the person remembered. On 2026-11-20 a deploy failed because lint was not run before deploying. Investigation also found:

- The Vercel project is connected to a different GitHub repo (`yagna247ai-star/ai-accelrator-hub`) than the one the code is pushed to (`yagna247ai-star/My_Business`), so no push was ever checked or deployed automatically.
- The integration test suite (135 tests) could not run since the move to Postgres: its setup still pointed at SQLite.
- 4 high-severity vulnerabilities in the deployed app's dependencies (an old nested `zod` under `@vercel/blob`).
- A transaction in Agent Lab submit queried through the global database client while holding its own connection, and five transactions notified reviewers one row at a time; both can stall to Prisma's 5 s transaction timeout.
- Every build, including previews, ran migrations and the content seed against the database it is configured with — and preview uses the production database.

## 2. Solution

One pipeline, in GitHub Actions, is the only automated path to production. Every check is blocking unless marked "report only".

```
push / PR ─► Secret scan ─┐
            Dependency audit ─┤
            SAST (Semgrep) ───┼─► all pass ─► PR: Vercel preview (no DB changes)
            Lint·types·unit·build ─┤          main: approval ─► Vercel prod ─► smoke ─► auto-rollback on failure
            DB: migrate·drift·integration ─┘
```

| Stage | Tool | Blocks on |
|---|---|---|
| Secret scan | gitleaks 8.21.2 (pinned, checksum-verified), default rules + exact-value allowlist | Any secret found |
| Dependency audit | `npm audit --omit=dev --workspace=web` | High or critical in the deployed app (whole repo: report only; `apps/api` is not deployed) |
| SAST | Semgrep 1.97.0: `p/typescript`, `p/react`, `p/secrets`, `p/owasp-top-ten` | ERROR severity; full SARIF report uploaded as an artifact |
| Quality | ESLint (`next lint --quiet`), `tsc --noEmit`, Vitest unit tests, `prisma validate`, `next build` | Any error |
| Database | Postgres 16 service: migrations on an empty DB, `prisma migrate diff --exit-code` drift check, 135 integration tests | Migration fails, schema change without migration, any test failure |
| Preview | Vercel CLI `pull → build → deploy --prebuilt` on pull requests | — |
| Production | Same, on push to `main`, behind the GitHub `production` environment (required reviewer = Vishal) | Smoke test failure → `vercel rollback` |
| Upkeep | Dependabot weekly (npm + GitHub Actions), each update through the same pipeline | — |

## 3. Behaviour

1. Nothing deploys to production unless all five check jobs pass on that exact commit.
2. Production deploys only from `main`, only after approval in the GitHub `production` environment, one at a time (no cancellation mid-deploy).
3. After a production deploy, `scripts/ci/smoke.sh` checks health (database ok), public pages (200), protected pages (redirect to login), protected APIs (401) and the upload endpoint (401). Any failure rolls production back to the previous deployment automatically.
4. Preview and development builds never run migrations or seeds (`apps/web/scripts/release-db.sh` checks `VERCEL_ENV`).
5. Vercel's own git auto-deploy is off (`apps/web/vercel.json` → `git.deploymentEnabled: false`), so a push to the other connected repo cannot bypass the checks.
6. Laptop deploys use `scripts/deploy-prod.sh`: clean and pushed tree → `scripts/ci/verify.sh` (same checks) → deploy → smoke → rollback on failure.
7. Integration tests only run against a local or CI database: `test/global-setup.ts` refuses any other host unless `ALLOW_REMOTE_TEST_DB=1`, so tests can never wipe production.
8. No secrets in the repo: Vercel credentials are GitHub secrets; runtime keys stay in Vercel environment variables.

## 4. Data and API

No schema change. Known gap: preview deployments share the production database at runtime (reads and writes by people using a preview). Recommended next step: a Neon branch per preview.

## 5. UI

None. GitHub shows each check on the commit and pull request; the production job links to the live site.

## 6. Acceptance criteria

- [x] `scripts/ci/verify.sh` with `TEST_DATABASE_URL` passes locally: audit 0 vulnerabilities, lint clean, types clean, 93 unit + 228 total tests pass, schema valid, no drift, build succeeds.
- [x] `scripts/ci/smoke.sh https://aiachub.nachikethaenterprises.business` passes (18 checks).
- [x] Workflow and Dependabot YAML parse; production and preview jobs depend on all five check jobs.
- [ ] First GitHub Actions run is green (needs the secrets below; Semgrep and gitleaks may surface findings to triage on the first run).
- [ ] A smoke-test failure in production triggers `vercel rollback` (verify once with a deliberate failure on a test project).

## 7. One-time setup (owner)

1. GitHub → `My_Business` → Settings → Secrets and variables → Actions: add `VERCEL_TOKEN` (Vercel → Account Settings → Tokens), `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (both in `ai-accelerator-hub/.vercel/project.json`).
2. GitHub → Settings → Environments → `production`: add yourself as a required reviewer; restrict to the `main` branch.
3. GitHub → Settings → Branches: protect `main` — require a pull request and the five checks (Secret scan, Dependency audit, SAST, Lint · typecheck · unit tests · build, Migrations · drift · integration tests).
4. Vercel → Project → Settings → Git: disconnect `yagna247ai-star/ai-accelrator-hub` (auto-deploy is already off in `vercel.json`; disconnecting removes the confusion).
5. Merge `enterprise-prod-readiness` into `main` through a pull request; from then on production releases happen by merging to `main`.

## 8. Out of scope

DAST (OWASP ZAP against a preview), container image scanning (no containers), SBOM signing, a separate staging database. Candidates for v1.1.
