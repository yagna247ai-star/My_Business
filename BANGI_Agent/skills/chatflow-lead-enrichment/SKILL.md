---
name: chatflow-lead-enrichment
description: Chat Flow attached agent — on inbound ping captures phone, enriches FB/IG, scores 0-100, creates CRM record with notes, checks lead capability, and decides human handover. Drag-drop ready for Admin My Apps.
trigger: chat_flow.inbound_message
attach_to: Chat Flow
autonomy: suggest
---

# Chat Flow Lead Enrichment Agent — Skill

**Purpose:** Attach to **Chat Flow** workflow in Admin My Apps (drag-drop). On every inbound user ping (phone captured), it runs full outreach → analysis → CRM → FB/IG check → lead value → human handover decision.

## When it runs
- **Trigger:** `Chat Flow > On New Message` where `contact.phone` is present (WhatsApp / Chat Widget)
- **Condition:** `phone != empty` AND `message != empty`
- **Throttle:** once per `phone` per 10 min (dedup)

## What it does (7 steps, all logged to CRM Notes)

### 1) Capture & Normalize (Read/query — Runs)
- Extract: `phone` (E.164), `name` (if given), `first_message`, `channel` (WhatsApp/Widget), `timestamp`
- Normalize phone: strip `+91`, keep 10-digit, validate 6000000000-9999999999

### 2) Identity & Social Lookup (Read/query — Runs)
- **Generate search links** (no scraping, no hallucination — just URLs for human/agent to open):
  - `Facebook Search: https://www.facebook.com/search/top/?q=<name>_<phone_last4>`
  - `Instagram Search: https://www.instagram.com/explore/search/keyword/?q=<name>`
  - `Google Business: https://www.google.com/search?q=<name> + phone`
- **Phone → Profile enrichment** (optional APIs if keys set: `APOLLO_KEY`, `CLEARBIT_KEY`): reverse lookup → email → LinkedIn handle
- If no API keys, still writes search links to Notes

### 3) Full Profile Analysis (Read/query — Runs)
- Build profile dict:
```json
{
  "phone": "9198XXXXXX10",
  "name": "inferred from message/profile",
  "location": "from phone prefix / message",
  "business_tenure": "more_than_1_year|1_year|6_months|unknown",
  "profit_volume": "more_than_5_lakh|1_lakh_2_lakh|50k|unknown",
  "intent_signal": "fb_feed|instagram|whatsapp_ping",
  "digital_readiness": "custom_domain|business_gmail|standard_gmail"
}
```
- Extract via regex/NLP from first message (e.g., "run shop 2 years, profit 3 lakh" → tenure+profit)

### 4) CRM Record + Notes (Write/update — Approval in Suggest, Runs+notify in Act+Notify)
- **Create/Upsert Contact** in CRM (Hermes/HubSpot/Sheets — via `config.yaml: crm.provider`):
  - Fields: name, phone, email (if found), location, channel, first_message, fb_search_url, ig_search_url
  - **Notes section** (append-only, timestamped):
```
[2026-08-19 07:57 IST] Chat Flow ping — phone 9198XXXXXX10
Message: "Hi, need solar for shop"
FB: https://facebook.com/search/top/?q=...
IG: https://instagram.com/explore/search/...
Analysis: tenure=more_than_1_year, profit=more_than_5_lakh
Score: 87/100 (HOT)
Next: human call within 5 min (Telugu)
```
  - Deduplicate on `phone`

### 5) Lead Score 0-100 (Value for that lead) — Runs
**Model: Solar 13+yr expert (same as solar-lead-enricher) — total 100**
- **Business Tenure 25:** more_than_1_year=25, 1_year=18, 6_months=10, unknown=5
- **Profit Volume 25:** more_than_5_lakh=25, 1_lakh_2_lakh=18, 50k=10, unknown=5
- **Placement Intent 15:** WhatsApp ping=15, Facebook=15, Instagram=12
- **Digital Readiness 15:** custom domain=15, business gmail=12, standard gmail=8
- **Recency 20:** within 5 min=20, within 60 min=18, within 24h=12

**Tiers:** Platinum 85+ (HOT), Gold 65-84, Silver <65 — written to `lead_score` + `tier` fields + Notes.

### 6) Lead Capability Check (Write/update — Runs)
- Check **capacity to take on lead** before human call:
  - `budget_lakhs` inferred? If profit >5L → capability HIGH → can propose ₹3,000 7-day test / ₹500 per survey
  - `location` in serviceable corridor? (from `config.yaml: hermes.realestate_path`)
  - `finance_brain` check: if tenure <6 months → flag "needs nurturing, not immediate close"
- Output `capability: high|medium|low` + `max_proposal: ₹X` → written to CRM custom field `lead_capability`

### 7) Full Info + Human Handover Decision (Outbound — Approval in Suggest)
- **If score ≥75 (HOT) OR capability=high OR message asks custom negotiation → Escalate:**
  - Create task: `Human call — Telugu, within 5 min SLA`
  - Notify via `Approvals` tab + optional WhatsApp/Telegram to owner (via `GREEN_API_TOKEN` / `TELEGRAM_BOT_TOKEN` from `.env`)
  - Attach full packet: profile + FB/IG links + score + capability + notes
- **Else:** Enqueue nurture: 90-day cadence (7-day pilot) via `hermes.cadence`

## Outputs (written to CRM)
- Contact created/updated
- Notes appended with FB/IG links + analysis
- `lead_score` (0-100) + `lead_tier` + `lead_capability`
- `next_action`: `human_call_5min` | `nurture_90day`

## Drag-Drop Manifest for Admin My Apps

Import this JSON in **Admin My Apps → AI Suite → Skills → Import Skill**:

```json
{
  "skill_id": "chatflow-lead-enrichment-v1",
  "name": "Chat Flow Lead Enrichment",
  "version": "1.0.0",
  "description": "On Chat Flow ping, enriches FB/IG, scores, creates CRM record + notes, checks capability, decides human handover",
  "trigger": { "workflow": "Chat Flow", "event": "inbound_message", "condition": "phone != ''" },
  "autonomy_level": "suggest",
  "communication_tone": "Professional",
  "knowledge_brains": [
    "Solar buisness", "Sales Brain", "Marketing Brain", "Finance Brain",
    "Module: Email Marketing", "Module: WhatsApp", "Module: Workflows & Chatflows",
    "Module: Inbox", "Module: Prospecting", "Module: Chat Widget"
  ],
  "actions": [
    { "id": "capture_phone", "type": "read_query", "runs": true },
    { "id": "fb_ig_search", "type": "read_query", "runs": true, "output": "fb_search_url, ig_search_url" },
    { "id": "analyze_profile", "type": "read_query", "runs": true },
    { "id": "create_crm_record", "type": "write_update", "requires": "approval", "fields": ["phone","name","fb_search_url","ig_search_url"] },
    { "id": "score_lead_0_100", "type": "write_update", "runs": true, "model": "solar_13yr" },
    { "id": "check_capability", "type": "write_update", "runs": true },
    { "id": "outreach_decision", "type": "outbound_message", "requires": "approval", "condition": "score>=75" }
  ],
  "destructive_requires_approval": true
}
```

## Attach to Chat Flow (Drag-Drop Steps)
1. Admin → AI Suite → AI Agents → **Create Custom Agent** (fill Name e.g. `Chat Flow Enricher`, Tone `Professional`, Goal `Enrich every Chat Flow ping within 5 min and decide human handover`, Guided prompt `Handle Chat Flow pings: capture phone, enrich FB/IG, score lead 0-100, create CRM record with notes, check capability, decide human call`, Autonomy `Suggest`, attach 10 brains above → **Create Agent**
2. **Workflows → Chat Flow** → drag `Chat Flow Lead Enrichment` skill onto canvas → connect `On Message` → `Enrichment Skill` → `Condition: score>=75` → `Human Call` / `Nurture`
3. **Test Agent** → send test ping `Hi, need solar for shop 2 years 3 lakh profit 9876543210` → verify CRM Notes + score + FB/IG links appear → **Publish**

## Local Dev (BANGI) — Same Skill

```bash
# 1. Add skill file
mkdir -p skills/chatflow-lead-enrichment
# copy this SKILL.md there

# 2. Register in bangi_agent.py (hybrid router handles phone pings)
# already handles handle_incoming_lead → reuse for Chat Flow

# 3. Test
.venv/bin/python -c "
from backend.bangi_agent import BangiAgent
import asyncio
async def t():
  a=BangiAgent()
  # simulate Chat Flow inbound
  r=await a.handle_incoming_lead({'phone':'919876543210','name':'Test','message':'need solar shop 2 years profit 3 lakh','source':'chat_flow'})
  print(r)
asyncio.run(t())
"

# 4. Verify CRM notes + score written to ~/.bangi/events.jsonl and bangi.db
```

## Guardrails
- No scraping — only search **links** unless API keys present
- Telugu-first SLA 5 min for HOT leads (from solar-lead-enricher)
- Human handover if score≥75 or custom negotiation (same trigger as existing enricher)
- All writes logged to `events.jsonl` + `Approvals` when autonomy=Suggest
