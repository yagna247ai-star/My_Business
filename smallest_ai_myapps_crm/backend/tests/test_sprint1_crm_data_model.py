import pytest
from app.models.crm_custom_fields import (
    FullCRMContactRecord,
    IdentityContext,
    QualificationDetails,
    AIAssessment,
    CallControl,
    HumanHandoff,
    LeadTemperature,
    CallOutcome,
    InvestmentBand
)

def test_sprint1_full_crm_record_validation():
    """Verify that Sprint 1 FullCRMContactRecord validates custom fields correctly."""
    record = FullCRMContactRecord(
        myappz_contact_id="CNT_9001",
        myappz_opportunity_id="OPP_9001",
        phone="+919876543210",
        name="Vikram Patel",
        ai_assessment=AIAssessment(
            motivation_score=3,
            business_fit_score=3,
            commitment_score=2,
            capital_readiness_score=3,
            local_network_score=2,
            total_voice_lead_score=13,
            lead_temperature=LeadTemperature.HOT
        ),
        call_control=CallControl(
            call_outcome=CallOutcome.BOOKED,
            booking_datetime="2026-09-10 11:00 AM IST"
        )
    )

    assert record.myappz_contact_id == "CNT_9001"
    assert record.ai_assessment.total_voice_lead_score == 13
    assert record.ai_assessment.lead_temperature == LeadTemperature.HOT
    assert record.qualification.investment_band == InvestmentBand.TWO_TO_FIVE_LAKH
    assert record.call_control.dnc is False
    assert record.human_handoff.ai_call_summary != ""

def test_sprint1_score_bounds_enforcement():
    """Verify pydantic enforces score constraints (0-3 subscores, 0-15 total)."""
    with pytest.raises(Exception):
        AIAssessment(motivation_score=5)  # Max allowed is 3

    with pytest.raises(Exception):
        AIAssessment(total_voice_lead_score=20)  # Max allowed is 15
