# A real time estimate for each day — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-27 |
| Trigger | "For every estimation of activity it is coming as Time: 4 h 30 min · Module: M2 SQL · Shop: Sunita Stores. Please fix accordingly." |
| Cause | All 45 lesson files start with the same header line, `> **Time:** 4 h 30 min · **Module:** … · **Shop:** …`, so every day said 4 h 30 min. The module and shop are already right per day; only the time was a placeholder. Each guided step already has its own minutes. |
| Decisions | The day page replaces the time in that header with **reading time + the day's steps**: reading at 180 words a minute (code blocks and the trainer's answer key left out, at least 5 min), plus the sum of the step minutes, rounded to 5. It shows the parts: "about 50 min (lesson 10 min + 6 steps 40 min)". Days without step minutes keep their header. Module and shop are unchanged. The lesson files are left as they are, so the estimate follows the steps whenever they change. |
| Code | `apps/web/lib/domain/dayTime.ts` (new, pure) · `apps/web/app/(app)/levels/[code]/days/[day]/page.tsx` |
| Tests | `apps/web/test/day-time.test.ts` |

## Acceptance criteria
- [x] AC-1: Reading time leaves out code blocks and the answer key, and is at least 5 minutes.
- [x] AC-2: The day's time is reading plus steps, rounded to 5, written as "45 min", "1 h" or "1 h 35 min".
- [x] AC-3: Only the time in the header changes; module and shop stay; a lesson without that header is untouched.
- [x] AC-4: Across a journey the days show different times, each between 10 minutes and 8 hours.
- [x] AC-5: The day page uses it.
