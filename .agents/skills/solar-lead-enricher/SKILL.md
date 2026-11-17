---
name: solar-lead-enricher
description: Deep market research, profile identification, 0-100 scoring, Telugu/English personalized script generation, and 47-column dataset enrichment for AP/TS solar installer leads.
---

# Solar Lead Enricher & Personalization Skill

This skill provides an end-to-end framework for enriching raw Meta/Google solar lead form CSV exports, performing deep market intelligence, calculating 13+ year expert lead scores, generating personalized call scripts in Telugu & English, and outputting structured 47-column CRM-ready datasets.

## Core Capabilities

1. **Generic Entity Extraction (`extract_business_name`)**:
   - Algorithmic, non-hardcoded NLP method that tokenizes email prefixes, inspects custom domains, performs compound subword segmentation (e.g. `renusunsolarsystems` → *Renu Sun Solar Systems*, `manasaaenterprises2024` → *Manasaa Enterprise Solar*, `sssolarenergy` → *SS Solar Energy*), and formats generic entity fallbacks for any user or campaign.

2. **Digital & Social Profile Search Link Generation**:
   - Computes Facebook, Instagram, LinkedIn, and Google Business/Maps search query URLs for lead entities based on extracted company name, full name, email, and phone.

2. **13+ Years Solar Industry Lead Scoring Model (0–100)**:
   - **Business Tenure (25 pts)**: `more_than_1_year` (25 pts), `1_year` (18 pts), `6_months` (10 pts).
   - **Profit Volume (25 pts)**: `more_than_5_lakh` (25 pts), `1_lakh_-2_lakh` (18 pts), `50k` (10 pts).
   - **Placement Intent (15 pts)**: Facebook feed/form (15 pts), Instagram (12 pts).
   - **Digital Readiness (15 pts)**: Custom domain email (15 pts), Business Gmail (12 pts), Standard Gmail (8 pts).
   - **Recency/Responsiveness (20 pts)**: Recency within current campaign window (18 pts).

3. **Bespoke Script & Hook Synthesizer**:
   - Generates customized Telugu call scripts featuring localized greetings, tenure/profit references, 5-minute SLA pitch, ₹3,000 7-day test / ₹500 per survey offer, and objection handling.
   - Generates parallel English call scripts for bilingual sales reps.

4. **Workflow State & Pipeline Routing**:
   - Assigns initial pipeline state (`New Lead - Ready for Immediate Outreach`), SLA targets (≤5 min median / ≤60 min hard max), Hermes AI vs Human handover triggers, and nurture track assignments.

## Usage Instructions

To enrich a new solar lead CSV file:
```bash
python3 enrich_solar_leads.py
```
Outputs generated:
- `enriched_leads_master.csv`: Full 47-column CSV dataset (UTF-8).
- `enriched_leads_report.html`: Visual filterable HTML dashboard.

## Guardrails & Non-Hallucination Protocol

- **Strict Fact-Sheet Bounding**: Figures, pricing bands, and subsidy numbers must strictly use authorized numbers from the client fact sheet.
- **Telugu-First SLA**: First contact must be initiated in Telugu within 5 minutes of enquiry arrival.
- **Human Handover Triggers**: Leads scoring ≥75 (HOT Tier) or requesting custom contract negotiation must be immediately escalated to human installer owners.
