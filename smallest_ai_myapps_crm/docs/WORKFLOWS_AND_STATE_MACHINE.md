# Workflows & Conversation State Machine Specification

## 1. Smallest AI Conversation State Machine

```text
       [START CALL]
            │
            ▼
      [CONNECTED]
            │
            ▼
     [PERMISSION CHECK]
            │
            ▼
     [DISCOVERY STAGE] ────(Opt Out)────► [DNC EXCLUSION]
            │
            ▼
   [QUALIFICATION & FIT]
            │
            ▼
   [VALUE BRIDGE OFFER] ───(Needs Info)──► [SEND QUOTE VIA EMAIL]
            │
            ▼
   [OBJECTION HANDLING]
            │
            ▼
   [BOOKING CONFIRMATION] ──(Confirmed)─► [DEMO SCHEDULED & WABA]
```

---

## 2. MyApps CRM Workflow Inventory (WF-01 to WF-08)

### WF-01: New Lead Intake & Phone Sanitization
- **Trigger**: New Lead Created or CSV Uploaded.
- **Action**: Sanitize E.164 phone number, verify DNC blacklist, set `Voice Call Status = READY`.

### WF-02: Voice Call Dispatch Trigger
- **Trigger**: Pipeline Stage changes to `VOICE CALL QUEUE`.
- **Action**: Check DNC registry $\rightarrow$ Acquire Redis Rate-Limiter Token $\rightarrow$ Call Smallest AI API.

### WF-03: Webhook Event Ingestion & SETNX Lock
- **Trigger**: Webhook received from Smallest AI.
- **Action**: Acquire Redis `SETNX` lock key `webhook:idempotency:{call_id}`. If lock exists, drop duplicate; otherwise process.

### WF-04: Hot Lead Immediate Handoff (Score $\ge 11$)
- **Trigger**: Lead Score $\ge 11$ & Sentiment = Positive.
- **Action**: Move Pipeline to `HUMAN CALL REQUIRED` $\rightarrow$ Create High-Priority Task for Closer.

### WF-05: Appointment Booking & WABA Confirmation
- **Trigger**: Outcome = `BOOKED`.
- **Action**: Create Calendar Booking $\rightarrow$ Trigger WhatsApp WABA Confirmation $\rightarrow$ Schedule T-24h & T-2h reminders.

### WF-06: Scheduled Callback Wait Queue
- **Trigger**: Lead requests Callback.
- **Action**: Store Callback DateTime $\rightarrow$ Wait until scheduled timestamp $\rightarrow$ Re-enter `VOICE CALL QUEUE`.

### WF-07: Warm Lead WhatsApp Nurture
- **Trigger**: Outcome = `NOT NOW` / `QUOTE REQUESTED`.
- **Action**: Move Pipeline to `QUOTE SENT` / `WARM NURTURE` $\rightarrow$ Trigger multi-touch WABA sequence.

### WF-08: DNC Exclusion & Opt-Out Handling
- **Trigger**: Lead Opts Out / DNC requested.
- **Action**: Add phone to Redis `dnc:blacklist` $\rightarrow$ Move Pipeline to `DO NOT CALL` $\rightarrow$ Cancel all active workflows.
