import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.redis_engine import redis_engine

client = TestClient(app)

def test_api_root():
    """Verify API Gateway root health endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Smallest AI" in data["app"]

def test_api_config_get_and_post():
    """Verify /api/config GET and POST settings router."""
    # 1. GET config
    get_res = client.get("/api/config")
    assert get_res.status_code == 200
    config_data = get_res.json()
    assert "smallest_ai_api_key" in config_data
    assert "myapps_crm_webhook_url" in config_data

    # 2. POST update config
    update_payload = {
        "smallest_ai_api_key": "key_test_updated_12345",
        "smallest_ai_agent_id": "agent_test_updated_001",
        "myapps_crm_webhook_url": "https://api.myapps.crm/v1/test-webhook",
        "rate_limit_per_sec": 15,
        "mock_mode": True
    }
    post_res = client.post("/api/config", json=update_payload)
    assert post_res.status_code == 200
    assert post_res.json()["config"]["smallest_ai_agent_id"] == "agent_test_updated_001"

def test_api_calls_parse_csv_endpoint():
    """Verify /api/calls/parse-csv file upload router."""
    csv_content = "Name,Phone,Business\nRajesh Sharma,9876543210,10kW Solar\nAnanya Rao,9812345678,Audit\n"
    files = {"file": ("leads.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    
    res = client.post("/api/calls/parse-csv", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["valid_count"] == 2
    assert data["valid_leads"][0]["phone"] == "+919876543210"

def test_api_calls_dispatch_single_endpoint():
    """Verify /api/calls/dispatch-single router triggers call and CRM webhook sync."""
    payload = {
        "name": "Vikram Patel",
        "phone": "9988776655",
        "business": "Rooftop Battery Storage",
        "email": "vikram@example.com"
    }
    res = client.post("/api/calls/dispatch-single", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["call"]["success"] is True
    assert data["crm_sync"]["success"] is True
    assert "Demo Scheduled" in data["crm_sync"]["pipeline_stage"] or "Quote Sent" in data["crm_sync"]["pipeline_stage"] or "Opted Out" in data["crm_sync"]["pipeline_stage"]

def test_api_calls_dispatch_batch_endpoint():
    """Verify /api/calls/dispatch-batch router handles multiple leads."""
    batch_payload = {
        "leads": [
            {"id": "batch_1", "name": "Lead One", "phone": "9111222333", "business": "Solar Retail"},
            {"id": "batch_2", "name": "Lead Two", "phone": "9444555666", "business": "Commercial Audit"}
        ]
    }
    res = client.post("/api/calls/dispatch-batch", json=batch_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_dispatched"] == 2
    assert data["successful_calls"] == 2

def test_api_webhooks_smallest_ai_and_crm():
    """Verify /api/webhooks/smallest-ai and /api/webhooks/myapps-crm routers."""
    webhook_payload = {
        "event": "qualification_completed",
        "call_id": "call_test_router_999",
        "contact_id": "CNT_ROUTER_999",
        "lead_name": "Router Test Lead",
        "phone": "+919876543210",
        "crm_target_stage": "Demo Scheduled",
        "sentiment": "Positive",
        "summary": "Webhook test summary"
    }
    
    res = client.post("/api/webhooks/smallest-ai", json=webhook_payload)
    assert res.status_code == 200
    assert res.json()["status"] == "Webhook Received"

    crm_res = client.post("/api/webhooks/myapps-crm", json=webhook_payload)
    assert crm_res.status_code == 200
    assert crm_res.json()["status"] == "Accepted"

def test_api_devils_advocate_simulation_endpoints():
    """Verify Devil's Advocate interactive simulation routers."""
    # 1. Rate limit crash simulation
    res_rl = client.post("/api/devils-advocate/simulate/rate-limit")
    assert res_rl.status_code == 200
    assert res_rl.json()["scenario"] == "Smallest AI API Rate Limit (429)"

    # 2. Webhook replay crash simulation
    res_rp = client.post("/api/devils-advocate/simulate/webhook-replay")
    assert res_rp.status_code == 200
    assert res_rp.json()["attempt_2_replay"]["status"] == "Blocked_Duplicate"

    # 3. CRM down simulation
    res_crm = client.post("/api/devils-advocate/simulate/crm-down")
    assert res_crm.status_code == 200

    # 4. DNC violation simulation
    res_dnc = client.post("/api/devils-advocate/simulate/dnc-violation")
    assert res_dnc.status_code == 200
    assert res_dnc.json()["result"]["status"] == "Blocked"

    # 5. Audit report endpoint
    res_audit = client.get("/api/devils-advocate/audit-report")
    assert res_audit.status_code == 200
    assert res_audit.json()["system_status"] == "OPERATIONAL"
