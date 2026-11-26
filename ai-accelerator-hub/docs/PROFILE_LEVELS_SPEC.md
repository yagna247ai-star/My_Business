# Finished levels on the learner profile — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "In the profile also we need to reflect the level finished in learner profile." |
| Decisions | A level counts as finished when a reviewer approved it (`Progress.state = approved`), the same rule as the ribbon and titles. One record per course the learner is enrolled in. Staff and employers see finished levels only on talent profiles the learner already chose to share (tenant or public visibility, same consent and under-18 rules as today); nothing new becomes visible. |
| Builds on | `docs/LEVEL_RIBBON_SPEC.md`, `docs/LEVEL_TITLES_SPEC.md` (`levelTitles.ts`), `lib/domain/talent.ts` |
| Code | `apps/web/lib/domain/levelTitles.ts` (`levelRecord`, pure) · `apps/web/lib/domain/levelRecords.ts` (one batched query for many learners) · `apps/web/components/learn/LevelRecord.tsx` · Profile & privacy page, Career page, Talent search and applicant lists |
| Tests | `apps/web/test/profile-levels.test.ts` |

## 1. Acceptance criteria
- [x] AC-1: Given a course's levels and the learner's approved ones, the record shows "N of M levels finished", the earned title with stars, each finished level as "Level N · title" with the date it was approved, and the next level (or "Course complete").
- [x] AC-2: Levels are counted per course; levels of another course never mix in. A learner with no approved level shows "0 of M" and the first title to earn.
- [x] AC-3: The learner sees their record for every course on Profile & privacy and on Career.
- [x] AC-4: Talent search results and opportunity applicants show "Verified: Level 1 · Data Explorer, …" for each shared profile, from one query for the whole list (no query per person).
- [x] AC-5: Profiles that are private, under-18 or not opted in stay hidden exactly as before.

## 2. Release
Read-only queries and UI. No migration, no new route; two existing responses gain a `levels` field.
