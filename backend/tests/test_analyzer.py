"""
Comprehensive test suite for the Satark Saathi scam intelligence engine.
Tests cover all required scenarios:
  1. Digital arrest scam
  2. Fake investment scheme
  3. Phishing message
  4. OTP theft
  5. Legitimate transaction notification
  6. Benign family conversation
  7. Empty and malformed inputs
  8. URL analysis
  9. Counter-signal handling
"""

import pytest
from backend.app.services.rule_analyzer import RuleBasedScamAnalyzer
from backend.app.services.risk_engine import analyze_text, analyze_url
from backend.app.services.analysis_result import InputType, RiskLevel


# ── Fixture ──────────────────────────────────────────────────────────────────

@pytest.fixture
def analyzer():
    return RuleBasedScamAnalyzer()


# ── 1. Digital Arrest Scam ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_digital_arrest_detection(analyzer):
    """CBI impersonation with digital arrest threat, secrecy, and Skype."""
    text = (
        "URGENT: This is Senior Officer Vikram Singh from CBI New Delhi Headquarters. "
        "Your Aadhaar card was linked to a seized parcel containing MDMA narcotics. "
        "A Non-Bailable Arrest Warrant is issued. You are under DIGITAL ARREST. "
        "Join Skype video call immediately for confidential verification. "
        "Do not inform any family member or your bank will be frozen. Contact 9811223344."
    )
    result = await analyzer.analyze_text(text, channel="WHATSAPP")
    assert result.risk_score >= 60
    assert result.severity == "HIGH_RISK"
    assert result.is_flagged_for_family is True
    assert result.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    assert len(result.detected_signals) >= 2
    assert any("AUTHORITY" in sig.signal_type or "IMPERSONATION" in sig.signal_type
               for sig in result.detected_signals if sig.weight > 0)
    assert result.analysis_mode.value == "rule_based"
    assert result.ai_provider == "none"
    assert len(result.recommended_actions) > 0
    assert len(result.limitations) > 0


# ── 2. Fake Investment Scheme ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_investment_fraud_detection(analyzer):
    """Guaranteed returns scam via Telegram group."""
    text = (
        "Join our exclusive Telegram trading group for guaranteed 100% returns! "
        "We are SEBI registered advisors with insider stock market tips. "
        "Minimum investment ₹50,000 via Google Pay. "
        "Already 5000+ happy investors. Join: t.me/guaranteed-profits-india"
    )
    result = await analyzer.analyze_text(text, channel="WHATSAPP")
    assert result.risk_score >= 40
    assert result.severity in ("CAUTION", "HIGH_RISK")
    assert any(sig.signal_type in ("GREED_EXPLOITATION", "FALSE_AUTHORITY", "URL_SHORTENER")
               for sig in result.detected_signals if sig.weight > 0)
    assert len(result.verification_steps) > 0


# ── 3. Phishing Message (Bank KYC) ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_phishing_message_detection(analyzer):
    """Bank KYC phishing with URL shortener."""
    text = (
        "Dear SBI User, your NetBanking access and ATM card will be permanently blocked within 24 hours "
        "due to pending PAN card verification. Click bit.ly/sbi-kyc-verify to update immediately."
    )
    result = await analyzer.analyze_text(text, channel="SMS")
    assert result.risk_score >= 50
    assert result.severity == "HIGH_RISK"
    assert any("SUSPICIOUS" in sig.signal_type or "URL" in sig.signal_type or "CREDENTIAL" in sig.signal_type
               for sig in result.detected_signals if sig.weight > 0)


# ── 4. OTP Theft ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_otp_theft_detection(analyzer):
    """OTP theft via fake bank call."""
    text = (
        "Hello sir, this is calling from HDFC Bank credit card department. "
        "Your credit card has been compromised. Please share the OTP that was sent to your "
        "registered mobile number to block the unauthorized transaction. "
        "This is very urgent, tell me the 6-digit OTP immediately."
    )
    result = await analyzer.analyze_text(text, channel="CALL_TRANSCRIPT")
    assert result.risk_score >= 40
    assert result.severity in ("CAUTION", "HIGH_RISK")
    assert any("CREDENTIAL" in sig.signal_type or "OTP" in sig.signal_type or "SOCIAL" in sig.signal_type
               for sig in result.detected_signals if sig.weight > 0)


# ── 5. Legitimate Transaction Notification ───────────────────────────────────

@pytest.mark.asyncio
async def test_legitimate_transaction_sms(analyzer):
    """Genuine bank debit notification with toll-free number."""
    text = (
        "Dear Customer, INR 1,450.00 debited from A/C XX8901 on 13-Oct-26 at 14:15 "
        "via UPI to BLINKIT GROCERY. Available Balance: INR 34,200.00. "
        "If not authorized, call SBI toll-free 1800112211."
    )
    result = await analyzer.analyze_text(text, channel="SMS")
    assert result.risk_score < 40
    assert result.severity == "SAFE"
    assert result.is_flagged_for_family is False
    # Should have counter-signals
    counter_signals = [sig for sig in result.detected_signals if sig.weight < 0]
    assert len(counter_signals) >= 1, "Should detect legitimacy counter-signals"


# ── 6. Benign Family Conversation ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_benign_family_conversation(analyzer):
    """Normal family message should not trigger alerts."""
    text = (
        "Happy birthday beta! How are you doing? Take care of yourself. "
        "Shall we plan dinner tonight? Love you. Miss you a lot."
    )
    result = await analyzer.analyze_text(text, channel="WHATSAPP")
    assert result.risk_score < 20
    assert result.severity == "SAFE"
    assert result.is_flagged_for_family is False
    assert result.risk_level == RiskLevel.LOW


# ── 7. Empty and Malformed Inputs ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_empty_input(analyzer):
    """Empty text should return safe empty result."""
    result = await analyzer.analyze_text("", channel="SMS")
    assert result.risk_score == 0
    assert result.severity == "SAFE"
    assert result.verdict == "Insufficient Input"


@pytest.mark.asyncio
async def test_very_short_input(analyzer):
    """Very short text should return low-risk result."""
    result = await analyzer.analyze_text("Hi", channel="SMS")
    assert result.risk_score == 0
    assert result.severity == "SAFE"


@pytest.mark.asyncio
async def test_only_whitespace(analyzer):
    """Whitespace-only input should return empty result."""
    result = await analyzer.analyze_text("   \n\t  ", channel="SMS")
    assert result.risk_score == 0


# ── 8. URL Analysis ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_suspicious_url_analysis(analyzer):
    """Suspicious URL with deceptive subdomain."""
    result = await analyzer.analyze_url("https://sbi-kyc-update.xyz/verify")
    assert result.risk_score >= 40
    assert result.input_type == InputType.URL
    assert any("IMPERSONATION" in sig.signal_type or "SUSPICIOUS" in sig.signal_type
               for sig in result.detected_signals if sig.weight > 0)


@pytest.mark.asyncio
async def test_url_shortener_detection(analyzer):
    """URL shortener should be flagged."""
    result = await analyzer.analyze_url("https://bit.ly/free-money-now")
    assert result.risk_score >= 20
    assert any("URL_SHORTENER" in sig.signal_type
               for sig in result.detected_signals if sig.weight > 0)


@pytest.mark.asyncio
async def test_safe_url(analyzer):
    """Known safe domain should get low risk."""
    result = await analyzer.analyze_url("https://www.google.com/search?q=weather")
    assert result.risk_score < 20


# ── 9. Counter-Signal Handling ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_counter_signal_reduces_score(analyzer):
    """A message mentioning bank name with legitimate toll-free number should have lower score."""
    text_with_counter = (
        "Dear SBI customer, your account balance is low. "
        "Please visit your nearest branch. Call 1800112211 for assistance."
    )
    text_without_counter = (
        "Dear SBI customer, your account has been blocked due to KYC. "
        "Click here immediately to update or your card will be deactivated."
    )
    result_with = await analyzer.analyze_text(text_with_counter, channel="SMS")
    result_without = await analyzer.analyze_text(text_without_counter, channel="SMS")
    assert result_with.risk_score < result_without.risk_score


# ── 10. Electricity Bill Scam ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_electricity_bill_scam(analyzer):
    """Electricity disconnection threat from personal number."""
    text = (
        "Dear consumer your electricity power will be disconnect tonight at 9:30 PM "
        "from power office. Contact officer 9876543210."
    )
    result = await analyzer.analyze_text(text, channel="SMS")
    assert result.risk_score >= 40
    assert result.severity in ("CAUTION", "HIGH_RISK")


# ── 11. Remote Access App Scam ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_remote_access_app_detection(analyzer):
    """Caller asking to install AnyDesk."""
    text = (
        "Sir please install AnyDesk app for verification. "
        "I am from your bank's fraud department and I need to verify your account. "
        "Download the app immediately and share the 9-digit code."
    )
    result = await analyzer.analyze_text(text, channel="CALL_TRANSCRIPT")
    assert result.risk_score >= 40
    assert any("REMOTE_ACCESS" in sig.signal_type or "MALICIOUS" in sig.signal_type
               for sig in result.detected_signals if sig.weight > 0)


# ── 12. Result Structure Validation ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_result_has_all_required_fields(analyzer):
    """Every result must contain all specified fields."""
    text = "This is a test message with CBI arrest warrant threat."
    result = await analyzer.analyze_text(text, channel="SMS")

    assert result.incident_id is not None and result.incident_id.startswith("SA-")
    assert result.input_type is not None
    assert result.risk_level is not None
    assert 0 <= result.risk_score <= 100
    assert result.confidence_label is not None
    assert result.verdict is not None
    assert result.plain_language_summary is not None
    assert isinstance(result.detected_signals, list)
    assert isinstance(result.supporting_evidence, list)
    assert isinstance(result.recommended_actions, list)
    assert isinstance(result.verification_steps, list)
    assert isinstance(result.should_alert_family, bool)
    assert result.ai_provider is not None
    assert result.analysis_mode is not None
    assert isinstance(result.limitations, list)
    assert len(result.limitations) >= 1


# ── 13. Image and Audio Text Analysis ────────────────────────────────────────

@pytest.mark.asyncio
async def test_image_text_analysis(analyzer):
    """OCR-extracted text should be analyzed normally."""
    ocr_text = "Your SBI account blocked. Click bit.ly/fix-sbi to update KYC immediately."
    result = await analyzer.analyze_image_text(ocr_text, "screenshot.png")
    assert result.input_type == InputType.IMAGE
    assert result.risk_score >= 40
    assert "screenshot.png" in result.plain_language_summary


@pytest.mark.asyncio
async def test_audio_transcript_analysis(analyzer):
    """Audio transcript should be analyzed normally."""
    transcript = "Sir please share your OTP right now. Your card is being misused urgently."
    result = await analyzer.analyze_audio_text(transcript, "call_recording.mp3")
    assert result.input_type == InputType.AUDIO
    assert result.risk_score >= 30
    assert "call_recording.mp3" in result.plain_language_summary


# ── 14. IBM watsonx.ai Timeout & Invalid Response Handling ───────────────────

from unittest.mock import AsyncMock, patch
from backend.app.services.watsonx_analyzer import WatsonXScamAnalyzer
from backend.app.services.analysis_result import AnalysisMode


@pytest.mark.asyncio
async def test_ibm_watsonx_timeout_fallback():
    """When IBM watsonx call times out, engine falls back to rule engine with transparent labeling."""
    analyzer = WatsonXScamAnalyzer()
    analyzer.api_key = "fake-test-key"
    analyzer.project_id = "fake-project-id"
    analyzer.base_url = "https://us-south.ml.cloud.ibm.com"

    # Mock _get_iam_token to succeed but _call_watsonx to time out (return None)
    with patch.object(analyzer, "_call_watsonx", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = None  # Simulates timeout/network error

        result = await analyzer.analyze_text(
            "CBI officer calling. You are under digital arrest. Pay ₹50,000 immediately.",
            channel="WHATSAPP"
        )

        assert result is not None
        assert result.ai_provider == "none"
        assert result.analysis_mode == AnalysisMode.RULE_BASED
        assert any("IBM watsonx.ai" in lim for lim in result.limitations)
        assert result.risk_score >= 40
        assert result.incident_id.startswith("SA-")


@pytest.mark.asyncio
async def test_ibm_watsonx_invalid_response_fallback():
    """When IBM watsonx returns malformed data, engine falls back safely to rule engine."""
    analyzer = WatsonXScamAnalyzer()
    analyzer.api_key = "fake-test-key"
    analyzer.project_id = "fake-project-id"
    analyzer.base_url = "https://us-south.ml.cloud.ibm.com"

    # Mock _call_watsonx returning invalid/malformed schema
    with patch.object(analyzer, "_call_watsonx", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"gibberish": 12345}  # Missing required keys

        result = await analyzer.analyze_text(
            "Share your OTP immediately to unblock your account.",
            channel="SMS"
        )

        assert result is not None
        assert result.ai_provider == "none"
        assert result.analysis_mode == AnalysisMode.RULE_BASED
        assert result.risk_score >= 30
