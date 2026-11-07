# Agent Lab: Screenshot Proof, Validation and Scoring Framework — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-07 |
| Trigger | *"Learners should be able to upload **or paste** the screenshot. Validate the screenshot proof, and give points based on how correct the proof is. If the proof doesn't match the expected result, tell the learner what's wrong, offer fixes and a retry; if they want to continue anyway, explain why it matters, offer help, then let them go ahead."* |
| Builds on | `AGENT_LAB_SETUP_GUIDE_SPEC.md` (per-method checks), `AGENT_LAB_GET_UNSTUCK_SPEC.md` (help on each step) |
| Code | `lib/domain/imageProof.ts` (image validation, pure) · `lib/domain/proofScore.ts` (scoring, pure) · `lib/domain/agentLab.ts` (pre-check, submit, verify) · `components/learn/ScreenshotInput.tsx` · `components/learn/ProofCheck.tsx` · `components/staff/LabVerifier.tsx` · migration `20261107120000_proof_scoring` |
| Tests | `apps/web/test/proof-scoring.test.ts` |

---

## 1. Principles
1. **The score is explainable.** Every point comes from a named check with a fixed weight. The same proof always gets the same automatic score. No AI decides points.
2. **People decide what only people can see.** Whether the screenshot really shows the agent working is judged by a reviewer, using three fixed questions.
3. **Gates protect what matters most.** Some checks must pass whatever the total, such as "no secrets visible".
4. **Feedback over punishment.** Every failed check says *what's wrong, why it matters and how to fix it*, links to the step and to help, and allows unlimited retries. XP is awarded once.

## 2. Screenshot input
| Way in | How |
|---|---|
| Upload | **Choose file** button (PNG, JPG or WebP) |
| Paste | Click the drop zone, press **⌘V** (macOS) or **Ctrl+V** (Windows and Linux). An image copied with the screenshot tool's "copy to clipboard" option is pasted directly |
| Drag and drop | Drop an image file onto the zone |

The learner sees a preview, then the server's validation result, before anything is submitted. Replacing the screenshot is always allowed until it's submitted. Learners are reminded to crop out keys and personal data.

## 3. Screenshot validation (server, at upload; `imageProof.ts`)
| Check | Rule | If it fails |
|---|---|---|
| Real image | The file's bytes must start with the PNG, JPEG or WebP signature, matching the declared type | Upload rejected: *This file isn't a real PNG, JPG or WebP image* |
| Readable size | Width and height are read from the image header | Upload rejected if unreadable |
| Big enough to review | At least **640 × 360** pixels | Counted in the score (A5); the learner is told to capture the whole window |
| Not reused | SHA-256 of the bytes. Reuse means the same image was **earlier** attached to **another** Agent Lab run in the institution, whether by the same learner (for a different agent) or anyone else. The first, genuine use is never penalised; only later copies are | Counted in the score (A5) and is a **gate**: *Take a new screenshot of your own result* |
| Virus scan | Existing AV gate (`clean`, or `skipped` in development; `infected` is refused) | Existing behaviour |

The hash, width and height are stored on `files` (`sha256`, `width`, `height`).

## 4. Proof score (100 points)
### 4.1 Automatic checks (60 points, `scoreAuto`)
| id | Check | Points | Gate |
|---|---|---|---|
| A1 | The install proof matches what the chosen method's check prints | 20 | **Yes** |
| A2 | The Node.js version meets the method's minimum (N/A gets full points) | 5 | |
| A3 | The simplified prompt has all five parts, each with its minimum words (3 points per part) | 15 | |
| A4 | The result write-up has a description of 30+ words (6 points) and a "how I checked" note of 15+ words (4 points) | 10 | |
| A5 | The screenshot is a real image (3), at least 640×360 (3), not reused (4, **gate**), and not flagged by the virus scan (gate) | 10 | Reuse and the virus scan |

### 4.2 Reviewer checks (40 points, `scoreReview`)
The reviewer answers **Yes**, **Partly** or **No**. Yes gets full points, Partly half, No zero.

| id | Question | Points | Gate |
|---|---|---|---|
| R1 | Does the screenshot show **this agent** running (its panel, TUI or terminal session)? | 15 | Must not be **No** |
| R2 | Does it show the **result the learner described**? | 15 | |
| R3 | Is it free of **secrets and personal data** (keys, emails, phone numbers, other people's data)? | 10 | Must be **Yes** |

### 4.3 Outcome
- **Verified** when the total is **≥ 70 and every gate passes.** The reviewer can't choose "verified" for a failing score; the outcome is computed.
- Otherwise the outcome is **Needs changes**, and the learner gets the failed checks plus the reviewer's note.
- **XP = round(40 × score ÷ 100)**, so a pass earns between 28 and 40 XP. It's awarded **once** per learner and agent, with the idempotency key unchanged, on the first verified attempt.
- Stored: `agent_lab_runs.proofScore` (the total), `reviewScores` (JSON of R1–R3), and `autoChecks` (the A1–A5 breakdown).

## 5. Before submitting: the proof check
`GET /api/v1/agent-lab/{id}/precheck` returns the automatic score with every item. The learner sees:

```
Proof check · 52 / 60 automatic points        (reviewer adds up to 40)
 ✓ A1 Install proof matches            20/20
 ✗ A3 Prompt — Constraints too short    12/15   Why it matters · Fix → [Go to step] [Get help]
 ⚠ A5 Screenshot is 512×300 (small)      7/10   Why it matters · Fix → [Replace screenshot]
 ─────────────────────────────────────────────
 [Fix and re-check]   [Submit anyway]  ← only if no gate failed; needs "I understand" tick
```

- **Gate failed** (A1, reuse, virus scan): submitting is blocked. The learner sees the fix and help options.
- **Non-gate items failed:** the learner may tick *"I understand these lower my score and may lead to Needs changes"* and **Submit anyway**. The acknowledgement is stored with the submission (`autoChecks.acknowledged`).
- Every item has `why` (the learning reason) and `fix` (the action), and links to the step and its "Stuck on this step?" help (Get Unstuck spec).

## 6. After review: retry
"Needs changes" shows the learner the score breakdown, which checks failed, the reviewer's note, and a **Fix and resubmit** path back to the failing step. There's no limit on attempts. Attempts are counted and shown to the reviewer, and XP is never awarded twice.

## 7. Acceptance criteria → tests (`test/proof-scoring.test.ts`)
| # | Criterion |
|---|---|
| P1 | The image parser reads PNG, JPEG and WebP dimensions from real headers; it rejects non-images and type mismatches |
| P2 | Upload stores sha256, width and height; a fake image (text bytes declared as PNG) is rejected |
| P3 | Reuse is detected across learners and across a learner's own runs; re-uploading to the same run is fine |
| P4 | `scoreAuto` gives the documented points per check; gates are reported |
| P5 | Pre-check: a learner with a gate failure can't submit; with non-gate failures they can submit only with an acknowledgement |
| P6 | Verify: the outcome is computed from the scores (pass ≥ 70 and gates); XP = round(40 × score / 100) once; a failing score gives Needs changes with feedback |
| P7 | Retry after Needs changes; the second verified attempt doesn't award XP twice |
