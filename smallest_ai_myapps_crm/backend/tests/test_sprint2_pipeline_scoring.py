import pytest
from app.services.pipeline_router import PipelineScoreRouter
from app.models.crm_custom_fields import LeadTemperature

def test_sprint2_score_calculation():
    """Verify 5 sub-scores sum accurately to total score."""
    score = PipelineScoreRouter.calculate_score(3, 3, 2, 3, 2)
    assert score == 13

def test_sprint2_hot_lead_routing():
    """Verify score >= 11 routes to 'HUMAN CALL REQUIRED' with High Priority Task."""
    route = PipelineScoreRouter.route_pipeline_stage(score=13, call_outcome="BOOKED")
    assert route["pipeline_stage"] == "HUMAN CALL REQUIRED"
    assert route["lead_temperature"] == LeadTemperature.HOT
    assert route["priority"] == "High"
    assert route["create_human_task"] is True
    assert route["waba_nurture"] is True

def test_sprint2_warm_lead_routing():
    """Verify score 8-10 routes to 'WARM NURTURE'."""
    route = PipelineScoreRouter.route_pipeline_stage(score=9, call_outcome="QUALIFIED")
    assert route["pipeline_stage"] == "WARM NURTURE"
    assert route["lead_temperature"] == LeadTemperature.WARM
    assert route["create_human_task"] is False
    assert route["waba_nurture"] is True

def test_sprint2_dnc_override_routing():
    """Verify DNC call outcome overrides score and sets DO NOT CALL stage with DNC flag."""
    route = PipelineScoreRouter.route_pipeline_stage(score=15, call_outcome="DNC")
    assert route["pipeline_stage"] == "DO NOT CALL"
    assert route["dnc_flag"] is True
    assert route["target_action"] == "STOP_ALL_WORKFLOWS"
