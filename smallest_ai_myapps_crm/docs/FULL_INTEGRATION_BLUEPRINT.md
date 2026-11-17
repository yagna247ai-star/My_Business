# Full Integration Blueprint: MyAppz Gen 2 × Smallest AI Voice Agent

The goal is to build a closed-loop **Voice AI Qualification System**:

**Lead enters MyAppz → Voice AI calls → AI qualifies → structured data returns → CRM fields update → pipeline moves → WhatsApp/Calendar follow-up → human closer receives complete context.**

This uses the MyAppz Gen 2 system as the operating system: **CRM + Opportunity & Pipeline + Workflows + WABA + Calendar + AI Brain + AI Agents**.

---

# 1. Target Architecture

```text
                         ┌─────────────────────┐
                         │    MYAPPZ GEN 2     │
                         │                     │
                         │ CRM / Contacts      │
                         │ Opportunities       │
                         │ Pipeline            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  WORKFLOW ENGINE    │
                         │                     │
                         │ Trigger Voice Call  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │  INTEGRATION ORCHESTRATOR   │
                    │                             │
                    │ API Mapping                 │
                    │ Validation                  │
                    │ Retry / Logging             │
                    │ ID Correlation              │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                       ┌────────────────────┐
                       │    SMALLEST AI     │
                       │                    │
                       │ Voice Agent        │
                       │ Telugu/Hinglish    │
                       │ Conversation       │
                       └─────────┬──────────┘
                                 │
                     Call Events │
                                 ▼
                    ┌─────────────────────────────┐
                    │  INTEGRATION ORCHESTRATOR   │
                    │                             │
                    │ Normalize Results           │
                    │ Score Lead                  │
                    │ Route Outcome               │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              Update CRM       Move Pipeline    Trigger Workflow
                    │              │              │
                    ▼              ▼              ▼
              Custom Fields    Human Call       WABA
              Notes            Nurture         Calendar
              Call History     DNC             Tasks
```

---

# 2. Core Design Principle

## MyAppz is the Source of Truth

Smallest AI should **not become your CRM**.

MyAppz remains the master database for:
* Contact
* Phone
* Lead source
* Pipeline
* Opportunity
* Qualification
* Lead score
* Call history
* Booking status
* Follow-up status
* Do-not-call status

Smallest AI is the **voice execution layer**.

---

# 3. Recommended Integration Pattern

A **three-layer architecture**:

## Layer 1 — MyAppz
Business system owning Contacts, Custom Fields, Pipeline, Opportunity, Tasks, Calendar, WABA, Workflows, Reporting.

## Layer 2 — Integration Orchestrator (FastAPI Gateway)
Middleware owning Authentication, API transformation, Webhook validation, Retries, Error logging, Deduplication (Redis `SETNX`), Correlation IDs, State management.

## Layer 3 — Smallest AI
Voice execution owning Calling, Conversation, Qualification, Objection handling, Structured extraction, Call result, Transcript, Recording reference.

---

# 4. Sprint Plan (Sprints 0–6)

### SPRINT 0 — Solution Design & Data Contract
- Artifact 1: System Architecture
- Artifact 2: Lead Identity Contract (`myappz_contact_id`, `myappz_opportunity_id`, `voice_session_id`, `phone`)

### SPRINT 1 — MyAppz CRM Data Model
- Custom Field Specification (Identity, Qualification, AI Assessment, Call Control, Human Handoff).

### SPRINT 2 — Pipeline Architecture
- Pipeline Stages: `NEW LEAD` → `VOICE CALL QUEUE` → `CALL ATTEMPTED` → `CONNECTED` → `QUALIFICATION IN PROGRESS` → (`HOT`, `WARM`, `NOT NOW`, `DNC`).

### SPRINT 3 — Smallest AI Outbound Call Integration
- Workflow trigger & pre-call validation (DNC check, phone check, callback schedule check).

### SPRINT 4 — Voice Event & Webhook System
- Multiple event lifecycle: `call_queued`, `call_started`, `call_completed`, `qualification_completed`.

### SPRINT 5 — Result Processing Engine
- Webhook signature validation, duplicate check (Redis SETNX lock), score calculation, pipeline router (`BOOKED`, `CALLBACK`, `NOT NOW`, `DNC`).

### SPRINT 6 — WABA + Calendar + Human Handoff
- Booking confirmation, WhatsApp reminders (T-24h, T-2h), Human Handoff Brief generation.
