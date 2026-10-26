"""
Phase 4.2 Robustness, Generalization & Invariant Test Suite for Satark Saathi.

Tests:
1. Generic Tactics Isolation: Generic urgency, secrecy, authority, or payment words never assign a specific scam category.
2. Repetition & Score Inflation: Repeated identical keywords do not artificially escalate risk score or policy tier.
3. Delivery OTP Disambiguation: Doorstep delivery OTPs remain GREEN while social-engineering OTP demands are flagged.
4. Institutional Public Notices: Emergency alerts, flight boarding, tax refunds remain GREEN.
5. Token Distance Containment: Dispersed keywords separated by large token distances do not form spurious matches.
6. Normalization Invariants: NFKC, zero-width stripping, and whitespace collapse.
7. Policy Safety Invariants: Acute threats maintain RED/AMBER floor and resist counter-signal cancellation.
8. Latency & ReDoS Safety: 50,000+ character inputs process in under 1 second without exponential backtracking.
9. Verbatim Excerpt Guarantee: All detected signal excerpts are verbatim substrings of the original input.
10. API Schema Compatibility: /api/v1/analyze response schema and reason code stability.
"""

import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.risk_engine import analyze_text
from backend.app.services.risk_policy import RiskPolicy, PolicyTier
from backend.app.services.text_utils import normalize_text, token_distance_pattern, find_token_window_match
from backend.app.evaluation.robustness_dataset import ROBUSTNESS_DATASET


# ── 1. Generic Tactics Isolation ─────────────────────────────────────────────

def test_generic_tactics_never_assign_specific_category():
    """Generic urgency, secrecy, or payment demands alone must NEVER invent a specific scam type."""
    cases = [
        ("URGENT: Please respond immediately within 15 minutes! Very critical matter.", "Unverified Urgent Message"),
        ("Please keep this confidential and do not tell anyone or discuss with family.", "Suspicious Confidentiality Request"),
        ("Please transfer ₹5,000 to this personal account immediately.", "Suspicious Coercive Payment Request"),
        ("Kind attention: Urgent immediate response required today.", "Unverified Urgent Message")
    ]
    for text, expected_verdict in cases:
        res = analyze_text(text)
        assert res.verdict == expected_verdict, f"Expected generic verdict '{expected_verdict}', got '{res.verdict}'"
        assert "Electricity" not in res.verdict
        assert "Digital Arrest" not in res.verdict
        assert "KYC" not in res.verdict
        assert "Gift Card" not in res.verdict


# ── 2. Repetition & Score Inflation Safety ───────────────────────────────────

def test_no_score_escalation_from_repeated_identical_keywords():
    """Repeating the same urgent or payment keyword must not accumulate multiplicative score inflation."""
    single_urgent = "URGENT: Please respond immediately."
    repeated_urgent = "URGENT " * 50 + "immediately " * 50

    res_single = analyze_text(single_urgent)
    res_repeated = analyze_text(repeated_urgent)

    # Score should remain within the same tier and not escalate to RED
    assert res_repeated.policy_tier == "GREEN"
    assert res_repeated.risk_score <= 25, f"Score inflated to {res_repeated.risk_score} from repetition"
    assert res_repeated.verdict == "Unverified Urgent Message"


def test_repeated_financial_terms_remain_green():
    """Repeating payment and credit keywords without fraud coercion must remain GREEN."""
    text = "Payment received. Payment credited. Payment confirmed. Payment of ₹500, ₹1000, ₹1500 transferred."
    res = analyze_text(text)
    assert res.policy_tier == "GREEN"
    assert res.risk_score < 30


# ── 3. Delivery OTP vs Suspicious OTP Theft ──────────────────────────────────

def test_benign_delivery_otp_separated_from_theft():
    """Delivery handoff OTP notifications must remain GREEN, while OTP requests over phone are RED."""
    benign_delivery = "Your Zepto grocery delivery is arriving in 5 minutes. Share OTP 4892 with delivery partner at doorstep."
    malicious_otp = "This is SBI customer support. Share OTP 4892 immediately to reverse an unauthorized transaction."

    res_benign = analyze_text(benign_delivery)
    res_malicious = analyze_text(malicious_otp)

    assert res_benign.policy_tier == "GREEN"
    assert "SIG_CREDENTIAL_THEFT_OTP" not in res_benign.reason_codes

    assert res_malicious.policy_tier == "RED"
    assert "SIG_CREDENTIAL_THEFT_OTP" in res_malicious.reason_codes


# ── 4. Legitimate Institutional Notices ──────────────────────────────────────

def test_legitimate_institutional_notices_remain_green():
    """Public safety, flight gate updates, and official tax credits must not be classified as scams."""
    notices = [
        "NDMA - IMD Cyclone Alert: Very Severe Cyclonic Storm landfall tonight. Stay indoors. Dial 1070 for State Disaster Helpline.",
        "IndiGo Flight 6E-204 to Bengaluru: Final boarding call. Gate changed to Gate 24A. Aircraft doors close in 10 minutes.",
        "Income Tax Department: Refund of INR 8,420.00 has been credited to your bank account ending *4102 on 22-OCT-2026. Track on incometax.gov.in.",
        "Mumbai University: Hall tickets for Semester 5 B.Com examinations are available for download from student portal mu.ac.in."
    ]
    for text in notices:
        res = analyze_text(text)
        assert res.policy_tier == "GREEN", f"Notice misclassified as {res.policy_tier}: {text[:50]}"
        assert res.risk_score < 35


# ── 5. Token Distance Containment ────────────────────────────────────────────

def test_token_distance_containment_across_long_messages():
    """Keywords separated by large token distances must NOT combine to trigger scam patterns."""
    text = (
        "Quarterly Facilities Update — October 2026. "
        "Our building management has initiated a green energy campaign to lower commercial electricity consumption by 15%. "
        "Please switch off workstation monitors and lights when leaving meeting rooms. "
        "In other news, our human resources team welcomes 12 new engineering recruits this month. "
        "For facilities queries, please contact our administrative officer in cabin 4B or extension 402 during office hours."
    )
    res = analyze_text(text)
    assert res.verdict != "Electricity Bill / Utility Disconnection Threat"
    assert "SIG_UTILITY_DISCONNECT" not in res.reason_codes
    assert res.policy_tier == "GREEN"


def test_token_distance_pattern_respects_token_limit():
    """Direct test of token_distance_pattern to ensure token limits are enforced."""
    p1 = r"electricity"
    p2 = r"disconnect"

    # 5 words between p1 and p2 -> Should match window of 10
    short_text = "Your electricity bill is overdue and will disconnect tomorrow."
    assert find_token_window_match(p1, p2, short_text, max_tokens=10) is not None

    # 25 words between p1 and p2 -> Should NOT match window of 10
    long_gap_text = "Your electricity consumption this month was measured across thirty commercial properties in our district and our maintenance team will disconnect faulty meters."
    assert find_token_window_match(p1, p2, long_gap_text, max_tokens=10) is None


# ── 6. Normalization Invariants ──────────────────────────────────────────────

def test_normalization_invariants():
    """Verify NFKC normalization, zero-width stripping, and whitespace collapse."""
    # Zero-width spaces embedded in text
    dirty_text = "C\u200bI\u200cB\u200dI\ufeffL   Score"
    cleaned = normalize_text(dirty_text)
    assert cleaned == "C I B I L Score" or "CIBIL" in cleaned.replace(" ", "")

    # Multiple whitespace
    multi_space = "Urgent:   Please    transfer \t\t funds  \n  now."
    cleaned_space = normalize_text(multi_space)
    assert "   " not in cleaned_space


# ── 7. Policy Safety Invariants ──────────────────────────────────────────────

def test_acute_threat_policy_invariants():
    """Acute threats enforce safety floor even in the presence of strong counter-signals."""
    from backend.app.services.analysis_result import DetectedSignal
    for code in RiskPolicy.ACUTE_THREAT_CODES:
        sig = DetectedSignal(reason_code=code, signal_type="ACUTE_THREAT", severity="HIGH", reason="Test", excerpt="Test", weight=45)
        ctr = DetectedSignal(reason_code="CTR_OFFICIAL_HELPLINE", signal_type="COUNTER", severity="LOW", reason="Helpline", excerpt="1930", weight=25)
        score, tier, risk_lvl, sev, conf, alert, recs, act = RiskPolicy.evaluate(
            raw_score=45,
            counter_reduction=25,
            signals=[sig],
            counter_signals=[ctr]
        )
        assert tier in (PolicyTier.AMBER, PolicyTier.RED), f"Acute threat {code} dropped below safety floor"
        assert tier != PolicyTier.GREEN
        assert score >= RiskPolicy.AMBER_MIN_SCORE


# ── 8. Latency & ReDoS Safety on Long Inputs ─────────────────────────────────

def test_latency_on_large_input_safety():
    """Ensure that 50,000+ character inputs execute within 1.0 second without catastrophic backtracking."""
    long_adversarial_input = ("URGENT: Administrative verification required. Disciplinary Committee notice. " * 700)
    assert len(long_adversarial_input) > 50000

    t0 = time.perf_counter()
    res = analyze_text(long_adversarial_input)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    assert elapsed_ms < 1000, f"ReDoS risk detected: {elapsed_ms:.2f} ms for 50KB input"
    assert res.incident_id.startswith("SA-")


# ── 9. Verbatim Excerpt Guarantee Across Robustness Dataset ──────────────────

def test_verbatim_excerpts_across_robustness_dataset():
    """Every detected signal excerpt from Dataset C must be an exact verbatim substring of the input text."""
    for sample in ROBUSTNESS_DATASET:
        text = sample["text"]
        res = analyze_text(text)
        for sig in res.detected_signals:
            if sig.excerpt:
                assert sig.excerpt in text, (
                    f"Excerpt '{sig.excerpt}' is not a verbatim substring of [{sample['id']}] '{text}'"
                )


# ── 10. API Schema Compatibility ─────────────────────────────────────────────

def test_api_v1_analyze_endpoint_contract():
    """API endpoint returns valid response conforming to schemas_v1 contract."""
    client = TestClient(app)
    response = client.post("/api/v1/analyze", json={
        "text": "BSES electricity supply disconnected tonight. Call 9876543210 immediately."
    })
    assert response.status_code == 200
    data = response.json()
    assert "incident_id" in data
    assert "risk_score" in data
    assert "policy_tier" in data
    assert "verdict" in data
    assert "detected_signals" in data
    assert isinstance(data["detected_signals"], list)
    if data["detected_signals"]:
        sig = data["detected_signals"][0]
        assert "category" in sig
        assert "excerpt" in sig
