# Data Contracts & API Specification

## 1. Identity Correlation Contract

Every outbound voice payload and inbound webhook payload MUST preserve this core identity contract:

```json
{
  "myappz_contact_id": "CONTACT_109283",
  "myappz_opportunity_id": "OPP_887211",
  "voice_session_id": "call_sai_998877",
  "phone": "+919876543210"
}
```

---

## 2. API Endpoints Contract

### API-01: Start Voice Call (`POST /api/calls/dispatch-single`)
```json
// Request Payload
{
  "name": "Rajesh Sharma",
  "phone": "+919876543210",
  "business": "10kW Rooftop Solar",
  "email": "rajesh@example.com"
}

// Response (200 OK)
{
  "call": {
    "success": true,
    "call_id": "call_sai_7a8b9c",
    "status": "Completed",
    "result": { ... }
  },
  "crm_sync": {
    "success": true,
    "status_code": 200,
    "pipeline_stage": "Demo Scheduled"
  }
}
```

### API-02: Qualification Webhook (`POST /api/webhooks/smallest-ai`)
```json
{
  "event": "qualification_completed",
  "call_id": "call_sai_7a8b9c",
  "contact_id": "CONTACT_109283",
  "opportunity_id": "OPP_887211",
  "call_outcome": "BOOKED",
  "crm_target_stage": "Demo Scheduled",
  "sentiment": "Positive",
  "interest_level": "High",
  "summary": "Customer requested 10kW system with battery. Appointment set for Tuesday 10 AM.",
  "action_items": [
    "Send calendar invite for Tuesday 10 AM",
    "Prepare preliminary design doc"
  ]
}
```

### API-03: CRM Pipeline Sync Webhook (`POST /api/webhooks/myapps-crm`)
```json
{
  "event": "voice_agent_call_completed",
  "call_id": "call_sai_7a8b9c",
  "lead_name": "Rajesh Sharma",
  "phone": "+919876543210",
  "pipeline_stage": "Demo Scheduled",
  "sentiment": "Positive",
  "ai_notes": "Customer requested 10kW system with battery."
}
```

### API-04: Idempotency Lock Check (`GET /api/webhooks/idempotency-check/{call_id}`)
```json
{
  "call_id": "call_sai_7a8b9c",
  "lock_active": true,
  "lock_key": "webhook:idempotency:call_sai_7a8b9c",
  "ttl_seconds_remaining": 86392
}
```
