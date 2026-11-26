# One Ranks Page, One Points Rule — Specification

| | |
|---|---|
| Version | 1.1, 2026-11-26 (ranks per course) |
| Trigger | "I'm seeing three different pages. The one showing the crown should have the proper thing. Club all of them into one single page, and all should follow the same rule: one rule for all the count points." |
| Decisions | One page, `/ranks`. The points rule is the crown page's rule. `/leaderboard` and `/leaderboard/areas` redirect to it. **v1.1:** every ranking is for **one course (journey) in one institution**. A learner taking GenAI and AI-Powered Data Analytics has a separate rank in each, and courses never mix. |
| Builds on | `apps/web/lib/domain/standings.ts` (crown rule), `apps/web/lib/domain/ranks.ts`, `apps/web/lib/domain/insights.ts` (`leaderboard`), `docs/AREA_PICKER_SPEC.md` |
| Code | `apps/web/lib/domain/pointsRule.ts` (new, pure) · `apps/web/lib/domain/ranks.ts` · `apps/web/lib/domain/standings.ts` · `apps/web/lib/domain/insights.ts` · `apps/web/app/(app)/ranks/page.tsx` · `apps/web/app/(app)/leaderboard/page.tsx` and `apps/web/app/(app)/leaderboard/areas/page.tsx` (redirect) · `apps/web/app/(app)/layout.tsx` (menu) |
| Tests | `apps/web/test/points-rule.test.ts` (new, pure) · `apps/web/test/ranks.test.ts` |

---

## 1. Problem
Three pages rank the same learners with three rules:

| Page | Who | Points |
|---|---|---|
| Leaderboard (`insights.leaderboard`) | my cohort / institution / track | all XP, including streak and other bonuses |
| Ranks (`ranks.ts`) | everyone in the institution | all XP, including bonuses |
| Area crowns (`standings.ts`) | everyone | only XP earned on **levels of the viewer's journey**, so learners on other journeys show 0 |

So the same learner shows different points and positions on each page.

## 1a. Problem found after v1.0
v1.0 summed level XP from **all** of a learner's journeys, and ranked every learner in the institution together. A learner on two courses (for example GenAI and AI-Powered Data Analytics) got one combined score, and learners from different courses competed on one board.

## 2. Solution
**v1.1: per course, per institution.**
- A ranking is always for one **course** (journey) in the current **institution**. Only learners enrolled in that course (active or completed) are ranked, and only XP earned on that course's levels counts.
- A **course picker** on `/ranks`: learners see the courses they are enrolled in (default: the one they worked on most recently); staff see every course in the institution that has learners. The choice is kept in the URL (`?course=`).
- Every tab (City, State, Everyone, My cohort, Area crowns), the dashboard standings card and the quests widget use the same course. Rankings never include another institution: every query is scoped to the institution, and people switch institution in the top bar.
- Fully automatic: computed live from the points ledger on every view.

**One rule (`pointsRule.ts`)**, the crown page's rule made fair for every journey:
- **Points = XP earned on journey levels** (ledger rows with a `levelId`), across all of the learner's journeys in this institution. Streak, badge and social bonuses do not count towards rank.
- A level filter (L1…Ln) narrows points to that level of the viewer's journey.
- The same people (active learners and team leads), the same privacy (private and under-18 learners show as "Anonymous learner"), and the same tie-break (points, then earliest to reach them, then name).

**One page `/ranks`**, with tabs: **City · State · Everyone · My cohort · Area crowns**. The level filter applies to all tabs. Area crowns keep the top 3 per area and the final-fight bracket. The 24-hour movement arrows stay.

## 3. Behaviour
1. `rankPoints(entries)` sums only entries with a `levelId`, restricted to `levelIds` when a filter is given.
2. Ties: points descending, then `reachedAt` ascending, then name.
3. Every tab uses `rankPoints`; the same learner has the same points on every tab (for the same level filter).
4. `/leaderboard` → 308 redirect to `/ranks?tab=cohort`; `/leaderboard/areas` → `/ranks?tab=areas` (with `level` passed through).
5. The menu shows one "Ranks" entry; "Leaderboard" and "Area crowns" are removed.

## 4. Data and API
No schema change.

## 5. UI
`/ranks`: header with my position and points; tab bar; level chips; then the table (rank, avatar, name, area · level, points, movement) or, on Area crowns, the crown cards and bracket. Column widths are fixed (`tabular-nums`, right-aligned points) so rows line up.

## 6. Acceptance criteria
- [x] AC-6 (v1.1): `chooseCourse` picks the requested course only if the person may see it; otherwise their most recent course; staff may pick any course in the institution.
- [x] AC-7 (v1.1): a learner on two courses gets each course's points only; learners not enrolled in the course are not ranked in it.
- [x] AC-8 (v1.1): ranks, standings and the dashboard standings card all filter members by enrollment in the chosen course.

- [x] AC-1: Bonuses without a level do not count; level XP from any of the learner's journeys does.
- [x] AC-2: The level filter counts only that level.
- [x] AC-3: The tie-break order is points, then the earliest to reach them, then name.
- [x] AC-4: The old routes redirect to the right tab.
- [x] AC-5: The menu has one Ranks entry.

## 7. Out of scope
Changing how much XP an activity gives.

## 8. Open questions
None.
