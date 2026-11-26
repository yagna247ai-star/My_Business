# Level Titles (Earned Tags per Course) — Specification

| | |
|---|---|
| Version | 1.1, 2026-11-27 (tags on every level in the journey, next level at the top) |
| Trigger | "At every level the learner is shown only as Explorer. Give a tag based on the levels they have crossed and the level intensity, so they grow from explorer to developer, to SQL journalist, to Python coder, to Python data analytics specialist. Research the tags so learners get more enthusiasm." |
| Decisions | The title comes from the **highest level approved in the course** (not from XP), named after the skill that level proves. It shows **intensity stars** (1–5, by how far into the course the level is) and the **next title**, with the levels still to go. Unlocking a title sends a celebration notification. The XP ranks (Explorer, Builder, Engineer, Architect) are no longer shown as the learner's tag. |
| Builds on | `apps/web/lib/domain/insights.ts` (`RANKS`), `apps/web/lib/domain/gamify.ts` (`crownLabel`), `apps/web/lib/domain/ranks.ts`, `docs/RANKS_UNIFIED_SPEC.md` v1.1 (per course) |
| Code | `apps/web/lib/domain/levelTitles.ts` (new, pure) · `apps/web/lib/domain/ranks.ts` · `apps/web/app/(app)/layout.tsx` · `apps/web/lib/domain/review.ts` (celebration) · `apps/web/app/(app)/dashboard/page.tsx` |
| Tests | `apps/web/test/level-titles.test.ts` (new, pure) |

---

## 1. Problem
The tag next to a learner comes from total XP (Explorer under 200 XP, Builder under 800 …). Most learners stay "Explorer" through several levels, so the tag says nothing about what they have actually proved, and it never changes when they pass a level.

## 2. Solution: research and the rules it gives

| Finding | Source | Rule here |
|---|---|---|
| Identity titles that name a real skill motivate more than generic ranks (competence and identity are core needs) | Self-determination theory (Deci & Ryan); Trailhead ranks; Kaggle progression | Each title names the skill the level proves |
| Progress you can see to the next goal raises effort (the goal-gradient effect) | Kivetz, Urminsky & Zheng 2006; Duolingo leagues | Always show the next title and "N levels to go" |
| Unlocks should be celebrated at the moment they happen | Game-design reward schedules; Duolingo | A notification and badge when a title is unlocked |
| Harder achievements should look harder | Kaggle tiers, Trailhead stars | 1–5 intensity stars, by depth in the course |

**AI-Powered Data Analytics** (by level code):

| Level | Title | ★ |
|---|---|---|
| DA01 Fundamentals | Data Explorer | ★ |
| DA02 SQL | SQL Data Journalist | ★★ |
| DA03 Python Fundamentals | Python Coder | ★★ |
| DA04 Python for Analytics | Python Data Analytics Specialist | ★★★ |
| DA05 Power BI | Dashboard Storyteller | ★★★ |
| DA06 AI for Analytics | AI-Powered Analyst | ★★★★ |
| DA07 Machine Learning | Machine Learning Practitioner | ★★★★ |
| DA08 ETL and Data Quality | Data Quality Engineer | ★★★★★ |
| DA09 Capstone | Industry-Ready Data Analyst | ★★★★★ |

**GenAI journey (L01–L15):** the level titles are already identity titles (AI Explorer → AI Problem Hunter → Prompt Wizard → … → AI Developer → RAG Engineer → Agent Architect → … → AI Grandmaster), so they are used as they are.

**Other courses:** a level title that already names a role (ends in Explorer, Builder, Developer, Engineer, Architect, Specialist, Analyst, Coder, Creator, Wizard, Hunter, Hacker or Grandmaster) is used as it is; otherwise the title is "*Level title* Graduate".

**Before any level is approved:** "Rising *first title*", for example "Rising Data Explorer", with "1 level to go".

## 2a. v1.1
- The journey page opens with a banner: "Your title: *title* ★★ · Next: Level *n*, *next title* (*k* levels to go)".
- Every level tile shows the tag it earns ("Earns: SQL Data Journalist ★★"), or "Earned" with a tick once it is approved.

## 3. Behaviour
1. `titleFor(level, totalLevels)` → `{ title, stars }`; stars = ⌈idx / total × 5⌉, clamped to 1–5.
2. `learnerTitle(levels, approvedIdx[])` → `{ current, stars, next, levelsToNext, isMax }`. The highest approved level counts, even if an earlier one is still open.
3. Ranks show each learner's title for the selected course (instead of the XP rank).
4. When a review approves a level, the learner gets a notification "Title unlocked: *title* ★★" (once per level).
5. The top bar crown shows "*title* · Level n".

## 4. Data and API
No schema change. Titles are computed from level code, title and index.

## 5. UI
- **Ranks:** the title under each name, with stars.
- **Dashboard:** a "Your title" card with stars, and the next title with "N levels to go".
- **Top bar:** the crown label uses the title.

## 6. Acceptance criteria
- [x] AC-5 (v1.1): Given the journey page, then it shows the title banner with the next level, and each level tile shows its tag (earned or to earn).

- [x] AC-1: The data analytics levels map to the nine titles above, with the stars shown.
- [x] AC-2: GenAI uses the level titles as they are; other courses get "Graduate" titles unless the level already names a role.
- [x] AC-3: No approval → "Rising …", next = level 1's title, 1 to go; the highest approved level wins; the last level → `isMax`.
- [x] AC-4: Ranks no longer use the XP rank names as the learner's tag.

## 7. Out of scope
Certificates per title. Changing XP amounts.

## 8. Open questions
1. "Jeevastana Astana level" in the request was unclear; the GenAI "AI Developer" level is treated as the developer step. Rename any title in `levelTitles.ts`.
