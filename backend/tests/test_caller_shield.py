"""
Unit and integration tests for Satark Saathi Caller Shield.
Tests phone number normalization, deterministic risk scoring,
fast caller reputation lookups, community reporting, personal blocklists,
and IBM watsonx AI fallback behavior.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal, init_db
from backend.app.services.caller_intelligence_service import (
    normalize_phone_number,
    compute_risk_score,
    format_display_number,
)
from backend.app.services.ibm_caller_service import IBMCallerIntelligenceService

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db():
    init_db(seed_if_empty=True)


# ── 1. Phone Number Normalization Tests ──────────────────────────────────────────

def test_normalize_indian_10_digit():
    assert normalize_phone_number("9876543210") == "+919876543210"
    assert normalize_phone_number("7012345678") == "+917012345678"
    assert normalize_phone_number("6200112233") == "+916200112233"


def test_normalize_indian_leading_zero():
    assert normalize_phone_number("09876543210") == "+919876543210"


def test_normalize_formatted_strings():
    assert normalize_phone_number("+91 98765-43210") == "+919876543210"
    assert normalize_phone_number("+91 (98765) 43210") == "+919876543210"
    assert normalize_phone_number("91 98765 43210") == "+919876543210"


def test_normalize_international():
    assert normalize_phone_number("+92 300 1234567") == "+923001234567"
    assert normalize_phone_number("+1 (555) 234-5678") == "+15552345678"


def test_normalize_invalid_and_empty():
    assert normalize_phone_number("") == ""
    assert normalize_phone_number("   ") == ""


def test_format_display_number():
    assert format_display_number("+919876543210") == "+91 98765 43210"
    assert format_display_number("+923001234567") == "+92 300 1234567"


# ── 2. Risk Scoring Algorithm Tests ─────────────────────────────────────────────

def test_risk_scoring_legitimate_business():
    score, level, conf = compute_risk_score(
        category="LEGITIMATE_BUSINESS",
        total_reports=0,
        verified_reports=0,
        upvotes_spam=0,
        downvotes_safe=50,
        carrier_verified=True,
        is_business=True,
    )
    assert score == 4
    assert level == "LOW"
    assert conf == "HIGH"


def test_risk_scoring_digital_arrest_high_reports():
    score, level, conf = compute_risk_score(
        category="DIGITAL_ARREST",
        total_reports=50,
        verified_reports=40,
        upvotes_spam=48,
        downvotes_safe=0,
        carrier_verified=False,
        is_business=False,
    )
    assert score >= 90
    assert level == "CRITICAL"
    assert conf == "HIGH"


def test_risk_scoring_unknown_number():
    score, level, conf = compute_risk_score(
        category="UNKNOWN",
        total_reports=0,
        verified_reports=0,
        upvotes_spam=0,
        downvotes_safe=0,
        carrier_verified=False,
        is_business=False,
    )
    assert score == 10
    assert level == "UNKNOWN"
    assert conf == "LOW"


# ── 3. Caller Lookup API Tests ──────────────────────────────────────────────────

def test_lookup_known_digital_arrest_scammer():
    res = client.get("/api/v1/caller-intelligence/lookup?phone_number=+919876500001&user_id=1")
    assert res.status_code == 200
    data = res.json()
    assert data["normalized_number"] == "+919876500001"
    assert data["category"] == "DIGITAL_ARREST"
    assert data["risk_score"] >= 90
    assert data["risk_level"] in ["CRITICAL", "HIGH"]
    assert "IMPERSONATING_LAW_ENFORCEMENT" in data["evidence_signals"]
    assert data["total_reports"] >= 100


def test_lookup_verified_business_sbi():
    res = client.get("/api/v1/caller-intelligence/lookup?phone_number=+912228540000&user_id=1")
    assert res.status_code == 200
    data = res.json()
    assert data["normalized_number"] == "+912228540000"
    assert data["category"] == "LEGITIMATE_BUSINESS"
    assert data["risk_score"] <= 10
    assert data["risk_level"] == "LOW"
    assert data["carrier_verified"] is True
    assert data["is_business"] is True
    assert data["business_name"] == "State Bank of India"


def test_lookup_unknown_clean_number():
    res = client.get("/api/v1/caller-intelligence/lookup?phone_number=9999900000&user_id=1")
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "UNKNOWN"
    assert data["risk_score"] == 10
    assert data["risk_level"] == "UNKNOWN"
    assert data["action"] == "ALLOW"
    assert data["is_blocked"] is False


# ── 4. Community Reporting & Feedback API Tests ─────────────────────────────────

def test_submit_caller_report_and_verify_update():
    new_number = "9870098700"
    payload = {
        "phone_number": new_number,
        "category": "ELECTRICITY_SCAM",
        "claimed_caller_name": "Power Discom Executive",
        "description": "Threatened power cutoff at 9pm and sent an APK link.",
        "call_type": "INCOMING"
    }
    res = client.post("/api/v1/caller-intelligence/reports?user_id=1", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["normalized_number"] == "+919870098700"
    assert data["risk_score"] >= 60
    assert data["risk_level"] in ["SUSPICIOUS", "HIGH"]

    # Query lookup to verify reputation is updated in real time
    lookup_res = client.get(f"/api/v1/caller-intelligence/lookup?phone_number={new_number}&user_id=1")
    assert lookup_res.status_code == 200
    lookup_data = lookup_res.json()
    assert lookup_data["category"] == "ELECTRICITY_SCAM"
    assert lookup_data["total_reports"] >= 1


def test_post_call_feedback():
    feedback_payload = {
        "phone_number": "+919876500001",
        "is_spam": True
    }
    res = client.post("/api/v1/caller-intelligence/feedback?user_id=1", json=feedback_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "upvotes_spam" in data


# ── 5. Personal Blocklist API Tests ─────────────────────────────────────────────

def test_personal_blocklist_lifecycle():
    target_num = "9777788888"
    block_payload = {
        "phone_number": target_num,
        "action": "BLOCK",
        "display_name": "Persistent Harasser",
        "reason": "Repeated unwanted calls"
    }
    # Add to blocklist
    res = client.post("/api/v1/caller-intelligence/blocklist?user_id=1", json=block_payload)
    assert res.status_code == 200
    assert res.json()["action"] == "BLOCK"

    # Verify lookup reflects user block
    lookup_res = client.get(f"/api/v1/caller-intelligence/lookup?phone_number={target_num}&user_id=1")
    assert lookup_res.status_code == 200
    assert lookup_res.json()["is_blocked"] is True
    assert lookup_res.json()["action"] == "BLOCK"

    # List blocklist
    list_res = client.get("/api/v1/caller-intelligence/blocklist?user_id=1")
    assert list_res.status_code == 200
    numbers = [item["normalized_number"] for item in list_res.json()]
    assert "+919777788888" in numbers

    # Remove from blocklist
    del_res = client.delete(f"/api/v1/caller-intelligence/blocklist?phone_number={target_num}&user_id=1")
    assert del_res.status_code == 200

    # Verify lookup is unblocked
    lookup_res2 = client.get(f"/api/v1/caller-intelligence/lookup?phone_number={target_num}&user_id=1")
    assert lookup_res2.status_code == 200
    assert lookup_res2.json()["is_blocked"] is False


# ── 6. IBM Watsonx AI Integration & Diagnostics ─────────────────────────────────

@pytest.mark.asyncio
async def test_ibm_caller_fallback_generation():
    service = IBMCallerIntelligenceService()
    # Test deterministic fallback
    res = service._generate_fallback(
        phone_number="+91 98765 00001",
        category="DIGITAL_ARREST",
        claimed_name="CBI Officer"
    )
    assert "CBI" in res["summary"] or "arrest" in res["summary"].lower()
    assert "IMPERSONATING_LAW_ENFORCEMENT" in res["detected_signals"]
    assert "Fallback" in res["provider"]


def test_caller_shield_stats_and_status():
    stats_res = client.get("/api/v1/caller-intelligence/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_screened_numbers"] >= 5
    assert stats["active_threat_numbers"] >= 3

    status_res = client.get("/api/v1/caller-intelligence/ibm-status")
    assert status_res.status_code == 200
    st = status_res.json()
    assert st["active_for_call_screening"] is True
    assert "provider" in st
