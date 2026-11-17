# WhatsApp Lead-Enrichment Workflow — Master Document (yagna Platform)

**System:** Trigger → Capture → Enrichment → Custom Message → Calendar Booking → One-on-One Call
**Platform:** yagna · **WABA:** +91 78160 05187 · BYOB Meta billing · Tier 250 conversations/day · Webhook ACTIVE · Messaging Health **BLOCKED** · Coexistence App+API
**Prospects:** Indian consumers/SMBs · Telugu + English
**Status:** Decision-ready. **Do not scale until Messaging Health is unblocked and the 10-lead pilot passes.**

---

## 1. Executive Summary + System Diagram

**What this system is:** every WhatsApp click — from Meta ads, the site, or Instagram — lands in one flow: auto-captured lead record → 10-minute enrichment → a custom message built from the enriched profile → a specific calendar slot booked → a one-on-one call. The yagna platform modules carry it end to end; the WABA tier and DPDP rules set the guardrails; humans take over exactly when a conversation turns into a meeting.

**Text flow (system diagram):**

```
CTWA / site / Instagram click  →  yagna Lead Generation (entry points)
        ↓  webhook (ACTIVE): auto-captures wa_id + profile.name + referral (ad_id, source_url, headline)
Lead Automation: lead record created → state = Captured
        ↓
Trigger first-response (≤5 min, EN/TE)  →  5-question qualification flow
        ↓
Enrichment (AI Suite, ≤10 min hard stop): priority H/M/L · social interest · budget band · pain points · intent stage
        ↓
Custom message (V1–V8, ≤15 min) built from enrichment profile
        ↓
Calendar booking (3 specific slots) → confirmation → reminders T-24h/T-1h
        ↓
ONE-ON-ONE CALL → Won / Nurture / Lost
EVERY TRANSITION HAS A TIMEOUT — no lead sits forever (24h/72h booking follow-ups, ≤24h no-show recovery, Nurture timeout)
```

**Design rules:**
1. **One conversation, one owner** — Coexistence App+API means the phone app and the API share the number; only the API responds during the flow to avoid double-replies.
2. **Fast ack, enriched follow-up** — the ≤5 min first response is a friendly ack; the *custom* message waits ≤10 min for enrichment and lands by ≤15 min.
3. **Unknown stays Unknown** — enrichment never guesses; missing fields are labeled and the message adapts.
4. **Tier cap discipline** — 250 conversations/day is a ceiling, not a target; tier routing protects it (Section 8).
5. **DPDP first** — consent-based processing only; no legitimate-interest cover; every first touch carries the privacy notice (Section 10).

---

## 2. Trigger Layer

**Entry points (yagna Lead Generation):**
- **Meta click-to-WhatsApp (CTWA)** — ad → WhatsApp; referral carries `ad_id`, `headline`, `source_url`.
- **Website widget/wa.me link** — referral carries `source_url` + page context.
- **Instagram** — bio link / DM button → WhatsApp; referral carries profile context.

**Webhook capture (Lead Automation — webhook ACTIVE):**
| Field | Source | Notes |
|---|---|---|
| `wa_id` | WhatsApp payload | Auto — never ask the prospect for their number |
| `profile.name` | WhatsApp payload | Auto; fallback ask **only** if generic/missing |
| `referral` (ad_id / source_url / headline) | Payload | Feeds source-quality scoring + A/B attribution |
| profile photo / About / last-seen | **NOT available** (official Meta) | Never rely on them; do not attempt workarounds |

**Rule:** capture happens automatically on click; the human-visible trigger script (Section 3) starts immediately inside the 24h opt-in window.

---

## 3. Capture Layer (Trigger Script + Qualification, EN + TE)

### 3.1 Trigger first-response (1–2 exchanges; never asks for phone)

**EN:**
> Hi [Name]! 👋 Thanks for reaching out — I'm [Agent] and I'll get you sorted fast. Quick one so I point you the right way: what's on your mind today — a problem you're trying to fix, pricing, or just exploring?

**TE:**
> హాయ్ [పేరు]! 👋 మాట్లాడినందుకు ధన్యవాదాలు — నేను [పేరు]. మీకు ఏ విషయంలో సహాయం కావాలో తెలుసుకుందాం: సమస్య పరిష్కారం కావాలా, ధరల గురించి అడగాలా, లేదా కేవలం తెలుసుకోవాలనుకుంటున్నారా?

**Name fallback (only if profile name generic — one line, never pushy):** EN: "And what should I call you?" · TE: "మిమ్మల్ని ఏ పేరుతో పిలవాలి?"

### 3.2 Five-question qualification flow (one at a time)

| # | Question (EN) | Question (TE) | Feeds field |
|---|---|---|---|
| 1 | "What's the main thing you're trying to fix or achieve here?" | "మీరు సాధించాలనుకునే ప్రధాన విషయం ఏమిటి?" | pain points + need context |
| 2 | "Just so I share the right options — which fits you best? (A) watch-my-cost (B) middle range (C) quality-first, budget is fine" | "సరైన ఆప్షన్లు చూపించడానికి — మీకు ఏది సరిపోతుంది? (A) తక్కువ ఖర్చు (B) మధ్యస్థం (C) క్వాలిటీ ముఖ్యం, బడ్జెట్ ఓకే" | budget band |
| 3 | "When are you hoping to move on this — this week, this month, or just planning ahead?" | "ఎప్పుడు మొదలుపెట్టాలనుకుంటున్నారు — ఈ వారమా, ఈ నెలలోనా, లేక ఆలోచనలోనే ఉన్నారా?" | intent stage + timeline |
| 4 | "Totally optional — which platform do you use most: Instagram, LinkedIn, or YouTube? Helps me send you the right examples." | "పూర్తిగా ఐచ్ఛికం — మీరు ఏ ప్లాట్ఫామ్ ఎక్కువ వాడతారు: ఇన్స్టాగ్రామ్, లింక్డ్ఇన్ లేదా యూట్యూబ్? సరైన ఉదాహరణలు పంపడానికి ఉపయోగపడుతుంది." | social-media interest |
| 5 | "Will you be deciding on this yourself, or is someone else part of the decision?" | "మీరే నిర్ణయం తీసుకుంటారా, లేక మరొకరు కూడా భాగమా?" | decision role |

**Guardrails:** Q4 optional + reason given · no OTP/payment/address requests · no private data beyond what the prospect volunteers · "exploring" is a valid answer that routes to nurture, not a dead end.

---

## 4. Enrichment Layer

### 4.1 Five-field schema (with derivation + confidence)

| Field | Values | Derivation rule | Confidence |
|---|---|---|---|
| **Call priority** | H / M / L | H = answered Q3 with near-term intent + decision role self, or H-trigger signals (source = CTWA, urgent language); M = engaged, mid timeline; L = exploring/no reply | High if derived from answers; Medium if inferred from signals; Low if Unknown |
| **Social-media interest** | Instagram / LinkedIn / YouTube / none | Q4 answer (direct) — highest confidence source | High when self-provided |
| **Budget band** | Price-sensitive / Mid / High | Q2 answer (A/B/C) — direct | High when self-provided |
| **Pain points** | Cost / Time / Complexity / Trust / other | Q1 answer + keyword categorization | High when self-provided |
| **Intent stage** | Now / Soon / Exploring | Q3 answer + booking behavior | High when self-provided |

**Rule: any field not derivable is marked `Unknown` — never guessed.**

### 4.2 Lookup playbook (≤10 min hard stop; fast path for H-priority)

1. **Consented/public sources only:** WhatsApp profile · yagna CRM history (prior conversations) · Google Places (business listings) · public social profiles.
2. **H-priority fast path:** run Google Places + CRM-history checks first (≤3 min), build the message, book — never let enrichment delay a hot lead's first response.
3. **Hard stop at 10 minutes** — ship the message with `Unknown` fields; enrichment resumes in the background and updates the record.
4. **Not allowed:** private-profile scraping, unofficial Truecaller-style APIs, bought lists (Section 10).

### 4.3 Scorecard (yagna AI Suite)

Enrichment output = 5 fields × confidence. The custom-message builder consumes **only** high/medium-confidence fields; low-confidence fields default to the neutral variant (V7). Every enrichment run is logged with source + confidence for audit (DPDP accountability).

---

## 5. Messaging Layer (Custom-Message Builder)

**Builder logic:** `priority` → urgency + CTA strength · `budget band` → cost framing · `pain point` → hook line · `social platform` → proof format (Instagram → reel-style, LinkedIn → case study, YouTube → walkthrough video, none → plain proof).

**Tone rules:** High priority = direct, time-anchored, ONE CTA · Medium = helpful, two options, low pressure · Low = value-first nurture, no CTA pressure · Price-sensitive = savings/cost framing only · Trust pain = third-party proof/guarantee.

**V1 — High · Price-sensitive · Cost pain · Instagram**
> "{name}, you asked about cost — here's the short version: most people in your situation start with the [entry option] and upgrade later. Here's a 30-sec breakdown of what it really costs vs. what you save: [reel link]. If that makes sense, grab a slot today — this week's prices hold till [day]. {timeline} work?"

**V2 — High · High budget · Time pain · LinkedIn**
> "{name}, since timing matters most to you — the [solution] runs on a [X]-day setup with a named point of contact. One client with the exact same constraint went live in [Y] days: [case study]. Want a 15-min slot today or tomorrow to check if we fit?"

**V3 — Medium · Mid budget · Complexity pain · YouTube**
> "No pressure, {name} — here's a 5-min walkthrough of how it actually works, start to finish: [video]. Two ways we can go from here: (a) you watch and tell me what's unclear, or (b) we grab a quick call and I answer it in 10 minutes. Either works."

**V4 — Medium · Price-sensitive · Trust pain · none**
> "{name}, fair to be cautious — a few things people check before trusting us: [guarantee], [verifiable reference], [number served]. No locked-in commitment until you're sure. Happy to send details or book a no-pressure call — your call."

**V5 — Low · Mid budget · Time pain · LinkedIn**
> "{name}, whenever you're ready — one thing worth knowing: the [solution] needs a [X]-day lead time, so starting early saves the rush later. I'll leave a short note here [link]. Ping me whenever you want the walkthrough."

**V6 — Low · Price-sensitive · Cost pain · Instagram**
> "{name}, you're not alone on the budget question — most people start by seeing the numbers on paper. Here's a simple cost-vs-savings sheet: [link]. If it makes sense when you're ready, we're one message away."

**V7 — Any · Any · "just exploring" · any platform (neutral default)**
> "{name}, exploring is smart. One useful thing to know while you look around: [one fact/checklist]. And when you're comparing options, bring the questions here — worst case you leave knowing exactly what to ask everyone else."

**V8 — High · High budget · Trust pain · YouTube**
> "{name}, you're comparing seriously, so here's the founder/team intro so you know who you'd be working with: [video]. After that, a 15-min call to go through your specifics — [slot options]. If we're not a fit, I'll tell you straight."

**Field map (every `{field}`):** name→`profile.name` · variant→`priority` · cost framing→`budget band` · hook→`pain points` · proof format→`social-media interest` · CTA wording→`intent stage`. **No field outside the enrichment schema is used.**

---

## 6. Booking Layer (Calendar)

**Booking CTA (2–3 specific slots — never open-ended):**
> EN: "Great — a quick 15-min call is all we need. I have: **Today 4 PM** · **Tomorrow 11 AM** · **Day after 5 PM**. Which works? I'll send the calendar link right here."
> TE: "మంచిది — 15 నిమిషాల కాల్ చాలు. స్లాట్లు: **ఈరోజు సాయంత్రం 4** · **రేపు ఉదయం 11** · **ఎల్లుండి సాయంత్రం 5**. ఏది సౌకర్యంగా ఉంది? క్యాలెండర్ లింక్ ఇక్కడే పంపుతాను."

**Confirmation:**
> EN: "Locked in, {name} — **{date} at {time}** 📅. What happens next: I'll send a reminder a day before; the call covers [your pain point] specifics and next steps. Reply 'change' anytime to reschedule."
> TE: "బుక్ అయింది, {name} — **{తేదీ} {సమయం}కి** 📅. తర్వాత ఏమి జరుగుతుంది: ఒక రోజు ముందు రిమైండర్ పంపుతాం; కాల్లో [మీ సమస్య] గురించి వివరంగా మాట్లాడతాం. రీషెడ్యూల్ కావాలంటే 'change' అని రాయండి."

**24h reminder (utility template — template category, not free-form):**
> EN: "Reminder: your call with [Agent] is **tomorrow at {time}**. Reply **'yes'** to confirm, **'change'** to reschedule."
> TE: "రిమైండర్: మీ కాల్ **రేపు {సమయం}కి**. కన్ఫర్మ్ చేయడానికి **'yes'** అని రాయండి, మార్చడానికి **'change'**."

**No-show recovery (≤24h; rebook once, then stop — no nagging):**
> EN: "You missed the call — no worries, life happens 😊. Rebook for **tomorrow same time**, or **{next slot}**? One message and it's done."
> TE: "కాల్ మిస్ అయింది — ఫర్వాలేదు 😊. **రేపు అదే సమయానికి** లేదా **{తర్వాత స్లాట్}**కి రీబుక్ చేద్దాం? ఒక్క మెసేజ్ చాలు."

---

## 7. State Machine + SLA Timers

| State | Trigger | Action | Timeout branch |
|---|---|---|---|
| **Click** | User taps entry point | Webhook captures wa_id + name + referral; lead record created | — |
| **Captured** | Record created | Trigger script ≤5 min; run qualification flow | 24h no reply → Nurture |
| **Enriched** | Q-flow answers + lookups | Enrichment ≤10 min hard stop; Unknown stays Unknown | — |
| **Messaged** | Custom message sent | V1–V8 by profile; ≤15 min from capture | Reply → booking CTA; 24h silence → follow-up |
| **Booked** | Slot chosen | Confirmation + calendar link | Booking follow-up at 24h / 72h → then Nurture |
| **Called** | Call happens | Reminders T-24h and T-1h | No-show recovery ≤24h (rebook once) |
| **Won / Nurture / Lost** | Outcome | Won → CRM close + referral ask; Nurture → value cadence; Lost → reason logged | Nurture timeout (config: 30 days) → Lost |

**SLA timers (hard):** first response **≤5 min** · enrichment **≤10 min** · custom message **≤15 min** · booking follow-ups **24h / 72h** · call reminders **T-24h / T-1h** · no-show recovery **≤24h** · Nurture → Lost **30 days (config)**.

---

## 8. Constraints (250/day Cap, 24h Window, BLOCKED Pre-Flight)

### 8.1 Tier routing (protects the 250 conversations/day cap)

| Tier | Share | Handling |
|---|---|---|
| **A — Full enrichment** | ≤40% | Complete 5-field enrichment + custom message + human-grade flow |
| **B — Auto + self-serve** | ~30% | Template-based auto replies + self-serve booking link, no full enrichment |
| **C — Acknowledge + queue** | ~30% | Friendly ack + queue for next-day reply (still inside window) |
| **Overload rule** | — | **At ≥80% cap utilization, ALL new leads → Tier C** |

### 8.2 24h window economics

- CTWA click = opt-in for that conversation; service replies are free inside the **24h window** — the entire trigger→booked flow fits in one window by design.
- Reminders use **utility templates** (different category/pricing class).
- *(Flag from prior verified research: Meta's free service-window pricing changes take effect 1 Oct 2026 — re-model conversation economics at that milestone before scaling.)*

### 8.3 Messaging Health BLOCKED — pre-flight checklist (10 items)

1. **Unblock ticket** — Messaging Health currently BLOCKED: open the case with Meta/BSP; identify the root cause (template rejection? opt-in complaints?) before any go-live.
2. **Template approval** — all marketing + utility templates approved before scale.
3. **Opt-in capture** — every entry point (CTWA, site, Instagram) captures explicit opt-in.
4. **Privacy notice** — DPDP notice at first touch + opt-out line in messages (Section 10).
5. **Webhook validation** — webhook ACTIVE confirmed; payload fields (wa_id, profile.name, referral) validated end-to-end.
6. **Sandbox 24h-window test** — full flow tested in sandbox inside the 24h window.
7. **10-lead pilot** — run the complete flow on 10 real leads before any scale.
8. **Cap-routing config** — Tier A/B/C thresholds tested at the routing level.
9. **Kill switch + escalation** — complaint/block spike response defined; kill switch tested.
10. **Coexistence check** — App+API coexistence confirmed: app auto-replies disabled so only the API responds; BYOB billing verified in Finance.

---

## 9. Metrics

### 9.1 Funnel targets (estimates)

| Transition | Target |
|---|---|
| Click → Captured | ≥60% |
| Captured → Enriched | ≥80% |
| Enriched → Messaged | ≥90% |
| Messaged → Booked | ≥20% |
| Booked → Attended | ≥60% |

**Cap ceiling:** 250 conv/day × 60% × 80% × 90% × 20% × 60% = **~13 attended calls/day** at full volume.

### 9.2 The 11 KPIs (formulas)

1. **Captured rate** — Captured / Clicks × 100
2. **Enrichment rate** — Enriched / Captured × 100
3. **Message send rate** — Custom messages sent / Enriched × 100
4. **Reply rate** — Replies / Messages sent × 100
5. **Booking rate** — Booked / Messaged × 100
6. **Attendance rate** — Called / Booked × 100
7. **Book→call velocity** — Median hours from Booked to Called
8. **Template spend ₹/day** — (marketing conversations × ₹1) + (utility conversations × ₹0.14)
9. **Cap utilization** — Conversations today / 250 × 100
10. **Enrichment median time** — Median minutes per enrichment run (target ≤10)
11. **Revenue** — Won deals × ticket value (Finance module)

### 9.3 A/B plan (V1 vs V2 message variants)

Stratified by tier (A/B/C), **n ≈ 1,090 per arm, ~3 weeks** runtime (metrics-design computation). Measure booking rate + reply rate per variant per tier. **Kill rule:** abort the arm on complaint/block spikes — compliance beats experimentation.

---

## 10. Compliance (DPDP)

- **DPDP Rules 2025 (final, notified Nov 2025):** consent-based processing only — **no legitimate-interest cover** for marketing messaging.
- **Opt-in:** a CTWA click = consent for that conversation (24h window). Every other entry point must capture its own explicit opt-in.
- **Allowed:** webhook auto-data (wa_id, profile.name, referral) · self-provided answers · public registries (Google Places / GST / MCA) — **all declared in the privacy notice**.
- **Not allowed:** bought lists · scraping private profiles · unofficial Truecaller-style APIs · unsolicited templates.
- **Penalty ceiling:** ₹250 crore — the cap-routing and kill-switch rules exist to stay far from it.
- **At first touch:** privacy notice + purpose statement. **In messages:** opt-out instruction. **Honored immediately:** opt-outs, no re-contact.

---

## 11. Build Roadmap (map to yagna modules)

| Step | Action | yagna modules |
|---|---|---|
| 1 | **Unblock Messaging Health** — root-cause the BLOCKED status with Meta/BSP; verify BYOB billing | Inbox (health) · Finance (billing) · Lead Management (settings) |
| 2 | **Templates + opt-in + privacy notice** — approve marketing/utility templates; capture opt-in on all entry points; add DPDP notice + opt-out | Lead Automation (templates) · AI Suite (message bank) · Lead Generation (opt-in fields) |
| 3 | **Webhook + trigger wiring** — validate webhook ACTIVE payloads (wa_id, name, referral) into lead records | Lead Generation (entry points) · Lead Automation (webhook → capture) |
| 4 | **Enrichment config** — 5-field schema, lookup playbook, confidence scoring | AI Suite (enrichment) · Lead Management (schema fields) |
| 5 | **10-lead pilot** — run the full flow on 10 real leads; measure against Section 9 funnel targets | Inbox (human replies) · Calendar (booking) · Sales (pipeline) |
| 6 | **Scale** — tier routing live, A/B V1 vs V2, KPI dashboard | Lead Automation (cap routing) · Sales (funnel) · Finance (template spend + revenue) |

**Gate before every step:** the previous step's metrics hold and Messaging Health stays healthy. **Nothing scales on a BLOCKED account.**

---

*End of workflow. Trigger → capture → enrichment → custom message → booking → call; every SLA timer, cap rule, and compliance guardrail above is traceable to the four design reports or flagged config/estimate.*
