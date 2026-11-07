# Level 8 — AI Developer · Persona Specs

| | |
|---|---|
| Code | `L08_DEVELOPER` · Stage 3, AI Application Development · 210 XP |
| Topics | Python fundamentals · JavaScript fundamentals · APIs · Data handling · Application development · AI integrations · Git and GitHub |
| Unlock | Level 7 approved. Prerequisite for the App Developer track (Levels 7 and 8) and the QA & Evaluation track (Levels 8 and 13). |
| Status | Spec only. |

## Shared and protected
**Outcomes.** The learner can:
- write a small Python **or** JavaScript program that calls an AI API
- handle data (CSV or JSON)
- handle errors
- keep secrets in environment variables
- write tests
- use Git (branches, commits, pull requests) on GitHub

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 6 lessons: variables, functions and loops · data with CSV and JSON · calling an HTTP API · calling an AI API with the key in env · tests · Git basics. Quiz at 60%. The language track is Python or JS, chosen by the learner |
| 3 | Explore GitHub | `microsoft/generative-ai-for-beginners` "build" lessons (verified), with Python or TypeScript samples: find how the sample reads the API key. 3 questions |
| 4 | Build: AI-Integrated Program in a Repo | Fields:<br>`repo` (a public link, or private with reviewer access)<br>`readme` (setup, `.env.example`, how to run)<br>`tests` (≥5 automated tests that pass)<br>`commits` (≥5 meaningful commits, ≥1 PR merged from a branch)<br>`ai_review` ≥40 words (what the AI coding agent wrote, what they changed and why)<br>`data` (input and output samples, with personal data removed) |
| 5 | Submit Proof | Repo link; the reviewer runs the tests or watches a video of them running. The secret-key scan runs on the repo files submitted |
| 6 | Evaluation and Boss | 6 code-review snippets |

**Boss choices:**
- 0 = Safe to merge
- 1 = Bug: fix before merge
- 2 = Security issue: block

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Working code | 0.25 |
| Tests | 0.20 |
| Git hygiene | 0.15 |
| Secrets and data handling | 0.15 |
| Understanding of AI-written code | 0.05 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Why it matters:** Their Python hobby becomes real projects. This is an emphasis level for them.
- **Briefing:** Build a Python "homework helper" CLI. It reads a CSV of quiz questions, asks them, scores answers with code, and asks AI for a hint on wrong answers.
- **Check question:** Which line keeps the key safe?
  - `key = "sk-..."`
  - **`key = os.environ["API_KEY"]` with `.env` in `.gitignore`**
  - `print(key)`

  Answer: 1.
- **Learn demo:** Write `score()` with a test, run `pytest`, make one commit, then a branch, then a PR to themselves.
- **Build:** The CLI with ≥5 pytest tests and a README. The repo may be private, shared only with reviewers, unless a guardian consents to it being public.
- **Boss snippets:**
  1. `total = sum(scores)` [0]
  2. `for i in range(len(q)+1)` [1]
  3. An API key committed in `config.py` [2]
  4. Reading a CSV with `with open(...)` [0]
  5. `if answer = "yes"` [1]
  6. `os.system(user_input)` [2]
- **Safety:** GitHub's own terms set a minimum age, which staff confirm. The platform already blocks under-13s. No personal email appears in public commits; use GitHub's noreply address.

## Student & Career Starter
- **Briefing:** A "resume keyword matcher". Load a job description and a resume as text, have code compute keyword overlap, and have AI suggest improvements.
- **Check question:** A reviewer asks for changes on their PR. They:
  - Delete the PR
  - **Push new commits to the same branch and reply to each comment**
  - Force-push over main

  Answer: 1.
- **Learn demo:** Clean a JSON or CSV dataset, write a function with a test, and use an AI coding agent for one function, then review its diff.
- **Build:** In Python or JS, with ≥5 tests, a CI badge as a stretch goal, a clean README, and a public repo for the portfolio.
- **Boss snippets:**
  1. Uses `async`/`await` with try/catch [0]
  2. An off-by-one in pagination [1]
  3. SQL built by string concatenation from input [2]
  4. Validated input [0]
  5. A missing `await` [1]
  6. Logs the full API response, including tokens [2]

## Engineering Professional
- **Briefing:** A production-quality AI integration service with a typed API, retries and backoff, structured output validation, and tests with the model client mocked.
- **Check question:** Model output is supposed to be JSON. What's the robust approach?
  - `JSON.parse` and hope
  - **Validate against a schema, retry or repair on failure, and log the failures**
  - A regex

  Answer: 1.
- **Learn demo:** Use Claude Code or Codex to scaffold a service, then add contract tests and a fake model client yourself.
- **Build:** A service or library with schema validation, retries, timeouts, ≥5 tests (unit plus one integration test against a fake), lint, CI and an honest `ai_review`.
- **Boss snippets:**
  1. Idempotent retry with backoff [0]
  2. A retry loop with no maximum [1]
  3. A prompt built by concatenating untrusted input into the *system* prompt [2]
  4. A timeout set on the HTTP client [0]
  5. Swallowing exceptions [1]
  6. Disabling TLS verification [2]
- **Safety:** Use a personal or sandbox API account, never the employer's production keys.

## AI Builder, Enthusiast
- **Briefing:** Their Level 7 app hits builder limits. They export the code and add one feature by hand with an agent's help.
- **Check question:** The agent changed 40 files to fix one bug. They:
  - Accept it all
  - **Review the diff, keep only the needed change, and run the tests**
  - Start over

  Answer: 1.
- **Learn demo:** Read code that an agent wrote. Explain each function in plain words before accepting it.
- **Build:** Pick JavaScript, since the app is likely JS. Add the feature to the exported repo with ≥5 tests, a branch and a PR, and an `ai_review` written by them.
- **Boss snippets:**
  1. A clear function with a test [0]
  2. A wrong date comparison [1]
  3. The API key in front-end code [2]
  4. An environment variable read on the server [0]
  5. No error handling on a fetch [1]
  6. Open CORS plus an admin route without auth [2]

## Business Owner
- **Briefing:** They don't need to become a developer. They need to read, run and own a small script: a Python script that turns the daily orders CSV into an AI-written summary report.
- **Check question:** A freelancer delivers code. What do they ask for?
  - Just the app
  - **The repo access, a README, `.env.example`, and tests they can run**
  - A zip file

  Answer: 1.
- **Learn demo:** Run a provided script on their own anonymised CSV and change one setting.
- **Build:**
  - A small script for their business data with ≥5 tests (an AI agent may write them).
  - `ai_review` explains in plain words what each part does.
  - The repo is private, shared with the reviewer.
  - The bar is the same: tests must pass and Git must be used.
- **Boss snippets** (written in plain words):
  1. A script that only reads the CSV [0]
  2. Totals ignore cancelled orders wrongly [1]
  3. The script emails the full customer list to a third party [2]
  4. Keys in a `.env` file [0]
  5. Dates read as month and day swapped [1]
  6. A password in code shared on WhatsApp [2]
