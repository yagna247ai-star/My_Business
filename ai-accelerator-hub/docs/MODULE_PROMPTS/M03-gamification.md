# M03 — Gamification (BRD-04 · §10 · REQ-GAME-01/02)

## 1. Objective
Build server-authoritative, auditable, non-punitive gamification.

## 2. Prerequisites
- M02 complete (activities emit XP events).
- Read `apps/web/lib/gamification.ts` (`awardXp`, hash chain, streak logic).

## 3. Build steps
1. Confirm `xp_ledger` append-only with `UNIQUE idempotency_key` and `prev_hash/row_hash` chain.
2. Confirm server sets `amount` (never from client).
3. Confirm streak uses IST with `freezeTokens` + 48h grace + 7-day recovery.
4. Confirm badges via JSONLogic, quests, seasonal, referral +30 XP (anti-fraud), share cards.
5. Confirm leaderboards: Redis ZSET primary, Prisma groupBy fallback, Neo4j graph alt.

## 4. ARB gate
- Is there exactly one XP writer (`awardXp`), called server-side only?
- Is the ledger tamper-evident (hash chain verifiable via `verifyXpChain`)?
- Are XP rules configurable without code change?
- Is streak state derived from ledger/events, not a mutable counter clients bump?

## 5. NFR gate
- `load_test.mjs`: 100 concurrent XP aggregates p95 < 2000ms (target 42ms observed).
- No punitive streak loss (illness/disability/absence safe).
- Leaderboard reads never block writes.

## 6. Red-team review
- Try replaying same `idempotency_key`. Must return `awarded:false`, no new row.
- Try posting XP 9999. Must reject (`Invalid XP`).
- Try self-award and self-referral. Must block.
- Try leaderboard manipulation via direct API. Must use validated data only.

## 7. Acceptance
- `gamification.test.ts` passes (idempotency, invalid-amount guard, leaderboard fallback).
- `verify.mjs` gamification group green (server-side XP, persistence, unlocking, validated leaderboard).

## 8. Done criteria
Ledger auditable, streaks fair, leaderboards validated. No fake XP.
