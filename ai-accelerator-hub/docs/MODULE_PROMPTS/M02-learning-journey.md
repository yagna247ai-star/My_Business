# M02 — 15-Level Learning Journey (BRD-03 · §6 §8 §9 · REQ-LVL-01..03)

## 1. Objective
Build the competence-gated 15-level journey with 6 activities per level and weekend engine.

## 2. Prerequisites
- M01 complete (tenant + enrollment exist).
- Read `apps/web/lib/journey.ts` (6-gate `canUnlock`), `apps/web/lib/neo4j.ts` (DAG).
- Read `packages/db/prisma/seed.ts` + `seed-phase2.ts`.

## 3. Build steps
1. Confirm 15 levels L01–L15 with correct `idx` and 14 `REQUIRES` edges (Neo4j + `level_prerequisites` mirror).
2. Confirm L01 has 6 real activities (5/18/10/35/5/47 XP) with rubric `L01_RUBRIC`.
3. Confirm L02–L15 are published with real 6-activity configs (no fabricated finished lessons beyond seed).
4. Verify `canUnlock` order: prereq DAG (graph-first) → linear → minXp → badge → entitlement → no time gate.
5. Wire weekend engine: scheduled unlock dates, cohort schedules, live links, recordings, attendance≠pass.

## 4. ARB gate
- Is Neo4j the DAG owner and Prisma the mirror (not two competing truths)?
- Does fallback work with `NEO4J_URI` absent (Prisma-only path tested)?
- Are unlock rules server-side (never client-computed)?
- Can an instructor publish/edit a level without code change?

## 5. NFR gate
- Level page p95 < 2s. Progress writes are idempotent (no dupes on retry).
- No time-gating: a ready student is never blocked by calendar alone.
- Accessible progress indicators (keyboard + screen reader).

## 6. Red-team review
- Try skipping L01 to unlock L02 directly. Must block with `missing: [L01_AWAKENING]`.
- Try double-submit of activity 5. Must not double-award (idempotency).
- Try teacher-only publish as student. Must 403.
- Try malformed `unlockCondition` JSON. Must fail safe (locked, not open).

## 7. Acceptance
- `demo_flow.mjs`: A1 +5 XP → submit → mentor approve → Boss +47 → L02 unlocks, total 57.
- `journey.test.ts` 4/4 pass (run from `apps/web` cwd).
- `verify.mjs` learning group green.

## 8. Done criteria
L01 fully working end-to-end; L02–L15 real configs; DAG verified in graph and fallback.
