"""
Phase 4.3 Targeted Test Suite: Context-Aware Risk Detection, Normalization & False-Positive Reduction.

Verifies:
1. Distinguishing benign OTP warnings from malicious OTP disclosure demands.
2. Handling mixed messages containing both benign disclaimers and malicious instructions.
3. Normalization pipeline (Unicode NFKC, zero-width chars, whitespace) with exact original-text excerpt fidelity.
4. Bounded typo tolerance on critical utility action words without elevating risk solely from typos.
5. Contextual scam coverage:
   - FASTag toll blacklist threats
   - Residential society maintenance QR / payment coercion
   - Freelance translation / hotel rating deposits
   - eSIM swap / SIM takeover threats
   - Gift card coercion across romance/tech pretexts
   - Traffic police e-challan APK sideloading
6. Preservation of legitimate institutional communications and travelogues with dispersed keywords.
"""

import pytest
from backend.app.services.risk_engine import analyze_text, SCAM_PATTERNS
from backend.app.services.text_utils import normalize_with_mapping, extract_original_excerpt, is_prohibition_context
from backend.app.services.risk_policy import PolicyTier


# ── 1. OTP Warning vs Disclosure Context Tests ────────────────────────────────

def test_legitimate_otp_warning_remains_green():
    """Legitimate password-reset notification with standard warning must not be flagged as OTP theft."""
    text = "491029 is your Amazon password reset OTP. Do not share this OTP with anyone. Amazon will never call to verify your OTP."
    result = analyze_text(text)
    assert result.policy_tier == "GREEN"
    assert result.risk_score < 35
    assert "SIG_CREDENTIAL_THEFT_OTP" not in result.reason_codes


def test_bank_security_advisory_remains_green():
    """Educational security advisory quoting OTP disclosure warnings must not trigger OTP theft or Red tier."""
    text = (
        "HDFC Bank Security Advisory: Protect yourself from modern cyber fraud. "
        "Fraudsters often send fake electricity disconnection threats or arrest warrants. "
        "Remember that banks never ask you to share your OTP, netbanking password, or UPI PIN. "
        "If you suspect fraud, report immediately to 1930."
    )
    result = analyze_text(text)
    assert result.policy_tier == "GREEN"
    assert result.risk_score <= 10
    assert "SIG_CREDENTIAL_THEFT_OTP" not in result.reason_codes


def test_delivery_partner_otp_remains_green():
    """Legitimate e-commerce delivery handoff code must not be treated as credential theft."""
    text = "Swiggy Delivery: Your food order #84920 is arriving in 5 minutes. Share the 4-digit delivery code 8291 with delivery partner to receive order."
    result = analyze_text(text)
    assert result.policy_tier == "GREEN"
    assert "SIG_CREDENTIAL_THEFT_OTP" not in result.reason_codes


def test_malicious_otp_theft_detected():
    """Direct scam demand to share OTP over call or message must trigger high risk."""
    text = "Dear customer, your SBI YONO account is suspended. Call our verification desk and share the OTP sent to your mobile immediately."
    result = analyze_text(text)
    assert result.policy_tier == "RED"
    assert "SIG_CREDENTIAL_THEFT_OTP" in result.reason_codes
    assert any("share the OTP" in s.excerpt for s in result.detected_signals if s.reason_code == "SIG_CREDENTIAL_THEFT_OTP")


def test_mixed_message_preserves_malicious_detection():
    """A benign disclaimer in a message must NOT neutralize a separate malicious disclosure instruction."""
    mixed_text = (
        "SBI Alert: Do not share this OTP with anyone. "
        "However, our representative officer Sharma is calling you from headquarters, "
        "please share the OTP with him right now to complete mandatory KYC."
    )
    result = analyze_text(mixed_text)
    assert result.policy_tier in ("RED", "AMBER")
    assert "SIG_CREDENTIAL_THEFT_OTP" in result.reason_codes
    otp_signal = next(s for s in result.detected_signals if s.reason_code == "SIG_CREDENTIAL_THEFT_OTP")
    assert "share the OTP" in otp_signal.excerpt


# ── 2. Normalization & Evidence Fidelity Tests ─────────────────────────────────

def test_normalization_and_verbatim_excerpt_fidelity():
    """
    When regex matches against normalized text (e.g. full-width letters or zero-width spaces),
    the displayed excerpt must be an exact substring of the original input.
    """
    # Full-width characters: ＳＢＩ and ＫＹＣ
    original_text = "Urgent: \uff33\uff22\uff29 account \uff2b\uff39\uff23 suspended. Click http://sbi-verify.top immediately."
    result = analyze_text(original_text)

    assert result.policy_tier == "RED"
    assert len(result.detected_signals) > 0
    for s in result.detected_signals:
        if s.excerpt:
            assert s.excerpt in original_text, f"Excerpt '{s.excerpt}' is not a substring of original text!"


def test_zero_width_characters_removal_with_fidelity():
    """Zero-width spaces embedded in scam keywords must be normalized while preserving original excerpt fidelity."""
    original_text = "Important notice: Your C\u200bI\u200bB\u200bI\u200bL credit score will be boosted to 780 within 24 hours guaranteed. Pay processing fee."
    result = analyze_text(original_text)

    assert "SIG_CREDENTIAL_THEFT_OTP" not in result.reason_codes
    for s in result.detected_signals:
        if s.excerpt:
            assert s.excerpt in original_text, f"Excerpt '{s.excerpt}' not in original text!"


def test_empty_and_very_long_input_safety():
    """Engine must handle empty, very short, and very long inputs without errors or ReDoS."""
    assert analyze_text("").policy_tier == "GREEN"
    assert analyze_text("   ").policy_tier == "GREEN"
    assert analyze_text("Hi").policy_tier == "GREEN"

    # Very long text (10,000 characters)
    long_text = "Standard corporate newsletter. " * 300
    res = analyze_text(long_text)
    assert res.policy_tier == "GREEN"
    assert res.risk_score <= 10


# ── 3. Typo Tolerance Tests ───────────────────────────────────────────────────

def test_bounded_typo_tolerance_electricity():
    """Typo-laden utility disconnection messages must be flagged as high risk."""
    text = "DEAR CONSUMER YOUR ELECTRCTY POWER WILL BE DISCONCT TONITE AT 9.30 PM FROM POWER OFICER BECAUSE YOUR PREVIOUS MONTH BILL NOT UPDATE. CONTACT ELECTRCITY OFICER 9876543210"
    result = analyze_text(text)
    assert result.policy_tier == "RED"
    assert "SIG_UTILITY_DISCONNECT" in result.reason_codes
    assert result.verdict == "Electricity Bill / Utility Disconnection Threat"


def test_typo_alone_does_not_elevate_risk():
    """Legitimate messages with accidental misspellings must never be elevated to scam status."""
    text = "Dear student, please rember that the tomorow lecture on pyton programing is rescheduld to 3 PM in hall B."
    result = analyze_text(text)
    assert result.policy_tier == "GREEN"
    assert result.risk_score == 0


# ── 4. Novel Scam Vectors Coverage ───────────────────────────────────────────

def test_fastag_toll_fraud_detected():
    """FASTag blacklist threats with payment deadlines must be flagged as High Risk."""
    text = "NHAI FASTag Alert: Your vehicle Fastag ID *8812 is blacklisted due to negative KYC. Clear ₹450 pending penalty immediately at http://fastag-nhai-clearance.top or toll plaza entry will be denied."
    result = analyze_text(text)
    assert result.policy_tier == "RED"
    assert "SIG_FASTAG_TOLL_FRAUD" in result.reason_codes
    assert result.verdict == "FASTag / Highway Toll Blacklist Threat Fraud"


def test_society_maintenance_fraud_detected():
    """Apartment maintenance extortion with personal UPI QR must be flagged."""
    text = "Apartment RWA Advisory: Monthly society maintenance charges of ₹4,200 for October are due. Please scan the attached society treasurer QR or transfer to society.treasurer77@okaxis immediately to avoid ₹500 late fee."
    result = analyze_text(text)
    assert result.policy_tier in ("RED", "AMBER")
    assert "SIG_SOCIETY_MAINTENANCE_FRAUD" in result.reason_codes


def test_freelance_translation_deposit_detected():
    """Fake freelance project with upfront license fee / deposit must be flagged."""
    text = "Congratulations! You are shortlisted for freelance document translation project (English to Hindi). Project value: Rs 65,000. Refundable security deposit of Rs 3,500 required for software license activation. Pay to secure slot: hr.project@translaters.xyz"
    result = analyze_text(text)
    assert result.policy_tier in ("RED", "AMBER")
    assert "SIG_TASK_PREPAID_FRAUD" in result.reason_codes


def test_esim_swap_takeover_detected():
    """SIM conversion / eSIM swap attack threats must be flagged as High Risk."""
    text = "Jio Customer Care: A request to convert your physical SIM to eSIM has been submitted. If not requested by you, call 9821098210 within 30 minutes to cancel deactivation of your current SIM."
    result = analyze_text(text)
    assert result.policy_tier == "RED"
    assert "SIG_TELECOM_DISCONNECTION" in result.reason_codes


def test_steam_wallet_pretext_detected():
    """Romance or tech pretext demanding Steam wallet cards must be flagged."""
    text = "Dearest, my laptop crashed while working on our travel visa file. Microsoft store says repairs cost ₹12,000. Can you please get ₹10,000 Steam wallet cards from the supermarket and send the codes so I can pay the technician license fee? I will pay you back as soon as I arrive."
    result = analyze_text(text)
    assert result.policy_tier in ("RED", "AMBER")
    assert "SIG_EXECUTIVE_GIFT_CARD" in result.reason_codes


def test_traffic_echallan_apk_sideloading_detected():
    """Traffic police notice pushing APK or phishing link must trigger High Risk."""
    text = "Traffic Police Notice: Pending e-challan of ₹1,000 issued for vehicle DL01CA9999. Pay immediately or your driving license will be seized. Download court summons APK to contest: bit.ly/delhi-traffic-challan"
    result = analyze_text(text)
    assert result.policy_tier == "RED"
    assert "SIG_TRAFFIC_ECHALLAN_FRAUD" in result.reason_codes


# ── 5. Dispersed Keywords & Boundary Preservation ─────────────────────────────

def test_travelogue_with_customs_remains_green():
    """Travel advisory mentioning customs regulations must NOT trigger Digital Arrest."""
    text = (
        "Travel Advisory for Bangkok Delegates: Delegates arriving at Suvarnabhumi Airport should proceed directly to passport control. "
        "Customs regulations permit duty-free import of personal gifts and laptops for business travel. "
        "Please keep all official event registration badges visible when boarding conference shuttles to the convention center."
    )
    result = analyze_text(text)
    assert result.policy_tier == "GREEN"
    assert result.risk_score == 0
    assert "SIG_DIGITAL_ARREST" not in result.reason_codes
    assert result.verdict == "Likely Legitimate Communication"


def test_repeated_financial_terms_do_not_escalate_score():
    """Repeated financial terms in non-coercive message must not inflate risk score."""
    text = "Please review your investment portfolio. The balance, returns, mutual funds, interest rate, and financial summary are available in the attached quarterly report."
    result = analyze_text(text)
    assert result.policy_tier == "GREEN"
    assert result.risk_score <= 10
