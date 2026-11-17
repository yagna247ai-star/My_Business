import pytest
from app.services.handoff_waba_engine import HandoffWABAEngine

def test_sprint6_human_handoff_brief_generation():
    """Verify structured Human Handoff Brief text generation."""
    contact = {"name": "Rajesh Sharma", "phone": "+919876543210", "location": "Vijayawada"}
    qual = {"current_business": "Electrical Store", "investment_band": "2_TO_5_LAKH"}
    scoring = {"motivation": 3, "business_fit": 3, "commitment": 3, "capital_readiness": 3, "local_network": 3, "total": 15}
    summary = "Perfect 15 score lead ready for dealer contract."

    brief = HandoffWABAEngine.generate_human_handoff_brief(contact, qual, scoring, summary)
    
    assert "HUMAN HANDOFF BRIEF" in brief
    assert "Rajesh Sharma" in brief
    assert "Vijayawada" in brief
    assert "15/15 (HOT)" in brief
    assert "RECOMMENDED CLOSER ANGLE" in brief

def test_sprint6_calendar_and_waba_reminders():
    """Verify Calendar booking creation and WABA confirmation & reminder scheduling."""
    contact = {"id": "CNT_7700", "name": "Vikram Patel", "phone": "+919988776655"}
    booking_time = "2026-09-10 10:00 AM IST"

    cal_res = HandoffWABAEngine.schedule_calendar_booking("CNT_7700", booking_time)
    assert cal_res["success"] is True
    assert cal_res["status"] == "CONFIRMED"
    assert "cal_CNT_7700" in cal_res["booking_id"]

    waba_res = HandoffWABAEngine.schedule_waba_reminders(contact, booking_time)
    assert waba_res["success"] is True
    assert waba_res["waba_confirmation"]["status"] == "SENT_IMMEDIATELY"
    assert len(waba_res["queued_reminders"]) == 2
