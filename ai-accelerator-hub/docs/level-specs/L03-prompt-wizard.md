# Level 3 — Prompt Wizard · Persona Specs

| | |
|---|---|
| Code | `L03_PROMPT_WIZARD` · Stage 1, AI Foundations · 150 XP |
| Topics | Prompt engineering · Context and constraints · Role-based prompting · Zero-shot and few-shot prompting · Prompt testing · Prompt refinement · Multimodal prompting |
| Unlock | Level 2 approved |
| Status | Spec only. Seed note: the core material is "Prompt Engineering Presentation AG-2.pdf", **which hasn't been uploaded or ingested yet**. The Learn lessons must be checked against it once it is supplied. |

## Shared and protected
**Outcomes.** The learner can write prompts with context and constraints, use roles, compare zero-shot with few-shot, test a prompt against cases, refine it with evidence, and prompt with an image.

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question, 3 options |
| 2 | Learn | 5 lessons:<br>the five-part prompt (Goal · Context · Constraints · Output · Check, the same as the Agent Lab)<br>roles<br>zero-shot vs. few-shot<br>testing a prompt<br>multimodal<br>5-question quiz, 60% to pass |
| 3 | Explore GitHub | The prompt-engineering lessons of the verified `microsoft/generative-ai-for-beginners` (lessons 04–05). 3 questions, 2 correct to pass |
| 4 | Build: Prompt Library | **5 prompts** for the problem chosen in Level 2. Each prompt has: the five parts · 3 test inputs with what a good answer looks like · the zero-shot result · the few-shot result · the winner and why (≥20 words). At least 1 prompt is multimodal (image in). Rules: the output in each test ≥15 words, and the refinement note ≥15 words |
| 5 | Submit Proof | A library link plus one test showing a prompt fail and then pass after a change |
| 6 | Evaluation and Boss | 6 broken prompts; pick the fix that helps most; reason ≥6 words |

**Boss choices:**
- 0 = Add context
- 1 = Add few-shot examples
- 2 = Add constraints and an output format

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Prompt structure | 0.25 |
| Testing with cases | 0.25 |
| Refinement evidence | 0.20 |
| Multimodal use | 0.10 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Why it matters:** Clear prompts are the fastest way to get good Python help. This is an emphasis level for them.
- **Briefing:** Their AI helper keeps giving the whole answer to Python homework when they only wanted a hint.
- **Check question:** Which prompt gets a hint, not the answer?
  - "Fix my code"
  - **"I am 13 and learning Python. Here is my error. Give one hint, no full solution, in under 40 words."**
  - "Python help"

  Answer: 1.
- **Learn demo:** Show the AI 2 examples of "question, then hint-only reply", then ask a new question, so they see few-shot copy the style.
- **Build:** 5 prompts for their Level 2 problem, for example a quiz-question generator, a hint-only tutor, an error explainer, a story about loops, and a photo of handwritten code explained (multimodal).
- **Boss scenarios:**
  1. "Write a quiz" gives random topics [0]
  2. A quiz returns a different format each time [2]
  3. "Explain loops" is too grown-up for Class 7 [0]
  4. They want answers in the style of their 2 favourite riddles [1]
  5. The answer is too long [2]
  6. Jokes come out in the wrong style [1]
- **Safety:** Images must not show faces, uniforms or school names.

## Student & Career Starter
- **Briefing:** They need resume bullets, cover letters and aptitude practice, and generic AI output makes everyone's resume sound the same.
- **Check question:**
  - "Write my resume"
  - **"Role: hiring manager for a junior data analyst. Here are my 3 projects. Write 3 bullets, each with a number and an action verb, under 20 words."**
  - "Make me impressive"

  Answer: 1.
- **Learn demo:** Write zero-shot bullets, then few-shot bullets from 2 strong examples, and compare them against a rubric.
- **Build:** 5 prompts, for example a resume-bullet writer, a mock-interview interviewer with a role, an aptitude question generator with answer checking, a job-description analyser, and a screenshot of a job post summarised (multimodal).
- **Boss scenarios:**
  1. Bullets have no numbers [2]
  2. Interview questions are too generic for the role [0]
  3. They want bullets in the style of 2 good examples [1]
  4. The output is in paragraphs and they need a table [2]
  5. The cover letter doesn't mention the company [0]
  6. Aptitude questions don't match the placement-test pattern [1]

## Engineering Professional
- **Why it matters:** Prompts become production artefacts, so they must be tested like code.
- **Briefing:** A team's log-summarisation prompt works in a demo but fails on real logs.
- **Check question:** What's the best first step?
  - Make the prompt longer
  - **Build a test set of 10 real (sanitised) logs with expected summaries and run the prompt on all of them**
  - Switch models

  Answer: 1.
- **Learn demo:** Measure: run the same prompt across 10 cases, score pass or fail by hand, change one variable, and re-run.
- **Build:**
  - 5 prompts, for example commit-message drafting, PR-description drafting, log triage, a JSON-only structured extractor, and an architecture diagram image explained (multimodal).
  - Each has 3 test inputs. A stretch goal is a small script that runs the test inputs.
- **Boss scenarios:**
  1. The extractor returns prose instead of JSON [2]
  2. The summary invents service names that aren't in the input [0]
  3. Commit messages don't follow team conventions; there are 3 examples [1]
  4. The output is sometimes 2,000 words [2]
  5. The model misreads internal acronyms [0]
  6. The classification label style varies [1]
- **Safety:** Test logs must have secrets and personal data removed.

## AI Builder, Enthusiast
- **Why it matters:** Better prompts mean better output from their agent. This is an emphasis level for them.
- **Briefing:** Their AI agent keeps building the wrong screens from one-line requests.
- **Check question:**
  - "Build my app"
  - **"Goal, users, 3 screens, must-never-happen rules, output: a plan first, then wait for approval"**
  - "Make it better"

  Answer: 1.
- **Learn demo:** Write a five-part build prompt for the Agent Lab, then ask for a plan only, before any code.
- **Build:** 5 prompts, for example an app-spec writer, onboarding copy in a brand voice (few-shot), a bug-report writer, a test-case generator, and a sketch photo turned into a screen description (multimodal).
- **Boss scenarios:**
  1. The agent builds a login they didn't want [2]
  2. Copy doesn't sound like the brand; there are 2 samples [1]
  3. The agent assumed web, but they want mobile [0]
  4. Bug reports miss the steps to reproduce [2]
  5. Feature ideas ignore the target user [0]
  6. Error messages vary in tone [1]

## Business Owner
- **Briefing:** AI replies to customers sound robotic and sometimes promise refunds the owner never offers.
- **Check question:**
  - "Reply to customer"
  - **"Role: my polite support assistant. Policy: no refunds, only replacement within 24 h. Reply in the customer's language, under 60 words, for me to approve."**
  - "Be nice"

  Answer: 1.
- **Learn demo:** Show the AI 2 of their own real replies (anonymised) as few-shot examples, and the drafts start to sound like them.
- **Build:** 5 prompts, for example complaint replies, a weekly menu post, supplier price-comparison notes, an FAQ answerer, and a photo of a handwritten order slip turned into a structured order (multimodal).
- **Boss scenarios:**
  1. The reply promises a refund against policy [2]
  2. Replies don't sound like the owner; there are 2 past replies [1]
  3. The AI doesn't know delivery areas [0]
  4. The menu post format changes every week [2]
  5. FAQ answers are wrong on timings [0]
  6. Festival offers should match last year's 2 successful posts [1]
- **Safety:** Order-slip photos must be cropped so they show no customer phone numbers.
