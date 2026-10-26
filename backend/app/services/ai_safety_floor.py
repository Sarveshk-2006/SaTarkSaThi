"""
Combines an AI provider's assessment with the local deterministic result.

The deterministic engine stays authoritative: an AI result may add explanation and raise risk, but it
can never lower the local risk score, tier, or family-alert decision. Signals already found locally are
not re-added (no double counting); the final score is max(local, ai), never a sum.
"""

from backend.app.services.analysis_result import AnalysisResult, AnalysisMode


def apply_local_safety_floor(ai: AnalysisResult, local: AnalysisResult, provider_label: str) -> AnalysisResult:
    if local.risk_score > ai.risk_score:
        ai.risk_score = local.risk_score
        ai.risk_level = local.risk_level
        ai.policy_tier = local.policy_tier
        ai.severity = local.severity
        ai.limitations.insert(
            0,
            f"Deterministic safety floor applied: the local rule engine rated this higher than {provider_label}, "
            "so the higher local rating is shown.",
        )

    ai.should_alert_family = ai.should_alert_family or local.should_alert_family
    ai.is_flagged_for_family = ai.is_flagged_for_family or local.is_flagged_for_family

    ai_types = {s.signal_type for s in ai.detected_signals}
    for sig in local.detected_signals:
        if sig.signal_type not in ai_types:
            ai.detected_signals.append(sig)
    for code in local.reason_codes:
        if code not in ai.reason_codes:
            ai.reason_codes.append(code)
    for action in local.recommended_actions:
        if action not in ai.recommended_actions:
            ai.recommended_actions.append(action)

    ai.analysis_mode = AnalysisMode.HYBRID
    ai.limitations.append("The AI score is a heuristic, not a calibrated fraud probability.")
    return ai
