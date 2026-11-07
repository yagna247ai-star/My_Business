# Zero-to-Running: A Critical Learner's Walkthrough + Custom Path

**Persona:** first-time learner. No Python, no LLM concepts, owns a Windows laptop.
**Scenario (real):** a tiffin service owner keeps the day's orders as messy
WhatsApp-forwarded text lines. The learner's job: build a Python program that
reads the list, cleans it, counts it, and prints a summary the owner can use.
**Rule of this path:** every concept is earned by a task the scenario needs.
No concept without a job. No job without proof. Proof earns points.

Sources consulted: beginner setup guides and stumbling-block surveys, 2025–2026
(PATH checkbox as the #1 Windows trap; indentation as the #1 code error;
`NameError` from use-before-assign; copy-paste without understanding).
Full citations live in `docs/RTM.md` research policy — verify before publishing.

## Part 1 — The walkthrough (as the learner)

**Day 0, hour 0 — "I know nothing. Where do I even type code?"**
I don't need a lecture on AI first. I need a win in 15 minutes: something on
MY machine that runs. The path gives me Task 0 (below) instead of theory.

**Hour 1 — "It printed!"**
I pressed Run and saw `Today's orders: 23`. First proof I can do this.
Concept learned without studying: a program is text the interpreter executes
top to bottom — no compile step, errors point at line numbers.

**Hour 3 — "It broke and I fixed it."**
`IndentationError` on my veg/non-veg split. The path teaches the 4-space rule
exactly when the error appears, not before. Fixing it myself is the lesson.

**Hour 5 — "It read a real file."**
My program opens `orders.txt` (23 messy lines), skips 2 bad ones with a
message, and writes `summary.txt`. I send both files to review. That is proof.

## Part 2 — The customized path (7 tasks + proof)

| # | Task (real job) | Concepts smuggled in | XP | Proof artifact |
|---|---|---|---|---|
| 0 | Setup: install Python 3.12+ (tick **Add to PATH** on Windows), make a project folder, create the project env (`python -m venv .venv`, or `uv venv`), pick that interpreter in VS Code + Python extension, run `python --version` | interpreter vs compiler, PATH, editor vs IDE, project-local env (never system pip, never `--break-system-packages`) | 5 | screenshot of version + extension + `.venv` in project |
| 1 | First run: print today's order count | `print`, strings, Run button vs terminal (from the project folder: activate env, then `python tiffin.py`, or `uv run python tiffin.py`) | 5 | `tiffin.py` v1 + terminal screenshot |
| 2 | Ask the owner: how many rotis? | variables, `input()`, `int()`, `NameError` | 10 | v2 handling a non-number without crashing |
| 3 | Split veg / non-veg lines | `if/elif/else`, indentation (4 spaces), comparison | 10 | v3 + one fixed `IndentationError` shown |
| 4 | Process all 23 lines | lists, `for` loops, `len()` | 10 | v4 output count matches hand count |
| 5 | Reusable counter + survive bad lines | functions, `try/except`, reading a Traceback bottom-up | 15 | v5 + `summary.txt` noting 2 skipped lines |
| 6 | Read `orders.txt`, write `summary.txt` | files (`open/read/write`), paths | 10 | `orders.txt` + `summary.txt` in repo |
| 7 | **Proof + Boss: Messy List Monday** — a NEW corrupted list, 30 min, clean it live | everything above, under time pressure | 5 + 25 boss | repo link + 50-word reflection + demo |

Total: 70 task XP + 25 boss. Uses the existing engine untouched:
server-side `awardXp` with idempotency keys, streaks, and a `first-run`
badge (`condition: { type: 'activity_approved', activity: 'FIRST_RUN' }`).

**Boss rules (fair, non-punitive):** 3 attempts, best counts; corrupt file is
generated, never reused; reflection graded on honesty (what broke, how fixed),
not prose quality. Withdraw/retry never costs XP.

## Part 3 — Critical review of current Level 1 (what to fix)

Current L01 (tiffin brief, AI concepts) is a good *thinking* level but a
zero-code level: a learner can finish it and still never have run anything.
That contradicts "learn by doing" for anyone whose goal is building.

1. **Gap: no on-ramp to running code.** Python first appears at L08.
   Fix: insert this path as **Level 0: First Light** (pre-L01, required) or as
   L01 Activities 0–2. Touches: `packages/db/prisma/seed-v3.ts` (LEVELS + L1
   activities), journey DAG (`level_prerequisites`), `docs/RTM.md`.
2. **Gap: setup is assumed.** Add Task 0 with OS-specific PATH guidance and
   a VS Code checklist; store the checklist state in `ContentProgress`.
3. **Gap: errors are not taught as a skill.** Add Traceback-reading to the
   Build rubric (`L01_AI_EXPLORER_RUBRIC` → new `L00_FIRST_RUN_RUBRIC`):
   runs without errors (30%), uses input + loop + function + file (40%),
   honest reflection incl. one error fixed (30%).
4. **Gap: proof is link-only.** Require the repo to contain `*.py` +
   `orders.txt` + `summary.txt`; the review UI (`app/(app)/review/[id]`)
   should show a file-presence checklist. Count lines/functions server-side —
   never trust client claims.
5. **Gap: one scenario for all.** Customization hooks per task: dish/cuisine
   swap (same skills), low-bandwidth variant (no video evidence — screenshots
   + text), regional-language variant (Hindi/Telugu/Tamil prompts via i18n
   keys). History-preserving: switching variants keeps XP and proof.

## Part 4 — What "done" looks like

Learner record shows: setup checklist ✓, 7 tasks approved, boss cleared,
repo with runnable code + real I/O, reflection naming one fixed error,
70+25 XP in the ledger, `first-run` badge. A mentor opening the portfolio
sees proof, not promises: the program runs, the summary matches the input,
and the learner can explain every line.
