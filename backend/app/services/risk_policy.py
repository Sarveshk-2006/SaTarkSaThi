"""
Centralized Risk Policy Engine for Satark Saathi.

Responsible for deterministic mapping from detected manipulation signals and heuristic scores
to standardized policy tiers (GREEN, AMBER, RED), severity labels, confidence levels,
protective recommended actions, and family alert triggers.

POLICY TIERS:
- GREEN (Score 0-34):
    No strong risk indicators were detected. This does not guarantee safety.
    Standard digital hygiene and vigilance apply.
- AMBER (Score 35-69):
    Suspicious, incomplete, or conflicting indicators warrant independent verification
    before any action or financial transfer.
- RED (Score 70-100 or Acute Threat Override):
    Strong indicators of coercion, impersonation, or high-risk payment pressure.
    Requires immediate pause, disengagement, and seeking trusted help.
"""

from typing import List, Tuple, Set, Optional
from enum import Enum
from backend.app.services.analysis_result import (
    RiskLevel, ConfidenceLabel, DetectedSignal, AnalysisMode
)


class PolicyTier(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"

    @classmethod
    def from_score(cls, score: int) -> "PolicyTier":
        if score >= 50:
            return cls.RED
        if score >= 35:
            return cls.AMBER
        return cls.GREEN


# Set of reason codes representing acute coercive threats that cannot be downgraded to GREEN
ACUTE_THREAT_CODES: Set[str] = {
    "SIG_DIGITAL_ARREST",
    "SIG_CREDENTIAL_THEFT_OTP",
    "SIG_REMOTE_DEVICE_TAKEOVER",
    "SIG_PREDATORY_LOAN_EXTORTION",
    "SIG_FAMILY_EMERGENCY_IMPERSONATION",
    "SIG_ADVERSARIAL_PROMPT_INJECTION",
    "SIG_EXECUTIVE_GIFT_CARD",
    "SIG_DISCIPLINARY_BLACKMAIL",
    "SIG_UPI_COLLECT_PIN_TRAP",
    "SIG_ARMY_QR_RENTAL_FRAUD",
}


class RiskPolicy:
    """
    Deterministic rule-based policy evaluator.
    Decoupled from input parsing and signal extraction.
    """

    # Baseline thresholds matching existing validated scoring system
    GREEN_MAX_SCORE = 34
    AMBER_MIN_SCORE = 35
    AMBER_MAX_SCORE = 49
    RED_MIN_SCORE = 50
    SAFETY_FLOOR_RED = 50
    ACUTE_THREAT_CODES = ACUTE_THREAT_CODES

    @classmethod
    def evaluate(
        cls,
        raw_score: int,
        counter_reduction: int,
        signals: List[DetectedSignal],
        counter_signals: List[DetectedSignal]
    ) -> Tuple[int, PolicyTier, RiskLevel, str, ConfidenceLabel, bool, List[str], str]:
        """
        Evaluates the evidence against the centralized policy.

        Returns:
            final_score (int): 0 to 99 bounded heuristic score
            policy_tier (PolicyTier): GREEN, AMBER, or RED
            risk_level (RiskLevel): LOW, MEDIUM, HIGH, or CRITICAL
            severity (str): SAFE, CAUTION, or HIGH_RISK (legacy compatibility)
            confidence (ConfidenceLabel): LOW, MEDIUM, or HIGH
            should_alert_family (bool): trigger for Family Shield broadcast
            recommended_actions (List[str]): ordered, proportionate actionable steps
            primary_action (str): single headline action
        """
        # 1. Identify active acute threat signals
        active_reason_codes = {
            getattr(s, "reason_code", "") or s.signal_type for s in signals if s.weight > 0
        }
        has_acute_threat = bool(active_reason_codes.intersection(ACUTE_THREAT_CODES))

        # Check for verified educational advisory or official in-person visit counter-signals
        has_advisory_or_in_person = any(
            getattr(cs, "reason_code", "") in ("CTR_SECURITY_AWARENESS_ADVISORY", "CTR_IN_PERSON_OFFICIAL_VISIT")
            for cs in counter_signals
        )
        has_coercive_demand = any(
            "PAYMENT" in s.signal_type or
            getattr(s, "reason_code", "") in ("SIG_COERCIVE_PAYMENT_DEMAND", "SIG_SECRECY_ISOLATION", "SIG_SAFE_ACCOUNT_DECEPTION")
            for s in signals
        )

        # If a verified educational awareness advisory or in-person station visit direction is present without payment or isolation coercion,
        # it is not an acute extortion threat.
        if has_advisory_or_in_person and not has_coercive_demand:
            has_acute_threat = False

        # 2. Counter-signal protection:
        # If an acute threat is present, counter-signals can never reduce score below AMBER threshold (35)
        # and cannot negate the fraud indicators.
        effective_counter = counter_reduction
        if has_acute_threat and (raw_score - counter_reduction) < cls.AMBER_MIN_SCORE:
            effective_counter = max(0, raw_score - 45)

        adjusted_score = max(raw_score - effective_counter, 0)
        final_score = min(adjusted_score, 99)

        # 3. Determine Policy Tier & Risk Level
        if final_score >= cls.RED_MIN_SCORE or (has_acute_threat and final_score >= 45):
            policy_tier = PolicyTier.RED
            severity = "HIGH_RISK"
            risk_level = RiskLevel.CRITICAL if final_score >= 70 else RiskLevel.HIGH
            should_alert_family = True
            confidence = ConfidenceLabel.HIGH if (final_score >= 70 or len(signals) >= 2) else ConfidenceLabel.MEDIUM
        elif final_score >= cls.AMBER_MIN_SCORE or has_acute_threat:
            policy_tier = PolicyTier.AMBER
            severity = "CAUTION"
            risk_level = RiskLevel.MEDIUM
            should_alert_family = False
            confidence = ConfidenceLabel.MEDIUM
        else:
            policy_tier = PolicyTier.GREEN
            severity = "SAFE"
            risk_level = RiskLevel.LOW
            should_alert_family = False
            confidence = ConfidenceLabel.LOW if final_score < 10 else ConfidenceLabel.MEDIUM

        # 4. Generate proportionate recommended actions
        recommended_actions, primary_action = cls._get_recommended_actions(
            policy_tier=policy_tier,
            signals=signals,
            has_acute_threat=has_acute_threat
        )

        return (
            final_score,
            policy_tier,
            risk_level,
            severity,
            confidence,
            should_alert_family,
            recommended_actions,
            primary_action
        )

    @classmethod
    def _get_recommended_actions(
        cls,
        policy_tier: PolicyTier,
        signals: List[DetectedSignal],
        has_acute_threat: bool
    ) -> Tuple[List[str], str]:
        """Returns ordered, proportionate actions based on tier and detected signals."""
        signal_types = {s.signal_type for s in signals}

        if policy_tier == PolicyTier.RED:
            primary = "Stop immediately: Do not transfer funds or share codes, and seek trusted help."
            actions = [
                "Do NOT reply to or call back this sender",
                "Do NOT click any links or download attached files",
                "Do NOT transfer funds to any 'verification', 'police', or 'escrow' account",
                "Block the sender immediately",
                "Alert Family Shield trusted contacts or call national cyber helpline 1930"
            ]
            if "REMOTE_ACCESS_REQUEST" in signal_types or any("REMOTE" in s.signal_type for s in signals):
                actions.insert(0, "Do NOT install AnyDesk, TeamViewer, or screen-sharing tools; uninstall if already added")
            if "CREDENTIAL_THEFT" in signal_types or any("OTP" in s.signal_type for s in signals):
                actions.insert(0, "NEVER disclose OTPs, UPI PINs, or NetBanking passwords over the phone")

        elif policy_tier == PolicyTier.AMBER:
            primary = "Pause and verify independently through official directory-listed numbers before acting."
            actions = [
                "Do not click links or call numbers provided directly inside this message",
                "Verify the sender through official websites or numbers printed on your physical bill/card",
                "Do not share personal, banking, or identification details",
                "Consult with a trusted family member before taking any financial action"
            ]
        else:
            primary = "Standard digital safety: Practice everyday vigilance and never share banking PINs or OTPs."
            actions = [
                "Standard digital hygiene: Verify unexpected requests through a known contact number",
                "Never share OTPs, PINs, or passwords with anyone under any circumstances"
            ]

        return actions, primary
