import pytest
import time
from app.redis_engine import redis_engine
from app.services.outbound_validator import OutboundCallValidator

@pytest.mark.asyncio
async def test_sprint3_valid_outbound_payload():
    """Verify valid lead builds complete Smallest AI outbound payload."""
    await redis_engine.connect()
    
    contact = {
        "id": "CNT_5500",
        "name": "Ananya Rao",
        "phone": "9812345678",
        "lead_source": "Website Form",
        "current_business": "Hardware Retail"
    }
    
    res = await OutboundCallValidator.validate_and_build_payload(contact)
    assert res["valid"] is True
    assert res["outbound_payload"]["phone"] == "+919812345678"
    assert res["outbound_payload"]["myappz_contact_id"] == "CNT_5500"
    
    await redis_engine.close()

@pytest.mark.asyncio
async def test_sprint3_dnc_blocking():
    """Verify DNC blacklisted lead is blocked during pre-call validation."""
    await redis_engine.connect()
    
    dnc_phone = "+919888877777"
    await redis_engine.add_to_dnc(dnc_phone)
    
    contact = {"id": "CNT_DNC", "phone": dnc_phone, "name": "DNC User"}
    res = await OutboundCallValidator.validate_and_build_payload(contact)
    
    assert res["valid"] is False
    assert res["reason"] == "DNC_BLOCKED"
    
    await redis_engine.close()

@pytest.mark.asyncio
async def test_sprint3_future_callback_waiting():
    """Verify pending callback in future instructs workflow to wait."""
    contact = {
        "id": "CNT_CB",
        "phone": "+919000111222",
        "name": "Callback User",
        "callback_datetime": time.time() + 3600  # 1 hour in future
    }
    res = await OutboundCallValidator.validate_and_build_payload(contact)
    assert res["valid"] is False
    assert res["reason"] == "CALLBACK_PENDING"
