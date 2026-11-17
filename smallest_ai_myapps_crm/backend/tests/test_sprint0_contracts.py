import pytest
import asyncio
from app.services.csv_sanitizer import CSVSanitizer
from app.redis_engine import redis_engine
from app.services.smallest_ai import SmallestAIService
from app.services.crm_webhook import CRMWebhookService

@pytest.mark.asyncio
async def test_sprint0_phone_sanitization():
    """Verify E.164 phone formatting rules in Sprint 0 data contract."""
    assert CSVSanitizer.sanitize_phone("9876543210") == "+919876543210"
    assert CSVSanitizer.sanitize_phone("+1 (555) 444-3333") == "+15554443333"
    assert CSVSanitizer.sanitize_phone("+91-9988776655") == "+919988776655"
    assert CSVSanitizer.sanitize_phone("123") == "+123"

@pytest.mark.asyncio
async def test_sprint0_identity_contract_parsing():
    """Verify CSV parsing extracts valid leads and flags invalid ones."""
    sample_csv = "Name,Phone,Business\nRajesh Sharma,9876543210,10kW Solar\nInvalid User,123,Short Phone\n"
    valid, invalid = CSVSanitizer.parse_and_validate(sample_csv)
    
    assert len(valid) == 1
    assert len(invalid) == 1
    assert valid[0]["phone"] == "+919876543210"
    assert valid[0]["name"] == "Rajesh Sharma"
    assert invalid[0]["reason"] == "Invalid or missing phone number format"

@pytest.mark.asyncio
async def test_sprint0_redis_idempotency_lock():
    """Verify Redis SETNX lock contract prevents duplicate webhook execution."""
    await redis_engine.connect()
    
    call_id = "test_call_sprint0_001"
    
    # First acquisition should succeed
    lock1 = await redis_engine.acquire_idempotency_lock(call_id, ttl_seconds=10)
    assert lock1 is True
    
    # Second acquisition for same call_id MUST fail
    lock2 = await redis_engine.acquire_idempotency_lock(call_id, ttl_seconds=10)
    assert lock2 is False
    
    await redis_engine.close()

@pytest.mark.asyncio
async def test_sprint0_dnc_blacklist_blocking():
    """Verify DNC blacklisted phone numbers are blocked before initiating outbound calls."""
    await redis_engine.connect()
    
    dnc_phone = "+919999000011"
    await redis_engine.add_to_dnc(dnc_phone)
    
    lead = {"id": "lead_dnc_test", "name": "Opt Out Lead", "phone": dnc_phone}
    res = await SmallestAIService.trigger_voice_call(lead)
    
    assert res["success"] is False
    assert res["status"] == "Blocked"
    assert "DNC" in res["reason"]
    
    await redis_engine.close()
