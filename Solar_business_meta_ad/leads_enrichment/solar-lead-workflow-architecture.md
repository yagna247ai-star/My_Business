# Solar Lead Workflow Architecture — Lead-Gen → Lead-Management → Automation (Hermes)

**System:** Full lead pipeline for the same-day Telugu lead-response service (AP/TS)
**Builds on:** [solar-lead-followup-playbook.md](solar-lead-followup-playbook.md) — pricing, offer, 7-day test, scripts live there; this document is the *system* that runs it.
**Status:** Decision-ready. Phased rollout: manual → assisted → semi-auto → autonomous. **Do not automate before the playbook pass-gate clears.**

---

## 1. Executive Summary + System Diagram

**What this system is:** every homeowner enquiry — from any channel — lands in one inbox, is answered in Telugu within minutes, qualified, scored, booked into a survey or parked in a nurture sequence, and handed to the human installer at exactly 4 moments. The Hermes agent does the talking; n8n does the routing; a per-installer fact sheet does the guarding; humans own the money decisions.

**Text flow (system diagram):**

```
Meta CTWA / Google wa.me / IndiaMART API / portal SMS / referral link
        ↓  (all paths land in WhatsApp or webhook)
n8n webhook  ──────────────►  26-col Sheet / Zoho CRM row (auto)
        ↓
Hermes Agent (Gemini 3 Flash, fact-sheet guardrails, Telugu+EN)
        ↓
   auto-reply (≤5 min median / ≤60 min hard)  +  qualification (5 Qs)
        ↓
   score → Hot/Warm/Cold
        ↓
   Survey booking (owner confirm) → reminder → done (≤48h) → quote (≤72h)
        ↓
   nurture day 1/3/7/14 for not-ready            won → referral ask
        ↓
HUMANS AT 4 MOMENTS ONLY: hot-lead callback · survey · quote creation · negotiation beyond threshold
EVERY STATE HAS A TIMEOUT BRANCH — nothing sits forever (24h no-reply → nurture; 30-day → lost)
```

**Design principles:**
1. **One inbox** — every channel funnels into the same responder; no lead depends on which door it walked through.
2. **Fast first, smart second** — SLA (≤5 min median) beats sophistication; a wrong-but-fast answer is forbidden (fact-sheet guardrails), a slow answer is a lost deal.
3. **Humans only where money moves** — callback, survey, quote, negotiation. Everything else is the agent's job.
4. **Automate in stages** — each phase must earn the next via the pass gate.

---

## 2. Stack Decisions

### 2.1 WhatsApp route — decision table

| Route | What it is | Cost | Verdict |
|---|---|---|---|
| **Official WhatsApp Cloud API via BSP** | Interakt (₹2,799–3,799/mo, est.), AiSensy (from ₹1,500/mo + ~₹1.09/msg, est.), 360dialog (quote at build time) | Service replies **free inside the 24h window UNTIL 1 Oct 2026**; after that, conversation pricing applies — re-model at that milestone | **✅ COMMERCIAL ROUTE — one WABA per installer client** |
| **Click-to-WhatsApp ads (Meta)** | Opens a **72-hour free response window** per ad lead; instant-reply flow costs **₹0 in Meta fees per ad lead** | Free window | ✅ Use for all Meta lead-gen |
| **Baileys (Hermes default bridge)** | Unofficial; emulates WhatsApp Web | Free | ❌ **Ban risk — NOT for commercial use.** Dev/experiments only, never a client account |
| **Free WhatsApp Business app** | Manual, single device | Free | ⚠️ Phase 0 only (manual test) — not a system |

### 2.2 Hermes integration pattern

- Hermes Agent = **Nous Research open-source (MIT), self-hosted**: persistent memory, auto-built skills, 60+ tools, MCP support, scheduled automations, **OpenAI-compatible API server** (`POST /v1/chat/completions`, bearer auth).
- **No official n8n node exists.** Connect two ways:
  1. **n8n HTTP Request node → Hermes API server** (recommended — simple, stable).
  2. **n8n MCP server** → Hermes via MCP (for tool-rich flows later).
- **Domain caveat:** official docs are at **hermes-agent.nousresearch.com**. hermes-agent.org is a **third-party site — do not cite or install from it.**

### 2.3 Model choice (Telugu + English via OpenRouter)

| Model | Cost | Why |
|---|---|---|
| **google/gemini-3-flash-preview** | **$0.50 / $3.00 per 1M tokens** (input/output, est.) | **Primary** — strongest documented Telugu, cheap enough for per-message use |
| **qwen/qwen3-32b** | Low | Fallback for high-volume/low-stakes replies |
| DeepSeek | — | ❌ **Avoid — weak Telugu** |

### 2.4 CRM path (scale as you grow)

1. **Sheets-first (MVP)** — the playbook's 26-column tracking sheet (extended to 36 columns, Section 4.3). Zero cost, zero setup.
2. **Zoho CRM** — free org per client; **Standard ≈ ₹1,170/user/mo (est.)**; **native WhatsApp Business API integration** — move here when per-client pipeline volume justifies it.
3. **EspoCRM** — only if a client requires on-prem hosting.

### 2.5 Lead ingestion hooks

- **IndiaMART Leads API (Push/Pull)** — cleanest real-time lead hook; wire first.
- **Meta click-to-WhatsApp** — lands in WhatsApp directly; free 72h window.
- **Google Search wa.me deep link** — pre-filled message text → responder.
- **PM Surya Ghar portal** — leads arrive as **SMS/email only (no API)** → manual capture flag → responder follows up next day.

### 2.6 Cost envelope (per installer client, est.)

| Item | Est. monthly |
|---|---|
| BSP (Interakt / AiSensy) | ₹1,500–3,799 |
| Model (gemini-3-flash-preview usage) | Small at pilot volume (per-token pricing above) |
| CRM (Zoho Standard, when scaled) | ≈₹1,170/user (est.) |
| **Stack total at pilot scale** | **≈ ₹3,000–8,000 (est.)** — comfortably under the ₹15,000 retainer floor |

**Post-1-Oct-2026:** the 24h free service-reply window ends. Conversation-based WhatsApp pricing arrives — re-model cost per conversation at that milestone **before** scaling beyond pilots.

---

## 3. Lead-Gen Layer

### 3.1 Channel mix (CPLs are **estimates**)

| Channel | Role | Est. CPL | Telugu hook | Automation hook |
|---|---|---|---|---|
| **Meta click-to-WhatsApp** | Volume engine | ₹150–400 (est.) | "సోలార్ సబ్సిడీ ఎంత? మీ ఇంటికి **ఉచిత సర్వే + సబ్సిడీ లెక్క — తెలుగులో**. ఇప్పుడే వాట్సాప్ చేయండి 👇" | Ad → WhatsApp → n8n webhook → responder thread + tracking row (auto) |
| **Google Search** | Intent engine | ₹500–1,500 Tier-2 (est.) | "సోలార్ ఇన్స్టాలర్ మీ ఏరియాలో — 5kW ధర + ఉచిత సర్వే. సబ్సిడీ లెక్క ఫ్రీగా" | wa.me deep link w/ pre-filled text → responder (auto) |
| **IndiaMART / JustDial** | Trickle + trust | ₹200–600 (est.) | Listing: "ఉచిత సబ్సిడీ లెక్క + సైట్ సర్వే — 5 నిమిషాల్లో వాట్సాప్ రెస్పాన్స్" | Leads API (Push/Pull) → webhook → responder (auto) |
| **PM Surya Ghar presence** | Subsidy-trust | ₹0–100 (est., effort-based) | "సబ్సిడీ అప్లికేషన్ తర్వాత ఏం చేయాలి? ఉచిత సబ్సిడీ లెక్క + సర్వే" | SMS/email only → manual capture → responder next-day (semi-auto) |
| **Referrals** | Trust engine | ₹0–50 (est.) + ₹200/booked reward (est.) | "మీ ఫ్రెండ్కి సోలార్ అవసరమా? ఉచిత సర్వే + మీకు రిఫరల్ బోనస్" | Unique wa.me referral link per customer; code logs referrer, credits on booked survey (auto) |
| **Installer communities** | Client acquisition (B2B) | Time-based (est.) | "మీ ఎన్క్వైరీలు ఆలస్యంగా సమాధానం వల్ల పోతున్నాయా? 5 నిమిషాల్లో తెలుగులో రెస్పాన్స్" | Posts/DMs → click-to-WhatsApp → B2B CRM (auto log) |

**Mix logic:** Meta = volume, Google = intent, IndiaMART/JustDial = steady credibility, referrals = trust at near-zero cost, portal = subsidy-trust multiplier. Start Meta + referrals (cheapest); add Google once the responder proves 100% SLA. **Volume floor for pass gate: n≥15 leads in 7 days — Meta + referrals alone must clear it (est. assumption).**

### 3.2 Lead magnet — "Free Site Survey + Subsidy Calculation in Telugu"

> ఇంగ్లీషు అక్కర్లేదు. మీ సోలార్ సబ్సిడీ ఎంత — తెలుగులో ఫ్రీగా లెక్కిస్తాం. పైగా మీ ఇంటికి **ఉచిత సైట్ సర్వే**. 5 నిమిషాల్లో వాట్సాప్ రెస్పాన్స్. 👇
> *(EN: No English needed. We'll calculate your solar subsidy in Telugu — free. Plus a free site survey. WhatsApp response within 5 minutes.)*

**Mechanics:** ad/listing → click-to-WhatsApp → responder confirms in Telugu → 2 sizing questions (size + area) → sends personalized subsidy/savings estimate (template) → books survey into installer's slot → installer confirmed with customer contact. It converts a *pricing question* into a *booking action* without asking for commitment.

---

## 4. Lead-Management Layer

### 4.1 State machine (every state has a trigger → automation action → timeout branch)

| State | Trigger | Automation action | Timeout branch |
|---|---|---|---|
| **New** | Enquiry received (any channel) | Score lead; respond ≤5 min median; log row 1–36 | — |
| **Contacted** | First response sent | Run qualification script (5 Qs) | 24h no reply → **Nurturing** |
| **Qualified** | ≥2 answers given | Push survey booking; set book→done timer | 24h no booking → **Nurturing** |
| **Survey booked** | Booking confirmed (owner confirmed) | Reminder 24h before slot | Book→done **≤48h**; overdue → flag |
| **Survey done** | Survey completed | Create quote draft; set done→quote timer | Done→quote **≤72h**; overdue → flag |
| **Quoted** | Quote sent | Follow-ups day 1/3/7 | 30-day no reply → **Lost** |
| **Negotiating** | Counter >5% off **or** price <₹1L | **Human takes over** | 7-day silence → re-engage or **Lost** |
| **Won** | Deal closed | Referral ask + case-study permission | — |
| **Lost** | Explicit no / 30-day timeout | Log loss reason (col 35) | — |
| **Nurturing** | Not-ready / 24h no-reply | Day 1/3/7/14 sequence (Section 5.5) | 30-day no reactivation → **Lost** |

**SLA timers (hard):** first response ≤5 min median / 100% within 60 min · survey book→done ≤48h · survey done→quote ≤72h · 24h no-reply → nurture · 30-day loss timeout.

### 4.2 Lead scoring (0–100)

| Component | Weight | Scale (config) |
|---|---|---|
| Recency | 25 | 25 = <24h · 15 = 24–48h · 5 = 3–7d · 0 = >7d |
| Source quality | 20 | Google 20 · referral 18 · portal 16 · Meta 14 · IndiaMART/JustDial 12 · community 8 |
| Project size | 25 | 5kW+ = 25 · 3kW = 15 · unknown = 5 |
| Subsidy interest | 15 | Interested = 15 · unaware = 5 · not eligible = 0 |
| Response behaviour | 15 | Replies <5 min = 15 · <1h = 10 · <24h = 5 · none = 0 |

**Tiers:** **Hot ≥70** → human call ≤5 min · **Warm 40–69** → nurture + push to booking · **Cold <40** → nurture at low priority.

**Worked examples:**
- **Hot (100):** 5kW house, subsidy-interested, replied in 3 min, today, from Google → 25+20+25+15+15 = **100** → human call now.
- **Warm (≈57):** asked "3kW ధర?" yesterday via Meta, replied in 3h, unsure about subsidy → 15+14+15+5+8 = **57** → nurture + survey push.
- **Cold (≈18):** "just checking" 6 days ago, from a community post, never replied → 5+8+5+0+0 = **18** → park in nurture.

### 4.3 Sheet extension — columns 27–36 (one row per lead)

27 Lead score (0–100) · 28 Tier (Hot/Warm/Cold) · 29 Pipeline stage · 30 Nurture touch # · 31 Last touch timestamp · 32 SLA timer status (OK / At risk / Breached) · 33 Escalation flag + reason · 34 Automation events log · 35 Loss reason · 36 Next-action owner (AI/human). Columns 1–26 remain the playbook's tracking sheet.

---

## 5. Automation & Nurturing with Hermes

### 5.1 Qualification script (asked one at a time; ≥2 answers = qualified → booking; "just checking" → nurture)

| # | Telugu | English | Use |
|---|---|---|---|
| 1 | "మీ ఇంటికి ఎన్ని కిలోవాట్ సోలార్ అనుకుంటున్నారు — 3kW లేదా 5kW?" | "What size system — 3kW or 5kW?" | Sizing → score component |
| 2 | "ఇల్లు ఏ ఏరియాలో ఉంది?" | "Which area/city?" | Dispatch; **out of area = not a lead** |
| 3 | "PM Surya Ghar సబ్సిడీ గురించి తెలుసా? లెక్క పంపాలా?" | "Know the subsidy? Want the calculation?" | Buying trigger + score component |
| 4 | "ఎప్పుడు ఇన్స్టాల్ చేయించుకోవాలి — ఈ నెలలోనా, 3 నెలల్లోనా?" | "When — this month or within 3 months?" | Timeline → cadence |
| 5 | "ఇల్లు మీ సొంతమా? బడ్జెట్ ఏ రేంజ్?" | "Own property? Budget range?" | Subsidy eligibility + quote readiness |

**Booking CTA:** "సర్వే టీమ్ ఎప్పుడు పంపొచ్చు — శనివారం లేదా ఆదివారం ఉదయం?" / "When can the survey team come — Saturday or Sunday morning?"

### 5.2 Enquiry taxonomy — 11 types (handling by the agent)

| # | Type | Handling |
|---|---|---|
| 1–6 | Subsidy enquiry · price enquiry · basic specs/FAQ · survey availability · referral enquiry · greeting/thanks | **Auto-reply (guarded** — fact sheet only) |
| 7 | Survey booking request | **Book with owner confirm** |
| 8 | Complaints / service issues | **Escalate → human** |
| 9 | Money / contract / legal | **Escalate → human** |
| 10 | Hot lead (score ≥70) | **Priority — human call ≤5 min** |
| 11 | "Just checking" / not-ready | **Nurture track** |

### 5.3 FAQ bank + no-invention guardrails

- **12-answer FAQ bank** per installer (subsidy figures, price bands, financing, tariff, timeline, warranty, brands, process text, contacts) — derived **only** from the approved fact sheet.
- **Strict rule:** the agent may use figures **only** from the per-installer fact sheet. Anything absent → **fixed fallback**, never a guess:
  - తెలుగు: "మీ survey call లో exact numbers confirm చేస్తాం"
  - English: "We'll confirm the exact numbers on your survey call"
- **Red flags → human only, immediately:** complaints · money/contracts · safety · specs beyond the fact sheet · government paperwork status.

### 5.4 Per-installer fact sheet (template — one per client, owner-approved)

Subsidy figures · price bands (from installer's list) · financing options · tariff/savings numbers · timeline · warranty · brands carried · process text (what happens after booking) · contacts (installer, survey team) · **do-not-answer list** (topics the agent must never touch).

### 5.5 Nurturing cadence — 4 touches for not-ready leads (value → proof → soft CTA)

| Touch | Telugu (draft) | English (draft) |
|---|---|---|
| **Day 1** | "మీ ప్రశ్నకు ధన్యవాదాలు! మీ సబ్సిడీ లెక్క ఇక్కడ ఉంది: [link]. 3kW కి ~[₹X] సబ్సిడీ (సుమారు — fact sheet). సర్వే స్లాట్ ఫ్రీగా బుక్ చేసుకోవాలంటే 'అవును' అనండి." | "Thanks! Your subsidy estimate: [link]. ~₹X on a 3kW system. Reply 'yes' to book a free survey." |
| **Day 3** | "మా కస్టమర్ విజయవాడలో 5kW పెట్టించుకున్నారు — బిల్లు ₹[X] → ₹[Y] (fact sheet case). మీ దగ్గర కూడా చేద్దాం?" | "A Vijayawada customer's 5kW bill dropped ₹[X]→₹[Y]. Shall we do yours?" |
| **Day 7** | "సబ్సిడీ లాస్ట్ డేట్లు/ధరలు మారుతున్నాయి — మీ ఏరియాలో తాజా స్థితి: [update]. లెక్క + సర్వే ఇప్పటికీ ఫ్రీ." | "Subsidy deadlines/prices are shifting — latest for your area: [update]. Still free." |
| **Day 14** | "ఫైల్ మూసేద్దామా? 2 నిమిషాల్లో సర్వే స్లాట్ — ఏ నిబద్ధత లేదు. లేదా 2 నెలల తర్వాత చెక్ చేద్దాం?" | "Close your file? A survey books in 2 minutes — no commitment. Or check back in 2 months?" |

- **After booked survey:** confirmation → reminder 24h before → post-survey quote CTA within 48h.
- **After quote:** Day 1 questions · Day 3 savings re-send · Day 7 soft close + referral ask.
- **After "later":** park explicitly + one blocker question — "ధరనా, సమయమా, లేక సబ్సిడీ సందేహమా?" (price, timing, or subsidy doubt — answer exactly that next touch).

### 5.6 Handoff rules (agent → installer)

**Hand off within 5 min median / 60 min hard:** survey booking confirmed (slot + contact) · quote requests · complaints/refunds/service · negotiation · site-specific technical (roof, shading, grid/DISCOM) · anything the agent can't answer with confidence. **Escalation triggers:** 2 failed clarification attempts · negative sentiment · safety complaints · contract/legal · customer asks for "the owner/engineer". Every handoff logged (cols 33/34); **if handoff SLA slips below 100%, slow the agent — never let a fast AI answer bury a slow installer.**

---

## 6. Phasing (each phase earns the next)

| Phase | What runs | Tools | Gate to advance |
|---|---|---|---|
| **0 — Manual** | Human answers everything; test per playbook | WhatsApp Business app + 26-col sheet | **Playbook pass-gate: n≥15 leads, 100% SLA (≤60 min), ≥3/5 test targets** |
| **1 — Assisted** | n8n routes webhooks → Hermes **drafts** → human approves/sends | n8n + Hermes (draft mode) + sheet 27–36 | SLA holds for 1 week with drafting; red flags clean |
| **2 — Semi-auto** | Auto-reply with **approved templates** + bookings (owner confirm); red flags → human | BSP + WABA + Hermes auto-reply + Zoho (if scaled) | 100% SLA maintained; zero unguarded inventions |
| **3 — Autonomous** | Nurturing runs automated; humans at **4 moments only** (hot callback · survey · quote · negotiation) | Full stack + scheduled automations | WTP ≥50% + referral ≥20% hold across clients |

**Rule:** no phase skips. Automation is a reward for proven process, never a bet on unproven one.

---

## 7. Safety

- **Read / draft / act** — Phase 1 is read+draft (human approves); Phase 2 adds act on approved templates; Phase 3 adds autonomous nurturing. Never start at act.
- **Least freedom** — the agent gets the minimum: one WhatsApp line, one sheet tab, one calendar, fact-sheet-only answers. No tools beyond the response workflow.
- **Safe delivery map** — define exactly where output goes: WhatsApp replies to *incoming* enquiries only; no unsolicited messaging; survey bookings land with owner confirm; nothing posts publicly.
- **Maintenance** — weekly review of responses, SLA, red-flag handling, fact-sheet freshness; kill switch if SLA drops.
- **Meta framing** — Meta terms (Jan 2026) bar general-purpose AI chatbots: **frame the agent as customer-service assistance** for the installer's own business; use the 72h/24h windows; no broad autonomous campaigns.
- **No-invention guardrails** — the FAQ fallback (Section 5.3) is a hard rule: no figure outside the fact sheet, ever.
- **Kill switch** — one flag in n8n: pull all auto-replies to drafts instantly. Test the kill switch in Phase 1 before Phase 2.

---

## 8. Metrics

### 8.1 The 10 KPIs (formulas; thresholds = playbook test targets where set)

| # | KPI | Formula | Cadence |
|---|---|---|---|
| 1 | Median first-response time | MEDIAN(response_time_min) over leads | Daily |
| 2 | SLA attainment | Count(responded ≤60 min) / Count(all leads) × 100 | Daily |
| 3 | Qualification rate | Qualified / New × 100 | Weekly |
| 4 | Survey booking rate | Survey_booked / Qualified × 100 | Weekly |
| 5 | Survey completion | Survey_done / Survey_booked × 100 (timer ≤48h) | Weekly |
| 6 | Quote rate | Quoted / Survey_done × 100 (timer ≤72h) | Weekly |
| 7 | Win rate | Won / (Won + Lost) × 100 | Weekly |
| 8 | WTP conversion | Retainer_signups / Pilots × 100 | Monthly |
| 9 | Referral rate | Referred_contacts / Total_customers × 100 | Weekly |
| 10 | Automation containment | Auto_handled / Total_enquiries × 100 (from col 34) | Daily |

### 8.2 The 5 test targets + pass gate (from the playbook — not repeated, enforced here)

Median response **≤5 min** · 100% **≤60 min** · booking **≥35%** · WTP **≥50%** · referral **≥20%**. **Pass gate: n≥15 leads, 100% SLA, ≥3/5 targets** — required to leave Phase 0 and to expand beyond the first installer.

### 8.3 Review rhythm

Daily (KPIs 1, 2, 10 + SLA-timer breaches) → Weekly (3–7, 9 + red-flag log + fact-sheet freshness) → Monthly (8 + cost envelope + post-1-Oct-2026 re-model + phase-gate review).

---

## 9. Build Roadmap (in order)

1. **BSP + WABA per client** — pick Interakt or AiSensy for installer #1; one WABA per client; verify 24h/72h windows.
2. **n8n webhook + Hermes install** — from official docs (hermes-agent.nousresearch.com only); connect n8n HTTP Request node → Hermes `/v1/chat/completions` (bearer auth); wire IndiaMART Leads API + CTWA + wa.me paths; build the kill-switch flag first.
3. **Fact sheet per installer** — owner-approved figures; do-not-answer list; FAQ bank built from it; **no fact sheet, no automation**.
4. **Templates approved** — qualification script, booking CTA, nurturing touches, fallback phrases — signed off by the installer owner.
5. **Pilot installer #1** — run Phase 1 (assisted) for one week → Phase 2 (semi-auto) behind the gates.
6. **Scale** — only after pass-gate + WTP ≥50% + referral ≥20% hold; then replicate per client (BSP, fact sheet, templates).

---

## 10. Repeatability (tie-back to the playbook)

The **playbook's Section 12 (Reusable Team-Workflow Blueprint)** is the operating system for the next idea: score → oddly specific → reverse brief → Perplexity pain research → Claude shaping → team verification → price from evidence → 7-day test → grow from proof → automate if useful (n8n). This document is the concrete instance of that last step for the solar service. When a future idea reaches "automate," reuse: the phased gates, the fact-sheet guardrail pattern, the no-invention fallback, the 4-human-moments rule, and the kill-switch-first build order.

---

*End of architecture. Phase 0 runs on the playbook; nothing in this document changes its pricing (test ₹3,000–5,000 / retainer ₹15,000–30,000) or its 7-day test — it builds the system behind them.*
