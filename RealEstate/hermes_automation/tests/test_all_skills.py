"""
Comprehensive Test Suite for Hermes Agent Real Estate Automation (including Mama Hermes Lead Generator)
Run via: uv run pytest
"""

import os
import sys
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
from main import HermesRealEstateAgent

@pytest.fixture
def memory_path():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "memory", "buyer_personas.json")

@pytest.fixture
def projects_path():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "memory", "hyderabad_projects.json")

def test_lead_generator(projects_path):
    generator = LeadGeneratorSkill(projects_path)
    reel = generator.generate_instagram_reel_script("shankarpally_west")
    assert "Shankarpally" in reel["visual_direction"] or "HMDA" in reel["voiceover_script"]
    
    fb = generator.generate_facebook_ad_copy("shadnagar_south")
    assert "Shadnagar" in fb["headline"]

def test_lead_qualifier_classification(memory_path):
    qualifier = LeadQualifierSkill(memory_path)
    gulf = qualifier.classify_persona("Kurnool", 15.0, "Kuwait")
    assert gulf["id"] == "gulf_nri"

def test_emi_plot_matcher():
    matcher = EMIPlotMatcherSkill()
    result = matcher.calculate_emi(1500000.0, 20.0, 36, 10.5)
    assert result["total_plot_price"] == 1500000.0
    assert result["down_payment_amount"] == 300000.0

def test_sales_call_coach():
    coach = SalesCallCoachSkill()
    mock_transcript = "Hello, how are you? Let's talk about cricket. What's your business history and USP? Standard price is 50,000 but we have a special privilege price of 25,000 with a token advance."
    analysis = coach.analyze_transcript(mock_transcript)
    assert analysis["overall_score"] > 0
    assert "special privilege" in mock_transcript.lower()

def test_hermes_agent_end_to_end():
    agent = HermesRealEstateAgent()
    lead_payload = {
        "lead_id": "TEST_HYD_100",
        "name": "Kalyan Kumar",
        "location": "Tellapur, Hyderabad",
        "budget_lakhs": 30.0,
        "residence": "India",
        "language": "te_en"
    }
    result = agent.handle_incoming_lead(lead_payload)
    assert result["instant_response_sent"] is True
    assert result["lead_id"] == "TEST_HYD_100"

def test_lead_converter():
    converter = LeadConverterSkill()
    source_p = "/Users/apple/Documents/My_Business/leads_unzipped/ad1/ad1_Leads_2026-08-01_2026-08-04.csv"
    target_p = "/Users/apple/Documents/My_Business/contacts.csv"
    res = converter.convert(source_p, target_p)
    assert res["success"] is True
    assert res["processed_count"] > 0
    assert os.path.exists(target_p)

