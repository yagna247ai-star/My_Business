# Level 1 — AI Explorer · Persona Specs

| | |
|---|---|
| Code | `L01_AI_EXPLORER` · Stage 1, AI Foundations · 120 XP |
| Topics | Introduction to AI · AI versus traditional software · Understanding generative AI · LLM fundamentals · Identifying real-world problems · AI tool exploration · First practical project |
| Unlock | Enrolment |
| Status | **Built and seeded.** This file describes the live content in `seed-v3.ts` (`L1` and `V`). The Agent Lab (PDF Activity 4) runs alongside this level and earns its own +40 XP. |

## Shared and protected (identical for every persona)

**Outcomes.** By the end, the learner can:
- explain generative AI and how an LLM generates text
- tell AI-suited tasks from tasks that suit rules
- improve an AI result over several prompt iterations
- spot errors and avoid sharing personal data

| # | Activity | Kind | XP | Protected rules |
|---|---|---|---|---|
| 1 | Mission Briefing | briefing | 5 | 1 check question, 3 options |
| 2 | Learn | learn | 18 | 4 lessons; a 5-question quiz with a 60% pass mark |
| 3 | Explore GitHub | explore | 10 | `microsoft/generative-ai-for-beginners` (MIT, verified); 3 questions, 2 correct to pass |
| 4 | Build: AI Explorer Brief | build | 35 | Fields: problem ≥40 words · user ≥15 · fit ≥30 · evaluation ≥25 · responsible ≥15. **3 prompt iterations**, each with prompt ≥10 words, output ≥15 words, change ≥10 words, and similarity ≤0.85 to the previous one |
| 5 | Submit Proof | proof | 5 | Note ≥50 words, a public link, and a 3-item checklist |
| 6 | Evaluation and Boss | boss | 47 (20 + 27) | Rubric `L01_AI_EXPLORER_RUBRIC`, pass mark 3.0; 3 attempts; 6 scenarios; each reason ≥6 words |

**Boss choices** (fixed order):
- 0 = Generative AI
- 1 = Rules-based software
- 2 = AI draft + human decision

**Rubric weights:**

| Dimension | Weight |
|---|---|
| Problem | 0.25 |
| Prompting | 0.25 |
| Evaluation | 0.20 |
| Responsible | 0.10 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder (`kid_hobbyist`)
- **Why it matters:** It shows what AI can and can't do before they rely on it for Python help. This is an emphasis level for them.
- **Briefing:** A school coding club runs a Python quiz every Friday. The captain writes 20 questions by hand, marks every sheet, and explains the hard ones again and again.
- **Check question:** Which job fits generative AI?
  - The options are: checking 7×8=56 · **writing 10 fun practice questions on Python lists for the captain to check** · counting attendance.
  - Answer: 1.
- **Learn demo:** "Ask AI to explain a Python error":
  1. Run `print(len(5))`.
  2. Paste only the error (never a name or school).
  3. Ask for "one hint, not the answer".
  4. Fix it yourself.
- **Build hints:**
  - Problem: a real problem at school, in a club or at home.
  - User: "a Class 8 student new to Python", with no real names.
  - Fit: does it need words or ideas (AI), or does it have one right answer (a Python program)?
  - Evaluation: did you test the AI's code?
- **Boss scenarios:**
  1. Add up 40 students' marks [1]
  2. Explain a for-loop using cricket [0/2]
  3. Check a password's rules [1]
  4. Five story ideas for the school magazine [0/2]
  5. Does a friend's bad cough need a doctor? [2]
  6. Sort club members by name [1]
- **Proof:** A Google Doc, Notion page or GitHub README of the brief. Under-18s share the link only with reviewers, never publicly, unless a guardian consents.
- **Agent Lab:** Kilo Code (free models) is ranked first. Paid agents are blocked until a guardian consents. The checklist says "guardian present, no card needed".
- **Safety:** They paste no names, school, photos or classmates' work. The coach uses school-level language.

## Student & Career Starter (`student`)
- **Why it matters:** The brief is the first piece of evidence an interviewer can read.
- **Briefing:** A college placement cell serves 600 final-year students. Two coordinators answer the same questions about resumes, eligibility and dates on WhatsApp and email.
- **Check question:**
  - The options are: CGPA cut-off check · **first-draft resume feedback for the coordinator to review** · listing interviews by date.
  - Answer: 1.
- **Learn demo:** "Three prompts, three answers". Write a resume summary three ways: bare, then with context and a limit, then with two options and their weaknesses.
- **Build hints:** A problem on campus or in an internship. Verify facts and code, and ask "what would an interviewer ask me to fix?"
- **Boss scenarios:**
  1. CGPA cut-off for 600 students [1]
  2. Personalised interview tips for a coordinator to review [2]
  3. Top 5 themes from 200 pieces of feedback [0/2]
  4. Roll-number format check [1]
  5. 10 aptitude questions with answers [0/2]
  6. Who gets the last internship seat [2]
- **Proof:** A public link, with a GitHub README preferred because it starts the portfolio.
- **Agent Lab:** Kilo Code and OpenCode are ranked first, so they can start without a paid plan.

## Engineering Professional (`software_pro`)
- **Why it matters:** It grounds intuition in how tokens are sampled and why outputs vary, which is the basis for trusting AI code later.
- **Briefing:** A 9-year-old Java billing service with thin tests, painful on-call shifts, and new joiners who take weeks to learn it.
- **Check question:**
  - The options are: tax per invoice line · **drafting unit tests for a legacy class, reviewed in a PR** · enforcing ticket IDs in commit messages.
  - Answer: 1.
- **Learn demo:** "Non-determinism you can measure":
  1. Send the same PIN-code validator prompt three times.
  2. Diff the outputs.
  3. Add constraints and five test cases.
  4. Run the tests. Treat the output as an unreviewed PR.
- **Build hints:**
  - Problem: cost it in hours or incidents.
  - Evaluation: review the output like a PR (correctness, edge cases, security, licence).
  - Responsible: what code or secrets must never be pasted?
- **Boss scenarios:**
  1. PR must pass the tests before merge [1]
  2. Release notes from 60 PRs [0/2]
  3. Summarise a 3,000-line incident log for on-call [2]
  4. Exact cloud bill per team [1]
  5. Refactoring options for a 900-line class [0/2]
  6. Approve a Friday-night production migration [2]
- **Proof:** A repository or document link.
- **Agent Lab:** Claude Code and Codex CLI are ranked first.
- **Safety:** They never paste employer code or secrets into a public tool. Employer AI policy comes first.

## AI Builder, Enthusiast (`ai_builder`)
- **Why it matters:** They need to know when to trust what an AI agent builds for them.
- **Briefing:** A yoga studio takes bookings by Instagram DM and copies them into a notebook, so double-bookings happen and reminders are forgotten.
- **Check question:**
  - The options are: preventing double-booking of the 7 am slot · **a friendly reminder in the studio's voice, for the owner to approve** · counting the classes left on a pass.
  - Answer: 1.
- **Learn demo:** "Vague idea to buildable request". Turn "Make me a booking app" into a request with the users, 3 screens and what must never happen, and ask the AI to list what it's unsure about.
- **Build hints:** Which parts need AI, which need app logic, and which stay with the user? What did the AI build that was wrong or unsafe, and how did you test it?
- **Boss scenarios:**
  1. Stop double-booking [1]
  2. Welcome and onboarding copy [0/2]
  3. Top 5 feature requests from 30 interviews [0/2]
  4. Price of a 10-class pass [1]
  5. Reply to an angry client about a cancelled class [2]
  6. Email field validation [1]
- **Agent Lab:** Claude Code is ranked first, then Kilo Code.

## Business Owner (`business_owner`)
- **Why it matters:** Learning to tell a useful AI tool from hype protects their money and their customers.
- **Briefing:** Their own tiffin service gets 200 WhatsApp messages a day in English, Hindi and Telugu, and they reply until midnight. This is the base content, framed as "you".
- **Check question:** The base check: GST maths · **polite reply to an upset customer, which you check** · sorting by delivery time. Answer: 1.
- **Learn demo:** "An AI draft you approve". Anonymise a complaint, ask for a reply in under 60 words, check the promises and tone, then send it yourself.
- **Build hints:**
  - Problem: cost it in hours or money.
  - User: one typical customer or staff member, with no names or numbers.
  - Evaluation: judge the AI like a new employee.
- **Boss scenarios:** The base set:
  1. GST on 500 invoices [1]
  2. Hindi and English complaint replies [2]
  3. Themes from 40 pages of feedback [0/2]
  4. Password rules [1]
  5. Bakery captions [0/2]
  6. Patient medicine dose [2]
- **Gap:** A boss set written for business owners is optional (see the parent spec, §14).
- **Agent Lab:** Claude Code is ranked first, then Kilo Code. Business owners pay for a plan themselves.
- **Safety:** They paste no customer phone numbers or addresses, and check whether their customers have agreed to AI being used on their messages.
