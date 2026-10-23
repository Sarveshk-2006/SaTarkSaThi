"""
Evaluation API router for Satark Saathi (/api/evaluation).
Provides endpoints to trigger repeatable benchmark evaluations, view confusion matrices,
precision/recall metrics, latency measurements, and workflow completion status.
Supports baseline (N=30) and expanded (N=60) evaluation datasets.
"""

from fastapi import APIRouter, Query, HTTPException, status
from typing import Dict, Any
from backend.app.evaluation.evaluator import run_evaluation_suite

router = APIRouter(prefix="/evaluation", tags=["Model Evaluation & Benchmarking"])

_CACHED_REPORTS: Dict[str, Dict[str, Any]] = {}

@router.get("/metrics")
async def get_evaluation_metrics(dataset: str = Query("baseline", description="Dataset to evaluate: 'baseline' (N=30) or 'expanded' (N=60)")):
    """
    Returns the latest benchmark evaluation scorecard including precision, recall,
    false-positive rate, latency benchmarks, and dataset sample count.
    """
    global _CACHED_REPORTS
    ds_key = dataset.lower()
    if ds_key not in _CACHED_REPORTS:
        _CACHED_REPORTS[ds_key] = await run_evaluation_suite(dataset_name=ds_key)
    return _CACHED_REPORTS[ds_key]

@router.post("/run")
async def run_evaluation(dataset: str = Query("baseline", description="Dataset to evaluate: 'baseline' (N=30) or 'expanded' (N=60)")):
    """
    Executes a fresh evaluation run across the selected dataset (baseline N=30 or expanded N=60)
    and returns complete precision, recall, latency, and sample classifications.
    Forbidden in production to protect server compute resources.
    """
    from backend.app.config import settings
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Production security policy: Benchmark execution is disabled in production environments."
        )

    global _CACHED_REPORTS
    ds_key = dataset.lower()
    _CACHED_REPORTS[ds_key] = await run_evaluation_suite(dataset_name=ds_key)
    return _CACHED_REPORTS[ds_key]
