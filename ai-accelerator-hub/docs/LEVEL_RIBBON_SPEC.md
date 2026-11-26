# Level ribbon (every level labelled with its title and state) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "Put the label on the level ribbon, with the title mapped to that level, e.g. Level 1 · Data Explorer · Done, Locked for the others. All courses should have this." |
| Decisions | The ribbon is the row of level dots on the dashboard ("Your journey"). It is a shared component, also shown at the top of the Journey page. Titles come from `levelTitles.titleFor`, so every course gets its own (Data Analytics by level code, other courses from the level name). |
| Builds on | `docs/LEVEL_TITLES_SPEC.md` (`apps/web/lib/domain/levelTitles.ts`), `journeyOverview` level states |
| Code | `apps/web/lib/domain/levelTitles.ts` (`ribbonNodes`, pure) · `apps/web/components/learn/LevelRibbon.tsx` · `apps/web/app/(app)/dashboard/page.tsx` · `apps/web/app/(app)/levels/page.tsx` · `apps/web/app/styles/core.css` |
| Tests | `apps/web/test/level-ribbon.test.ts` |

## 1. Problem
The dashboard ribbon showed a number and the last word of each level's name ("Fundamentals"), with no title and no state apart from a colour. The heading always said "Your 15-level journey"; the Data Analytics course has 9 levels.

## 2. Acceptance criteria
- [x] AC-1: Given a course's levels, when the ribbon is built, then every level shows "Level N", its title from `titleFor` (DA01 → "Data Explorer") and a state label.
- [x] AC-2: The state labels are: approved → "Done", submitted → "In review", needs changes → "Changes asked", available or in progress → "In progress" (the learner's current level), locked → "Locked". Done shows ✓ and Locked shows a lock in the dot.
- [x] AC-3: The line between the dots is filled up to the last Done level.
- [x] AC-4: The heading counts the course's own levels ("Your 9-level journey").
- [x] AC-5: Every course in the platform (Data Analytics and the 23 domain journeys) gets a title for every level, never an empty one.
- [x] AC-6: Each dot has an accessible name with the level, title and state; locked levels are not links.
- [x] AC-7 (2026-11-27): The level tabs at the top of a level page (`/levels/{code}`) show the same tags: "Level 2 · Query Builder · In progress" (Done / Open / Locked), with the same title as the ribbon.

## 3. Release
UI and a pure helper only. No migration, API, route or env change.
