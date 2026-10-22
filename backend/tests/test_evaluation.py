"""
Integration tests for Satark Saathi Repeatable Evaluation & Benchmarking Suite.
Asserts that precision, recall, false-positive/negative rates, latency benchmarks,
and workflow verifications meet production hackathon requirements.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.evaluation.evaluator import run_evaluation_suite
from backend.app.evaluation.dataset import EVALUATION_DATASET

@pytest.mark.asyncio
async def test_evaluation_suite_metrics_and_benchmarks():
    """
    Directly runs the repeatable evaluation suite and verifies statistical metrics.
    """
    report = await run_evaluation_suite()
    
    assert "summary" in report
    summary = report["summary"]
    
    # Verify dataset balance
    assert summary["total_samples"] == 30
    assert summary["scam_samples"] == 15
    assert summary["safe_samples"] == 15
    
    # Verify confusion matrix consistency
    cm = summary["confusion_matrix"]
    assert cm["true_positives"] + cm["false_positives"] + cm["true_negatives"] + cm["false_negatives"] == 30
    
    # Assert performance benchmarks
    metrics = summary["metrics"]
    assert metrics["precision"] >= 0.85, f"Precision was {metrics['precision']}, expected >= 0.85"
    assert metrics["recall"] >= 0.85, f"Recall was {metrics['recall']}, expected >= 0.85"
    assert metrics["f1_score"] >= 0.85, f"F1-Score was {metrics['f1_score']}, expected >= 0.85"
    assert metrics["false_positive_rate"] <= 0.15, f"FPR was {metrics['false_positive_rate']}, expected <= 0.15"
    assert metrics["false_negative_rate"] <= 0.15, f"FNR was {metrics['false_negative_rate']}, expected <= 0.15"
    
    # Verify latency benchmarks
    latency = summary["latency_benchmark"]
    assert latency["average_latency_ms"] > 0
    assert latency["min_latency_ms"] >= 0
    assert latency["max_latency_ms"] >= latency["min_latency_ms"]
    
    # Verify workflow verifications
    verifications = report["workflow_verifications"]
    assert verifications["family_alert_delivery"]["status"] == "PASSED"
    assert verifications["recovery_dossier_generation"]["status"] == "PASSED"
    
    # Verify methodology disclaimer exists
    assert "METHODOLOGY" in report["methodology_disclaimer"]

def test_evaluation_api_endpoints():
    """
    Tests the /api/evaluation/metrics and /api/evaluation/run endpoints.
    """
    with TestClient(app) as client:
        # GET metrics
        res_get = client.get("/api/evaluation/metrics")
        assert res_get.status_code == 200
        data_get = res_get.json()
        assert "summary" in data_get
        assert data_get["summary"]["total_samples"] == 30
        assert "provider_status" in data_get
        
        # POST run fresh evaluation
        res_post = client.post("/api/evaluation/run")
        assert res_post.status_code == 200
        data_post = res_post.json()
        assert "summary" in data_post
        assert len(data_post["sample_details"]) == 30
