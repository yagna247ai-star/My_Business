# Level 2 — AI Problem Hunter · Persona Specs

| | |
|---|---|
| Code | `L02_PROBLEM_HUNTER` · Stage 1, AI Foundations · 140 XP |
| Topics | Identifying customer pain points · Problem discovery · Defining a niche · Understanding users · Validating problem statements · Creating a solution concept |
| Unlock | Level 1 approved |
| Status | Spec only; not yet seeded. It **closes the parent spec's §14 gap**: it includes PDF Activity 1 ("your niche and three project ideas") and Activity 2 ("your promise to yourself"). |

## Shared and protected
**Outcomes.** The learner can:
- find a real pain point
- define a niche
- interview 3 real users
- write a testable problem statement
- propose a solution concept with a clear AI part and non-AI part

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question, 3 options |
| 2 | Learn | 4 lessons: pain vs. wish · niche = who + where + which problem · interview without leading the person · the problem-statement formula. 5-question quiz, 60% to pass |
| 3 | Explore GitHub | A verified repo's README or issues page: find 3 real user complaints in open issues. 3 questions, 2 correct to pass |
| 4 | Build: Problem Validation Canvas | Fields:<br>`niche` ≥20 words<br>`pain` ≥40<br>`users` ≥30 (3 interviews summarised, no names)<br>`evidence` ≥40 (quotes, frequency, cost)<br>`statement` ≥25 ("[user] struggles to [task] because [cause], which costs [impact]")<br>`ideas` (3 project ideas, ≥15 words each)<br>`concept` ≥40 (the chosen idea, its AI part, its rules part, and its human part)<br>`promise` ≥20 (weekly hours, and what they will ship by Level 7) |
| 5 | Submit Proof | Link to the canvas; checklist: "3 real people interviewed", "no personal data", "I can name the evidence" |
| 6 | Evaluation and Boss | 6 scenarios; reason ≥6 words; 3 attempts |

**Boss choices:**
- 0 = Real, validated problem
- 1 = Assumption that needs evidence
- 2 = Solution looking for a problem

**Proposed rubric** (pass mark 3.0):

| Dimension | Weight |
|---|---|
| Pain and evidence | 0.25 |
| User understanding | 0.20 |
| Problem statement | 0.20 |
| Solution concept | 0.15 |
| Reflection and promise | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Why it matters:** Good projects start from a real problem, not from "let's use AI".
- **Briefing:** Students in a Class 9 group keep forgetting which homework is due. The class WhatsApp group is full of "what's the homework?" messages every evening.
- **Check question:** Which is a *real, validated* problem?
  - "AI would be cool for homework"
  - **"7 of the 10 classmates I asked missed a homework deadline this month because the notes were lost in chat"**
  - "Build a homework app"

  Answer: 1.
- **Learn demo:** Ask a friend "what's annoying about homework?" and write down their exact words. Then ask an AI to make three guesses about the problem and compare them with what the friend said. Real words beat AI guesses.
- **Build hints:**
  - Niche: "Class 9 students in my school who…".
  - Interviews: talk to classmates or family, with no names.
  - Promise: hours per week agreed with a guardian.
- **Boss scenarios:**
  1. "Everyone hates maths," with no one asked [1]
  2. 8 of 10 club members say they can't find past quiz answers [0]
  3. "Let's make an AI robot for the canteen" [2]
  4. The librarian says 30 books a month come back late, and she shows the register [0]
  5. "Kids probably want an AI game" [1]
  6. "An app that uses AI to do something with photos" [2]
- **Safety:** Interviews happen only with people they know, with a guardian or teacher aware. They record no personal details.

## Student & Career Starter
- **Why it matters:** "Found a real problem and validated it" is the strongest line on a fresher's resume.
- **Briefing:** Hostel students waste time every month splitting mess and electricity bills, and the disputes take days.
- **Check question:**
  - "Students might like a bill app"
  - **"5 of 6 hostel students said bill disputes took 2+ days last month"**
  - "Use blockchain for bills"

  Answer: 1.
- **Learn demo:** Write a leading question ("Wouldn't an app help?") and then a neutral one ("Tell me about the last time…"). An AI critiques both, and the learner sees why the neutral question gets true answers.
- **Build hints:** The niche is campus-specific. Look for evidence in screenshots of anonymised group chats (names blurred) or a short form with at least 10 answers. One of the 3 ideas should be portfolio-worthy by Level 7.
- **Boss scenarios:**
  1. A placement office log shows 40 repeat questions a week [0]
  2. "Recruiters would love an AI resume tool," with no recruiter asked [1]
  3. "An AI chatbot for our college, for everything" [2]
  4. 12 of 15 lab students say booking lab slots by email fails [0]
  5. "Students are lazy about attendance" [1]
  6. "A metaverse campus tour" [2]

## Engineering Professional
- **Why it matters:** Engineers often build what was asked for, not what is needed. Discovery cuts down AI projects that get wasted.
- **Briefing:** An internal "AI assistant for developers" was requested by leadership. Nobody has measured where developers actually lose time.
- **Check question:**
  - "Developers want AI"
  - **"Over 2 weeks of time-tracking with 8 engineers, 31% of their time went to finding which service owns an error"**
  - "Buy an AI tool licence for everyone"

  Answer: 1.
- **Learn demo:** Take 20 anonymised incident tickets, have AI cluster them into themes, and then hand-check 5. They see where the AI's grouping was wrong and why evidence must be traceable to the source tickets.
- **Build hints:**
  - Niche: a team or a workflow, such as on-call triage or onboarding.
  - Evidence: metrics (MTTR, PR cycle time, ticket counts), never confidential numbers in public.
  - Concept: say what is the LLM's job and what deterministic tooling handles.
- **Boss scenarios:**
  1. PR review wait is a median of 3.4 days in the repo analytics [0]
  2. "The CTO thinks we need agents" [1]
  3. "Add a vector database to the monolith" [2]
  4. On-call survey: 9 of 11 engineers say runbooks are outdated [0]
  5. "Developers will 10× with AI" [1]
  6. "Fine-tune a model for our logging" before any problem is defined [2]
- **Safety:** The public canvas contains no employer-confidential data.

## AI Builder, Enthusiast
- **Why it matters:** Their app needs a user who wants it before an AI agent builds it.
- **Briefing:** They want to "build an AI app" but have not picked whose problem it solves.
- **Check question:**
  - "An AI app for everyone"
  - **"Home bakers in my area lose 2–3 orders a week because they miss DMs; 4 of 5 bakers I asked said so"**
  - "An app using the newest model"

  Answer: 1.
- **Learn demo:** An AI suggests 10 niches. The learner removes those they can't reach or interview, then keeps the one where they know 3 real users.
- **Build hints:** The concept names the screens, the AI step and the rule-based steps (payments, slots). The promise says what they will ship by Level 7.
- **Boss scenarios:**
  1. 4 tuition teachers say they spend Sunday making worksheets by hand [0]
  2. "People want an AI friend app" [1]
  3. "An app that uses AI image, voice and video at once" [2]
  4. A local gym logs 15 missed renewals a month [0]
  5. "Creators would pay for this" [1]
  6. "Wrap a chatbot and sell it" [2]

## Business Owner
- **Why it matters:** Pick one customer problem worth solving before spending on any tool. This is an emphasis level for them.
- **Briefing:** Their tiffin service loses customers after the first month, but they don't know why.
- **Check question:**
  - "Customers want AI"
  - **"Of 10 customers who left, 6 said the menu repeated too often"**
  - "Buy a chatbot subscription"

  Answer: 1.
- **Learn demo:** Paste 15 anonymised customer messages, have AI group the complaints, then check the groups against their own experience. They count which complaint costs the most money.
- **Build hints:**
  - Niche: their own customers or segment.
  - Pain: cost it in lost revenue or staff hours.
  - Ideas: 3 ideas, including at least one with no AI at all.
  - Promise: hours per week and one automation they will run by Level 6.
- **Boss scenarios:**
  1. The ledger shows 22% of orders are changed by phone [0]
  2. "My competitor uses AI, so I must" [1]
  3. "An AI app for all my business" [2]
  4. 9 of 12 regular customers ask for weekly menu notifications [0]
  5. "Young customers probably like Instagram" [1]
  6. "Buy an AI voice bot for calls" before checking call volume [2]
- **Safety:** Ask customers for consent before using their feedback, and keep the canvas anonymised.
