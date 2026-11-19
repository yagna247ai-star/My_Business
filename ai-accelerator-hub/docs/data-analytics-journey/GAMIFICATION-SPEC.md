# Gamification, Area Rankings, Final Fight and AI Support — Spec

| | |
|---|---|
| Version | 1.0, 2026-11-18 |
| Scope | AI-Powered Data Analytics journey (45 days, 9 modules) |
| Decided by | Owner, through questions answered on 2026-11-18 |
| Code | `apps/web/lib/domain/points.ts` (pure rules) · `apps/web/test/points.test.ts` |

## 1. Activities for every module
Decision: draft the six activities for all nine modules (Briefing, Learn, Explore, Build, Proof, Evaluation + Boss). Drafts are marked for reviewer sign-off before a real launch.

## 2. Points
Decision: **weighted by difficulty**.

| Module | Code | Weight |
|---|---|---|
| M1 Fundamentals | DA01 | 1.0 |
| M2 SQL | DA02 | 1.5 |
| M3 Python fundamentals | DA03 | 1.5 |
| M4 Python analytics | DA04 | 2.0 |
| M5 Power BI | DA05 | 2.0 |
| M6 AI for analytics | DA06 | 2.0 |
| M7 Machine learning | DA07 | 2.5 |
| M8 ETL and data quality | DA08 | 2.5 |
| M9 Capstone | DA09 | 3.0 |

- **Each day's class check** (the screenshot for that day) is worth `10 × module weight`, rounded.
- **Each activity** is worth its XP, as already set in the app.
- **A level's total** is the sum of its day points and activity XP.

## 3. Crown: area rankings
Decision: crowns are **area-based**, not institution-wide.
- For each level, the **top 3 learners in each area** get a crown.
- An area is the learner's city (for example Hyderabad, Danda).
- The crown shows on the level's standings, and on the learner's avatar.

## 4. Hackathon level
Decision: the hackathon level is **open to anyone who wants to join**. It is a separate level, not part of the journey.
- Entries are **split by area**, and ranked **across the globe**.
- Each area shows its top 3, and a global list shows the overall top.

## 5. Final fight phase
Decision: **bracket of matches**.
- Learners are seeded by total points. The highest plays the lowest, and so on.
- Each match is won by the higher score on the final challenge.
- Winners advance until one learner is first.
- Ranking: by wins, then by total points.

## 6. Learners
Decision: 10 to 20 demo learners in several areas, to check how the system runs with many users.

## 7. AI support (stuck helper)
Decision: a **LangGraph** workflow using **Gemini**, through the app's existing LangChain provider chain.
- When a learner is stuck, the helper asks what they tried, gives one hint at a time, and escalates to a mentor after three hints.
- Without a Gemini key, the helper shows a clear fallback message. It never invents an answer.

## 8. React prompting
Decision: internal React prompting is the completion goal for the whole journey. Each level is captured step by step, with a screenshot per step and a checklist of what to solve next.

## 9. Automated review (no waiting for a person)
Decision (2026-11-18): reviews are decided automatically by a **rubric template** as soon as the proof and the boss are both in.
- Code: `apps/web/lib/domain/autoReview.ts`, tests in `apps/web/test/autoreview.test.ts`.
- Each rubric dimension gets a 1–5 score from the evidence: boss correctness, reflection length, build fields complete, data limits named.
- **Pass:** weighted average ≥ the rubric threshold (3.0), boss ≥ 2 correct, reflection ≥ 50 words, and every build field complete.
- The decision is recorded like a human review: a Review row by the system account `auto-reviewer@system.local` (which cannot log in), an audit log entry, and a notification.
- The learner can still **appeal to a mentor**, so a person remains available when the template gets it wrong.

## 10. Celebration and gaps
- **Pass:** a burst of falling flowers and an "approved" banner with the XP earned. The burst starts after the page is interactive and respects reduced-motion settings.
- **Not yet:** each missing item is highlighted with the small number of points a fix earns (Boss +5, Reflection +3, Method +3, Data checks +2), and the learner keeps all XP already earned.
- Code: `apps/web/components/learn/ReviewCelebration.tsx`, `apps/web/lib/domain/gaps.ts`.

## 11. Built (2026-11-18)
| Item | Code | Tests and proof |
|---|---|---|
| Activities for modules 2–9 (drafts, reviewer sign-off before launch), one rubric per module | `packages/db/prisma/data-analytics-activities.ts`, `seed-data-analytics.ts` | `e2e/journey-all-modules.spec.ts` → `e2e/proof/journey-modules/` |
| Learner area (city), set in Settings | `User.area`, migration `0002_user_area`, `lib/domain/account.ts` | `e2e/area-standings.spec.ts` |
| Area crowns (top 3 per area, per level or whole journey), global ranking | `lib/domain/standingsCore.ts`, `lib/domain/standings.ts`, `/leaderboard/areas` | `test/standings.test.ts`, `e2e/proof/area-standings/` |
| Final-fight bracket (top 8, decided by the capstone score; byes are not wins) | `runBracket` in `lib/domain/points.ts` | `test/points.test.ts` |
| 15 demo learners in 5 areas | `packages/db/prisma/demo-area-learners.ts` | local only |
| Stuck helper: LangGraph + Gemini, ask → 3 hints → mentor; honest fallback with no key; personal data removed | `lib/ai/stuckHelper.ts`, `POST /api/v1/levels/[code]/stuck`, `components/learn/StuckHelper.tsx` | `test/stuck-helper.test.ts`, `e2e/proof/stuck-helper/` |

## Open items
- Reviewer sign-off on the module 2–9 drafts before a real launch (they stay unpublished in the seed).
- A real Gemini key (`GEMINI_API_KEY`) to see live hints; without it the helper shows the fallback.
- Hackathon entries ranked by area: the same `areaBoard` rules apply once hackathon scores are recorded.
