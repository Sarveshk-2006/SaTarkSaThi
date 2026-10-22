"""
Evaluation API router for Satark Saathi (/api/evaluation).
Provides endpoints to trigger repeatable benchmark evaluations, view confusion matrices,
precision/recall metrics, latency measurements, and workflow completion status.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from backend.app.evaluation.evaluator import run_evaluation_suite

router = APIRouter(prefix="/evaluation", tags=["Model Evaluation & Benchmarking"])

_CACHED_REPORT: Dict[str, Any] = {}

@router.get("/metrics")
async def get_evaluation_metrics():
    """
    Returns the latest benchmark evaluation scorecard including precision, recall,
    false-positive rate, latency benchmarks, and dataset sample count.
    """
    global _CACHED_REPORT
    if not _CACHED_REPORT:
        _CACHED_REPORT = await run_evaluation_suite()
    return _CACHED_REPORT

@router.post("/run")
async def run_evaluation():
    """
    Executes a fresh evaluation run across the 30-sample ground-truth dataset
    and returns complete precision, recall, latency, and sample classifications.
    """
    global _CACHED_REPORT
    _CACHED_REPORT = await run_evaluation_suite()
    return _CACHED_REPORT
