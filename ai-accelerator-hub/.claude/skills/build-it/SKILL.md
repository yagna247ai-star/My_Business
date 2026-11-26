---
name: build-it
description: Build a feature or fix in this repo the house way — spec-driven development first (a docs/*_SPEC.md via the spec-it skill), then test-driven development (failing tests, then code, then green). Use when the user asks to build, implement, fix or improve something and mentions SDD, TDD, "spec then test", "our usual approach", or asks for a change big enough to need a spec.
---

# build-it — SDD, then TDD

Three phases, always in this order: Spec, then Tests-first, then Verify. Do not write application code before phase 1 is done and the failing tests from phase 2 exist.

## Phase 1 — Spec (SDD)

1. Follow the `spec-it` skill (`.claude/skills/spec-it/SKILL.md`) to write or update `docs/<TOPIC>_SPEC.md`. One spec per feature.
2. Decisions only the user can make (provider, wording, who may see what, migrations that overwrite data) go to the user **once, batched**, before the spec is final. Record the answers in the spec header under "Decisions".
3. Number every acceptance criterion (`AC-1`, `AC-2`, …) in `spec-it` Given/when/then checklist form. Tests cite these numbers in `it('AC-N: ...')` titles.
4. Show the user the spec path and a short summary. If they have already answered the open decisions, carry on; otherwise wait.

## Phase 2 — Tests first (TDD)

Test layout in `apps/web`:

| Kind | Where | Runs with | Notes |
|---|---|---|---|
| Pure rules (no DB) | `test/<topic>.test.ts`, code in `lib/domain/<topic>Core.ts` or `<topic>Rules.ts` | `npm run test:pure` | Add the file to the `include` list in `vitest.pure.config.ts`. |
| DB / route tests | `test/<topic>.test.ts` | `npm test` (needs `TEST_DATABASE_URL`, Postgres) | Uses `test/global-setup.ts` and `test/helpers`. |
| End-to-end | `e2e/` | `npm run test:e2e` | Only for flows a unit test cannot cover. |

Steps:

1. Put the logic in a **pure module** wherever possible, so most tests run without a database.
2. Write the tests for every AC, naming the AC in the `it(...)` title, e.g. `it('AC-3: unknown email still returns 200', …)`.
3. Run them and **confirm they fail for the right reason** (the missing function or the wrong behaviour, not a typo). Paste the short failing summary to the user.
4. Write the smallest code that makes them pass. Then refactor with the tests green.
5. Schema changes: edit `packages/db/prisma/schema.prisma` and add a hand-written SQL migration `packages/db/prisma/migrations/00NN_<name>/migration.sql` (Postgres). Data fixes belong in the migration and must be safe to run twice.
6. New UI strings go through `<Tr>` / `t()`; run `npm run i18n:extract` afterwards so `i18n-coverage.test.ts` stays green.
7. New env vars: document them in `docs/ENVIRONMENT_VARIABLES.md` and, if they are needed at build time, in `turbo.json`.

## Repo guardrails — confirm before ticking ACs green

From the production review. Confirm each, or record a waiver in the feature spec:

- Postgres, not `file:`: `packages/db/prisma/schema.prisma` is `provider=postgresql`. Use a Postgres URL (compose/Neon) for local DB work. Never ship `file:./dev.db` unless the provider change is the spec.
- RLS: `packages/db/pg/rls.sql` is reviewed-not-applied. Tenant data relies on `apps/web/lib/prisma.ts` `withTenant()` fail-closed helpers. State in the spec whether RLS is applied or the Prisma path is relied on.
- API home: real routes live under `apps/web/app/api` with `route()` + `requireCtx`/`requirePerm`. `apps/api` Nest is an empty stub — justify touching it.
- Vercel: `apps/web/vercel.json` has `git.deploymentEnabled=false`; `apps/web/scripts/release-db.sh` migrates only on `VERCEL_ENV=production`. Preview must never migrate prod DB.
- CI: no `.github/workflows` exists in this checkout though `docs/DEPLOYMENT.md` cites one. Cite the real scripts (`scripts/ci/verify.sh`, `scripts/ci/smoke.sh`, `scripts/deploy-prod.sh`); do not claim an absent workflow ran.
- Observability: no Sentry/PostHog/OTEL. Name logging/health evidence (`apps/web/app/api/health/route.ts`, request-id in `apps/web/lib/server/http.ts`) or file it as out-of-scope.
- i18n: UI strings go through `<Tr>`/`t()` + `npm run i18n:extract`, or `test/i18n-coverage.test.ts` goes red.
- Dead code: do not extend `_retired/api`, `_legacy_student`, `app-v3/`, unused `components/shell/Sidebar.tsx`, or unused zustand/react-query without a remove/reuse decision in the spec.

## Phase 3 — Verify

From `apps/web`, run and report the real output:

- `npm run test:pure`
- `npm run typecheck`
- `npm test` if `TEST_DATABASE_URL` is set; otherwise say the DB tests were not run.

Then tick the AC checklist in the spec (`- [x]`), add a row to `docs/RTM.md` if the feature is a new requirement, and give the user: the spec path, the tests added, the pass counts, and anything left open (credentials, manual steps). Do not commit unless asked.
