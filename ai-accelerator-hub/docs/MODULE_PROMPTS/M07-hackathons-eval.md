# M07 — Hackathons & Evaluation (BRD-08 · §8 §11 §12 · REQ-HACK/TEAM/EVAL)

## 1. Objective
Run weekly cohort hackathons (teams 3–5, fair credit) with 3-layer 10-dim evaluation.

## 2. Prerequisites
- M02 (levels), M03 (XP), M06 (teams/feed) complete.
- Read `app/api/submissions`, `app/api/progress/complete`, Team/Review/Rubric models.

## 3. Build steps
1. Build Mon–Fri prep → Sat workshop → Sun 4h hackathon → next-week refine/submit cycle.
2. Build teams: formation, invites, roles, contribution tracking, team submissions, mentor allocation.
3. Build rubric with 10 dims (problem, tech, innovation, functionality, UX, reliability, Responsible AI, docs, GitHub, business impact).
4. Build 3 layers: AI pre-review + mentor review + peer review, `weighted_avg` verdict.
5. Build appeals path (human review corrects AI errors). Attendance alone never passes.

## 4. ARB gate
- Is contribution per-member (not assumed equal)?
- Is AI never the sole authority for high-stakes decisions (verdict requires human)?
- Are rubrics versioned per hackathon (judging criteria reproducible)?
- Are submissions immutable once judged (appeals create new reviews, not edits)?

## 5. NFR gate
- Submission window enforcement with catch-up path. No data loss on submit.
- Judging latency bounded; partial judge failure does not lose evidence.
- Certificates only on verified wins/completions.

## 6. Red-team review
- Try free-riding: member with zero commits claiming equal credit. Must show low contribution.
- Try judge bias: AI-only verdict deciding placement. Must require human sign-off.
- Try late submission after deadline. Must reject or route to catch-up explicitly.
- Try editing a submission post-judging to change verdict. Must be immutable.

## 7. Acceptance
- Team 3–5 + membership + contribution tracking; review with `rubricScores + weightedAvg`.
- `verify.mjs` hackathon/eval items green; appeals path exists.

## 8. Done criteria
Fair teams, structured judging, human-gated verdicts, appeals working.
