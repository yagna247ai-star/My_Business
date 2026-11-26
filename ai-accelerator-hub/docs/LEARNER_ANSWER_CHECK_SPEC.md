# Learner answer check (correct answers are never refused) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "Act as a learner of this platform and find bugs and improvements across the whole platform." A learner walk-through of every answer gate, run against the real course steps. |
| Decisions | The checker keeps refusing junk (empty, keyboard mash, one word repeated, a copy of a prose example). It stops refusing answers that are right: the result the step asks for, short counts, numbers, links. |
| Builds on | `apps/web/lib/domain/answerQuality.ts` (`checkAnswer`), used by 957 guided "answer" steps (`guidedSteps.validateStep`), activity briefs and the level proof reflection (`journey.submitProof`). |
| Code | `apps/web/lib/domain/answerQuality.ts` · `apps/web/components/learn/CoachChat.tsx` + `apps/web/app/styles/core.css` (coach starter buttons) |
| Tests | `apps/web/test/answer-quality.test.ts` (AC-1…AC-5), `apps/web/test/learner-answers.test.ts` (AC-6, every course step) |

## 1. Problem (found 2026-11-26, by running the steps)
| Gate | What the learner typed | What they were told |
|---|---|---|
| Day 26 "Revenue, Orders and Avg Order Value for September" (example `4,890 · 8 · 611.25`) | `4,890 · 8 · 611.25`, the correct answer | "Use your own words instead of repeating the example." |
| Day 7, Day 25 and 527 step prompts in all | The correct counts, written as the example writes them | Same. In these steps the example *is* the result, so a right answer looks like a copy. |
| Day 24 "How many rows are left" (example `24 rows`) | `38 rows` | "Write a full sentence that answers…" |
| Level proof reflection | "…total revenue was 100000 rupees…" | "This does not read like a real answer yet." (five zeros read as "aaaaa") |
| Level proof reflection | A sentence with the Drive link in it | Same (a URL is a "word" longer than 40 characters). |
| Any answer | "it took time….." | Same (five dots). |
| Reflection in Telugu | Two full Telugu sentences (6 words) | "Add a little more…" (Telugu packs more into a word than English). |
| AI coach panel | Long starter questions | The buttons ran past the panel's right edge (screenshot from a learner, 2026-11-26). |

## 2. Acceptance criteria
- [x] AC-1: Given an example that contains a result (two or more digits), when the learner's answer matches it, then the answer is accepted. A copy of a prose example is still refused.
- [x] AC-2: Given a short question, when the answer is one or two words containing a number ("24 rows", "38"), then it is accepted. One or two words without a number are still refused.
- [x] AC-3: Given an answer with numbers such as 100000, a link, or "….." , then it is not called "not a real answer". Letters repeated five times ("aaaaa"), keyboard mash and one word repeated are still refused.
- [x] AC-4: Given a detailed answer in Telugu, Hindi or another non-Latin script, when it holds at least 24 letters (two short sentences), then it is not asked to "add a little more".
- [x] AC-5: No refusal message mentions a number of words.
- [x] AC-6: Given every guided "answer" step in every course (Data Analytics and the 23 domain journeys), when its example is entered as the answer, then it is accepted if the example contains a result, and refused as a copy only if the example is prose.
- [x] AC-7: Starter questions in the AI coach panel wrap inside the panel instead of running past its edge.

## 3. Improvements found, not built (for a decision)
- Several examples give away the answer (Day 24 `24 rows`, Day 26 `4,890 · 8 · 611.25`, Day 25 `13,260 = 5,310 + 7,950`). Showing the format instead (`__ rows`) would keep the step a real check. Changes course content in every institution, so it needs a content decision first.
- `checkAnswer` accepts a long answer made of a few words repeated ("data data quality the the key…", score 3). The AI judge catches it when an AI provider is on.

## 4. Release
Code only: no migration, no schema, API, route or env change. RLS not involved.
