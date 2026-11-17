# 📜 Sprint 1 Artifact: MyAppz CRM Data Model & Custom Field Specification

## 1. Executive Overview
Sprint 1 provisions the full CRM Custom Field Schema in MyAppz Gen 2 to capture structured voice qualification data across 5 domain categories.

---

## 2. Provisioned Custom Fields Catalog

### Category 1: Identity & Context
- `voice_campaign_id` (Text): Campaign identifier (`CAMPAIGN_WAVES_SOLAR_001`).
- `lead_source` (Dropdown): Lead origin (`Facebook Meta Lead Gen`, `Website Form`, `WhatsApp`).
- `referrer` (Text): Referring partner name.
- `location` (Text): Territory/district (`Andhra Pradesh / Telangana`).
- `current_business` (Text): Primary trade (`Electrical & Hardware Store`).

### Category 2: Qualification Fields
- `solar_experience` (Dropdown): `YES` / `NO` / `INDIRECT`.
- `customer_type` (Multi-select): `Homeowners`, `Electrical Customers`, `Commercial`.
- `customer_acquisition_channel` (Dropdown): `Referrals`, `Walk-in Store`, `Digital Ads`.
- `local_network` (Dropdown): Network strength (`Strong`, `Moderate`, `Weak`).
- `commitment_level` (Dropdown): `Full-Time Commitment`, `Serious Part-Time`, `Exploratory`.
- `investment_band` (Dropdown): `UNDER_1_LAKH`, `1_TO_2_LAKH`, `2_TO_5_LAKH`, `ABOVE_5_LAKH`.
- `start_timeline` (Dropdown): `WITHIN_30_DAYS`, `30_TO_60_DAYS`, `60_PLUS_DAYS`.
- `why_now` (Long Text): Customer motivation details.

### Category 3: AI Assessment & Lead Scoring
- `motivation_score` (Number 0–3): Need urgency score.
- `business_fit_score` (Number 0–3): Existing trade synergy.
- `commitment_score` (Number 0–3): Operational bandwidth.
- `capital_readiness_score` (Number 0–3): Liquidity & budget band.
- `local_network_score` (Number 0–3): Regional distribution reach.
- `total_voice_lead_score` (Number 0–15): Cumulative qualification score.
- `lead_temperature` (Dropdown): `HOT` (11–15), `WARM` (8–10), `MEDIUM` (5–7), `LOW` (0–4).
- `main_objection` (Dropdown): `NONE`, `PRICING`, `TIMELINE`, `COMPETITION`.

### Category 4: Call Control & Compliance
- `voice_call_status` (Dropdown): `QUEUED`, `IN PROGRESS`, `COMPLETED`, `FAILED`, `BLOCKED`.
- `last_voice_call_at` (DateTime): Last call timestamp.
- `callback_datetime` (DateTime): Scheduled callback date.
- `call_outcome` (Dropdown): `BOOKED`, `CALLBACK`, `NOT_NOW`, `DNC`.
- `dnc` (Boolean): Permanent opt-out status.
- `booking_status` (Dropdown): `CONFIRMED`, `PENDING`, `CANCELLED`.
- `booking_datetime` (DateTime): Agreed strategy call date.

### Category 5: Human Handoff Context
- `ai_call_summary` (Long Text): AI executive summary.
- `recommended_closer_angle` (Long Text): Strategic advice for human sales closer.
