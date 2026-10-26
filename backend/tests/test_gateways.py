"""
Tests for Telecom SMS Gateway and Statutory Banking / Cybercrime Gateways.
Verifies DLT compliance, interbank freeze reference generation, and 1930 portal e-filing.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.sms_service import sms_service

client = TestClient(app)


@pytest.mark.asyncio
async def test_sms_service_format_and_dispatch():
    res = await sms_service.send_emergency_alert(
        contact_name="Rajesh Sharma",
        phone_number="+91 98765 43210",
        threat_title="CBI Digital Arrest Threat",
        risk_level="CRITICAL",
        incident_id="SA-TEST-998811"
    )
    assert res["status"] == "DELIVERED"
    assert "DLT-IN-" in res["carrier_message_id"]
    assert res["dlt_template_id"] == "1407168923481729012"
    assert "SA-TEST-998811" in res["message"]
    assert "[SATARK SAATHI ALERT]" in res["message"]


def test_carrier_sms_logs_endpoint():
    response = client.get("/api/alerts/carrier-logs")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["dlt_registered_sender"] == "SATARK"
    assert isinstance(data["recent_dispatches"], list)


def test_submit_bank_freeze_endpoint():
    payload = {
        "bank_name": "State Bank of India",
        "account_number_last4": "4491",
        "transaction_amount": 75000.0,
        "suspect_vpa_or_account": "cyber-crook@fakeupi",
        "utr_number": "UTR9988221100"
    }
    response = client.post("/api/recovery/submit-bank-freeze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "BF-STAT-" in data["freeze_reference"] or "BF-SBI-" in data["freeze_reference"] or "BF-STAT" in data["freeze_reference"]
    assert data["status"] == "INTERBANK_LIEN_INITIATED"
    assert "NPCI / CFCFRMS" in data["gateway_protocol"]


def test_submit_cybercrime_portal_endpoint():
    payload = {
        "complaint_text": "Victim was subjected to digital arrest extortion under threat of CBI arrest warrant.",
        "scam_category": "Digital Arrest Extortion",
        "financial_loss": 50000.0,
        "suspect_details": "+91 98112 00000 / cbi-clearance@fakeupi"
    }
    response = client.post("/api/recovery/submit-cybercrime-portal", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "MHA-1930-" in data["portal_ack_number"]
    assert data["status"] == "REGISTERED_FOR_INVESTIGATION"
    assert len(data["next_steps"]) >= 2
