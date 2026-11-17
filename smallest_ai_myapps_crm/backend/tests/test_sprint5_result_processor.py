import pytest
import hmac
import hashlib
from app.redis_engine import redis_engine
from app.services.result_processor import WebhookResultProcessor

def test_sprint5_hmac_signature_validation():
    """Verify HMAC SHA256 signature verification."""
    secret = "smallest_webhook_secret_key"
    payload = b'{"event":"qualification_completed"}'
    sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    
    assert WebhookResultProcessor.verify_signature(payload, sig, secret) is True
    assert WebhookResultProcessor.verify_signature(payload, "invalid_sig", secret) is False

@pytest.mark.asyncio
async def test_sprint5_end_to_end_result_processing():
    """Verify end-to-end webhook processing, Redis lock acquisition, and CRM dispatch."""
    await redis_engine.connect()
    
    session_id = "call_sai_proc_999"
    payload = {
        "event": "qualification_completed",
        "contact_id": "CNT_PROC_999",
        "voice_session_id": session_id,
        "call_outcome": "BOOKED",
        "scoring": {"motivation": 3, "business_fit": 3, "commitment": 3, "capital_readiness": 3, "local_network": 3},
        "summary": "End-to-end verified lead."
    }

    # 1. First execution must succeed
    res1 = await WebhookResultProcessor.process_incoming_webhook(payload)
    assert res1["success"] is True
    assert res1["contact_id"] == "CNT_PROC_999"
    assert res1["event_processed"]["total_score"] == 15

    # 2. Replay execution MUST be dropped by Redis SETNX lock
    res2 = await WebhookResultProcessor.process_incoming_webhook(payload)
    assert res2["success"] is False
    assert res2["reason"] == "DUPLICATE_EVENT_BLOCKED"

    await redis_engine.close()
