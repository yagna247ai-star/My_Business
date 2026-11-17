# Master Strategic Playbook — Same-Day Solar Lead Response (AP/TS)

**Framework:** Make-Money-with-AI · **Phase:** Shaping → Verification → Test → Grow → Automate
**Market:** Telugu solar (Andhra Pradesh + Telangana) · **Date:** Aug 2026
**Status:** Decision-ready. Execute the 7-day test before spending anything on automation.

> **One problem, one solution, one idea.**
> Solar installers in AP/TS pay heavily for leads (₹30–80k/month in ads) but lose a large share of enquiries to slow response. The solution: a same-day Telugu WhatsApp/call response service that answers every enquiry in minutes and books site surveys — manual first, automated later (n8n).

**Offer sentence:** *"I help owner-run solar installers in AP/TS handle every WhatsApp and call enquiry within minutes, in Telugu. The measurable result is that no enquiry goes unanswered and more site surveys get booked every week."*

**Evidence discipline:** every number in this playbook is traceable to verified evidence or explicitly flagged **ASSUMPTION**. Nothing else gets repeated in front of a buyer.

---

## 1. Executive Summary

| Element | Definition |
|---|---|
| **Problem** | Installers spend ₹30–80k/month on ads (Google CPL ₹500–1,500 Tier-2, Meta ₹150–400, IndiaMART ₹200–600) and close 15–25% of leads — but enquiries leak because nobody answers fast. No India-specific response benchmark exists (US: 42h average, 23% never respond — HBR 2011). Vendor claims of "40% of leads lost to response time" and "55% of solar companies take 5+ days" are **unverified** — the mystery-shopper probe (Day 1–2) decides whether this is real in this market. |
| **Solution** | Answer every WhatsApp/call enquiry within minutes, in Telugu; qualify it; book the site survey. Delivered manually during the test, automated with n8n once proven. |
| **Idea** | A paid service sold to owner-run installers (4–10 people, ₹30L–3.5Cr revenue, avg ticket ₹1.2–1.8L, margin 15–35%). Price: ₹15,000–30,000/month retainer, ₹3,000–5,000 for the 7-day test, or ₹500–1,000 per survey booked. |
| **Why now** | AP has the worst application→installation conversion in India (2.9% vs 39.5% national — PIB Mar 2026). Demand exists at scale; the conversion layer is where money leaks. |
| **Buyer access** | 41 real installers already shortlisted from official NREDCAP/TGREDCO/APEPDCL PDFs + Justdial/IndiaMART; 5 verified reach channels. |
| **Test** | 7 days: probe (20–30 mystery enquiries) → outreach (WhatsApp + cold calls) → 1–3 paid pilots. Pass gate: n≥15 leads, 100% SLA, ≥3 of 5 targets hit. |

**Decision rules:**
- Probe shows median response <30 min and >60% reply → **slow response is not the pain here → pivot to Framing B** (PM Surya Ghar pipeline conversion).
- Probe shows median >2h or <40% reply → **proceed with A** and run the full 7-day test.

---

## 2. Framework Workflow (one line each)

1. **Score the problem** — 6 criteria (frequent / painful / paid for / reachable / safe to test / clear result); 8+ = go.
2. **Go oddly specific** — one market (AP/TS solar), one persona (owner-run installer), one action (answer enquiries fast).
3. **Reverse brief** — define the deliverable backward from the outcome the buyer pays for (booked surveys), not the activity.
4. **Perplexity research — pain, not idea** — verify the pain and its cost before designing the solution.
5. **Claude shaping — evidence in, bounded offer out** — verified facts → bounded offer, pricing, test design (this document).
6. **Idea verification** — team scorecard + red-teaming + mystery-shopper probe on the real market.
7. **Price from evidence** — cost of the problem × proven willingness to pay (they already pay ₹150–1,500 per lead).
8. **7-day test** — probe → outreach → paid pilot → go/no-go.
9. **Grow from proof** — help one → repeat → write stable steps → expand.
10. **Automate if useful** — n8n on the proven daily task, with safety rules (read/draft/act).

---

## 3. Pain Evidence

**Verified (PIB Mar 2026; Down To Earth Oct 2025):**
- AP: 13,76,208 PM Surya Ghar applications vs 1,14,302 installations → **2.9% application→installation conversion — worst in India** vs 39.5% national average.
- TS: 32,646 installations.
- Buyer already pays for demand: Google CPL ₹500–1,500 (Tier-2 ₹500–1,200), Meta CPL ₹150–400, IndiaMART ₹200–600 (vendor estimates 2026); ad budgets ₹30–80k/month; close 15–25%.

**Unverified (vendor/LinkedIn claims — the probe decides):**
- "40% of leads lost to response time"
- "55% of solar companies take 5+ days to respond"
- No India-specific lead-response benchmark exists. US baseline: 42h average first response, 23% never respond (HBR 2011).

**Lost-lead economics (the cost of the problem — what the price is built on):**
- 100 leads/month at a 20% response-loss → 20 lost leads × 15% close rate = **3 lost deals**.
- 3 × ₹1.5L avg ticket = **₹4.5L revenue**; × 25% avg margin = **₹1.12L gross profit lost per month**.
- Sensitivity: 10% loss → ₹2.25L revenue / ₹56k profit; 40% loss → ₹9L revenue / ₹2.25L profit.
- *Note: 100 leads/month is derived from ₹30–80k budgets ÷ blended CPL — **ASSUMPTION**, used only for internal math, never for the buyer pitch. The 20% loss rate is also **ASSUMPTION** pending the probe.*

**Alternatives the buyer already has (and why they don't solve it):**
- WhatsApp Business free tier — static auto-reply; cannot hold a real Telugu conversation ("subsidy ఎంత?", "5kW price?") or book a survey.
- Zoho / HubSpot / OpenSolar free tiers — CRM plumbing, not response speed; the buyer's problem is the *first 5 minutes*, not the database.
- WhatsApp API ~₹1/message — the plumbing exists, but somebody still has to run the conversation; that "somebody" is what this service sells.

---

## 4. Buyer Access

**Persona — the buyer:**
- Owner-run installer, 4–10 people, revenue ₹30L–3.5Cr, avg ticket ₹1.2–1.8L, margin 15–35%.
- Decision-maker is the owner. Speaks Telugu first. Already spending ₹30–80k/month on ads — knows what a lead costs.

**Shortlist (done):** 41 real companies compiled from official NREDCAP/TGREDCO/APEPDCL PDFs + Justdial + IndiaMART.

**5 verified channels:**
1. **Installer communities** — WhatsApp / Facebook / Telegram groups for solar installers (join, observe, then contribute value).
2. **Brand dealer programs** — Tata Power, Waaree, Adani dealer/distributor networks.
3. **Trade expos** — Global Solar Expo, Hyderabad (Feb 6–7, 2026); Green Energy India Expo, Vijayawada (Jun 11–13, 2026).
4. **Government vendor registries** — NREDCAP/TGREDCO/APEPDCL empanelment lists (already mined for the 41).
5. **Associations** — solar industry / installer associations and their events.

**Proof assets to build before outreach:** the numbers (AP 2.9% conversion — worst in India), Telugu case studies (first pilots), named references (first paying installers).

---

## 5. Problem Scorecard

Scored 0–2 per criterion; **8+ = go**. Two candidate framings for the same working problem.

| Criterion | A) Same-day lead-response service | B) PM Surya Ghar pipeline conversion |
|---|---|---|
| **Frequent** | 2 — ₹30–80k/mo ad budgets exist → enquiries arrive daily (inference from budgets + close rates) | 1 — 13,76,208 state applications is huge at aggregate, but per-installer flow is sporadic/unverified |
| **Painful** | 1 — Revenue leakage is the core problem, but "40% lost to response time" is unverified; magnitude unknown → probe decides | 2 — Verified: AP 2.9% vs national 39.5% — worst-in-India application→installation conversion |
| **Paid for** | 2 — Already pays for demand: Google CPL ₹500–1,500, Meta ₹150–400, IndiaMART ₹200–600 | 1 — No evidence anyone pays for subsidy-pipeline management; only adjacent to existing lead spend |
| **Reachable** | 2 — 41 shortlisted installers; 5 verified channels | 2 — Same channels |
| **Safe to test** | 2 — No portal/compliance risk, no integration; manual delivery; a wrong attempt costs nothing | 1 — DISCOM filing, changing subsidy rules, portal mechanics = heavy domain lift; errors carry compliance weight |
| **Clear result** | 2 — First-response time + surveys booked, measurable within days | 1 — Application→installation loop runs months; unshowable inside a 7-day test |
| **TOTAL** | **11/12 — WINNER** | **8 — day-90 expansion, not now** |

**Decision:** pursue A. B is not discarded — it becomes the day-90 expansion (and the "boring daily task with scope" candidate for n8n automation) once A proves buyers pay.

---

## 6. Bounded Offer

**Offer sentence:** *"I help owner-run solar installers in AP/TS handle every WhatsApp and call enquiry within minutes, in Telugu. The measurable result is that no enquiry goes unanswered and more site surveys get booked every week."*

| Field | Definition |
|---|---|
| **Buyer** | Owner of a 4–10 person installer, ₹30L–3.5Cr revenue, avg ticket ₹1.2–1.8L, margin 15–35% |
| **Task** | Answer every WhatsApp/call enquiry in ≤5 minutes, in Telugu; qualify it; book the site survey into their calendar |
| **Result** | First-response time (probe sets baseline; US benchmark = 42h avg, 23% never respond — HBR 2011), surveys booked/week, enquiries converted |
| **Boundaries** | WhatsApp + calls only; Telugu + English only; no quoting, negotiation, or installation work; surveys booked, not closed; manual/AI-assisted delivery during pilot |
| **Questions before closing** | How many enquiries/day? Who answers today and how long does it take? What % book surveys? What's your close rate *on surveys*? Will you share 2 weeks of enquiry history so I can measure your gap? Is it your call alone? |
| **Assumptions** | 40%-lost-to-response & "55% take 5+ days" (unverified vendor claims — probe decides); 15–25% close rate holds; 40–120 enquiries/mo (**ASSUMPTION**, derived from ₹30–80k budgets ÷ CPL ₹150–1,500); owner is sole decision-maker; Telugu-first matters |

---

## 7. Pricing from Evidence

**What the buyer already pays (evidence):** ₹150–1,500 per lead (Google Tier-2 ₹500–1,200, Meta ₹150–400, IndiaMART ₹200–600); ₹30–80k/month in ads; 15–25% close rate. They know a lead's value precisely.

**What one recovered deal is worth:** ₹1.2–1.8L ticket × 15–35% margin = **₹18,000–63,000 gross profit** per won deal.

**Lost-lead economics (internal math only — not for buyer pitch):**
- 100 leads/mo (**ASSUMPTION**) at 20% response-loss (**ASSUMPTION**) → 3 lost deals → ₹4.5L revenue / ₹1.12L gross profit lost monthly.
- Sensitivity: 10% loss → ₹2.25L / ₹56k; 40% loss → ₹9L / ₹2.25L.

**Price structure (one consistent line):**

| Item | Price | Notes |
|---|---|---|
| 7-day test | **₹3,000–5,000** (anchor ₹4,999) | Flat, cancellable, no lock-in |
| Monthly retainer | **₹15,000–30,000** (anchor ₹30,000) | **Negotiate down from ₹30k, never up** |
| Per-survey option | **₹500–1,000** per booked survey | Zero fixed fee week 1 — for the "prove it" buyer |
| Breakeven | 0.4 deals/month | One average deal (₹37.5k gross profit) pays for 2.5 months of the ₹15k retainer |

**Anchor discipline:** quote ₹4,999 for the test, ₹30,000/month for the retainer. Give ground only in exchange for commitment (monthly, referral, case-study permission).

---

## 8. Measurement — What "Good" Means

**Targets (per active pilot, measured on real enquiry flow):**

| Metric | Target |
|---|---|
| Median first response | **≤5 minutes** |
| 100% responses within | **60 minutes** |
| Survey booking rate | **≥35%** of qualified enquiries |
| Quote request / sent rate | **≥25%** |
| Willingness-to-pay signal | **≥50%** of pilots convert to paid retainer |
| Referral | **≥20%** of paying pilots refer another installer |

**Pass gate (after the 7-day test):** n≥15 leads handled, 100% SLA (all responded ≤60 min), ≥3 of 5 targets hit → continue and expand. Below that → fix process or pivot.

**26-column tracking sheet** (one row per enquiry, shared live sheet — summary): lead ID · date · enquiry time · source channel · installer · enquiry language · enquiry type · first-response time · response delay (min) · SLA met (≤5 / ≤60) · response quality (1–5) · qualification questions asked · survey booked (Y/N) · survey date · survey outcome · quote requested · quote sent · quote amount · deal stage · deal value · won/lost · revenue · WTP signal · referral asked · referral given · notes. The probe (Days 1–2) logs the same columns for all 20–30 mystery enquiries — that single dataset is the baseline.

---

## 9. Day-by-Day 7-Day Test

**The mystery-shopper probe is mandatory and comes first** — the 40%/5-day stats are unverified vendor claims; this dataset decides whether slow response is real *in this market*.

| Day | Action | Output / Gate |
|---|---|---|
| **1–2** | **Probe:** send 20–30 genuine-looking residential enquiries (e.g. "4kW rooftop, what price, how soon can you survey?") via WhatsApp + call to the 41 shortlisted installers (NREDCAP/TGREDCO/APEPDCL PDFs + Justdial/IndiaMART). Log every column of the tracking sheet | **Gate:** median <30 min & >60% reply → slow response is NOT the pain → pivot to B. Median >2h or <40% reply → **proceed with A** |
| **3–4** | Wave-1 outreach: WhatsApp to 15–20 installers (the channel that answered the probe fastest first) + 5–10 cold calls | Pitch the paid pilot; book calls |
| **5–6** | Wave-2 outreach + one follow-up on non-responders. Onboard the 1–3 who say yes: collect channels, set up the Telugu responder, first live responses + survey bookings | First booked surveys; everything logged |
| **7** | Review: probes answered, signups, surveys booked, SLA delivered. Pass gate (n≥15, 100% SLA, ≥3/5 targets) → convert pilots to ₹15–30k monthly, or raise price, or pivot | Go / no-go for week 2 |

**Commitment:** *I will contact 20–30 installers through WhatsApp and cold calls (probe first, then pitch). I will offer a 7-day paid test at ₹3,000 — or ₹500 per survey booked — with live responses delivered from day 1.*

---

## 10. Outreach Scripts & Objection Handling

### WhatsApp (English)
> Namaste [Owner], this is [Name]. I run Telugu enquiry-response for solar installers. Right now, when a customer WhatsApps you, how fast do they get a real answer? In our market, leads that wait quietly go to whoever replies first. I'll take over your WhatsApp and calls — answer every enquiry within 5 minutes in Telugu, and book site surveys into your calendar. 7-day test, ₹3,000, no lock-in. If it doesn't feel different, we stop. Worth 5 minutes?

### WhatsApp (Telugu)
> నమస్తే గారు 🙏 నేను [మీ పేరు]. సోలార్ ఇన్స్టాలర్ల కోసం తెలుగులో ఎన్క్వైరీ రెస్పాన్స్ సర్వీస్ చేస్తున్నాను. మీ వాట్సాప్, కాల్స్కి వచ్చే ప్రతి ఎన్క్వైరీకి 5 నిమిషాల్లోపే తెలుగులో సమాధానం ఇచ్చి, సైట్ సర్వే బుక్ చేస్తాను. 7 రోజుల టెస్ట్ — కేవలం ₹3,000. రిజల్ట్ నచ్చకపోతే ఆపేయొచ్చు, లాక్-ఇన్ లేదు. 5 నిమిషాలు మాట్లాడొచ్చా?

### Cold call (English)
> Hi, is this [Owner]? This is [Name]. Quick question — how many enquiries does your WhatsApp get in a day, and how many actually turn into site surveys? …The reason I ask: most installers I've studied lose a big chunk of enquiries because nobody answers fast, and the customer moves to the next name on Google. I fix exactly that — every enquiry answered within minutes in Telugu, surveys booked into your calendar. 7-day paid test at ₹3,000; if it doesn't work, we stop. Can I send you a one-page breakdown?

### Cold call (Telugu)
> హలో, [యజమాని పేరు] గారా? నేను [పేరు]. ఒక చిన్న ప్రశ్న — మీ వాట్సాప్కి రోజుకి ఎన్ని ఎన్క్వైరీలు వస్తాయి? వాటిలో ఎన్ని సైట్ సర్వే దాకా వెళ్తాయి? …అర్థమైంది. చాలా ఇన్స్టాలర్లు ఆలస్యంగా సమాధానం చెప్పడం వల్ల కస్టమర్ని పక్క ఇన్స్టాలర్కి కోల్పోతున్నారు. నేను ప్రతి ఎన్క్వైరీకి 5 నిమిషాల్లో తెలుగులో సమాధానం ఇచ్చి సర్వే బుక్ చేస్తాను. 7 రోజుల టెస్ట్ ₹3,000 మాత్రమే — పని చేయకపోతే ఆపేద్దాం. ఒక పేజీ వివరాలు పంపొచ్చా?

### Objection handling (top 4)

1. **"We already use WhatsApp Business (auto-reply)."** Auto-reply is a static text — it can't hold a conversation. "Subsidy ఎంత?", "5kW price?", "survey free ah?" → dead end → customer leaves. We run the real Telugu conversation and *book the survey*. Test in parallel for a week: keep your auto-reply, we run a second line, compare booked surveys.
2. **"Too busy / no time."** That's exactly the leak — you're too busy to answer, so leads walk. Setup costs you 30 minutes; we run it from there; you just show up to surveys. Worst case you lose half an hour — the pilot is cancellable.
3. **"Prove it first."** Flip to per-survey pricing: ₹500–1,000 per *booked* survey, zero fixed fee for week 1. You pay only for results measured on your own enquiry flow. That is the proof.
4. **"Too expensive / why monthly?"** Do the math with them: one extra deal = ₹18,000–63,000 margin (ticket ₹1.2–1.8L × 15–35%). One recovered deal/month pays the entire service. You already spend ₹30–80k/month *buying* leads — we protect that spend from leaking out the back door.

**Close:** a refusal to pay is a **finding, not failure** — it tells us the perceived value doesn't clear the bar and positioning needs adjusting. Log it, don't fight it.

---

## 11. Automation Path

**Grow from proof (do this before any automation):**
1. Help one installer personally — deliver the 5-minute Telugu response + survey booking manually.
2. Repeat for the second and third paying installers.
3. Write the stable steps down (response playbook, qualification checklist, survey-booking flow).
4. Only then automate what is proven, boring, and daily.

**n8n blueprint (for the proven daily task):**

```
WhatsApp message (webhook)
        ↓
n8n workflow
        ↓
AI responder (Claude-based, Telugu + English)
  - answer within 5 min
  - qualify (project size, location, subsidy interest)
  - book site survey → confirmation to installer + customer
        ↓
CRM log (tracking sheet row auto-appended: response time, SLA, survey Y/N)
```

- Provider choices (WhatsApp Cloud API vs BSP) and calendar/CRM tools = decision points at build time, not now.
- Human review checkpoint: AI drafts → installer owner approves templates → automation only handles the approved conversation flow.

**Safety rules from the deck (apply to every automation):**
- **Read / draft / act** — start read-only, then drafts for approval, only then autonomous action.
- **Least freedom** — give the agent the minimum access it needs (one WhatsApp line, one sheet, one calendar).
- **Safe delivery map** — define exactly where output goes; no public or customer-facing sends without a human check.
- **Maintenance** — scheduled weekly review of responses, SLA, and the pass-gate metrics; kill switch if SLA drops.

---

## 12. Reusable Team-Workflow Blueprint (test any future idea the same way)

**The repeatable 10-step process — how this playbook was produced:**

1. **Score the problem** — 6 criteria, 0–2 each, 8+ = go. Two candidate framings scored head-to-head.
2. **Go oddly specific** — one region, one persona, one action. (AP/TS · owner-run installer · answer enquiries fast.)
3. **Reverse brief** — define the deliverable from the outcome the buyer pays for.
4. **Perplexity deep research — pain, not idea** — government data, market stats, buyer payment behavior, competitor landscape.
5. **Claude shaping — evidence in, bounded offer out** — verified facts → bounded offer (buyer · task · result · boundaries · questions · assumptions) + pricing from evidence.
6. **Idea verification** — team red-teaming: scorecard, buyer-access check, measurement model, contradiction hunt.
7. **Price from evidence** — cost of the problem (lost-deal math) × proven willingness to pay (existing spend).
8. **7-day test** — mystery-shopper probe first (decides if the pain is real), then outreach, then paid pilots.
9. **Grow from proof** — one → repeat → stable steps → expand.
10. **Automate if useful** — n8n on the proven daily task, with safety rules.

**Tooling used here (reuse for the next idea):**
- **Perplexity** — deep research on the pain (market size, conversion stats, payment benchmarks).
- **Claude** — shaping: evidence in, bounded offer + pricing + test design out.
- **Team agents** — buyer-access shortlist (41 companies, 5 channels), measurement model (26-column sheet, targets), verification (scorecard arithmetic, fact-checking).
- **Mystery-shopper probe** — the cheapest possible test of the core assumption; every future idea starts here.
- **7-day test structure** — probe → wave-1 outreach → wave-2 + onboard → review gate.
- **n8n** — automation of the proven daily task (WhatsApp API → AI responder → booking → CRM log).

**One rule for every future idea:** if you cannot write the offer sentence in the framework format, you are not ready to test.

---

*End of playbook. Execute Section 9 before Section 11 — proof first, automation second.*
