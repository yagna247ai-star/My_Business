# Courses, cohorts, sessions and the class calendar in every institution — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "Whatever the journeys, cohorts, sessions, weekly calendar: all should reflect in SLN, AIACHUB and Sparity, with timings changed based on the admin selection." |
| Decisions | (1) **Same rule as day materials** (`docs/DAY_MATERIALS_SPEC.md` v1.1): a Super Admin's change applies in every institution; an Institution Admin's change applies to their own institution only. (2) **Courses:** each institution keeps its own copy of a course (learner progress lives on it). A Super Admin shares a course: it is copied into every active institution that does not have it (same slug), keeping its published state. (3) **Cohorts:** a cohort created by a Super Admin is created in every active institution, linked by `Cohort.groupId`; each copy has its own invite code and its own learners. An existing cohort is shared with one tap; a cohort with the same name in another institution is linked instead of duplicated. (4) **Calendar:** the Super Admin's calendar is the shared plan (`schedule.base`). An Institution Admin may change any timing (start date, class days, half day, holidays, block times, offline/online, venue, link); only the fields they changed are kept as their own (`schedule.local`), so later shared changes still reach every other field. "Use the shared timings" drops their changes. (5) **Sessions** (workshops, hackathons, office hours) a Super Admin adds go to every copy. (6) A Super Admin can still change one institution only ("Only this institution"). Deleting a cohort deletes one copy only, because each copy has its own people. |
| Builds on | `docs/INSTITUTIONS_SPEC.md` (journey copy), `docs/COHORT_WEEK_SPEC.md` (calendar) |
| Code | `apps/web/lib/domain/sharingCore.ts` (new, pure) · `apps/web/lib/domain/sharing.ts` (new) · `apps/web/lib/domain/cohortWeek.ts` (`saveCalendar`) · `apps/web/lib/domain/admin.ts` (`createCohort`, `addSession`, `listCohorts`) · `apps/web/lib/domain/settingsAdmin.ts` (`createCohortAdmin`) · `apps/web/lib/domain/institutions.ts` (`cloneJourney` exported) · `components/staff/CohortManager.tsx`, `components/staff/CohortCalendarEditor.tsx`, `components/admin/JourneyShare.tsx` (new) · routes `POST /api/v1/admin/cohorts/{id}/share`, `POST /api/v1/admin/journeys/{id}/share` · migration `0023_cohort_groups` |
| Tests | `apps/web/test/institution-sharing.test.ts` |

## 1. Acceptance criteria
- [x] AC-1: `localChanges(base, edited)` keeps only what differs: start date, class days, half day, holidays, and per block (by key) its label, times, mode, venue and link; a different set of blocks keeps the whole block list. Nothing differs → empty.
- [x] AC-2: `applyLocal(base, local)` gives the institution's calendar: the shared plan with their changes on top. A shared change to a field they did not touch reaches them; a field they changed stays theirs; a block they changed that the shared plan removed is dropped.
- [x] AC-3: `planShare(name, slug, institutions)` links a same-slug cohort already in an institution, creates one where there is none, and skips the source institution and cohorts already in the group.
- [x] AC-4: A Super Admin creating a cohort creates it in every active institution with its own invite code; an Institution Admin creates it in their own only.
- [x] AC-5: A Super Admin saving a shared cohort's calendar ("All institutions", the default) sets the shared plan in every copy, keeping each institution's own changes; "Only this institution" saves that copy only. An Institution Admin's save records their changes against the shared plan.
- [x] AC-6: The calendar line says "your own timings" when an institution differs from the shared plan, and the editor offers "Use the shared timings".
- [x] AC-7: A Super Admin's new session appears in every copy; an Institution Admin's in their own cohort only.
- [x] AC-8: A Super Admin shares a course with all institutions: missing copies are made (published if the source is); institutions that already run it are left alone; a level-code clash is reported per institution, never half-copied. The journey list shows where each course runs.
- [x] AC-9: Sharing and every cross-institution write are Super Admin only and audited in each institution (`cohort.shared`, `journey.shared`).

## 2. Release
Migration `0023_cohort_groups`: `cohorts.groupId TEXT` and an index (additive). Readers keep using `schedule.calendar`, which always holds the institution's effective calendar. No env change.
