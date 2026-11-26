# Mission Control "This week" (live classes, study plan and materials in one week view) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "Mission Control → This week should reflect the proper coverage, in sync with live classes and their materials. I didn't see any preference of this week. Act as product expert and redesign This week." |
| Problem | The section was a fixed text (Mon–Fri "Prep mission", Sat "Live workshop", Sun "4-hour hackathon") the same for every learner and every week, plus at most two sessions below it. It ignored the real class schedule, hackathon dates, where the learner is in the course and the day materials mentors add. |
| Decisions | One week, Monday to Sunday in IST. Real data only: the cohort's scheduled sessions, the cohort's hackathon dates, the learner's next unfinished days of their current level with their material counts. The study plan suggests one day per weekday from today; it never marks anything done. Join opens 15 minutes before a class and closes when it ends; afterwards the recording if one exists. |
| Code | `apps/web/lib/domain/weekPlanCore.ts` (pure) · `apps/web/lib/domain/weekPlan.ts` (data) · `apps/web/components/learn/ThisWeek.tsx` · `apps/web/app/(app)/dashboard/page.tsx` |
| Tests | `apps/web/test/this-week.test.ts` |

## 1. Acceptance criteria
- [x] AC-1: The header shows this week's real dates (Mon–Sun, IST) and a summary: live classes, study days and materials this week.
- [x] AC-2: Every scheduled session of the learner's cohort that starts this week appears on its day with its IST time, kind and title. Sessions of other weeks never appear in the grid.
- [x] AC-3: A class shows "Join" from 15 minutes before it starts until it ends (only with an https live link), then "Watch recording" when a recording exists, else "Ended".
- [x] AC-4: The cohort's hackathon dates that fall this week appear ("Hackathon build starts", "Hackathon submissions due").
- [x] AC-5: The learner's next unfinished days of their current level are planned one per weekday from today (never on a past day), each linking to its day page with its material count. Done or skipped days are never planned.
- [x] AC-6: With no class this week, the next scheduled class is named; with no classes at all, the cohort's usual weekly rhythm is shown. The section is never empty.
- [x] AC-7: Today is marked; past days are dimmed.

## 2. Release
Read-only. No migration, API, route or env change. Replaces only the "This week" card on Mission Control.
