# Interview Prep Simulator (Architects & Technical Roles)

Web MVP for interview preparation similar in spirit to TestGorilla assessments, covering:
- **Assessment mode:** timed/structured questions (MCQ, scenario, design prompts) with rubric-based scoring and competency report.
- **Conversational mock interview:** interviewer flow with follow-ups and final feedback summary.

## Roles covered
- Software / Solution Architect
- Enterprise / Cloud Architect
- Data Engineer / Architect
- GenAI / ML Developer

## Experience tracks (5–25 years)
- **Mid-level (5–8 yrs):** strong execution, sound scoped designs, clear reasoning
- **Senior (9–14 yrs):** end-to-end ownership, cross-team trade-offs, reliability/scale depth
- **Staff / Principal (15–25 yrs):** org-wide strategy, ambiguity, governance, long-term bets

## v1 content & evaluation
- **Curated question bank** per role × track (6 assessment questions, 5 mock prompts each)
- **Structured rubrics** per scenario/design question (framing, depth, trade-offs/NFRs, communication)
- **Scoring:** correctness (MCQ), rubric/key-point coverage for open responses, depth, trade-offs/NFR focus, communication heuristics
- **Reports:** overall score, competency breakdown, strengths, improvements, feedback notes
- Results stored locally in browser (`localStorage`) for quick MVP validation

## Project structure
- `src/app/page.tsx` – landing and mode selection
- `src/app/assessment/page.tsx` – TestGorilla-like assessment flow and report
- `src/app/mock/page.tsx` – conversational mock interview flow
- `src/app/results/page.tsx` – saved reports history
- `src/data/questions.ts` – curated questions, options, key points, rubrics
- `src/lib/scoring.ts` – scoring/evaluation and result persistence
- `src/lib/catalog.ts`, `src/lib/types.ts` – roles, tracks, types

## Run locally
```bash
cd interview-prep-simulator
npm install
npm run dev
```
Open http://localhost:3000

## Build
```bash
npm run build
npm start
```

## How to test (interview validation)
1. **Assessment flow:** Home → Assessment → pick role/track → answer 6 questions → Submit → review overall/competency scores, strengths, improvements, feedback notes.
2. **Mock interview flow:** Home → Mock Interview → pick role/track → answer interviewer prompts and follow-ups → receive completion summary → check full report in Results.
3. **Track differentiation:** run same role across Mid/Senior/Staff and verify questions and expectations differ by depth/scope.
4. **Role coverage:** run at least one session per role to validate relevance of prompts and competencies.
5. **Report persistence:** complete a session, open Results, refresh page, confirm report remains.

## Notes / MVP limitations
- Scoring for open-ended responses is rubric/key-point heuristic (no external LLM/API); designed for transparent v1 evaluation.
- Question bank is curated but compact (MVP-sized) and intended to be expanded.
- No authentication or backend storage; reports are browser-local.
- No audio/video proctoring or live human interviewer scheduling.
