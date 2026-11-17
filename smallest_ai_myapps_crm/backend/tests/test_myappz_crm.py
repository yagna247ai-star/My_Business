import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_fetch_myappz_leads():
    response = client.get("/api/myappz/leads")
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "MyAppz CRM"
    assert "leads" in data
    assert len(data["leads"]) > 0

def test_myappz_lead_workflow_trigger():
    payload = {
        "contact": {
            "myappz_contact_id": "CNT_TEST_99",
            "name": "Test User",
            "phone": "+919840066397",
            "business": "Test Solar Shop",
            "city": "Vijayawada"
        }
    }
    response = client.post("/api/myappz/trigger-lead-call", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Accepted"
    assert data["lead_received"]["phone"] == "+919840066397"
    assert "call_dispatch" in data

def test_sync_and_dispatch_batch():
    response = client.post("/api/myappz/sync-and-dispatch-batch?stage=New Inquiry&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "successful_dispatches" in data
