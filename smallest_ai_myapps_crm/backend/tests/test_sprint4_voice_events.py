import pytest
from app.redis_engine import redis_engine
from app.services.voice_event_engine import VoiceEventEngine

@pytest.mark.asyncio
async def test_sprint4_call_queued_and_started_lifecycle():
    """Verify call_queued and call_started update CRM contact status in Redis."""
    await redis_engine.connect()
    
    contact_id = "CNT_EVT_100"
    session_id = "call_sai_evt_100"
    
    # Event 1: call_queued
    res1 = await VoiceEventEngine.process_event({
        "event": "call_queued",
        "contact_id": contact_id,
        "voice_session_id": session_id
    })
    assert res1["success"] is True
    assert res1["status"] == "QUEUED"
    
    # Event 2: call_started
    res2 = await VoiceEventEngine.process_event({
        "event": "call_started",
        "contact_id": contact_id,
        "voice_session_id": session_id
    })
    assert res2["success"] is True
    assert res2["status"] == "IN PROGRESS"
    
    await redis_engine.close()

@pytest.mark.asyncio
async def test_sprint4_qualification_completed_scoring():
    """Verify qualification_completed event calculates score and returns target pipeline route."""
    await redis_engine.connect()
    
    payload = {
        "event": "qualification_completed",
        "contact_id": "CNT_QUAL_200",
        "voice_session_id": "call_sai_qual_200",
        "call_outcome": "BOOKED",
        "scoring": {
            "motivation": 3,
            "business_fit": 3,
            "commitment": 3,
            "capital_readiness": 3,
            "local_network": 3
        },
        "summary": "Perfect 15 score lead."
    }
    
    res = await VoiceEventEngine.process_event(payload)
    assert res["success"] is True
    assert res["total_score"] == 15
    assert res["route"]["pipeline_stage"] == "HUMAN CALL REQUIRED"
    assert res["route"]["priority"] == "High"
    
    await redis_engine.close()
