# Level 6 — AI Workflow Builder · Persona Specs

| | |
|---|---|
| Code | `L06_WORKFLOW_BUILDER` · Stage 2, AI Productivity & Creation · 180 XP |
| Topics | Workflow automation · n8n · Make · Zapier · APIs · Webhooks · Practical business automation |
| Unlock | Level 5 approved. Approval here is the prerequisite for the **AI Automation Engineer** track. |
| Status | Spec only. n8n, Make and Zapier are named by the curriculum. Their plans, free tiers, self-hosting licence terms and age limits are **not verified here**. |

## Shared and protected
**Outcomes.** The learner can:
- design an automation (trigger → steps → AI step → human approval → action)
- connect through an API or webhook
- handle errors
- log runs
- measure time saved

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 5 lessons: triggers and actions · APIs and webhooks (request, response, auth) · AI steps inside workflows · errors and retries · human approval and audit. Quiz at 60% |
| 3 | Explore GitHub | The verified repo of an open-source workflow tool in the library: identify its licence and how it handles credentials. 3 questions |
| 4 | Build: One Working Automation | Fields:<br>`design` (diagram, plus ≥40 words)<br>`trigger` and `api` (the endpoint or webhook used, **credentials stored in the tool's credential store, never in the steps**)<br>`aistep` (prompt and model output check)<br>`approval` (where a human approves before any external send)<br>`errors` ≥30 words (what happens on failure)<br>`runlog` (≥5 real or test runs, with personal data removed)<br>`impact` (minutes per week, before and after) |
| 5 | Submit Proof | The workflow export (with secrets removed), run-log screenshots and a ≤2-minute video |
| 6 | Evaluation and Boss | 6 automation situations |

**Boss choices:**
- 0 = Automate fully
- 1 = Automate with human approval
- 2 = Keep it manual

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Design | 0.20 |
| Working integration | 0.25 |
| Error handling | 0.15 |
| Human approval and safety | 0.15 |
| Measured impact | 0.05 |
| Reflection | 0.10 |
| Boss | 0.10 |

**The export is scanned** with the secret-key scan used in the Agent Lab. An export that contains a key is rejected.

---

## Young Coder
- **Briefing:** Their coding club wants a reminder sent to the club group the evening before each meeting, plus a summary of the week's Python tip.
- **Check question:** Where should the API key for the automation be kept?
  - In the message text
  - **In the tool's credential settings, never shared**
  - In a screenshot

  Answer: 1.
- **Learn demo:** A webhook that sends "hello" to a test channel. Show the request and the response.
- **Build:** A club reminder automation. The trigger is a schedule. The AI step writes the tip of the week. The approval is that the teacher or captain approves before posting. It posts to a **test** channel.
- **Boss scenarios:**
  1. Adding the date to a reminder [0]
  2. Posting an AI-written message to the whole school group [1]
  3. Auto-replying to strangers' DMs [2]
  4. Copying form answers to a sheet [0]
  5. An AI-written apology to a parent [1]
  6. Auto-messaging classmates' phone numbers taken from a list [2]
- **Safety:** Free or education plans only, with guardian consent. Contact data of other students isn't used, and no public posting happens without an adult's approval.

## Student & Career Starter
- **Briefing:** Track internship applications automatically. A new job email goes into a sheet with an AI summary and a follow-up reminder.
- **Check question:** The automation fails when an email has no subject. Good error handling is:
  - Ignore it
  - **Catch the error, log it, and route it for manual review**
  - Turn off the automation

  Answer: 1.
- **Learn demo:** Call a public API with no key, and parse the JSON response into a sheet.
- **Build:** An application tracker:
  - trigger: an email label or a form
  - AI step: summarise the job description and extract the role and deadline
  - approval: the student approves the follow-up draft
  - run log: ≥5 runs
- **Boss scenarios:**
  1. Logging new applications to a sheet [0]
  2. Sending follow-up emails to recruiters [1]
  3. Auto-applying to 200 jobs with AI cover letters [2]
  4. A daily job digest to themselves [0]
  5. A LinkedIn message drafted by AI [1]
  6. Scraping recruiters' personal emails [2]

## Engineering Professional
- **Briefing:** On-call engineers get alert noise. They want alerts summarised and routed, and an incident channel opened with context.
- **Check question:** A webhook receiver should first:
  - Process the payload
  - **Verify the signature or secret, then validate the payload schema**
  - Reply 200

  Answer: 1.
- **Learn demo:** A signed webhook with retries, plus an idempotency key, so a retried delivery doesn't create duplicate tickets.
- **Build:** Alert triage:
  - trigger: a monitoring webhook (test payloads)
  - AI step: summarise the alert and suggest an owner
  - approval: the on-call engineer confirms before a page or ticket goes out
  - errors: dead-letter queue, retries
  - run log: ≥5 runs
  - a stretch goal is self-hosting, after checking the licence
- **Boss scenarios:**
  1. Tagging tickets from structured fields [0]
  2. Auto-restarting a production service on an AI suggestion [1]
  3. Auto-deleting customer data on an AI decision [2]
  4. Posting the CI status to chat [0]
  5. An AI-drafted customer incident notice [1]
  6. Giving the workflow tool admin credentials to production with no audit [2]
- **Safety:** Use employer-approved tools only, least-privilege tokens, and no production data in tests.

## AI Builder, Enthusiast
- **Why it matters:** They automate the boring parts of what they build. This is an emphasis level for them.
- **Briefing:** Their Level 2 idea needs a back office: a new sign-up gets a welcome email, a CRM row and a team alert.
- **Check question:** Before an AI-written welcome email goes to real users, they should:
  - Send it right away
  - **Test with their own address, then add approval or a fixed template for the first sends**
  - Skip testing

  Answer: 1.
- **Learn demo:** A form webhook leads to an AI personalised welcome draft, then a review queue, then a send.
- **Build:** An onboarding automation with ≥5 test runs, error handling, and measured impact.
- **Boss scenarios:**
  1. Adding sign-ups to a sheet [0]
  2. AI-personalised emails to users [1]
  3. AI deciding refunds automatically [2]
  4. A Slack or chat alert for a new sign-up [0]
  5. AI replies to support tickets [1]
  6. Buying an email list and auto-emailing it [2]

## Business Owner
- **Why it matters:** Automations save staff hours. This is an emphasis level for them.
- **Briefing:** A WhatsApp or website order should go to an order sheet, then a kitchen list, then an AI-drafted confirmation that the owner approves.
- **Check question:** Which step should keep a human approval?
  - Adding the order to a sheet
  - **Sending a reply about a delayed delivery or a refund**
  - Counting orders

  Answer: 1.
- **Learn demo:** A form leads to a sheet, then an AI summary of today's orders, then a morning message to the owner only.
- **Build:** A real order or enquiry workflow from their business:
  - AI step: classify enquiries and draft a reply
  - approval: the owner approves before it's sent
  - run log: ≥5 runs
  - impact: hours saved per week
- **Boss scenarios:**
  1. Daily sales total to the owner [0]
  2. AI replies to customer complaints [1]
  3. AI changing prices automatically [2]
  4. A supplier reorder list from stock levels [0]
  5. A payment reminder message [1]
  6. Messaging customers who never opted in [2]
- **Safety:** Get customer consent before messaging. Follow the messaging platform's business-messaging policy, which staff check per cohort.
