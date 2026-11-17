"""
Hermes Agent Local Lead Generator & Qualifier
Generates and qualifies genuine leads for Hyderabad open plots locally.
Run via: uv run python generate_lead.py
"""

import os
import sys
import logging
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import HermesRealEstateAgent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("hermes.local_lead_generator")

def generate_local_genuine_leads():
    print("=" * 70)
    print("🤖 HERMES AGENT: LOCAL GENUINE LEAD GENERATOR & QUALIFIER")
    print("=" * 70)

    agent = HermesRealEstateAgent()

    # 1. Select Hyderabad Corridor & Generate Campaign Creative
    corridor_id = "shankarpally_west"
    print(f"\n📢 [STEP 1] Generating Social Campaign Assets for: {corridor_id.upper()}")
    campaign = agent.generate_campaign_assets(corridor_id)
    print(f"👉 Instagram Reel Hook: {campaign['instagram_reel']['hook']}")
    print(f"👉 CTA Trigger: {campaign['instagram_reel']['cta_trigger']}")
    print(f"👉 Facebook Ad Headline: {campaign['facebook_ad']['headline']}")

    # 2. Simulate Inbound Genuine Lead Response (from IG Reel / FB Lead Form)
    sample_leads = [
        {
            "lead_id": f"HYD_LEAD_{datetime.now().strftime('%M%S')}_1",
            "name": "Kalyan Varma",
            "location": "Tellapur / Gachibowli, Hyderabad",
            "profession": "Senior Software Engineer (Salesforce)",
            "budget_lakhs": 28.0,
            "preferred_plot_sqyd": 200,
            "residence": "Hyderabad, India",
            "source": "Instagram Reel (Shankarpally Corridor)",
            "language": "te_en"
        },
        {
            "lead_id": f"HYD_LEAD_{datetime.now().strftime('%M%S')}_2",
            "name": "Rajesh Kumar",
            "location": "Shamshabad / LB Nagar, Hyderabad",
            "profession": "Senior Business Analyst",
            "budget_lakhs": 15.0,
            "preferred_plot_sqyd": 150,
            "residence": "Hyderabad, India",
            "source": "Facebook Lead Form (Shadnagar RRR Corridor)",
            "language": "te"
        }
    ]

    print("\n" + "=" * 70)
    print("⚡ [STEP 2] INGESTING & QUALIFYING GENUINE LEADS (< 1 MIN SLA)")
    print("=" * 70)

    for lead_data in sample_leads:
        print(f"\n--- PROCESSING LEAD: {lead_data['name']} ({lead_data['lead_id']}) ---")
        print(f"📍 Location: {lead_data['location']} | Source: {lead_data['source']}")
        print(f"💰 Budget: ₹{lead_data['budget_lakhs']} Lakhs | Plot Target: {lead_data['preferred_plot_sqyd']} sq.yds")

        # Handle Lead Ingestion & Qualification
        result = agent.handle_incoming_lead(lead_data)
        print(f"\n👤 Assigned Persona: {result['persona_assigned']}")
        print(f"💬 Instant WhatsApp SLA Response:\n{result['message_text']}")

        # Build Custom Personal Rapport & EMI Breakdown
        sqyd_rate = 28000 if "shankarpally" in lead_data['source'].lower() else 12500
        emi_msg = agent.emi_matcher.format_emi_summary_message(
            lead_name=lead_data['name'],
            plot_size_sqyd=lead_data['preferred_plot_sqyd'],
            sqyd_rate=sqyd_rate,
            down_payment_pct=20.0
        )
        print(f"\n{emi_msg}")

        rapport_script = agent.lead_generator.build_personal_rapport_script(
            lead_name=lead_data['name'],
            profession=lead_data['profession'],
            preferred_corridor=corridor_id
        )
        print(f"\n{rapport_script}")

        # Schedule Site Visit Confirmation
        booking_msg = agent.scheduler.format_booking_confirmation(
            lead_name=lead_data['name'],
            visit_date="This Sunday, 10:00 AM",
            visit_time="10:00 AM IST",
            pickup_location="Miyapur Metro Station (Exit Gate 2)" if sqyd_rate > 20000 else "LB Nagar Metro Station",
            driver_details="White Swift Dzire (TS 08 EK 4321) — Driver Ramesh"
        )
        print(f"\n{booking_msg}")
        print("-" * 50)

    print("\n" + "=" * 70)
    print("📈 [STEP 3] DAILY GM SALES SUMMARY DIGEST")
    print("=" * 70)
    print(agent.generate_daily_report())

if __name__ == "__main__":
    generate_local_genuine_leads()
