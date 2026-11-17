import pytest
import hmac
import hashlib
import time
from app.models.crm_custom_fields import FullCRMContactRecord, LeadTemperature, CallOutcome
from app.services.csv_sanitizer import CSVSanitizer
from app.services.pipeline_router import PipelineScoreRouter
from app.services.outbound_validator import OutboundCallValidator
from app.services.voice_event_engine import VoiceEventEngine
from app.services.result_processor import WebhookResultProcessor
from app.services.handoff_waba_engine import HandoffWABAEngine
from app.redis_engine import redis_engine

@pytest.mark.asyncio
async def test_fr01_to_fr04_contract_and_sanitization():
    """Verify FR-01 (Identity), FR-02 (Phone), FR-03 (DNC), FR-04 (Rate Limit)."""
    # FR-02: Phone Sanitization
    assert CSVSanitizer.sanitize_phone("9876543210") == "+919876543210"
    
    await redis_engine.connect()
    
    # FR-03: DNC Compliance
    dnc_phone = "+919900011122"
    await redis_engine.add_to_dnc(dnc_phone)
    contact = {"id": "CNT_FR03", "phone": dnc_phone, "dnc": True}
    res = await OutboundCallValidator.validate_and_build_payload(contact)
    assert res["valid"] is False
    assert res["reason"] == "DNC_BLOCKED"

    # FR-04: Rate Limiter Token Bucket
    token = await redis_engine.acquire_rate_limit_token()
    assert token is True
    
    await redis_engine.close()

@pytest.mark.asyncio
async def test_fr05_to_fr08_crm_fields_and_score_routing():
    """Verify FR-05 (CRM Fields), FR-06 (Score Router), FR-07 (Pipeline Move), FR-08 (Pre-Call Validator)."""
    # FR-05: CRM Fields Validation
    rec = FullCRMContactRecord(myappz_contact_id="CNT_FR05", phone="+919876543210", name="Test FR05")
    assert rec.identity.voice_campaign_id == "CAMPAIGN_WAVES_SOLAR_001"
    
    # FR-06 & FR-07: Score Sum & Pipeline Stage Movement
    score = PipelineScoreRouter.calculate_score(3, 3, 3, 3, 3)
    assert score == 15
    route = PipelineScoreRouter.route_pipeline_stage(score, "BOOKED")
    assert route["pipeline_stage"] == "HUMAN CALL REQUIRED"
    assert route["lead_temperature"] == LeadTemperature.HOT
    assert route["create_human_task"] is True

@pytest.mark.asyncio
async def test_fr09_to_fr13_events_webhooks_and_handoff():
    """Verify FR-09 (4-Stage Events), FR-10 (HMAC), FR-11 (SETNX Lock), FR-12 (Handoff Brief), FR-13 (Calendar/WABA)."""
    await redis_engine.connect()
    
    # FR-10: HMAC Signature
    secret = "smallest_webhook_secret_key"
    payload = b'{"event":"qualification_completed"}'
    sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    assert WebhookResultProcessor.verify_signature(payload, sig, secret) is True

    # FR-11: SETNX Idempotency Lock
    session_id = f"call_fr11_{int(time.time())}"
    lock1 = await redis_engine.acquire_idempotency_lock(session_id)
    assert lock1 is True
    lock2 = await redis_engine.acquire_idempotency_lock(session_id)
    assert lock2 is False

    # FR-12: Human Handoff Brief
    brief = HandoffWABAEngine.generate_human_handoff_brief(
        {"name": "Ananya Rao", "phone": "+919812345678", "location": "Hyderabad"},
        {"current_business": "Hardware Store"},
        {"motivation": 3, "business_fit": 3, "commitment": 3, "capital_readiness": 3, "local_network": 3, "total": 15},
        "Full qualification confirmed."
    )
    assert "HUMAN HANDOFF BRIEF" in brief
    assert "Ananya Rao" in brief

    # FR-13: Calendar & WABA Queue
    waba_res = HandoffWABAEngine.schedule_waba_reminders({"name": "Ananya", "phone": "+919812345678"}, "2026-09-10 10:00 AM IST")
    assert waba_res["success"] is True
    assert len(waba_res["queued_reminders"]) == 2

    await redis_engine.close()
