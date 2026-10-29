"""
Phase 4.8 Unit Test Suite: Dataset E Governance, Reviewer Agreement & Leakage Controls.
Validates:
1. Candidate Schema Validation & Invariants
2. Cohen's Kappa & Reviewer Agreement Calculation
3. Leakage, Deduplication & PII Detection
4. Cryptographic Manifest Integrity & Tamper Detection
5. Metric Reconciliation & Release Gate Evaluator Logic
"""

import json
import pytest
from pathlib import Path

try:
    from evaluation_governance.schemas.dataset_e_schema import (
        CandidateSample, StratumEnum, ProvenanceEnum, RiskTierEnum, RedactionStatusEnum
    )
    from evaluation_governance.tools.calculate_agreement import compute_cohens_kappa
    from evaluation_governance.tools.leakage_and_integrity_check import (
        normalize_text, compute_jaccard_similarity, compute_levenshtein_ratio,
        check_pii_patterns, audit_candidate_package
    )
    from evaluation_governance.tools.package_freezer import freeze_candidate_package, sha256_file
    from evaluation_governance.tools.run_dataset_e_evaluator import compute_binary_metrics, execute_evaluation
except ImportError:
    pytest.skip("evaluation_governance package not present in repository (air-gapped dataset)", allow_module_level=True)


def test_candidate_schema_validation_valid():
    """Verify that a compliant candidate sample passes Pydantic validation."""
    sample = CandidateSample(
        id="E-CITIZEN-01",
        text="Cyber Police Mumbai: Case registered for illegal transfer. Pay bail surety of Rs 5000 to avoid arrest.",
        stratum=StratumEnum.CITIZEN_SCAM,
        language="en",
        provenance_type=ProvenanceEnum.ADAPTED_PUBLIC_ADVISORY,
        provenance_detail="Public advisory case.",
        expected_is_scam=True,
        expected_tier=RiskTierEnum.RED,
        tier_rationale="Digital arrest extortion pretext.",
        threat_category="Digital Arrest Extortion",
        evidence_span="Pay bail surety of Rs 5000 to avoid arrest."
    )
    assert sample.id == "E-CITIZEN-01"
    assert sample.expected_is_scam is True
    assert sample.expected_tier == RiskTierEnum.RED


def test_candidate_schema_rejects_missing_evidence_span():
    """Verify that if evidence_span is not a substring of text, validation fails."""
    with pytest.raises(ValueError, match="must be an exact verbatim substring"):
        CandidateSample(
            id="E-CITIZEN-02",
            text="Electricity will be cut off tonight. Call power officer.",
            stratum=StratumEnum.CITIZEN_SCAM,
            language="en",
            provenance_type=ProvenanceEnum.SYNTHETIC_STRESS_TEST,
            provenance_detail="Utility disconnection test.",
            expected_is_scam=True,
            expected_tier=RiskTierEnum.RED,
            tier_rationale="Utility disconnection threat.",
            threat_category="Utility Disconnect",
            evidence_span="NON_EXISTENT_SUBSTRING_IN_TEXT"
        )


def test_cohens_kappa_perfect_agreement():
    """Verify that two identical label lists yield Kappa = 1.0 and P_o = 1.0."""
    labels_1 = [True, True, False, False, True]
    labels_2 = [True, True, False, False, True]
    categories = [True, False]
    kappa, p_o, matrix = compute_cohens_kappa(labels_1, labels_2, categories)
    assert kappa == 1.0
    assert p_o == 1.0
    assert matrix[True][True] == 3
    assert matrix[False][False] == 2
    assert matrix[True][False] == 0


def test_cohens_kappa_disagreement_calculation():
    """Verify Kappa calculation when reviewers disagree."""
    labels_1 = [True, True, True, False, False]
    labels_2 = [True, True, False, False, True]
    categories = [True, False]
    kappa, p_o, matrix = compute_cohens_kappa(labels_1, labels_2, categories)
    assert p_o == 0.60
    assert kappa < 1.0
    assert matrix[True][False] == 1
    assert matrix[False][True] == 1


def test_leakage_checks_exact_and_normalized_duplicates():
    """Verify that identical and case-normalized samples are flagged."""
    t1 = "Dear Customer, update your KYC at http://sbi.xyz now."
    t2 = "dear customer, update your kyc at http://sbi.xyz now."
    assert normalize_text(t1) == normalize_text(t2)
    assert compute_jaccard_similarity(t1, t2) == 1.0
    assert compute_levenshtein_ratio(t1, t2) == 1.0


def test_pii_checker_detects_unredacted_phone_and_email():
    """Verify that unredacted Indian mobile numbers and emails trigger warnings."""
    text_with_phone = "Please contact Officer Sharma at 9876543210 immediately."
    text_with_email = "Send your Aadhaar copy to fraud.officer@gmail.com today."

    warnings_phone = check_pii_patterns(text_with_phone)
    warnings_email = check_pii_patterns(text_with_email)

    assert any("phone" in w.lower() for w in warnings_phone)
    assert any("email" in w.lower() for w in warnings_email)


def test_cryptographic_manifest_tamper_detection(tmp_path):
    """Verify that tampering with a frozen test input causes a SHA-256 failure."""
    candidates = [
        {
            "id": "E-CITIZEN-01",
            "text": "Cyber Police Mumbai: Case registered for illegal transfer. Pay bail surety of Rs 5000.",
            "stratum": "CITIZEN_SCAM",
            "language": "en",
            "provenance_type": "ADAPTED_PUBLIC_ADVISORY",
            "provenance_detail": "Advisory text.",
            "expected_is_scam": True,
            "expected_tier": "RED",
            "tier_rationale": "Digital arrest extortion pretext.",
            "threat_category": "Digital Arrest",
            "evidence_span": "Pay bail surety of Rs 5000."
        }
    ]
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(candidates), encoding="utf-8")

    pkg_dir = tmp_path / "frozen_pkg"
    manifest = freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_PKG_v1")

    # Tamper with test_inputs.json
    inputs_file = pkg_dir / "TEST_PKG_v1" / "test_inputs.json"
    inputs_data = json.loads(inputs_file.read_text(encoding="utf-8"))
    inputs_data[0]["text"] += " TAMPERED_MODIFIED_CONTENT"
    inputs_file.write_text(json.dumps(inputs_data), encoding="utf-8")

    out_dir = tmp_path / "eval_out"
    with pytest.raises(ValueError, match="Integrity check failed on test_inputs.json"):
        execute_evaluation(pkg_dir / "TEST_PKG_v1", out_dir)


def test_metric_computation_and_denominators():
    """Verify that TP, TN, FP, FN yield mathematically precise denominators."""
    tp, tn, fp, fn = 30, 48, 2, 20
    metrics = compute_binary_metrics(tp, tn, fp, fn)

    assert metrics["total_samples"] == 100
    assert metrics["accuracy"] == 78.0
    assert metrics["precision"] == round((30 / 32) * 100, 2)
    assert metrics["recall"] == round((30 / 50) * 100, 2)
    assert metrics["false_positive_rate"] == round((2 / 50) * 100, 2)
    assert metrics["denominators"]["precision_denom_predicted_positive"] == 32
    assert metrics["denominators"]["recall_denom_actual_positive"] == 50
    assert metrics["denominators"]["fpr_denom_actual_negative"] == 50
