# Day page side panel: AI mentor, materials, classmates, open-source practice — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-27 |
| Trigger | "/levels/DA02_SQL/days/7 has blank space on the right. Use it for going through materials and asking the AI mentor; bring what fits that place, maybe open-source GitHub repos for more insight; the feed can be placed here too. Think as a learner." |
| Research | A learner reading a lesson reaches for four things without leaving the page: **help on the exact idea** (an AI tutor that knows the lesson answers in seconds, and gives hints rather than answers so learning sticks), **the day's files**, **peers on the same day** (a question asked where others are stuck on the same step gets answered faster than a general feed, and seeing classmates' questions normalises being stuck), and **somewhere to practise more** (real sample databases and exercise sets beat more reading). The panel is optional help, so the lesson stays first and the steps stay the only thing that earns points. |
| Decisions | (1) On screens 1180 px and wider, the lesson keeps its 820 px column and a 300–380 px panel sits on the right, sticky, scrolling on its own; on narrower screens the panel goes below the lesson. (2) **Ask the AI mentor**: the existing coach (same assistants and credits as on activities), told the level and day; the server adds that day's lesson as reference, never the trainer's answer key; three starter questions. (3) **Today's materials**: one-tap open links; ticking Studied/Practised stays in the main materials card. (4) **Classmates on Day N**: the last 3 posts tagged to this level and day (feed rules: visible, the learner's course or institution-wide, blocked people left out), reply count or "Answered", and "Ask the class", which posts a question tagged to the day. (5) **Go deeper**: 3 curated open-source repos for the module (SQL, Python, analytics, Power BI, AI, ML, ETL, lakehouse, modelling, capstone), each checked on GitHub on 2026-11-27, with one line on why it helps. Nothing is removed from the page. |
| Code | `apps/web/components/learn/DaySide.tsx` (new) · `apps/web/lib/domain/dayResources.ts` (new, pure) · `apps/web/lib/domain/feed.ts` (`dayFeed`) · `apps/web/lib/ai/coach.ts`, `app/api/v1/coach/[assistant]/route.ts` (day context) · `components/learn/CoachChat.tsx` · `app/(app)/levels/[code]/days/[day]/page.tsx` · `app/styles/features.css` |
| Tests | `apps/web/test/day-side-panel.test.ts` |

## Acceptance criteria
- [x] AC-1: Wide screens show the lesson and a sticky side panel; narrow screens show the panel below the lesson.
- [x] AC-2: The AI mentor is told the level and day; the server gives it that day's lesson without the answer key.
- [x] AC-3: Today's materials open from the panel.
- [x] AC-4: Classmates' posts for this level and day follow the feed's visibility rules; "Ask the class" posts a question tagged to the day.
- [x] AC-5: Every module has at least 3 curated repos; every level of every course maps to a module.
