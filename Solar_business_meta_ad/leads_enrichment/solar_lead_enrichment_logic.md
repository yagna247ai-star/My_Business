# Solar Business Lead Enrichment & Scoring Logic Definition

## 1. Enrichment Data Schema (Target Fields)

To build a high-definition customer profile, the pipeline should collect and map data into the following fields:

### A. Core Contact & Identification
| Field | Data Source | Purpose |
| :--- | :--- | :--- |
| **Full Name** | WhatsApp/Social Search | Personalization in scripts and PPTs. |
| **Phone Number** | WhatsApp API | Primary key for identity bridging. |
| **Personal/Work Email** | Data Lookup (Apollo/Lusha) | Professional background verification. |
| **Geographic Location** | WhatsApp Metadata/Lookup | Logistics and regional rebate calculation. |

### B. Social Media Presence
| Field | Data Source | Purpose |
| :--- | :--- | :--- |
| **LinkedIn URL** | API Lookup | Professional credibility and decision-maker status. |
| **Instagram Handle** | Social Matching | Lifestyle analysis (B2C aesthetic preference). |
| **Social Bio/Interests** | Scraping | Extraction of "Hooks" for personalized messages. |

### C. Solar Intent & Financial Fit
| Field | Data Source | Purpose |
| :--- | :--- | :--- |
| **Home Ownership** | Real Estate API | Pre-requisite for solar installation. |
| **Monthly Bill Range** | WhatsApp Chat Flow | ROI calculation for the custom PPT. |
| **Financial Status** | Credit Scoring Tiers | Determining payment plan eligibility. |

---

## 2. Scoring Formulas

### A. LinkedIn Score (0 - 100)
Designed to measure the "Professional Clout" of the lead.
*   **Completeness (30 pts)**: Profile photo, detailed job history, and skills list.
*   **Network Strength (30 pts)**: 500+ connections and presence of shared industry connections.
*   **Engagement (20 pts)**: Posting or commenting frequency in the last 30 days.
*   **Seniority (20 pts)**: Role keywords (Owner, CEO, VP = 20; Manager = 15; Individual Contributor = 5).

### B. Final Lead Priority Score (0 - 100)
This score determines the calling order and resource allocation.
**Formula:** `Priority = (Intent * 0.45) + (Financial_Fit * 0.25) + (LinkedIn_Score * 0.20) + (Region_Fit * 0.10)`

*   **Intent (45%)**: Based on WhatsApp triggers. "System not running properly" = High Intent.
*   **Financial Fit (25%)**: Homeowner + high energy bill = High Fit.
*   **Social Clout (20%)**: Based on LinkedIn Score.
*   **Region Fit (10%)**: Proximity to existing service hubs.

---

## 3. "Old Profile" Enrichment Strategy (Identity Bridging)

To enrich a lead from a single WhatsApp interaction:
1.  **Reverse Phone Lookup**: Use the WhatsApp Phone Number to query professional databases (e.g., Clearbit, RocketReach).
2.  **Identity Graphing**: Link the retrieved Email to social handles (LinkedIn/Instagram) via third-party identity resolution APIs.
3.  **CRM Historical Merge**: Check the CRM for past interactions with this number/email. If a match is found, append historical "Pain Points" to the current session.

---

## 4. Priority Tiers for Sales Action
- **Platinum (85+)**: Immediate 1-on-1 personalized voice note + Custom PPT delivery within 1 hour.
- **Gold (65-84)**: Standard personalized script + Next-day follow-up call.
- **Silver (<65)**: Automated educational sequence via WhatsApp bot.
