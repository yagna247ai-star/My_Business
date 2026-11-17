# 📜 Sprint 2 Artifact: Pipeline Architecture & Score Router Specification

## 1. Executive Overview
Sprint 2 delivers the automated Pipeline Stage Router and Lead Scoring Matrix. Deals move visually across MyAppz CRM stages based on aggregate score thresholds and conversation outcome codes.

---

## 2. Pipeline Visual Stage Topology

```text
NEW LEAD
   │
   ▼
VOICE CALL QUEUE
   │
   ▼
CALL ATTEMPTED / CONNECTED
   │
   ▼
QUALIFICATION IN PROGRESS
   │
   ├──────► Score 11–15 (HOT) ────► HUMAN CALL REQUIRED (High Priority Task)
   │
   ├──────► Score 8–10 (WARM) ───► WARM NURTURE (Tag: voice-qualified, WABA)
   │
   ├──────► Score 5–7 (MEDIUM) ──► NURTURE (Standard Email/Content)
   │
   ├──────► Score 0–4 (LOW) ─────► NOT NOW / NO FIT
   │
   └──────► Outcome DNC ─────────► DO NOT CALL (DNC=true, Workflows Cancelled)
```

---

## 3. Outcome Routing Decision Table

| Call Outcome | Score Range | Temperature | Target Pipeline Stage | Automated Trigger Actions |
| :--- | :--- | :--- | :--- | :--- |
| `BOOKED` | 11–15 | `HOT` | **HUMAN CALL REQUIRED** | Create High-Priority Task for Closer, Calendar Booking, WABA Confirmation, T-24h & T-2h Reminders |
| `QUALIFIED` | 8–10 | `WARM` | **WARM NURTURE** | Tag `voice-qualified`, Trigger WABA Dealer Nurture Sequence |
| `NOT_NOW` | 5–7 | `MEDIUM` | **NURTURE** | Add to Monthly Newsletter Queue |
| `NO_FIT` | 0–4 | `LOW` | **NOT NOW / NO FIT** | Mark Lead Closed / No Fit |
| `DNC` | Any | `LOW` | **DO NOT CALL** | Set `dnc=True`, Add to Redis Blacklist, Cancel pending tasks |
| `CALLBACK` | Any | `MEDIUM` | **CALLBACK QUEUE** | Store Callback DateTime, Wait & Re-trigger Voice Queue |
