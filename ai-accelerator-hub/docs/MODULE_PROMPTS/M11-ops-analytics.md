# M11 — Ops, Analytics & Deploy (BRD-12 · §29 §30 §32 §33 · REQ-PERF/QA/ANL)

## 1. Objective
Make the platform measurable, tested, and deployable: SLOs, QA, analytics, runbooks.

## 2. Prerequisites
- M01–M10 complete (this module measures and ships them).

## 3. Build steps
1. Set SLOs: 99.9% monthly, dashboard p95 < 2s, no committed-submission loss, job retries, tested restore.
2. Wire QA: unit + integration + e2e (auth, isolation, payments HMAC, AI, a11y, perf). Run from correct cwd.
3. Build analytics on competencies (enrollment, completion, retention, quality, hackathons, readiness, revenue, AI cost). No vanity metrics.
4. Write deploy docs: `docker-compose` (neo4j/postgres/redis), env template, backup/restore drill, monitoring (OTEL/Prometheus/Sentry).
5. Record known limitations, pending creds, pending legal.

## 4. ARB gate
- Is there one deploy path (compose → prod) with the same migrations and seeds?
- Are analytics computed from ledger/events (not hand-entered counts)?
- Is monitoring alerting on SLOs (not just collecting logs)?
- Is rollback defined (migration + data) before release?

## 5. NFR gate
- Load test before scaling claims (`load_test.mjs` 100 concurrent, p95 target).
- Backup/restore actually executed (SQLite copy verified; pg drill documented).
- `next build` 26 routes green; vitest 11/11; verify 49/49.

## 6. Red-team review
- Try deploying with missing env. Must fail fast with clear message (not silent mock).
- Try restoring a backup. Must produce working DB (levels 15 verified).
- Try spiking traffic 10x. Must degrade gracefully (AI mock fallback, queues retry).
- Try shipping with a failing test. Must block release.

## 7. Acceptance
- Correct-cwd commands:
  - `cd apps/web && ../../node_modules/.bin/vitest run` → 11 passed.
  - hub root `node --import tsx/esm verify.mjs` → 49 passed, 0 failed.
  - `npm run build --workspace=apps/web` → 26 routes compiled.

## 8. Done criteria
SLOs set, tests green, restore proven, docs complete. Nothing claimed untested.
