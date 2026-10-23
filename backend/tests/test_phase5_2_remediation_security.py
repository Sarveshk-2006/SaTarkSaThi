"""
Phase 5.2 Remediation, Security, and Multilingual Verification Tests.
Tests audio, OCR, Devanagari detection, language limitation safeguards,
and security/ownership boundaries.
"""

import pytest
import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.risk_engine import analyze_text
from backend.app.services.audio_service import audio_service
from backend.app.services.ocr_service import ocr_service
from backend.app.services.text_utils import detect_script, is_prohibition_context

client = TestClient(app)


# ── 1. Audio Remediation Tests ───────────────────────────────────────────────

class TestAudioRemediation:
    def test_audio_user_transcript_analyzed_accurately(self):
        """User-provided transcript is analyzed through the authoritative risk policy."""
        res = client.post(
            "/api/v1/analyze/audio",
            data={
                "transcript": "Urgent: CBI officer speaking. You are under digital arrest. Transfer 50000 to clearance account.",
                "filename": "call_record.mp3"
            },
            headers={"X-User-Id": "1"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["analysis"] is not None
        assert data["analysis"]["policy_tier"] in ("AMBER", "RED")
        assert "user-provided" in data["message"].lower()

    def test_audio_no_synthetic_filename_heuristics(self):
        """Audio service must never synthesize text from filename keywords."""
        dummy_silent_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        text, method = audio_service.transcribe_audio(dummy_silent_wav, "cbi_digital_arrest_warrant_urgent.wav")
        # Must NOT return hardcoded Mumbai Cyber Cell script
        assert method != "watson_stt_neural_pipeline"
        assert text is None or "Mumbai Cyber Cell" not in text

    def test_audio_silent_file_does_not_produce_silent_green(self):
        """A silent audio file without transcript must return analysis=None, never a reassuring GREEN."""
        dummy_silent_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        res = client.post(
            "/api/v1/analyze/audio",
            files={"file": ("silent_test.wav", dummy_silent_wav, "audio/wav")},
            headers={"X-User-Id": "1"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["analysis"] is None  # Never silently produce GREEN
        assert "silence" in data["message"].lower() or "unavailable" in data["message"].lower()

    def test_audio_malformed_truncated_rejected(self):
        """Malformed or empty audio files must be rejected with 422."""
        res = client.post(
            "/api/v1/analyze/audio",
            files={"file": ("bad.wav", b"corrupted", "audio/wav")},
            headers={"X-User-Id": "1"}
        )
        assert res.status_code == 422


# ── 2. Image / OCR Remediation Tests ────────────────────────────────────────

class TestOCRRemediation:
    def test_ocr_unavailable_prompt_manual_entry_without_green(self):
        """When Tesseract is unavailable, OCR returns analysis=None and asks for manual entry."""
        # Create a valid 100x100 PNG
        from PIL import Image
        img = Image.new("RGB", (100, 100), color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        res = client.post(
            "/api/v1/analyze/image",
            files={"file": ("warrant_notice.png", png_bytes, "image/png")},
            headers={"X-User-Id": "1"}
        )
        assert res.status_code == 200
        data = res.json()
        # Must not fabricate fake warrant text merely from filename
        assert data["extracted_text"] is None or "CENTRAL BUREAU OF INVESTIGATION" not in data["extracted_text"]
        # If OCR did not extract text, analysis must be None (no reassuring GREEN)
        if not data["extracted_text"]:
            assert data["analysis"] is None

    def test_ocr_user_provided_text_analyzed_properly(self):
        """User-provided text with screenshot is analyzed through the risk engine."""
        from PIL import Image
        img = Image.new("RGB", (100, 100), color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        res = client.post(
            "/api/v1/analyze/image",
            files={"file": ("evidence.png", png_bytes, "image/png")},
            data={"extracted_text": "Non-bailable warrant issued by Cyber Crime Branch. Pay 35000 penalty immediately."},
            headers={"X-User-Id": "1"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["analysis"] is not None
        assert data["analysis"]["policy_tier"] in ("AMBER", "RED")

    def test_ocr_malformed_image_rejected(self):
        """Malformed image binary must be rejected with 422."""
        res = client.post(
            "/api/v1/analyze/image",
            files={"file": ("corrupt.png", b"not-a-real-image-payload-data-here-123", "image/png")},
            headers={"X-User-Id": "1"}
        )
        assert res.status_code == 422


# ── 3. Devanagari & Multilingual Remediation Tests ──────────────────────────

class TestDevanagariMultilingualRemediation:
    def test_devanagari_digital_arrest_detection(self):
        """Native Devanagari Digital Arrest threat is detected as acute threat."""
        hindi_text = "सीबीआई अधिकारी: आप मनी लॉन्ड्रिंग के लिए डिजिटल अरेस्ट में हैं। तुरंत सत्यापन खाते में पैसे ट्रांसफर करें।"
        res = analyze_text(hindi_text)
        assert res.policy_tier == "RED"
        assert res.risk_score >= 50
        assert any(sig.reason_code == "SIG_DIGITAL_ARREST" for sig in res.detected_signals)

    def test_devanagari_electricity_bill_cutoff(self):
        """Native Devanagari electricity disconnection alert is detected."""
        hindi_text = "बिजली बिल अपडेट नहीं है। आपका पावर कनेक्शन आज रात काट दिया जाएगा। तुरंत बिजली अधिकारी 9876543210 पर संपर्क करें।"
        res = analyze_text(hindi_text)
        assert res.policy_tier in ("AMBER", "RED")
        assert res.risk_score >= 45
        assert any("UTILITY" in getattr(sig, "reason_code", "") or "ELECTRICITY" in sig.category.upper() for sig in res.detected_signals)

    def test_devanagari_kyc_freeze_detection(self):
        """Native Devanagari Bank KYC deactivation is detected."""
        hindi_text = "प्रिय एसबीआई ग्राहक, आपका बैंक खाता ब्लॉक कर दिया गया है। तुरंत पैन आधार केवाईसी अपडेट करें।"
        res = analyze_text(hindi_text)
        assert res.policy_tier in ("AMBER", "RED")
        assert res.risk_score >= 35

    def test_devanagari_educational_advisory_not_flagged_as_scam(self):
        """Official security advisory in Hindi with prohibition marker is not flagged as acute threat."""
        advisory = "भारतीय स्टेट बैंक सुरक्षा सलाह: बैंक अधिकारी कभी भी आपसे ओटीपी या पासवर्ड नहीं मांगते। किसी से शेयर न करें। सावधान रहें।"
        res = analyze_text(advisory)
        # Advisory should not be RED
        assert res.policy_tier != "RED"
        assert not any(sig.reason_code == "SIG_CREDENTIAL_THEFT_OTP" for sig in res.detected_signals)

    def test_script_detection_utility(self):
        """Script detection accurately identifies Devanagari, Latin, and unsupported regional scripts."""
        hindi_info = detect_script("आपकी बिजली आज रात काट दी जाएगी")
        assert hindi_info["primary_script"] == "DEVANAGARI"
        assert hindi_info["is_supported"] is True

        tamil_info = detect_script("உங்கள் வங்கி கணக்கு விவரங்கள்")
        assert tamil_info["primary_script"] == "REGIONAL_INDIC_UNSUPPORTED"
        assert tamil_info["is_supported"] is False

    def test_unsupported_script_protective_advisory(self):
        """Unsupported Indic script receives cautionary limitation advice and LOW confidence."""
        tamil_text = "வணக்கம், தயவுசெய்து உங்கள் கடவுச்சொல்லைப் புதுப்பிக்கவும்."
        res = analyze_text(tamil_text)
        assert res.confidence_label == "LOW"
        assert any("Language limitation" in rec for rec in res.recommended_actions)


# ── 4. Security & Ownership Authorization Tests ──────────────────────────────

class TestSecurityAndOwnership:
    def test_invalid_identity_header_rejected(self):
        """Non-demo user IDs or arbitrary string headers must be rejected with 401."""
        res = client.get("/api/incidents", headers={"X-User-Id": "999"})
        assert res.status_code == 401

        res_str = client.get("/api/incidents", headers={"X-User-Id": "admin"})
        assert res_str.status_code == 401

    def test_cross_user_incident_modification_forbidden(self):
        """A user cannot modify or delete incidents belonging to another user."""
        # Create an incident as User 1
        create_res = client.post(
            "/api/incidents",
            json={
                "title": "Private User 1 Security Case",
                "scam_type": "Digital Arrest",
                "description": "Confidential investigation details",
                "financial_loss": 5000.0,
                "severity": "HIGH_RISK",
                "risk_level": "HIGH"
            },
            headers={"X-User-Id": "1"}
        )
        assert create_res.status_code in (200, 201)
        incident_id = create_res.json()["incident_id"]

        # Attempt to delete as User 2 without ownership
        del_res = client.delete(
            f"/api/incidents/{incident_id}",
            headers={"X-User-Id": "2"}
        )
        # User 2 cannot delete User 1's incident
        assert del_res.status_code in (403, 404)

        # Cleanup: delete as real owner User 1
        client.delete(f"/api/incidents/{incident_id}", headers={"X-User-Id": "1"})
