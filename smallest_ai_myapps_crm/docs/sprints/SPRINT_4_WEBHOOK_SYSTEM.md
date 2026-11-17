# 📜 Sprint 4 Artifact: Voice Event & Webhook System

## 1. Executive Overview
Sprint 4 establishes the multi-stage asynchronous voice event lifecycle system. Call progress updates in real-time without waiting for full call completion.

---

## 2. Voice Event Lifecycle Taxonomy

```text
[Smallest AI Event Stream]
         │
         ├──► Event 1: call_queued ────────► Voice Call Status = "QUEUED"
         │
         ├──► Event 2: call_started ───────► Voice Call Status = "IN PROGRESS", Last Voice Call At = NOW
         │
         ├──► Event 3: call_completed ─────► Voice Call Status = "COMPLETED", Record duration_seconds
         │
         └──► Event 4: qualification ──────► Extract Discovery Payload + Score Router + Pipeline Move
```

---

## 3. Qualification Webhook Payload Sample

```json
{
  "event": "qualification_completed",
  "contact_id": "CNT_109283",
  "opportunity_id": "OPP_887211",
  "voice_session_id": "call_sai_abc123",
  "call_outcome": "BOOKED",
  "qualification": {
    "current_business": "Electrical Shop",
    "solar_experience": "YES",
    "customer_type": ["Homeowners", "Electrical Customers"],
    "investment_band": "2_TO_5_LAKH",
    "start_timeline": "WITHIN_30_DAYS"
  },
  "scoring": {
    "motivation": 3,
    "business_fit": 3,
    "commitment": 2,
    "capital_readiness": 2,
    "local_network": 3,
    "total": 13,
    "temperature": "HOT"
  },
  "summary": "Strong candidate with active retail customer base."
}
```
