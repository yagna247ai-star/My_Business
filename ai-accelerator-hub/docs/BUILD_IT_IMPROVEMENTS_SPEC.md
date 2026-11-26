# build-it hardening — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "follow build-it skill and add improvements to that skill" — harden it with production lessons from the ai-accelerator-hub review |
| Builds on | `.claude/skills/build-it/SKILL.md`, `.claude/skills/spec-it/SKILL.md`, `docs/CI_CD_DEVSECOPS_SPEC.md`, `docs/DEPLOYMENT.md`, `docs/enterprise-gaps/10-observability.md` |
| Code | `.claude/skills/build-it/SKILL.md` (only file changed) |
| Tests | Docs-only — re-read + spec-format check. No `apps/web` vitest (skill is markdown, no runtime code) |
| Decisions | Scope=Harden with prod lessons; Tests=Docs-only verification; Spec=Write `docs/BUILD_IT_IMPROVEMENTS_SPEC.md` first, then patch skill |

---

## 1. Problem

The `build-it` skill describes spec-then-test in general terms, but it does not guard the failure modes this repo actually hit in production review: Postgres provider vs `file:./dev.db` local URL, `rls.sql` reviewed-not-applied, empty Nest `apps/api` stub vs Next routes, absent `.github` workflow, preview sharing prod DB, missing observability, stale i18n keys, and dead code. Builders following it as-is can repeat those mistakes.

## 2. Solution

Keep the three phases (Spec, Tests-first, Verify) and add a short "Repo guardrails" checklist the builder must confirm before marking ACs green. Fix the "Two phases" wording (there are three). Keep AC numbering (`AC-N`) aligned with `spec-it` Given/when/then format.

## 3. Behaviour

1. Phase order stays Spec → failing tests → code → green. No application code before spec + failing tests exist.
2. Spec step still follows `spec-it`, one spec per feature at `docs/<TOPIC>_SPEC.md`, with `AC-N` numbers cited in test titles.
3. Before ticking ACs, the builder confirms the guardrails checklist (Section 6, AC-1..AC-8), or records an explicit waiver in the feature spec.
4. Pure logic still goes in `lib/domain/*Core.ts` / `*Rules.ts` so `npm run test:pure` covers it without a DB.
5. Schema changes still edit `packages/db/prisma/schema.prisma` + hand-written `packages/db/prisma/migrations/00NN_<name>/migration.sql` (Postgres), idempotent.
6. UI strings still go through `<Tr>` / `t()` + `npm run i18n:extract`.
7. Env vars still documented in `docs/ENVIRONMENT_VARIABLES.md` and `turbo.json` when build-time.
8. Verify still runs `npm run test:pure` + `npm run typecheck` from `apps/web`, plus `npm test` when `TEST_DATABASE_URL` is set.

## 4. Data and API

No schema, route, or event changes. This spec changes only `.claude/skills/build-it/SKILL.md`.

## 5. UI

No UI changes.

## 6. Acceptance criteria

- [x] AC-1: Given the Postgres provider in `packages/db/prisma/schema.prisma`, when the feature needs local DB work, then the spec names a Postgres URL (compose/Neon) and never `file:./dev.db` unless the provider change is part of the spec.
- [x] AC-2: Given `packages/db/pg/rls.sql` is reviewed-not-applied, when the feature touches tenant data, then the spec states whether RLS is applied or the Prisma `withTenant()` fail-closed path is relied on, with no silent pass-through.
- [x] AC-3: Given `apps/api` is an empty Nest stub and real routes live under `apps/web/app/api`, when the feature adds an API, then the spec names the Next route owner + `requireCtx`/`requirePerm`, or justifies touching `apps/api`.
- [x] AC-4: Given `apps/web/vercel.json` has `git.deploymentEnabled=false` and `release-db.sh` migrates only on `VERCEL_ENV=production`, when the feature touches DB or deploy, then the spec states preview vs prod DB handling and that preview never migrates prod.
- [x] AC-5: Given no `.github/workflows` exists in this checkout though `docs/DEPLOYMENT.md` cites one, when the feature touches CI, then the spec names the real scripts (`scripts/ci/verify.sh`, `scripts/ci/smoke.sh`, `scripts/deploy-prod.sh`) and does not claim an absent workflow ran.
- [x] AC-6: Given observability is absent (no Sentry/PostHog/OTEL), when the feature adds a user-visible flow or a cron, then the spec states logging/health evidence (`app/api/health/route.ts`, request-id in `lib/server/http.ts`) or files the gap as out-of-scope.
- [x] AC-7: Given `test/i18n-coverage.test.ts` fails on stale keys, when the feature adds UI strings, then the skill requires `npm run i18n:extract` before verify.
- [x] AC-8: Given dead code (`_retired/api`, `_legacy_student`, `app-v3/`, unused `Sidebar`, unused zustand/react-query), when the feature touches those areas, then the spec says remove/reuse explicitly instead of extending the dead path.
- [x] AC-9: Given the skill text, when read end-to-end, then it says "Three phases" (not "Two"), phases are Spec → Tests-first → Verify, and AC format matches `spec-it` Given/when/then.

## 7. Out of scope

Fixing the eight gaps themselves (DB URL, RLS, Nest, CI, preview DB, observability, i18n keys, dead code). This spec only makes `build-it` point at them. No `apps/web` code or migrations.

## 8. Open questions

None — user chose harden-with-lessons, docs-only verification, spec-first on 2026-11-26.
