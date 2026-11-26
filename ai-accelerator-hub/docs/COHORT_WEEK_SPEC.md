# Cohort calendar and "This week" (classes, labs, materials, attendance, progress) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 (supersedes the study-plan guess in `docs/THIS_WEEK_SPEC.md` when a cohort has a calendar) |
| Trigger | "Sessions are 10 to 12 (offline or online) and the lab 12:30 to 1:30; the materials of that day should be on that day and open from This week. Admin plans the whole cohort: online/offline, materials per day, timings. Monday to Saturday classes, Sunday half day with no classes. Learners and mentors both mark attendance. Show what is done, what is pending and how to improve, day by day. Design it from the admin and learner side, to engage the learner." |
| Decisions | (1) **Calendar per cohort**, stored in `Cohort.schedule.calendar`: start date, class days, daily blocks (Session 10:00–12:00, Lab 12:30–13:30 by default; each offline with a venue or online with an https link), holidays, and a half day (Sunday: no classes, catch-up). (2) **Date → course day:** the k-th class date from the start date (holidays skipped) teaches the k-th day of the course (levels in order, days in order). Materials stay attached to course days (`docs/DAY_MATERIALS_SPEC.md`), so they land on the right date automatically. (3) **Attendance, both sides:** a learner taps "I attended" from 15 minutes before a block until the end of the next day; mentors (cohort:manage, or review:decide with cohort:read) mark present / absent / excused any time and their mark wins; every mark keeps who and when. Research: self-report alone inflates, mentor-only marking lags for offline classes. (4) **Peer nudge:** anonymous and positive only ("18 of 25 classmates finished Day 6"), shown when at least half of a cohort of 5 or more did it; descriptive norms motivate, but a low number backfires. Private learners are not counted by name, never shown. (5) **Engagement:** one clear next step (catch up the earliest missed day, else today's), a weekly progress bar, missed days framed as catch-up, no shaming. |
| Code | `apps/web/lib/domain/cohortCalendar.ts` (pure: calendar rules, date → course day, the week view) · `apps/web/lib/domain/cohortWeek.ts` (data, attendance) · migration `0021_session_attendance` · `apps/web/components/learn/CohortWeek.tsx` (learner) · `apps/web/components/staff/CohortCalendarEditor.tsx`, `apps/web/app/(app)/admin/cohorts/[id]/week/page.tsx` (admin) · routes `PUT /api/v1/admin/cohorts/{id}/calendar`, `POST /api/v1/admin/cohorts/{id}/attendance`, `POST /api/v1/attendance` |
| Tests | `apps/web/test/cohort-week.test.ts` |

## 1. Acceptance criteria
**Admin**
- [x] AC-1: An admin sets a cohort's calendar: start date, class days, blocks (label, start, end, offline + venue or online + https link), holidays, half day. Defaults are the SLN plan: Monday–Saturday, Session 10:00–12:00, Lab 12:30–13:30, Sunday half day. Invalid input (end before start, http link, bad date) is refused with a message per field.
- [x] AC-2: The k-th class date (from the start date, class days only, holidays skipped) maps to the k-th course day; a holiday shifts later days by one; the half day never takes a course day.
- [x] AC-3: The cohort week board shows every learner × class date of a week: the day done or pending, and each block's attendance; a mentor marks present / absent / excused and their mark replaces the learner's.

**Learner ("This week")**
- [x] AC-4: Each date shows its course day ("Day 7 · Joins") linked to its page, its blocks with IST times and offline venue or online Join (Join only from 15 minutes before to the end), and that day's materials opening straight from the week (same open and Studied/Practised as the day page).
- [x] AC-5: Each class date has a state: done (course day done), missed (a past class date not done: "Catch up"), today, upcoming. The half day shows "Half day · catch up"; holidays show "Holiday".
- [x] AC-6: The header shows "N of M class days done this week" with a bar, and one next step: the earliest missed day, else today's day, else the next class.
- [x] AC-7: "I attended" appears for a block from 15 minutes before it starts until the end of the next day, never for a future block and never over a mentor's mark. The learner's attendance this week is shown ("Attended 4 of 5 sessions").
- [x] AC-8: The peer line appears only when at least half of a cohort of 5+ finished that day, with counts only.
- [x] AC-9: Without a calendar, "This week" falls back to the v1.0 view (`docs/THIS_WEEK_SPEC.md`); one-off sessions and hackathons still appear on their dates in both.

## 2. Release
Migration `0021_session_attendance` (new table, additive). New routes are tenant-scoped and permission-checked. No env change.
