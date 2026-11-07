# Level 14 — AI Career Specialist · Persona Specs

| | |
|---|---|
| Code | `L14_CAREER_SPECIALIST` · Stage 6, Career & Industry Readiness · 340 XP |
| Topics | Select one specialisation · Complete its practical challenges |
| Unlock | Level 13 approved, **and** the chosen track's own prerequisite (seed `TRACKS.prereq`) |
| Status | Spec only. The track definitions (competencies, capstone, portfolio) are seeded in `TRACKS` and quoted here exactly. |

## Shared and protected
**Outcomes.** The learner chooses one of the 8 specialisations, meets its competencies through 2 practical challenges, and produces that track's capstone and portfolio exactly as the seed defines them.

| Track | Prerequisite | Capstone (seed) | Portfolio (seed) |
|---|---|---|---|
| AI Application Developer | Levels 7–8 | A deployed AI app with auth, data and monitoring | Public repo + live URL + 2-minute demo video |
| AI Automation Engineer | Level 6 | Three production automations for a real small business | Workflow exports + run logs + before/after metrics |
| AI Agent Developer | Levels 10–11 | A tool-using agent with an evaluation harness and approval gates | Repo + eval report + safety notes |
| Generative AI Engineer | Levels 9 and 13 | A RAG system with measured retrieval quality and a cost report | Repo + evaluation report |
| AI Product Manager | Levels 2–4 | A validated AI product spec with prototype and user tests | PRD + prototype link + user research summary |
| AI Data Analyst | Level 4 | An analysis of a real public dataset with AI-assisted insights, verified | Notebook or dashboard + methodology note |
| AI Solutions Architect | Levels 10 and 13 | An architecture and ROI proposal for a real organisation | Architecture diagrams + proposal + risk register |
| AI Quality & Evaluation Engineer | Levels 8 and 13 | An evaluation suite with golden sets and a regression dashboard | Eval repo + findings report |

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | Track choice, with the recommended track shown and changeable |
| 2 | Learn | The track's competency lessons. Quiz at 60% |
| 3 | Explore GitHub | 1 verified reference repo per track from the library |
| 4 | Build | **2 practical challenges** (intermediate pathway) **plus the capstone**, all to the track's portfolio definition |
| 5 | Submit Proof | The portfolio items from the table above |
| 6 | Evaluation and Boss | Track-specific panel review: 6 scenario questions defended in writing, and a rubric review by a human from that track (mentor or instructor) |

**Proposed rubric** (the same for every track):

| Dimension | Weight |
|---|---|
| Competency coverage | 0.25 |
| Capstone quality | 0.30 |
| Portfolio completeness | 0.15 |
| Real-user evidence | 0.10 |
| Reflection | 0.10 |
| Panel defence | 0.10 |

---

## Young Coder
- **Recommended track:** AI Application Developer (`TRACK_BY`).
- **Briefing:** Build the best version of their coding project for a school showcase or coding fair.
- **Challenges:**
  1. Add sign-in, or simple data storage, to the quiz buddy.
  2. Add monitoring (an error log and usage count).
- **Capstone:** A deployed app with auth, data and monitoring. Deployment is private or unlisted unless a guardian consents. A demo video with no face is fine.
- **Panel scenarios** are school-level, e.g. "A user enters a rude name. What does your app do?"
- **Note:** The bar is the same as for adult App Developers. Only the context and the privacy defaults differ.

## Student & Career Starter
- **Recommended track:** App Developer, or **AI Product Manager** if they don't code.
- **Briefing:** A portfolio piece that matches the job they're applying for.
- **Challenges (App Developer):**
  1. A paid-API feature with cost limits.
  2. CI with tests.
- **Challenges (Product Manager):**
  1. 5 user interviews and a synthesis.
  2. A prototype usability test with 3 users.
- **Capstone:** As the seed defines it. The README links to the job roles it targets.
- **Panel scenarios:** Interview-style, e.g. "Your metric went down after launch. What do you do?"

## Engineering Professional
- **Recommended track:** **AI Agent Developer**, or **AI Solutions Architect** for architects. Generative AI Engineer and QA & Evaluation Engineer are also strong fits.
- **Briefing:** A capstone they could present at work, made with sanitised or synthetic data.
- **Challenges (Agent Developer):**
  1. Add an eval harness to CI.
  2. A red-team pass with fixes.
- **Challenges (Solutions Architect):**
  1. Vendor comparison matrix.
  2. A security and compliance mapping for a target organisation.
- **Capstone:** As the seed defines it. The Architect version includes an ROI model with stated assumptions (no invented numbers).
- **Panel scenarios:** Design reviews, e.g. "The agent exceeded budget 3× in a day. Walk us through your controls."

## AI Builder, Enthusiast
- **Recommended track:** App Developer, or **AI Automation Engineer** when the goal is automation.
- **Briefing:** Turn the Level 7 product into something with real users.
- **Challenges (Automation Engineer):**
  1. Error handling and an alerting run book.
  2. Measured before-and-after time saving at a real small business.
- **Capstone:** As the seed defines it. For Automation, that means 3 production automations for a real small business, **with the owner's written consent** to share the metrics.
- **Panel scenarios:** "A webhook floods you with 10k events. What happens?"

## Business Owner
- **Recommended track:** **AI Automation Engineer**, or **AI Product Manager** when starting an AI business.
- **Briefing:** Make AI run part of their business, or validate the AI service they want to sell.
- **Challenges (Automation):**
  1. A third automation added to the Level 6 and Level 11 ones.
  2. A month of run logs and impact.
- **Challenges (Product Manager):**
  1. 5 customer interviews.
  2. Pricing tested with 3 prospects.
- **Capstone:** As the seed defines it. For Automation, their own business counts as "a real small business".
- **Panel scenarios:** Business framing, e.g. "Your automation sent a wrong price to 50 customers. What's your recovery plan?"
