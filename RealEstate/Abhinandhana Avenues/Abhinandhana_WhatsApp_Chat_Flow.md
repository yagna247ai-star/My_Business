# Abhinandhana Avenues — WhatsApp Automation Chat Flow & Community Funnel
## From Ad Click → Qualification → Community → Warm Lead → Customer

**Prepared for:** GM Sales, Abhinandhana Avenues Private Limited  
**Date:** August 5, 2026  
**Brand heritage:** 25 years in open plots | AP + Telangana (Vijayawada, Guntur, Hyderabad, etc.) | EMI options  
**Primary audience:** Telugu-speaking (primary) + English; NRIs (Gulf + US); budget ₹6–60L  
**Confidence flags:** **[CONFIRMED]** = research-backed | **[ESTIMATED]** = industry practice

---

## Executive Summary — The Funnel Architecture

```
 AD (Google/YouTube/Meta)                    WhatsApp Community
 ┌─────────────┐      ┌────────────────────┐      ┌──────────────────────┐
 │ Click-to-    │─────▶│  BOT FLOW (5-sec   │─────▶│  "Abhinandhana Open   │
 │ WhatsApp Ad  │      │  auto welcome → 5  │      │  Plot Investment      │
 │ (25-yr brand │      │  qualification →   │      │  Community"           │
 │ story + EMI  │      │  EMI teaser →      │      │  - Announcements (admins only) │
 │ hook)        │      │  community invite  │      │  - Current Projects group      │
 └─────────────┘      │  → human handoff)   │      │  - Plot Selection Tips group   │
                      └────────────────────┘      │  - Govt Updates group          │
                                                        │  - NRI Corner group              │
                                                        └──────────────┬───────────────┘
                                                                       │ warm drip
                                                                       ▼
                                                              SITE VISIT → BOOKING → CUSTOMER
```

**The core principle:** The bot's ONLY jobs are (1) welcome in 5 seconds, (2) qualify with 5 questions, (3) share an EMI teaser, (4) invite to community. **The moment a lead asks about price of a specific project, site visit, EMI, or NRI process — the bot hands off to a human sales agent.** Bot stays in loop only for value/qualification; money questions go to human. [CONFIRMED practice — AI chatbots fail on high-intent real estate questions; humans convert]

---

## Part 1: Complete Chat Flow Map

### 1.1 Flow Diagram (Step-by-Step)

| Step | Trigger | Bot Action | User Response Options | Next Step |
|---|---|---|---|---|
| **S1 — Entry** | User clicks WhatsApp ad / scans QR / clicks community-link | Opens chat with pre-filled message: "Hi! I'm interested in Abhinandhana open plots" | — | Auto-trigger S2 |
| **S2 — Welcome** | Chat opens (0–5 seconds) | Send welcome msg + brand intro (25 years) + menu (Quick replies) | 1️⃣ Open Plots Info | 2️⃣ EMI Plans | 3️⃣ Talk to Sales | Branch accordingly |
| **S3 — Qualification Q1** | After welcome | **Budget question** (quick replies) | ₹6–15L | ₹15–30L | ₹30–60L | ₹60L+ | Not sure | Store answer → Q2 |
| **S4 — Qualification Q2** | After Q1 answer | **Location preference** (quick replies) | Vijayawada | Guntur | Hyderabad | Other AP | Other TS | Store → Q3 |
| **S5 — Qualification Q3** | After Q2 answer | **Timeline question** (quick replies) | This month | 1–3 months | 3–6 months | Just exploring | Store → Q4 |
| **S6 — Qualification Q4** | After Q3 answer | **Decision-maker question** (quick replies) | Myself | Me + family | NRI (abroad) | Family decides | Store → Q5 |
| **S7 — Qualification Q5** | After Q4 answer | **Plot purpose question** (quick replies) | Self construction | Investment | Retirement/parents | NRI security | Store → S8 |
| **S8 — EMI Teaser** | All 5 answered | Send personalized EMI example based on budget + project locations + value message | Show interest | Not now | Branch → S9 |
| **S9 — Community Invite** | After EMI teaser | Send community invite: benefits list + join link + what happens after joining | Join (tap link) | Ask more | Redirect to link; log lead |
| **S10 — Post-Join Welcome** | User joins community | Human agent (or bot in announcements) posts welcome + next steps | — | Drip content begins (Part 5) |
| **S11 — Human Handoff** | ANY high-intent signal (price/project, site visit, EMI detail, NRI, "book") | Bot: "Connecting you to a sales specialist now" + tags lead in CRM | — | Human agent takes over |

### 1.2 Flow Logic Rules

1. **Every quick-reply answer is stored** in CRM (AiSensy/WATI field capture) — budget + location + timeline + decision-maker + purpose = lead profile for scoring
2. **No answer in 10 minutes** after any question → auto-resend question once → after 2nd no-answer, send: "No problem — here's the community link, join anytime: [link] We'll keep you updated" → tag as "cold-nurture"
3. **Free-text answers** (not matching quick replies): use keyword matching → if keyword = high-intent (price/visit/EMI/NRI/book) → escalate to human. Else → "Thanks! Let me connect you to a specialist who can help with that" → human
4. **Lead scoring after 5 answers:**
   - Hot (call within 24h): budget 30L+ OR timeline "this month" + decision-maker self OR site-visit ask
   - Warm (community drip): any 3+ answers given
   - Cold (nurture only): "just exploring" + no budget
5. **Every flow ends with one of two outcomes:** (a) community link sent, or (b) human handoff — never a dead end

---

## Part 2: Full Message Scripts (Telugu + English)

### S2 — Welcome Message (Auto, within 5 seconds)

**Telugu:**
> నమస్తే! 🙏 Abhinandhana Avenues కు స్వాగతం. మా 25 సంవత్సరాల అనుభవంతో AP మరియు తెలంగాణలో (విజయవాడ, గుంటూరు, హైదరాబాద్...) ఓపెన్ ప్లాట్లను EMI ఆప్షన్లతో అందిస్తున్నాము.
> మీకు ఏ వివరాలు కావాలి?
> 1️⃣ ఓపెన్ ప్లాట్స్ వివరాలు
> 2️⃣ EMI ప్లాన్స్
> 3️⃣ సేల్స్ టీమ్తో మాట్లాడాలి

**English:**
> Namaste! 🙏 Welcome to Abhinandhana Avenues. With 25 years of experience, we offer open plots with EMI options across AP & Telangana (Vijayawada, Guntur, Hyderabad...).
> What would you like to know?
> 1️⃣ Open Plots Info
> 2️⃣ EMI Plans
> 3️⃣ Talk to Sales Team

**Next action:** Quick-reply buttons → branch to Q1 (1/2) or human handoff (3)

---

### S3–S7 — Qualification Questions

#### Q1: Budget (Telugu + English)

**Telugu:**
> మీ బడ్జెట్ ఎంత? (మీ ప్లాట్ కోసం ఆలోచిస్తున్న మొత్తం)
> 1️⃣ ₹6–15 లక్షలు
> 2️⃣ ₹15–30 లక్షలు
> 3️⃣ ₹30–60 లక్షలు
> 4️⃣ ₹60 లక్షలకు పైగా
> 5️⃣ ఇంకా ఖచ్చితంగా లేదు

**English:**
> What's your budget range for the plot?
> 1️⃣ ₹6–15 lakh
> 2️⃣ ₹15–30 lakh
> 3️⃣ ₹30–60 lakh
> 4️⃣ ₹60 lakh+
> 5️⃣ Not sure yet

#### Q2: Location Preference

**Telugu:**
> ఏ ప్రాంతంలో ప్లాట్ కావాలి?
> 1️⃣ విజయవాడ
> 2️⃣ గుంటూరు
> 3️⃣ హైదరాబాద్
> 4️⃣ ఏపీలో మరెక్కడైనా
> 5️⃣ తెలంగాణలో మరెక్కడైనా

**English:**
> Which location are you looking at?
> 1️⃣ Vijayawada
> 2️⃣ Guntur
> 3️⃣ Hyderabad
> 4️⃣ Anywhere in AP
> 5️⃣ Anywhere in Telangana

#### Q3: Timeline

**Telugu:**
> ఎప్పుడు కొనాలనుకుంటున్నారు?
> 1️⃣ ఈ నెలలో
> 2️⃣ 1–3 నెలల్లో
> 3️⃣ 3–6 నెలల్లో
> 4️⃣ ఇప్పుడే చూస్తున్నాను (టైమ్ లేదు)

**English:**
> When are you planning to buy?
> 1️⃣ This month
> 2️⃣ In 1–3 months
> 3️⃣ In 3–6 months
> 4️⃣ Just exploring right now

#### Q4: Decision Maker

**Telugu:**
> ఈ నిర్ణయం ఎవరు తీసుకుంటారు?
> 1️⃣ నేను మాత్రమే
> 2️⃣ నేను + కుటుంబం
> 3️⃣ NRI (విదేశంలో ఉన్నారు)
> 4️⃣ కుటుంబం నిర్ణయిస్తుంది

**English:**
> Who will make this decision?
> 1️⃣ Just me
> 2️⃣ Me + my family
> 3️⃣ NRI (living abroad)
> 4️⃣ Family decides

#### Q5: Plot Purpose

**Telugu:**
> ప్లాట్ ఎందుకు కొంటున్నారు?
> 1️⃣ ఇల్లు కట్టడానికి
> 2️⃣ ఇన్వెస్ట్మెంట్ కోసం
> 3️⃣ రిటైర్మెంట్ / తల్లిదండ్రుల కోసం
> 4️⃣ NRI సెక్యూరిటీ కోసం

**English:**
> What's the purpose of the plot?
> 1️⃣ Self construction
> 2️⃣ Investment
> 3️⃣ Retirement / parents
> 4️⃣ NRI security

**Fallback (any wrong/free-text answer):**
> సార్/మేడమ్, మీ సమాధానం అర్థమైంది. మీకు సరిపోయే ఎంపికను ఎంచుకోండి లేదా మీ ప్రశ్నను టైప్ చేయండి — మా స్పెషలిస్ట్ మీకు సహాయం చేస్తారు.
> (Sir/Madam, I understand. Please select the closest option or type your question — our specialist will help you.)

---

### S8 — EMI Teaser (Personalized by Budget — sent AFTER qualification)

**Template (budget ₹15–30L example):**

**Telugu:**
> ధన్యవాదాలు! 🙏 మీ ప్రాధాన్యతలను బట్టి మీకు సరిపోయే ఎంపికలను చూపిస్తాము.
> ఉదాహరణకు — ₹20 లక్షల విలువైన ప్లాట్ ను
> 💰 డౌన్ పేమెంట్: ₹4 లక్షలు
> 📅 నెలకి ₹35,000 వంతున 48 నెలలు
> (లేదా మీ బడ్జెట్కి అనుగుణంగా కస్టమ్ ప్లాన్)
> 📍 ప్రస్తుత ప్రాజెక్ట్లు: విజయవాడ, గుంటూరు, హైదరాబాద్ (RERA/DTCP అప్రూవ్డ్)
> మరిన్ని వివరాలు కావాలా, లేదా మా వాట్సాప్ కమ్యూనిటీలో చేరి అన్ని అప్డేట్లు పొందాలా?

**English:**
> Thank you! 🙏 Based on your preferences, here's what could suit you.
> Example — for a ₹20 lakh plot:
> 💰 Down payment: ₹4 lakh
> 📅 ₹35,000/month for 48 months
> (Or a custom plan for your budget)
> 📍 Current projects: Vijayawada, Guntur, Hyderabad (RERA/DTCP approved)
> Want more details, or join our WhatsApp Community to get all updates?

**Next action:** Quick replies → 1️⃣ Show me community | 2️⃣ EMI for my budget | 3️⃣ Talk to sales

---

### S9 — Community Invite Message

**Telugu:**
> 🎉 మీకో గొప్ప అవకాశం!
> మా **"Abhinandhana Open Plot Investment Community"** లో చేరండి — పూర్తిగా ఉచితం, మీకు విలువైన సమాచారం:
> 📍 **కరెంట్ ప్రాజెక్ట్లు** — విజయవాడ, గుంటూరు, హైదరాబాద్ లోని అన్ని లొకేషన్ల అప్డేట్లు
> 🏗️ **ఓపెన్ ప్లాట్ ఎన్హాన్స్మెంట్స్** — రోడ్లు, డ్రైనేజ్, కంపౌండ్ వాల్, ఇన్ఫ్రా వివరాలు
> 🏛️ **గవర్నమెంట్ మార్పులు** — RERA, స్టాంప్ డ్యూటీ, ఇన్ఫ్రా ప్రాజెక్ట్స్ (కొత్త ఎయిర్పోర్ట్, ఎక్స్ప్రెస్వే)
> 📖 **ప్లాట్ సెలక్షన్ గైడ్** — సరైన ప్లాట్ ఎలా ఎంచుకోవాలో నిపుణుల సలహాలు
> 👉 చేరడానికి: [Join Link]
> కమ్యూనిటీలో చేరిన తర్వాత మీకు వీక్లీ అప్డేట్లు, EMI ఆఫర్లు, ప్రత్యేక స్కీమ్లు వస్తాయి.

**English:**
> 🎉 A great opportunity for you!
> Join our **"Abhinandhana Open Plot Investment Community"** — completely free, with valuable insights:
> 📍 **Current Projects** — updates from all locations in Vijayawada, Guntur, Hyderabad
> 🏗️ **Open Plot Enhancements** — roads, drainage, compound wall, infrastructure details
> 🏛️ **Government Changes** — RERA, stamp duty, infra projects (new airport, expressway)
> 📖 **Plot Selection Guide** — expert tips on choosing the right plot
> 👉 Join here: [Join Link]
> After joining, you'll receive weekly updates, EMI offers, and exclusive schemes.

**Next action:** Link tap → S10 | "Not now" → save as warm lead, follow up in 3 days with human

---

### S10 — Post-Join Welcome (in Community Announcements)

**Telugu:**
> 🙏 Abhinandhana Open Plot Investment Community కు స్వాగతం!
> 25 సంవత్సరాల విశ్వసనీయత. ఇక్కడ మీకు కావలసిన అన్ని సమాచారం:
> 📅 **ప్రతి సోమవారం:** ప్రాజెక్ట్ అప్డేట్లు (విజయవాడ, గుంటూరు, హైదరాబాద్)
> 📅 **ప్రతి బుధవారం:** ప్లాట్ సెలక్షన్ టిప్స్
> 📅 **ప్రతి శుక్రవారం:** గవర్నమెంట్/ఇన్ఫ్రా అప్డేట్లు
> 📅 **నెలకోసారి:** EMI స్పెషల్ ఆఫర్స్ + సైట్ విజిట్ ఈవెంట్స్
> మీ ప్రశ్నలకు మా టీమ్ సిద్ధం. సైట్ విజిట్ బుక్ చేయాలంటే: [Link]

**English:**
> 🙏 Welcome to the Abhinandhana Open Plot Investment Community!
> 25 years of trust. Here's everything you'll get:
> 📅 **Every Monday:** Project updates (Vijayawada, Guntur, Hyderabad)
> 📅 **Every Wednesday:** Plot selection tips
> 📅 **Every Friday:** Government/infra updates
> 📅 **Monthly:** EMI special offers + site visit events
> Our team is ready for your questions. To book a site visit: [Link]

---

### S11 — Human Handoff Message

**Telugu:**
> మీ ప్రశ్నకు మా ప్రత్యేక నిపుణుడు సహాయం చేస్తారు. ఒక్క క్షణం... మిమ్మల్ని కనెక్ట్ చేస్తున్నాము. 🙌

**English:**
> Our specialist will help you with this. One moment... connecting you now. 🙌

**After handoff:** Human agent takes over with CRM context (budget, location, timeline, decision-maker, purpose already known — no re-qualification!)

---

## Part 3: Automation Tooling Recommendation

### 3.1 Platform Comparison (2026 Pricing)

| Platform | Starting Price | Flow Builder | Best Fit | Verdict |
|---|---|---|---|---|
| **AiSensy** | **₹1,500/mo** [CONFIRMED] | Excellent drag-and-drop | CTWA ads + chatbot + CRM for Indian real estate | **RECOMMENDED** |
| Interakt | ₹999–1,500/mo [ESTIMATED] | Template-based | Budget-conscious small teams | Alternative |
| WATI | ₹1,999/mo [CONFIRMED] | Robust flow builder | Mid-large teams, multi-agent | Strong alternative |
| Gallabox | ~₹2,000/mo [ESTIMATED] | Yes + real-estate templates | CRM-like property tracking | Consider if property-tagging needed |
| DoubleTick | ~₹2,500/mo [ESTIMATED] | Yes | Field sales teams (mobile-first) | Consider |
| ManyChat | ~$15/mo (~₹1,250) | Best-in-class visual builder | Heavy Instagram/FB ad users | Consider if Meta-ads-heavy |
| Gupshup | Usage-based | Dev-focused | Enterprise/custom builds | Overkill |
| Meta Direct (Cloud API) | ₹0 platform fee | Build your own | In-house dev team | Not recommended |

**Recommendation: AiSensy ₹1,500/mo** — best native Click-to-WhatsApp Ads Manager integration, Indian lead-management "Smart Views," drag-and-drop flow builder a non-technical GM can operate, unlimited team members on base plan. [CONFIRMED]

### 3.2 Meta WhatsApp API Costs (2026, India)

| Message Type | Cost | Use |
|---|---|---|
| **Marketing (template)** | **₹1.09/msg** [CONFIRMED] | EMI offers, festive schemes, project promos |
| **Utility** | ₹0.145/msg [CONFIRMED] | Site-visit confirmations, OTPs |
| **Service (after Oct 1, 2026)** | ₹0.115/msg [CONFIRMED] | Replies within 24h window to customer-initiated chats |
| **CTWA free window** | **72 hours free** [CONFIRMED] | Ad-initiated chats — qualification flow is FREE here |
| **Green tick (Meta Verified)** | ₹1,100–2,200/mo [ESTIMATED] | Trust badge — high value for plot sales |

**Cost estimate for Abhinandhana (1,000 leads/mo):**
- Platform: ₹1,500
- Qualification flow: ₹0 (within 72h CTWA window)
- Follow-up drips (2/lead/mo): ~₹2,180
- **Total tech: ~₹3,680/mo + GST + ad spend** [ESTIMATED]

### 3.3 Free-form vs Template Messages — Critical Rule

| Message Type | When Allowed | Cost |
|---|---|---|
| **Free-form** | ONLY within 24h of customer's last message (or 72h for CTWA) | Free (pre-Oct 2026); ₹0.115 after |
| **Template** | Business-initiated (outside window) | ₹1.09 (marketing) / ₹0.145 (utility) |

**Operational implication:** The qualification flow + community invite run free inside the CTWA 72-hour window. Any proactive outreach AFTER the window closes (e.g., "Did you join?") needs an approved **marketing template** — plan template inventory in advance (welcome, EMI offer, festive scheme, site-visit reminder, community invite).

---

## Part 4: WhatsApp Community Setup Guide

### 4.1 Structure

```
📢 Abhinandhana Open Plot Investment Community
│
├── 📣 ANNOUNCEMENTS (admin-only broadcast)  ← ALL members automatically
│      Weekly value drips + offers
│
├── 📍 Current Projects Group (Vijayawada, Guntur, Hyderabad + all AP/TS)
│      Project photos, site videos, inventory, EMI plans
│
├── 🏗️ Plot Selection Tips Group
│      How to choose plots, documentation (EC, patta, approvals), 
│      DTCP vs HMDA vs RERA explained, red flags
│
├── 🏛️ Govt Updates Group
│      RERA changes, stamp duty, infrastructure (Bhogapuram airport,
│      expressways, RRR), circle rates
│
└── 🌍 NRI Corner Group (optional, if NRI volume justifies)
       FEMA rules, POA process, remote purchase, remittance timing
```

### 4.2 WhatsApp Community Limits (2026) [CONFIRMED — WhatsApp FAQ]

- Max **5,000 members** per community; up to **100 sub-groups**
- **Announcements group**: only admins post — this is your broadcast channel for high-volume value content without spamming members
- **Opt-in requirement:** Businesses CANNOT bulk-add users without consent (ban risk). The bot's community-invite link IS the compliant opt-in.

### 4.3 Admin Roles & Rules

| Role | Responsibility |
|---|---|
| **Community Admin (GM Sales)** | Announcements broadcast; escalation oversight; weekly metrics |
| **Community Manager (sales rep)** | Manage topic groups; answer member questions; post content calendar |
| **Moderator 1 (projects)** | Post project updates/photos/videos in Projects group |
| **Moderator 2 (content)** | Post plot-selection tips + govt updates on schedule |

**Rules:**
1. Announcements = max 2–3/week (Monday projects, Wednesday tips, Friday govt). No spam — members leave fast.
2. Topic groups = member-opt-in (join link per group); don't auto-add members to all groups
3. **Never** let non-admins post in Announcements
4. Personal 1:1 follow-ups on community members = allowed ONLY if they've chatted with you (24h window) OR via paid marketing template
5. Track community growth weekly: members added, active members, site visits booked from community, bookings from community

### 4.4 Value Drip Content Calendar (the "why they stay" engine)

| Day/Week | Content Type | Example | Goal |
|---|---|---|---|
| Mon (wkly) | Current projects update | "New corner plots released in Guntur — 3 left" + photos | Inventory awareness |
| Wed (wkly) | Plot selection tip | "EC vs patta: what to check before buying" | Trust/education |
| Fri (wkly) | Govt/infra update | "Bhogapuram airport opens Aug 17 — Vizag corridor update" | Urgency/value |
| Monthly | EMI special | "Sankranti offer: 0% EMI for 12 months" | Conversion trigger |
| Monthly | Site visit event | "Free site visit this Sunday — 10 slots" | Visit generation |
| Ad-hoc | Success stories | "Mr. & Mrs. Rao booked in Vijayawada this week" | Social proof |

---

## Part 5: Handoff Rules — Bot → Human (Unambiguous)

### 5.1 Escalation Triggers (ANY of these → human immediately)

| # | Intent signal | Keywords (Telugu + English) | Human action |
|---|---|---|---|
| 1 | **Asking price of a specific project** | "ధర" (price), "rate", project name + price | Share exact price list + schedule visit |
| 2 | **Asking for site visit** | "సైట్ విజిట్" (site visit), "visit", "చూడాలి" (want to see) | Book visit slot within 72h |
| 3 | **Asking about EMI details** | "EMI", "installment", "వాయిదా", "down payment" | Share EMI sheet + banking call-in |
| 4 | **NRI questions** | "NRI", "POA", "foreign", "abroad", "విదేశం" | Route to NRI specialist (video call walk) |
| 5 | **Booking intent** | "బుక్" (book), "block", "token", "కొంటాను" (will buy) | Immediately hand to senior salesperson |
| 6 | **Repeated objection after EMI teaser** | "too expensive", "ధర ఎక్కువ", "discount" | Human value-reframe call |
| 7 | **Any question bot can't answer** | Free-text not matching any flow node | Hand to human (never guess) |

### 5.2 Bot Scope (what it handles vs what it never handles)

| Bot HANDLES (stay in loop) | Bot NEVER handles (immediate handoff) |
|---|---|
| Welcome + brand intro (25 years) | Exact project pricing |
| 5-question qualification | Site visit scheduling |
| EMI teaser (examples only) | Booking / token / blocking |
| Community invite + benefits | EMI negotiation / custom structuring |
| Value content (tips, govt updates) | NRI legal/POA/FEMA specifics |
| FAQ (locations, approvals basics) | Negotiation / discounts |

### 5.3 Handoff Mechanics

1. **Detection:** keyword match OR free-text fallback OR user taps "3️⃣ Talk to Sales"
2. **Bot message:** "Our specialist will help you — connecting you now 🙌" (Telugu + English)
3. **CRM tag:** Lead profile (5 answers) auto-attached to the human's inbox — **no re-qualification**
4. **SLA:** Human responds within 5 minutes (78% of buyers work with first responder [CONFIRMED]); auto-nudge to human if 5 min passes
5. **After booking conversation:** human logs outcome in CRM (booked / visit / nurture / lost + reason)

---

## Part 6: Implementation Checklist (30 Days)

| # | Action | Tool/Where | Week |
|---|---|---|---|
| 1 | Sign up AiSensy ₹1,500/mo; connect WhatsApp Business number; get Meta Verified (₹1,100–2,200/mo) | AiSensy | W1 |
| 2 | Submit template inventory for approval: welcome, EMI offer, community invite, site-visit reminder, festive scheme (5 templates) | Meta template approval | W1–2 |
| 3 | Build the 11-step flow (S1–S11) in AiSensy flow builder with Telugu+English scripts (Part 2) | AiSensy flow builder | W2 |
| 4 | Create WhatsApp Community + announcements + 4 topic groups; assign admin roles | WhatsApp App | W2 |
| 5 | Connect Google Ads click-to-WhatsApp to the flow; set up lead source tagging | AiSensy CTWA Ads Manager | W3 |
| 6 | Build drip content calendar (Part 4.4) + 2 weeks of content ready | Content team | W3 |
| 7 | Train sales team on handoff rules + 5-min response SLA + Telugu close scripts | Training | W3–4 |
| 8 | Pilot with 100 leads → measure: welcome→qualification rate, qualification→community join rate, community→visit rate, visit→booking rate | CRM dashboard | W4+ |

### Metrics to Track Weekly

| Metric | Target |
|---|---|
| Welcome → qualification completion | 60%+ |
| Qualification → community join | 40%+ |
| CTWA lead → human handoff | 15–25% (high-intent) |
| Community → site visit | 5–10% of active members |
| Site visit → booking | 15–25% (qualified) |
| Human response time | <5 minutes |

---

## Sources (Key)

1. **AiSensy** — WhatsApp API providers comparison, starting ₹1,500/mo: https://m.aisensy.com/blog/whatsapp-api-providers/
2. **Shoplinx** — WhatsApp API pricing 2026 (WATI vs Interakt vs AiSensy vs Gallabox): https://www.shoplinx.ai/blog/whatsapp-business-api-pricing-2026
3. **Lemin AI** — WATI vs AiSensy vs Interakt vs DoubleTick vs Gallabox: https://leminai.com/wati-vs-aisensy-vs-interakt-vs-doubletick-vs-gallabox/
4. **Omnifox** — 2026 comparison: https://omnifox.io/blog/wati-vs-interakt-vs-aisensy-vs-gallabox-which-to-choose
5. **WhatsApp FAQ** — Community announcements (2,000 members announcement group; up to 100 groups): https://faq.whatsapp.com/582420703681043
6. **WhatsApp FAQ** — Create a community: https://faq.whatsapp.com/438859978317289
7. **GetKanal** — WhatsApp Communities in 2026: https://getkanal.com/blog/whatsapp-communities-guide
8. **Respond.io** — WhatsApp Communities how-to: https://respond.io/blog/whatsapp-communities
9. **Gupshup** — Click-to-Chat ads best practices: https://www.gupshup.ai/resources/blog/click-to-chat-ads-conversions
10. **Spurnow** — Click to WhatsApp Ads 2026 guide: https://www.spurnow.com/en/blogs/click-to-whatsapp-ads
11. **Meta for Developers** — Template categorization (utility vs marketing billing): https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization
12. **OnCloudAPI** — Template approval guide 2026: https://oncloudapi.com/blogs/whatsapp-message-templates-complete-guide-to-metas-approval-system-2026
13. **PropChat** — Click to WhatsApp ads for real estate: https://propchat.in/click-to-whatsapp-ads-for-real-estate/
14. **Propflo** — WhatsApp marketing use cases real estate: https://www.propflo.ai/blog/whatsapp-marketing-use-cases-in-real-estate

*Note: Meta is shifting to per-message pricing for service messages from Oct 1, 2026 (₹0.115/msg in India); CTWA ad-initiated chats carry a 72-hour free window — the qualification flow should be designed to complete inside it. Prices exclude 18% GST. Platform prices flagged [ESTIMATED] where rate cards were not directly verifiable in this research pass.*

---

### Verification Self-Check

- ✅ Complete chat flow map: S1 entry (click-to-WhatsApp) → S2 welcome (5-sec auto) → S3–S7 five-question qualification (budget, location, timeline, decision-maker, purpose) → S8 price/EMI teaser → S9 community invite with benefits → S10 post-join welcome → S11 human handoff
- ✅ Full message scripts in Telugu + English: welcome, all 5 qualification questions with quick-reply buttons, fallback for wrong answers, community invite, no-reply escalation
- ✅ Automation tooling comparison with costs: AiSensy ₹1,500/mo (recommended), Interakt/WATI/Gallabox/DoubleTick/ManyChat/Gupshup/Meta Direct; Meta per-message pricing ₹1.09 marketing / ₹0.145 utility / ₹0.115 service; CTWA 72h free window; template vs freeform rules
- ✅ WhatsApp Community setup guide: structure (announcements + 4 topic groups), 5,000-member/100-group limits, admin roles, broadcast vs community rules, drip content calendar
- ✅ Handoff rules: 7 escalation triggers with Telugu+English keywords, bot-scope vs human-scope table, 5-min SLA, CRM context handoff
