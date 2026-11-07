# Level 13 — AI Engineer · Persona Specs

| | |
|---|---|
| Code | `L13_AI_ENGINEER` · Stage 5, Open Source & Engineering · 320 XP |
| Topics | Model selection · Model evaluation · Fine-tuning concepts · Production AI systems · Monitoring · Reliability · Cost optimisation · Security and responsible AI |
| Unlock | Level 12 approved. Prerequisite for the Solutions Architect (Levels 10 and 13), QA & Evaluation (Levels 8 and 13) and Generative AI Engineer (Levels 9 and 13) tracks. |
| Status | Spec only. Model prices and limits change, so learners cite the provider's pricing page **with the date**. This spec doesn't state prices. |

## Shared and protected
**Outcomes.** The learner can:
- choose a model using an eval rather than reputation
- compare ≥2 models on the same golden set
- explain when fine-tuning is (rarely) justified compared with prompting or RAG
- design monitoring, fallbacks and cost controls
- write a responsible-AI risk register

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 6 lessons: model selection criteria (quality, latency, cost, privacy, licence) · golden sets and evaluation · fine-tuning vs. prompting vs. RAG · production patterns (timeouts, retries, fallbacks, caching) · monitoring and cost · security and responsible AI (injection, data leaks, bias). Quiz at 60% |
| 3 | Explore GitHub | An evaluation framework repo from the verified library: find how a test case is defined. 3 questions |
| 4 | Build: Production Readiness Review | Applied to one of their own earlier builds (Level 7, 9, 10 or 11). Fields:<br>`golden_set` (≥20 cases with expected results)<br>`model_comparison` (≥2 models: quality score, p50 latency, cost per 1k requests with a dated source)<br>`decision` ≥40 words<br>`finetune` ≥30 words (whether fine-tuning is justified, and why)<br>`monitoring` (≥4 metrics and alert thresholds)<br>`reliability` (timeouts, fallback, rate limits)<br>`risk_register` (≥5 risks, each with likelihood, impact, mitigation and owner) |
| 5 | Submit Proof | Repo or document link, with eval output attached |
| 6 | Evaluation and Boss | 6 launch decisions |

**Boss choices:**
- 0 = Ship
- 1 = Ship behind a guardrail, monitoring or a limited rollout
- 2 = Don't ship yet

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Evaluation rigour | 0.25 |
| Model decision | 0.15 |
| Reliability and monitoring | 0.15 |
| Cost analysis | 0.10 |
| Risk register | 0.15 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Briefing:** Make their Level 8 or 9 study buddy reliable. Compare 2 free or guardian-approved models on 20 quiz questions.
- **Check question:** Model A is "famous" but scores 12/20, and model B scores 17/20. They choose:
  - A
  - **B, because their own test shows it works better for this job**
  - Whichever is newer

  Answer: 1.
- **Learn demo:** A golden set in a spreadsheet: question, expected answer, model A ✓/✗, model B ✓/✗.
- **Build:**
  - A review of their own app with ≥20 cases and 2 models.
  - Cost is shown as "free tier limit used", with a dated source.
  - Monitoring: a simple log of wrong answers.
  - A risk register in kid-friendly words, with ≥5 items (e.g. "it gives a wrong answer and I copy it").
- **Boss scenarios:**
  1. 19/20 correct, used by them only [0]
  2. 15/20, shared with the club [1]
  3. It sometimes gives unsafe advice [2]
  4. Answers are slow but correct [0]
  5. It sometimes ignores the "hint only" rule [1]
  6. It collects classmates' names [2]
- **Safety:** No paid usage without a guardian.

## Student & Career Starter
- **Briefing:** Turn the placement-prep app (Level 7) into an "interview-ready" production story.
- **Check question:** Should they fine-tune a model so the app writes better resume bullets?
  - Yes, always
  - **Only if prompting and few-shot fail on a measured golden set, and they have enough good examples they're allowed to use**
  - Never

  Answer: 1.
- **Learn demo:** A golden set of 20 bullets scored by rubric for 2 models, with cost per 1k requests from the pricing pages (dated).
- **Build:** A full review with ≥20 cases, 2 models, monitoring, a fallback, and a risk register. It's written as a case study for interviews.
- **Boss scenarios:**
  1. 90% pass, low cost [0]
  2. 80% pass, new feature [1]
  3. Leaks other users' resumes [2]
  4. p95 latency of 9 seconds [1]
  5. Stable after a week of monitoring [0]
  6. Biased against certain college names [2]

## Engineering Professional
- **Why it matters:** Evaluation, cost and reliability in production. This is an emphasis level for them.
- **Briefing:** Leadership wants the Level 10 triage agent in production next sprint.
- **Check question:** A cheaper model scores 2 points lower on the golden set. The decision depends on:
  - Price only
  - **Whether the quality drop matters on the high-stakes cases, plus routing options (cheap model first, escalating to a stronger one)**
  - The vendor's marketing

  Answer: 1.
- **Learn demo:** Run an eval harness across ≥2 models with ≥20 cases, slice the results by case type, then add a regression check to CI.
- **Build:**
  - A full review of ≥20 cases (a stretch goal is ≥100): model routing, SLOs, alert thresholds, a fallback, caching and a cost model.
  - A fine-tuning analysis with data requirements.
  - A risk register mapped to OWASP-style LLM risk categories, which the learner cites from the source.
- **Boss scenarios:**
  1. Meets its SLOs, and eval is stable for 2 weeks [0]
  2. A new model version with +3% eval [1]
  3. A prompt-injection test passes 6/10 [2]
  4. Cost 40% over budget but quality good [1]
  5. A canary at 5% traffic is healthy [0]
  6. PII appears in the logs [2]

## AI Builder, Enthusiast
- **Briefing:** Their app has real users now. What happens when the AI provider has an outage or a price change?
- **Check question:** The provider has an outage. A good app:
  - Crashes
  - **Shows a friendly message, retries with backoff, and can fall back to another model or a non-AI path**
  - Says nothing

  Answer: 1.
- **Learn demo:** Simulate an outage with a forced timeout, and watch the fallback and the user message.
- **Build:** A review with ≥20 cases from real or test usage, 2 models, monitoring (errors, cost per day, a feedback thumbs-down rate), and a risk register.
- **Boss scenarios:**
  1. Good results, low usage [0]
  2. A new AI feature for all users [1]
  3. It answers medical questions confidently [2]
  4. Costs climbing 20% a week [1]
  5. A stable, monitored feature [0]
  6. Stores users' chats without telling them [2]

## Business Owner
- **Briefing:** Decide whether their AI FAQ assistant (Level 9) and automations (Level 6) are safe to run unsupervised for a month.
- **Check question:** Which number tells them most about whether the assistant is good?
  - How many messages it sent
  - **The percentage of real questions answered correctly, checked weekly on a sample**
  - Server uptime

  Answer: 1.
- **Learn demo:** Take 20 real past questions, run 2 models, and score them yes or no in a sheet. Add the monthly cost from the pricing pages (dated).
- **Build:**
  - A review in plain business language: ≥20 cases, 2 models, the cost per month, what's monitored weekly, a fallback ("forward to me"), and a risk register.
  - The same bar applies; a mentor may help with tooling.
- **Boss scenarios:**
  1. 19/20 correct, and the owner reviews weekly [0]
  2. A new offer-announcement bot [1]
  3. It promised a refund policy that doesn't exist [2]
  4. Cost doubled after a festival [1]
  5. A stable reorder-draft workflow [0]
  6. Shares customer numbers with a third-party tool with no agreement in place [2]
