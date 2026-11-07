# Level 7 — AI App Builder · Persona Specs

| | |
|---|---|
| Code | `L07_APP_BUILDER` · Stage 3, AI Application Development · 200 XP |
| Topics | AI application architecture · No-code and low-code development · Lovable · Bolt · Replit · AI coding assistants · Deployment fundamentals |
| Unlock | Level 6 approved. Levels 7 and 8 are the prerequisite for the **AI Application Developer** track. |
| Status | Spec only. Lovable, Bolt and Replit are named by the curriculum; their plans and age terms are **not verified here**. The "AI coding assistants" are the four agents set up in the Agent Lab (verified 2026-11-04). |

## Shared and protected
**Outcomes.** The learner can:
- describe an AI app's architecture (front end · back end · AI call · data · auth)
- build it with a no-code, low-code or AI coding tool
- keep secrets on the server
- deploy it
- test it against a checklist

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 5 lessons: the architecture of an AI app · where the API key lives (server only) · no-code vs. low-code vs. agent · deployment basics (environments, environment variables, URL) · testing and handover. Quiz at 60% |
| 3 | Explore GitHub | A verified starter repo from the library: find where the app reads environment variables and how it deploys. 3 questions |
| 4 | Build: Deployed AI App | Fields:<br>`architecture` (diagram, plus ≥50 words)<br>`build_log` (≥3 key prompts or agent sessions, and what they had to fix by hand, ≥40 words)<br>`url` (a live deployment)<br>`tests` (a checklist of ≥8 cases with pass or fail, including 1 abuse case)<br>`secrets` (proof that the key isn't exposed in the browser: a screenshot of the network tab, or the server-side code)<br>`limits` ≥30 words |
| 5 | Submit Proof | Live URL, a ≤2-minute demo video, and the repo or project link |
| 6 | Evaluation and Boss | 6 build decisions |

**Boss choices:**
- 0 = No-code or low-code builder
- 1 = An AI coding agent on real code
- 2 = Don't build: use an existing tool

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Architecture | 0.15 |
| Working deployment | 0.25 |
| Testing | 0.20 |
| Security (secrets, abuse) | 0.15 |
| Build-log honesty | 0.05 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Briefing:** Build a "Python quiz buddy" web app for the coding club. It asks a question, checks the answer, and gives an AI hint.
- **Check question:** Where should the AI API key go?
  - In the web page code
  - **On the server, or in the tool's secret settings, so visitors can't see it**
  - In the README

  Answer: 1.
- **Learn demo:** Build a one-screen app with a low-code tool or Kilo Code, then show the browser's network tab with no key visible.
- **Build:**
  - The quiz buddy, where answers are checked by code and hints come from AI.
  - The deployment is **private or unlisted** unless a guardian consents to a public link.
  - Tests include "a user types a rude message".
- **Boss scenarios:**
  1. A 1-page quiz with fixed questions [0]
  2. A Python game with custom logic [1]
  3. A class poll [2]
  4. A hint bot needing a server [0]
  5. Changing their own Python repo [1]
  6. A shared calendar [2]
- **Safety:** No accounts that ask for an age they don't meet. No collecting other students' data. Use free models through Kilo or guardian-approved plans.

## Student & Career Starter
- **Why it matters:** They ship something they can show in an interview. This is an emphasis level for them.
- **Briefing:** A placement-prep app: paste a job description, get tailored interview questions, and track practice.
- **Check question:** The demo works locally but fails after deploying. What's the first thing to check?
  - Rewrite the app
  - **Environment variables and the deployment logs**
  - Change the model

  Answer: 1.
- **Learn demo:** Generate the app with a builder, export it to GitHub, deploy it, and fix one bug with an AI coding agent.
- **Build:** The placement-prep app with sign-in, saved history, ≥8 tests, a live URL, and a public README for the portfolio.
- **Boss scenarios:**
  1. A landing page and waitlist [0]
  2. Custom scoring logic with tests [1]
  3. A shared notes doc for the study group [2]
  4. An MVP for a hackathon in 4 hours [0]
  5. Adding a feature to their existing repo [1]
  6. A group expense split (a common need already met by existing apps) [2]

## Engineering Professional
- **Briefing:** Prototype an internal "ask the runbook" tool for a demo in 3 days. Then judge whether a no-code prototype can go to production.
- **Check question:** A generated app stores user tokens in `localStorage` and calls the model straight from the browser. What should happen?
  - Ship the demo
  - **Move the model call to a server route, store sessions in httpOnly cookies, and add rate limits**
  - Add a disclaimer

  Answer: 1.
- **Learn demo:** Scaffold the app with Claude Code or Codex, then review the diff like a senior engineer, looking at auth, input validation and error paths.
- **Build:**
  - A prototype with a real architecture diagram, a server-side AI call, rate limiting, ≥8 tests (including a prompt-injection case), and a deployment to a sandbox environment.
  - `limits` lists what's needed for production.
- **Boss scenarios:**
  1. A clickable prototype for a stakeholder [0]
  2. A feature in an existing service repo [1]
  3. A team wiki search (existing tools exist) [2]
  4. An internal form app [0]
  5. A complex integration with company SSO [1]
  6. A ticketing system [2]
- **Safety:** Use synthetic or approved data, not real production data.

## AI Builder, Enthusiast
- **Why it matters:** This is where their idea becomes a deployed app. It's an emphasis level for them.
- **Briefing:** Build the Level 2 idea for real. The yoga-studio-style booking app is the default example.
- **Check question:** The AI agent says "done", but a booking for an already-taken slot still goes through. What should they do?
  - Trust the agent
  - **Write that test case, show the failure to the agent, and re-test after the fix**
  - Hide the button

  Answer: 1.
- **Learn demo:** Write a spec, get the agent's plan, build screen by screen, then run a test checklist after each screen.
- **Build:** The full app: auth, data, the AI feature, ≥8 tests including double-booking and abuse, a live URL, and a 2-minute demo.
- **Boss scenarios:**
  1. An MVP to test demand [0]
  2. Custom booking rules beyond the builder's limits [1]
  3. A simple contact form [2]
  4. A marketing site [0]
  5. Fixing a bug in the exported code [1]
  6. Invoicing (existing tools exist) [2]

## Business Owner
- **Briefing:** A simple order or enquiry app for their business, connected to the Level 6 automation.
- **Check question:** A builder platform offers to "store customer payments yourself". The safest choice is:
  - Store card numbers in the app
  - **Use an established payment provider and never store card data**
  - Collect cash only

  Answer: 1.
- **Learn demo:** Build an order form app with a builder that connects to the Level 6 sheet. Test it on a phone.
- **Build:** An app for a real business process (orders, bookings, catalogue) with ≥8 tests, a live URL, and a measured adoption plan (e.g. 5 customers try it).
- **Boss scenarios:**
  1. A catalogue page [0]
  2. A custom loyalty-points rule engine [1]
  3. Accounting software [2]
  4. A booking form [0]
  5. An integration with their existing POS through its API [1]
  6. A payment gateway built from scratch [2]
- **Safety:** Write a privacy notice for the customer data collected. Legal must review it before launch (see `PENDING_LEGAL.md`).
