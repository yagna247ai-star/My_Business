# Analytics an Institution Admin Can Act On — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "For analysis, are we in sync? Think like an Institution Admin and correct all the analysis parts. I saw the numbers and the screen and I do not understand them. Add value to the analysis." |
| Decisions | Numbers are counted per **learner** (a person), within a chosen **journey** and **cohort**. Every card says what the number means and what to do. Costs and revenue show to Super Admins only. |
| Builds on | `apps/web/lib/domain/insights.ts` (`programAnalytics`, `learnersAtRisk`), `apps/web/app/(app)/admin/page.tsx`, `docs/RANKS_UNIFIED_SPEC.md`, `docs/AUTO_REVIEW_ONLY_SPEC.md` |
| Code | `apps/web/lib/domain/analyticsCore.ts` (new, pure) · `apps/web/lib/domain/analytics.ts` (new) · `apps/web/app/(app)/admin/page.tsx` |
| Tests | `apps/web/test/analytics.test.ts` (new, pure) |

---

## 1. Problem: what is out of sync today
| Card | What it does now | Why it misleads |
|---|---|---|
| Enrolled | counts enrollment rows | one person with two journeys counts twice; dropped learners count |
| Active (7 days) | anyone with XP in 7 days | staff are included; day work without XP is missed |
| Level 1 funnel | the first "Level 1" in the database, by activity | may be another journey's level; learners now work in **days**, so the funnel stays near zero |
| Median review time | only non-AI reviews | review is automated now, so it shows "—" or old numbers |
| AI cost / revenue | mixed in USD and INR with learning numbers | not a learning measure; confusing for an Institution Admin |

There is also no cohort comparison, no trend and no plain-language "so what".

## 2. Solution
One analytics page with a **journey** and **cohort** filter (defaults: the institution's default journey, all cohorts), built from one pure module (`analyticsCore.ts`), so every number follows the same definitions.

**Definitions (shown under "How we count")**
- **Learner**: an active member with the learner or team lead role, enrolled (active or completed) in the selected journey.
- **Started**: at least one day or activity done.
- **Active this week**: did a day, a step, an activity or a submission in the last 7 days.
- **Progress**: days done ÷ days in the journey.
- **At risk**: started, but nothing in the last 7 days. **Not started**: enrolled 3+ days ago, nothing done.
- **Finished**: every level of the journey approved.

**Page**
1. **Headline** (4 cards, each with a meaning line): Learners · Active this week (% of learners) · Average progress (%) · Need attention (at risk + not started).
2. **What needs your attention** — 3 to 6 plain sentences, ranked, each with a link. For example: "Day 12 loses 38% of learners: check its lesson and materials." "14 learners have not started in 3+ days: nudge them." "Batch B is 21 points behind Batch A on progress."
3. **Where learners are**: the day-by-day funnel (learners who finished each day), with the biggest drop highlighted; and the level-by-level count (reached / approved).
4. **Weekly activity**: active learners in each of the last 8 weeks.
5. **Cohorts compared**: learners, active %, average progress, at risk, finished.
6. **Reviews** (automated): decided, approved %, needs changes, waiting, and the median time from submission to decision.
7. **Costs** (Super Admin only): AI cost this month, revenue.

## 3. Behaviour
1. A person counts once per journey, however many enrollment rows they have.
2. Staff never count as learners.
3. `dayFunnel` lists every day in the journey (zeros included). The biggest drop compares day *n* with day *n−1*, and only once day *n−1* has at least 5 learners.
4. `findings()` returns sentences with priority, text and href. There is none when the institution has no learners yet; instead, "No learners in this journey yet. Share an invite code (Cohorts & Sessions)."
5. Percentages round to whole numbers; 0 learners shows "—", never NaN.

## 4. Data and API
No schema change. Read-only queries scoped by tenant, journey and cohort.

## 5. UI
Filters at the top (journey and cohort selects, applied through the URL). Cards with meaning lines. Charts are CSS bars with numbers, accessible with `role="img"` and an `aria-label` summary. "How we count" is a `<details>` block.

## 6. Acceptance criteria
- [x] AC-1: Two enrollments for one person count as one learner; staff are excluded.
- [x] AC-2: Active this week, at risk and not started follow the definitions on fixed dates.
- [x] AC-3: The day funnel includes zero days, and the biggest drop respects the 5-learner minimum.
- [x] AC-4: The findings rank the biggest problems first, link somewhere useful, and give one helpful line when there are no learners.
- [x] AC-5: No NaN or Infinity anywhere with zero learners.

## 7. Out of scope
Exports to CSV/PDF. Cross-institution comparisons.

## 8. Open questions
None.
