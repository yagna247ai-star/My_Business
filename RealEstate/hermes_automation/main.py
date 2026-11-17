"""
Hermes Agent Real Estate Automation — Main Runner
Orchestrates Lead Generation, Speed-to-Lead, 90-day cadence, site visit scheduling, EMI calculations, and daily reporting.
"""

import os
import sys
import logging
from typing import Dict, Any

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from skills.lead_generator import LeadGeneratorSkill
from skills.lead_qualifier import LeadQualifierSkill
from skills.cadence_nurturer import CadenceNurturerSkill
from skills.site_visit_scheduler import SiteVisitSchedulerSkill
from skills.nri_remote_closing import NRIRemoteClosingSkill
from skills.emi_plot_matcher import EMIPlotMatcherSkill
from skills.tracker_sync import TrackerSyncSkill
from skills.market_intel_scanner import MarketIntelScannerSkill
from skills.sales_call_coach import SalesCallCoachSkill
from skills.lead_converter import LeadConverterSkill

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("hermes.main")

class HermesRealEstateAgent:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        memory_path = os.path.join(base_dir, "memory", "buyer_personas.json")
        projects_path = os.path.join(base_dir, "memory", "hyderabad_projects.json")
        tracker_path = os.path.join(base_dir, "..", "Abhinandhana Avenues", "Abhinandhana_Visit_Close_Tracker.xlsx")

        logger.info("Initializing Hermes Real Estate Autonomous Agent & Mama Lead Generator...")
        self.lead_generator = LeadGeneratorSkill(projects_path)
        self.qualifier = LeadQualifierSkill(memory_path)
        self.cadence = CadenceNurturerSkill()
        self.scheduler = SiteVisitSchedulerSkill()
        self.nri_closing = NRIRemoteClosingSkill()
        self.emi_matcher = EMIPlotMatcherSkill()
        self.tracker = TrackerSyncSkill(tracker_path)
        self.market_intel = MarketIntelScannerSkill()
        self.sales_coach = SalesCallCoachSkill()
        self.lead_converter = LeadConverterSkill()
        logger.info("All Hermes Skills (including Lead Generator, Sales Call Coach, and Lead Converter) successfully loaded.")

    def coach_sales_call(self, agent_name: str, transcript: str) -> str:
        """
        Runs the Sales Call Coach workflow to analyze Yagna's or other agents' call transcripts.
        """
        logger.info(f"Running sales call coaching workflow for {agent_name}...")
        return self.sales_coach.generate_coaching_report(agent_name, transcript)

    def convert_leads_to_contacts(self, source_path: str, target_path: str) -> Dict[str, Any]:
        """
        Runs the Lead Converter workflow to map raw leads to standard contacts format.
        """
        logger.info(f"Converting leads from {source_path} to {target_path}...")
        return self.lead_converter.convert(source_path, target_path)


    def generate_campaign_assets(self, corridor_id: str = "shankarpally_west") -> Dict[str, Any]:
        """
        Mama Hermes generates tailored social assets for Instagram, Facebook, and TikTok.
        """
        reel = self.lead_generator.generate_instagram_reel_script(corridor_id)
        fb_ad = self.lead_generator.generate_facebook_ad_copy(corridor_id)
        return {
            "corridor": corridor_id,
            "instagram_reel": reel,
            "facebook_ad": fb_ad
        }

    def handle_incoming_lead(self, lead_payload: Dict[str, Any]) -> Dict[str, Any]:
        lead_id = lead_payload.get("lead_id", "LEAD_1001")
        name = lead_payload.get("name", "Valued Buyer")
        location = lead_payload.get("location", "Hyderabad")
        budget = lead_payload.get("budget_lakhs", 15.0)
        residence = lead_payload.get("residence", "India")
        lang = lead_payload.get("language", "te_en")

        logger.info(f"Received new lead {lead_id} ({name}) from {location}")

        response_msg = self.qualifier.generate_instant_response(name, lang)
        persona = self.qualifier.classify_persona(location, budget, residence)

        self.tracker.update_lead_status(
            lead_id=lead_id,
            new_status="Qualified & Responded",
            notes=f"Persona: {persona['name']}, Budget: {budget}L"
        )

        return {
            "lead_id": lead_id,
            "instant_response_sent": True,
            "message_text": response_msg,
            "persona_assigned": persona["name"],
            "sla_seconds": 0.5
        }

    def generate_daily_report(self) -> str:
        sample_stats = {
            "total_leads_today": 22,
            "sla_adherence_pct": 100.0,
            "visits_booked": 8,
            "visits_attended": 7,
            "offers_made": 5,
            "tokens_collected_inr": 350000.0,
            "leak_warning": "Hyderabad Shankarpally & Shadnagar campaigns generated 22 leads with 100% SLA."
        }
        return self.tracker.generate_daily_executive_digest(sample_stats)


if __name__ == "__main__":
    agent = HermesRealEstateAgent()
    
    print("\n--- MAMA HERMES LEAD GENERATION ASSETS (HYDERABAD FOCUS) ---")
    assets = agent.generate_campaign_assets("shankarpally_west")
    print(f"Instagram Reel Hook: {assets['instagram_reel']['hook']}")
    print(f"Facebook Ad Headline: {assets['facebook_ad']['headline']}")
    
    print("\n--- SIMULATING HYDERABAD LEAD WORKFLOW ---")
    mock_lead = {
        "lead_id": "HYD_9901",
        "name": "Srinivas Rao",
        "location": "Gachibowli, Hyderabad",
        "budget_lakhs": 25.0,
        "residence": "India",
        "language": "te_en"
    }
    result = agent.handle_incoming_lead(mock_lead)
    print(f"Lead ID: {result['lead_id']}")
    print(f"Persona Assigned: {result['persona_assigned']}")
    print(f"Response Message:\n{result['message_text']}")
    
    print("\n--- SIMULATING SALES CALL COACHING WORKFLOW ---")
    mock_transcript = """
    Agent (Yagna): Hello, how are you doing today? Did you catch the cricket match over the weekend?
    Prospect: Yes, it was great!
    Agent (Yagna): Awesome. So why did you start your solar installer business? What's your business history?
    Prospect: We have been doing this for about 6 months, mostly in AP.
    Agent (Yagna): Got it. And what's your unique selling proposition or USP? What's your current performance?
    Prospect: We focus on quick residential rooftop installations. We get about 10 leads a week, but we struggle with response times.
    Agent (Yagna): Understood. We have an automation system that guarantees zero lead leakage. It includes an immediate welcome message, a 7-day nurturing sequence with client success stories, a booking calendar, and CRM tracking.
    Prospect: That sounds good. What are the costs?
    Agent (Yagna): For this partnership, you have some responsibilities. You need to follow up within 5 minutes (that's our SLA), prioritize appointments, pay ₹300-500/day for Meta ads and ₹1000-2000/month for WhatsApp. We also need feedback in our shared group.
    Prospect: Okay, and the pricing?
    Agent (Yagna): The standard price is ₹50,000 for 3 months, but we have a special privilege price of ₹25,000 if you commit today with a token advance.
    Prospect: Let me think.
    Agent (Yagna): We have two options: keep doing things manually or invest in this system.
    """
    coaching_report = agent.coach_sales_call("Yagna", mock_transcript)
    print(coaching_report)
    
    print("\n--- SIMULATING LEAD CONVERTER WORKFLOW ---")
    source_p = "/Users/apple/Documents/My_Business/leads_unzipped/ad1/ad1_Leads_2026-08-01_2026-08-04.csv"
    target_p = "/Users/apple/Documents/My_Business/contacts.csv"
    conv_result = agent.convert_leads_to_contacts(source_p, target_p)
    print(f"Conversion Result: {conv_result}")


