"""
Phase 4.9 Adversarial Package-Integrity and Access-Boundary Test Suite.
Validates system defenses against:
1. Tampered test inputs after cryptographic packaging.
2. Tampered ground-truth labels after cryptographic packaging.
3. Missing or malformed manifest files.
4. Hash mismatches against manifest.
5. Duplicate sample IDs during freeze and evaluation.
6. Invalid, missing, or corrupt risk tiers.
7. Omitted or malformed reviewer labels and degenerate kappa calculations.
8. Non-existent or unauthorized package directory paths.
9. Verification failure stopping execution (no misleading PASS).
10. Decoupled detector inference isolation (unlabelled payload only).
"""

import json
import pytest
from pathlib import Path

from evaluation_governance.tools.package_freezer import freeze_candidate_package, sha256_file
from evaluation_governance.tools.run_dataset_e_evaluator import execute_evaluation
from evaluation_governance.tools.calculate_agreement import compute_cohens_kappa, analyze_reviewer_submissions


@pytest.fixture
def valid_candidate_data():
    return [
        {
            "id": "E-CITIZEN-01",
            "text": "Cyber Crime Branch notice: Pay fine of Rs 25000 immediately to avoid arrest warrant.",
            "stratum": "CITIZEN_SCAM",
            "language": "en",
            "provenance_type": "ADAPTED_PUBLIC_ADVISORY",
            "provenance_detail": "Advisory text.",
            "expected_is_scam": True,
            "expected_tier": "RED",
            "tier_rationale": "Digital arrest extortion threat.",
            "threat_category": "Digital Arrest",
            "evidence_span": "Pay fine of Rs 25000 immediately to avoid arrest warrant."
        },
        {
            "id": "E-INST-01",
            "text": "IRCTC Booking Confirmation: PNR 4829104820 Train 12951. Berth B3-24 confirmed.",
            "stratum": "INSTITUTIONAL_BENIGN",
            "language": "en",
            "provenance_type": "RESPONSIBLY_SOURCED_PUBLIC_RECORD",
            "provenance_detail": "Standard booking SMS.",
            "expected_is_scam": False,
            "expected_tier": "GREEN",
            "tier_rationale": "Standard railway reservation notice.",
            "threat_category": "Legitimate Travel Notice",
            "evidence_span": None
        }
    ]


def test_adversarial_tampered_test_inputs(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Changing test input text after package freeze must abort evaluation."""
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(valid_candidate_data), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"
    freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_TAMPER_INPUT")

    # Tamper with test_inputs.json
    inputs_file = pkg_dir / "TEST_TAMPER_INPUT" / "test_inputs.json"
    inputs = json.loads(inputs_file.read_text(encoding="utf-8"))
    inputs[0]["text"] += " [INJECTED_ADVERSARIAL_TEXT]"
    inputs_file.write_text(json.dumps(inputs), encoding="utf-8")

    out_dir = tmp_path / "eval_out"
    with pytest.raises(ValueError, match="Integrity check failed on test_inputs.json"):
        execute_evaluation(pkg_dir / "TEST_TAMPER_INPUT", out_dir)


def test_adversarial_tampered_ground_truth(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Modifying ground truth labels after freeze must abort evaluation."""
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(valid_candidate_data), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"
    freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_TAMPER_TRUTH")

    # Tamper with ground_truth.json (flip expected_is_scam)
    truth_file = pkg_dir / "TEST_TAMPER_TRUTH" / "ground_truth.json"
    truth = json.loads(truth_file.read_text(encoding="utf-8"))
    truth[0]["expected_is_scam"] = False
    truth_file.write_text(json.dumps(truth), encoding="utf-8")

    out_dir = tmp_path / "eval_out"
    with pytest.raises(ValueError, match="Integrity check failed on ground_truth.json"):
        execute_evaluation(pkg_dir / "TEST_TAMPER_TRUTH", out_dir)


def test_adversarial_missing_manifest(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Missing manifest must abort execution."""
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(valid_candidate_data), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"
    freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_NO_MANIFEST")

    manifest_file = pkg_dir / "TEST_NO_MANIFEST" / "manifest.json"
    manifest_file.unlink()

    out_dir = tmp_path / "eval_out"
    with pytest.raises(FileNotFoundError, match="Incomplete package directory"):
        execute_evaluation(pkg_dir / "TEST_NO_MANIFEST", out_dir)


def test_adversarial_malformed_manifest_json(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Non-JSON or corrupted manifest must abort execution with clear error."""
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(valid_candidate_data), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"
    freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_CORRUPT_MANIFEST")

    manifest_file = pkg_dir / "TEST_CORRUPT_MANIFEST" / "manifest.json"
    manifest_file.write_text("{CORRUPTED_NOT_VALID_JSON", encoding="utf-8")

    out_dir = tmp_path / "eval_out"
    with pytest.raises(ValueError, match="Manifest JSON is malformed"):
        execute_evaluation(pkg_dir / "TEST_CORRUPT_MANIFEST", out_dir)


def test_adversarial_corrupted_manifest_hash(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Manifest containing wrong hash must abort execution."""
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(valid_candidate_data), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"
    freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_HASH_MISMATCH")

    manifest_file = pkg_dir / "TEST_HASH_MISMATCH" / "manifest.json"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    manifest["files"]["test_inputs"]["sha256"] = "0000000000000000000000000000000000000000000000000000000000000000"
    manifest_file.write_text(json.dumps(manifest), encoding="utf-8")

    out_dir = tmp_path / "eval_out"
    with pytest.raises(ValueError, match="Integrity check failed on test_inputs.json"):
        execute_evaluation(pkg_dir / "TEST_HASH_MISMATCH", out_dir)


def test_adversarial_duplicate_sample_ids_in_freeze(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Duplicate sample IDs in candidate pool must be rejected at freeze time."""
    dup_candidates = valid_candidate_data + [valid_candidate_data[0]]  # Add duplicate ID
    cand_file = tmp_path / "dup_cand.json"
    cand_file.write_text(json.dumps(dup_candidates), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"

    with pytest.raises(ValueError, match="Duplicate sample ID detected during freeze"):
        freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_DUP_FREEZE")


def test_adversarial_duplicate_sample_ids_in_evaluator(tmp_path):
    """ADVERSARIAL: Duplicate sample IDs in test_inputs.json must be rejected by evaluator."""
    pkg_dir = tmp_path / "frozen_pkg" / "TEST_DUP_EVAL"
    pkg_dir.mkdir(parents=True)

    inputs = [
        {"id": "E-CITIZEN-01", "text": "Cyber police fine demand 25000.", "channel": "SMS"},
        {"id": "E-CITIZEN-01", "text": "Duplicate message with same ID.", "channel": "SMS"}
    ]
    truth = [
        {"id": "E-CITIZEN-01", "expected_is_scam": True, "expected_tier": "RED", "stratum": "CITIZEN_SCAM"}
    ]

    inp_path = pkg_dir / "test_inputs.json"
    tru_path = pkg_dir / "ground_truth.json"
    inp_path.write_text(json.dumps(inputs), encoding="utf-8")
    tru_path.write_text(json.dumps(truth), encoding="utf-8")

    manifest = {
        "package_id": "TEST_DUP_EVAL",
        "version": "1.0.0",
        "files": {
            "test_inputs": {"sha256": sha256_file(inp_path)},
            "ground_truth": {"sha256": sha256_file(tru_path)}
        }
    }
    (pkg_dir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    out_dir = tmp_path / "eval_out"
    with pytest.raises(ValueError, match="Duplicate sample ID detected in test_inputs.json"):
        execute_evaluation(pkg_dir, out_dir)


def test_adversarial_invalid_expected_tier(tmp_path, valid_candidate_data):
    """ADVERSARIAL: Ground truth record with invalid tier (e.g. 'EXTREME') must be rejected."""
    bad_candidates = valid_candidate_data.copy()
    bad_candidates[0] = dict(bad_candidates[0], expected_tier="EXTREME")
    cand_file = tmp_path / "bad_tier.json"
    cand_file.write_text(json.dumps(bad_candidates), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"

    with pytest.raises(ValueError, match="invalid 'expected_tier'"):
        freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_BAD_TIER")


def test_adversarial_reviewer_missing_sample_identification(tmp_path):
    """ADVERSARIAL: Reviewer submissions with missing samples must be reported explicitly."""
    r1 = {
        "reviewer_id": "REV_01",
        "submission_timestamp": "2026-10-23T10:00:00Z",
        "labels": {
            "E-CITIZEN-01": {"is_scam": True, "risk_tier": "RED"},
            "E-INST-01": {"is_scam": False, "risk_tier": "GREEN"}
        }
    }
    r2 = {
        "reviewer_id": "REV_02",
        "submission_timestamp": "2026-10-23T10:05:00Z",
        "labels": {
            "E-CITIZEN-01": {"is_scam": True, "risk_tier": "RED"}
            # E-INST-01 is missing from reviewer 2!
        }
    }
    f1 = tmp_path / "r1.json"
    f2 = tmp_path / "r2.json"
    f1.write_text(json.dumps(r1), encoding="utf-8")
    f2.write_text(json.dumps(r2), encoding="utf-8")

    rep = analyze_reviewer_submissions(f1, f2)
    assert rep["status"] == "COMPUTED_WITH_OMISSIONS"
    assert "E-INST-01" in rep["missing_in_reviewer_2"]
    assert rep["sample_count"] == 1


def test_adversarial_reviewer_missing_is_scam_field(tmp_path):
    """ADVERSARIAL: Reviewer submission missing 'is_scam' field must fail rather than coerce to False."""
    r1 = {
        "reviewer_id": "REV_01",
        "submission_timestamp": "2026-10-23T10:00:00Z",
        "labels": {
            "E-CITIZEN-01": {"risk_tier": "RED"}  # is_scam is omitted!
        }
    }
    r2 = {
        "reviewer_id": "REV_02",
        "submission_timestamp": "2026-10-23T10:05:00Z",
        "labels": {
            "E-CITIZEN-01": {"is_scam": True, "risk_tier": "RED"}
        }
    }
    f1 = tmp_path / "r1.json"
    f2 = tmp_path / "r2.json"
    f1.write_text(json.dumps(r1), encoding="utf-8")
    f2.write_text(json.dumps(r2), encoding="utf-8")

    with pytest.raises(ValueError, match="missing or non-boolean 'is_scam'"):
        analyze_reviewer_submissions(f1, f2)


def test_adversarial_degenerate_kappa_all_single_class():
    """ADVERSARIAL: When all samples fall into a single class, Kappa is undefined (0/0), not 1.0."""
    labels_1 = [True, True, True, True, True]
    labels_2 = [True, True, True, True, True]
    categories = [True, False]
    kappa, p_o, matrix = compute_cohens_kappa(labels_1, labels_2, categories)

    assert p_o == 1.0
    # Kappa must be None (undefined degenerate condition) rather than a falsely asserted 1.0
    assert kappa is None


def test_adversarial_evaluator_unauthorized_nonexistent_path(tmp_path):
    """ADVERSARIAL: Non-existent or invalid directory path must abort evaluation."""
    bad_dir = tmp_path / "NON_EXISTENT_DIR_999"
    out_dir = tmp_path / "eval_out"

    with pytest.raises(FileNotFoundError, match="Incomplete package directory"):
        execute_evaluation(bad_dir, out_dir)


def test_detector_inference_isolation(tmp_path, valid_candidate_data):
    """
    VERIFICATION: Ensure detector receives strictly unlabelled payloads.
    Inspect serialized predictions to verify that no ground truth labels
    were passed to or generated from the detector stage.
    """
    cand_file = tmp_path / "cand.json"
    cand_file.write_text(json.dumps(valid_candidate_data), encoding="utf-8")
    pkg_dir = tmp_path / "frozen_pkg"
    freeze_candidate_package(cand_file, pkg_dir, package_id="TEST_ISOLATION_v1")

    out_dir = tmp_path / "eval_out"
    rep = execute_evaluation(pkg_dir / "TEST_ISOLATION_v1", out_dir)

    # Load predictions file
    pred_files = list(out_dir.glob("TEST_ISOLATION_v1_predictions_*.json"))
    assert len(pred_files) == 1
    preds = json.loads(pred_files[0].read_text(encoding="utf-8"))

    for p in preds:
        # Prediction object must have 'id', 'deterministic', 'hybrid', 'semantic_diagnostic'
        assert "id" in p
        assert "deterministic" in p
        # Must NOT leak ground truth fields into predictions file
        assert "expected_is_scam" not in p
        assert "expected_tier" not in p
        assert "tier_rationale" not in p
        assert "threat_category" not in p
