"""
Tests for the V1 Analysis API endpoints.
Uses FastAPI TestClient via httpx.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_v1_health(self):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "analysis_provider" in data

    def test_legacy_health(self):
        response = client.get("/api/health")
        assert response.status_code == 200


class TestTextAnalysis:
    def test_analyze_digital_arrest(self):
        response = client.post("/api/v1/analyze", json={
            "text": (
                "URGENT: CBI officer here. You are under digital arrest. "
                "Non-bailable warrant issued. Join Skype video call for interrogation. "
                "Do not inform family. Contact 9811223344."
            ),
            "channel": "WHATSAPP"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] >= 50
        assert data["risk_level"] in ("HIGH", "CRITICAL")
        assert data["incident_id"].startswith("SA-")
        assert len(data["detected_signals"]) >= 1
        assert len(data["limitations"]) >= 1

    def test_analyze_safe_message(self):
        response = client.post("/api/v1/analyze", json={
            "text": (
                "Dear Customer, INR 250.00 debited from A/C XX1234. "
                "Available Balance: INR 12,500. Call 1800112211 if not you."
            ),
            "channel": "SMS"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] < 40
        assert data["severity"] == "SAFE"

    def test_analyze_otp_theft(self):
        response = client.post("/api/v1/analyze", json={
            "text": (
                "Sir please share your OTP immediately to block the fraud transaction. "
                "Your credit card is being misused right now. Tell me the OTP urgently."
            ),
            "channel": "CALL_TRANSCRIPT"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] >= 30

    def test_analyze_empty_text(self):
        response = client.post("/api/v1/analyze", json={
            "text": "hi",
            "channel": "SMS"
        })
        # "hi" is only 2 chars, below min_length of 5
        assert response.status_code == 422

    def test_analyze_returns_all_fields(self):
        response = client.post("/api/v1/analyze", json={
            "text": "This is a normal message with no scam indicators at all.",
            "channel": "SMS"
        })
        assert response.status_code == 200
        data = response.json()
        required_fields = [
            "incident_id", "input_type", "risk_level", "risk_score",
            "confidence_label", "verdict", "plain_language_summary",
            "detected_signals", "supporting_evidence", "recommended_actions",
            "verification_steps", "should_alert_family", "ai_provider",
            "analysis_mode", "limitations"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


class TestURLAnalysis:
    def test_analyze_suspicious_url(self):
        response = client.post("/api/v1/analyze/url", json={
            "url": "https://sbi-kyc-update.xyz/verify-pan"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["input_type"] == "url"
        assert data["risk_score"] >= 30

    def test_analyze_safe_url(self):
        response = client.post("/api/v1/analyze/url", json={
            "url": "https://www.google.com/search"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] < 20

    def test_analyze_url_shortener(self):
        response = client.post("/api/v1/analyze/url", json={
            "url": "https://bit.ly/free-money-claim"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] >= 20


class TestImageAnalysis:
    def test_image_no_file(self):
        """Should fail without a file."""
        response = client.post("/api/v1/analyze/image")
        assert response.status_code == 422

    def test_image_with_extracted_text(self):
        """Image upload with user-provided text should analyze."""
        import io
        # Create a minimal valid PNG
        png_header = (
            b'\x89PNG\r\n\x1a\n'  # PNG signature
            b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
            b'\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N'
            b'\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        response = client.post(
            "/api/v1/analyze/image",
            files={"file": ("test.png", io.BytesIO(png_header), "image/png")},
            data={"extracted_text": "Your SBI account blocked click bit.ly/fix-sbi to update KYC immediately"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ocr_available"] is not None
        assert data["analysis"] is not None
        assert data["analysis"]["risk_score"] >= 30


class TestAudioAnalysis:
    def test_audio_with_transcript(self):
        """Audio endpoint with user-provided transcript."""
        response = client.post(
            "/api/v1/analyze/audio",
            data={
                "transcript": "Sir please share your OTP to verify your identity. This is HDFC Bank calling.",
                "filename": "suspicious_call.mp3"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["speech_recognition_available"] is True
        assert data["analysis"] is not None
        assert data["analysis"]["risk_score"] >= 20

    def test_audio_without_transcript(self):
        """Should return helpful message when no transcript."""
        response = client.post(
            "/api/v1/analyze/audio",
            data={"filename": "recording.mp3"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "not currently available" in data["message"].lower() or "paste" in data["message"].lower()
        assert data["analysis"] is None


class TestLegacyScannerCompatibility:
    def test_legacy_presets(self):
        response = client.get("/api/scanner/presets")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 6

    def test_legacy_analyze(self):
        response = client.post("/api/scanner/analyze", json={
            "text": "CBI officer calling. You are under digital arrest warrant.",
            "channel": "WHATSAPP"
        })
        assert response.status_code == 200
        data = response.json()
        assert "risk_score" in data
        assert "severity" in data
        assert "id" in data  # DB-persisted
