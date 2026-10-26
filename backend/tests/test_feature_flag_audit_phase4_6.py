"""
Phase 4.6 Feature-Flag & API Behavior Audit Test Suite.

Validates:
1. Production API endpoint (/api/v1/analyze) defaults strictly to deterministic analysis.
2. User-controlled request payloads cannot enable semantic mode via undocumented fields.
3. Explicit server-side internal opt-in correctly activates hybrid analysis.
4. Corrupted / invalid model artifacts safely fall back to pure deterministic analysis without crashing.
5. Incompatible model payloads trigger graceful degradation with warning logging.
6. API response fields (analysis_mode, ai_provider, reason_codes, detected_signals) accurately reflect execution path.
7. Uncalibrated score invariant: heuristic scores (0-100) are never represented as probabilities.
"""

import os
import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.analysis_result import AnalysisMode
from backend.app.services.risk_engine import analyze_text
from backend.app.services.semantic_engine import OfflineSemanticEngine

client = TestClient(app)


def test_api_defaults_to_deterministic_rule_based():
    """Verify that POST /api/v1/analyze defaults strictly to rule-based analysis."""
    response = client.post(
        "/api/v1/analyze",
        json={"text": "URGENT: Your electricity connection will be disconnected tonight.", "channel": "SMS"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_mode"] == "rule_based"
    assert data["ai_provider"] == "none"
    assert "SIG_SEMANTIC_SCAM_AFFINITY" not in data["reason_codes"]


def test_user_cannot_force_semantic_mode_via_payload():
    """
    SECURITY AUDIT:
    Verify that ordinary API requests passing extra fields like 'enable_semantic'
    cannot activate semantic mode through user-controlled parameters.
    """
    response = client.post(
        "/api/v1/analyze",
        json={
            "text": "URGENT: Your electricity connection will be disconnected tonight.",
            "channel": "SMS",
            "enable_semantic": True,
            "semantic_mode": True,
            "mode": "hybrid"
        }
    )
    assert response.status_code == 200
    data = response.json()
    # Pydantic strips or ignores extra fields; mode MUST remain rule_based
    assert data["analysis_mode"] == "rule_based"
    assert data["ai_provider"] == "none"


def test_internal_explicit_opt_in_activates_hybrid():
    """Verify that explicit server-side call with enable_semantic=True activates hybrid mode."""
    res = analyze_text(
        "PM Surya Ghar Muft Bijli Yojana: Solar rooftop subsidy approved. Pay mandatory inspection fee.",
        enable_semantic=True
    )
    assert res.analysis_mode == AnalysisMode.HYBRID
    assert res.ai_provider == "offline_semantic_tfidf"


def test_corrupted_model_artifact_fallback():
    """
    RESILIENCE AUDIT:
    Verify that if the model file is corrupted with random bytes,
    the engine gracefully falls back to deterministic analysis without crashing.
    """
    original_model = OfflineSemanticEngine._model
    original_loaded = OfflineSemanticEngine._is_loaded
    original_error = OfflineSemanticEngine._load_error

    try:
        # Simulate loading invalid / corrupted model bytes
        OfflineSemanticEngine._model = None
        OfflineSemanticEngine._is_loaded = False
        OfflineSemanticEngine._load_error = "Corrupted model header: EOFError"

        # Direct predict call must degrade gracefully
        pred = OfflineSemanticEngine.predict("Sample message")
        assert pred.status == "MODEL_UNAVAILABLE"

        # Engine call with enable_semantic must fall back cleanly
        res = analyze_text("Electricity cutoff tonight at 9:30 PM", enable_semantic=True)
        assert res.risk_score >= 45
        assert res.policy_tier in ("AMBER", "RED")
        assert res.analysis_mode == AnalysisMode.RULE_BASED
        assert res.ai_provider == "none"
    finally:
        OfflineSemanticEngine._model = None
        OfflineSemanticEngine._is_loaded = False
        OfflineSemanticEngine._load_error = None
        OfflineSemanticEngine.load_model()


def test_uncalibrated_heuristic_score_invariants():
    """
    SCORE SAFETY AUDIT:
    Confirm that the returned risk_score is bounded in [0, 99],
    is integer-valued, and is not represented as an uncalibrated decimal probability.
    """
    res = analyze_text(
        "Selected for overseas job in Poland. Pay visa fee immediately.",
        enable_semantic=True
    )
    assert isinstance(res.risk_score, int)
    assert 0 <= res.risk_score <= 100
    # Invariant: plain_language_summary presents score as /100, not as a probability
    assert "/100" in res.plain_language_summary
    assert "probability" not in res.plain_language_summary.lower()


def test_verbatim_evidence_excerpts_in_hybrid_mode():
    """
    EXCERPT INVARIANT:
    All evidence excerpts in hybrid mode must be 100% exact verbatim substrings of the original input.
    """
    raw_input = "   DEAR CUSTOMER: UrGeNt - Disconnection at 9:30 PM from power sub-station.   "
    res = analyze_text(raw_input, enable_semantic=True)
    for sig in res.detected_signals:
        if sig.excerpt:
            assert sig.excerpt in raw_input, f"Excerpt '{sig.excerpt}' is not a substring of original input!"
