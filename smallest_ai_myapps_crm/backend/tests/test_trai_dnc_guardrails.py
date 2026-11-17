import pytest
from app.services.outbound_validator import OutboundCallValidator
from app.redis_engine import redis_engine

@pytest.mark.asyncio
async def test_trai_emergency_number_blocking():
    contact = {"name": "Emergency Test", "phone": "100", "bypass_time_window": True}
    res = await OutboundCallValidator.validate_and_build_payload(contact)
    assert not res["valid"]
    assert res["reason"] == "TRAI_EMERGENCY_NUMBER_BLOCKED"

@pytest.mark.asyncio
async def test_trai_dnc_blacklist_blocking():
    phone = "+919988776655"
    await redis_engine.add_to_dnc(phone)

    contact = {"name": "DNC User", "phone": phone, "bypass_time_window": True}
    res = await OutboundCallValidator.validate_and_build_payload(contact)
    assert not res["valid"]
    assert res["reason"] == "DNC_BLOCKED"

@pytest.mark.asyncio
async def test_trai_frequency_cap_and_cooldown():
    phone = "+919840011223"
    
    # 1. First attempt should succeed (with time window bypass for unit test)
    contact = {"name": "Frequency Test", "phone": phone, "bypass_time_window": True}
    res1 = await OutboundCallValidator.validate_and_build_payload(contact)
    assert res1["valid"]

    # Record first call attempt in Redis
    await redis_engine.record_call_attempt(phone)

    # 2. Second attempt within 4 hours should be blocked by TRAI Cooldown
    res2 = await OutboundCallValidator.validate_and_build_payload(contact)
    assert not res2["valid"]
    assert res2["reason"] == "TRAI_COOLDOWN_ACTIVE"
