# Automated Review Only — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-25 |
| Trigger | "Once a review is submitted, only the automation review should be given. No need to have the human review. If it is necessary, then we can give it to them, and make automation for the review as soon as possible." |
| Decisions | Every submission is decided by the automated reviewer. A person is involved only when (a) the learner appeals an automated decision, or (b) automation could not decide (an error, or no rubric) for 15 minutes. |
| Builds on | `apps/web/lib/domain/autoReview.ts`, `apps/web/lib/domain/journey.ts` (`submitProof`, `runAutoReview`), `apps/web/lib/domain/review.ts` (appeals) |
| Code | `apps/web/lib/domain/autoReview.ts` · `apps/web/lib/domain/autoReviewCore.ts` (new, pure) · `apps/web/lib/domain/journey.ts` · `apps/web/app/api/cron/auto-review/route.ts` (new) · `apps/web/vercel.json` (cron) · `apps/web/app/(app)/showcase/page.tsx` (wording) |
| Tests | `apps/web/test/auto-review-only.test.ts` (new, pure) |

---

## 1. Problem
Every proof notifies reviewers, mentors and instructors as if a person had to decide it. The automated reviewer only runs after the learner has also finished the Boss challenge. If it errors, or the level's rubric is missing, the submission stays "pending" forever, waiting for a human who was never meant to be needed.

## 2. Solution
- When a proof is saved, the automated reviewer runs at once. If the Boss result is missing, it waits for the Boss and decides the moment the Boss is saved, exactly as today.
- No reviewer notifications on submit.
- If no rubric is found, the built-in `GENERIC_RUBRIC` weights are used, so a missing rubric never blocks a decision.
- A daily sweep (`/api/cron/auto-review`, 02:15 IST; the Vercel Hobby plan allows daily cron jobs only) re-runs the reviewer on pending submissions whose Boss is done. That catches errors and the existing backlog.
- Escalation to a person only on appeal, or when the sweep has failed on a submission for 15 minutes or more. Reviewers are notified only then.

## 3. Behaviour
1. `submitProof` no longer notifies reviewer, mentor or instructor roles.
2. `autoReviewSubmission` falls back to the default weights `{ correct_result: 0.35, business_reading: 0.2, method: 0.2, reflection: 0.15, data_checks: 0.1 }` (the dimensions `templateReview` scores) with threshold 3.0 when the rubric row is missing.
3. `needsHuman(sub, now)` is true only when the submission is pending, the Boss is done, and it was submitted at least 15 minutes ago (automation should have decided by then).
4. The cron route requires `Authorization: Bearer $CRON_SECRET` and processes at most 50 submissions per run. It decides each one with the automated reviewer and notifies reviewers once about the rest (the `needsHuman` ones).
5. The showcase header says "Every project here passed review against a published rubric" (not "a human review").
6. Appeals keep working: an overturned "needs changes" goes back to pending, and the reviewer queue still lists it.

## 4. Data and API
No schema change. New route `GET /api/cron/auto-review`. New env var `CRON_SECRET` (Vercel sets it for cron jobs).

## 5. UI
Showcase header wording only. The review queue is unchanged; it simply stays nearly empty.

## 6. Acceptance criteria
- [x] AC-1: Given a missing rubric, then default weights are used and a verdict is returned.
- [x] AC-2: `needsHuman` is false before 15 minutes or without a Boss result, and true after 15 minutes with one.
- [x] AC-3: The cron route returns 401 without the secret.
- [x] AC-4: `submitProof` contains no reviewer notification.
- [x] AC-5: The showcase header no longer says "human review".

## 7. Out of scope
AI (LLM) grading of the reflection beyond the existing `answerQuality` check.

## 8. Open questions
None.
