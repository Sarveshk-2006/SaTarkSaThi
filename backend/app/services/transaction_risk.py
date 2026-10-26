"""
Deterministic, explainable pre-transaction risk assessment.

Every point added to the score is attached to a RiskSignal that states where the
evidence came from (user report, recipient pattern, transaction history, amount
context, or a demo-simulated device signal). No machine-learning model is used:
there is no real labelled transaction dataset in this project to train or
evaluate one honestly (see docs/FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md).
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

CALL_STATE_NONE = "NONE"
CALL_STATE_DEMO = "DEMO_SIMULATED_ACTIVE_CALL"
CALL_STATE_USER = "USER_REPORTED_ACTIVE_CALL"
VALID_CALL_STATES = {CALL_STATE_NONE, CALL_STATE_DEMO, CALL_STATE_USER}

SOURCE_USER = "USER_REPORTED"
SOURCE_RECIPIENT = "RECIPIENT_PATTERN"
SOURCE_HISTORY = "TRANSACTION_HISTORY"
SOURCE_AMOUNT = "AMOUNT_CONTEXT"
SOURCE_DEMO_DEVICE = "DEMO_SIMULATED_DEVICE_SIGNAL"
SOURCE_PURPOSE = "PAYMENT_PURPOSE_TEXT"

HISTORY_WINDOW_DAYS = 90
ESTABLISHED_PAYEE_MIN_AGE = timedelta(hours=24)
VELOCITY_WINDOW = timedelta(minutes=30)
MIN_HISTORY_FOR_BASELINE = 5

HIGH_VALUE_THRESHOLD = 25_000
VERY_HIGH_VALUE_THRESHOLD = 50_000
GUARDIAN_REVIEW_AMOUNT = 25_000

INSTITUTIONAL_VPA_KEYWORDS = [
    "cbi", "police", "customs", "cyber", "lottery", "refund", "nodal", "discom", "power-desk",
]
PERSONAL_PSP_SUFFIXES = ["@ybl", "@oksbi", "@okhdfc", "@okaxis", "@paytm", "@ibl", "@apl"]
PURPOSE_RISK_TERMS = [
    "arrest", "warrant", "bail", "clearance fee", "customs duty", "parcel", "kyc update",
    "disconnection", "task deposit", "unlock", "guaranteed", "court fine", "pmla",
]

TIER_ORDER = {"GREEN": 0, "AMBER": 1, "RED": 2}

SCAM_INDICATOR_CODES = {
    "AUTHORITY_CLAIM", "SECRECY_DEMAND", "GUARANTEED_RETURNS", "URGENT_PRESSURE", "ACTIVE_CALL",
    "INSTITUTIONAL_KEYWORD_VPA", "PRIVATE_HANDLE_FOR_OFFICIAL_PAYMENT", "PURPOSE_RISK_TERMS",
    "REPEAT_PAYMENT_TO_RECENT_PAYEE",
}


@dataclass
class RiskSignal:
    code: str
    label: str
    points: int
    explanation: str
    source: str

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class HistoryItem:
    payee_vpa: str
    amount: float
    created_at: datetime


@dataclass
class PaymentContext:
    vpa: str
    amount: float
    recipient_name: Optional[str] = None
    purpose: Optional[str] = None
    pressure_present: bool = False
    authority_claimed: bool = False
    secrecy_demanded: bool = False
    guaranteed_returns: bool = False
    call_state: str = CALL_STATE_NONE
    self_reported_new_recipient: Optional[bool] = None


@dataclass
class PaymentAssessment:
    risk_score: int
    policy_tier: str
    outcome: str
    severity: str
    decision_rationale: str
    is_new_payee: bool
    guardian_approval_recommended: bool
    signals: List[RiskSignal] = field(default_factory=list)
    verification_steps: List[str] = field(default_factory=list)
    history_summary: Dict = field(default_factory=dict)

    @property
    def evidence_factors(self) -> List[str]:
        return [s.explanation for s in self.signals if s.points > 0]


def _as_utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _inr(amount: float) -> str:
    return f"₹{amount:,.0f}"


def _percentile(values: List[float], pct: float) -> float:
    ordered = sorted(values)
    rank = max(1, math.ceil(pct / 100 * len(ordered)))
    return ordered[rank - 1]


def tier_max(*tiers: str) -> str:
    return max(tiers, key=lambda t: TIER_ORDER.get(t, 0))


def assess_payment(ctx: PaymentContext, history: List[HistoryItem], now: Optional[datetime] = None) -> PaymentAssessment:
    """Pure function: same inputs always produce the same assessment."""
    now = _as_utc(now or datetime.now(timezone.utc))
    vpa = (ctx.vpa or "").strip().lower()
    purpose = (ctx.purpose or "").strip().lower()
    amount = float(ctx.amount)
    call_state = ctx.call_state if ctx.call_state in VALID_CALL_STATES else CALL_STATE_NONE
    active_call = call_state != CALL_STATE_NONE

    window_start = now - timedelta(days=HISTORY_WINDOW_DAYS)
    items = [h for h in history if window_start <= _as_utc(h.created_at) <= now]

    signals: List[RiskSignal] = []
    steps: List[str] = []

    established = {h.payee_vpa.strip().lower() for h in items if _as_utc(h.created_at) <= now - ESTABLISHED_PAYEE_MIN_AGE}
    if items:
        is_new_payee = vpa not in established
    else:
        is_new_payee = True if ctx.self_reported_new_recipient is None else bool(ctx.self_reported_new_recipient)
    any_coercion_flag = ctx.authority_claimed or ctx.secrecy_demanded or ctx.guaranteed_returns or ctx.pressure_present

    # 1. User-reported coercion
    if ctx.authority_claimed:
        signals.append(RiskSignal("AUTHORITY_CLAIM", "Official authority claimed", 40,
            "You reported that the requester claims to be police, CBI, customs, a court or another official body.", SOURCE_USER))
        steps.append("Police, courts and investigating agencies in India never collect fines or bail through personal UPI IDs.")
    if ctx.secrecy_demanded:
        signals.append(RiskSignal("SECRECY_DEMAND", "Secrecy demanded", 30,
            "You reported being told to keep this payment secret from family, friends or the bank.", SOURCE_USER))
        steps.append("Stop and tell a trusted family member about this payment before doing anything else.")
    if ctx.guaranteed_returns:
        signals.append(RiskSignal("GUARANTEED_RETURNS", "Guaranteed returns promised", 35,
            "You reported a promise of fixed or guaranteed profits, a common investment/task scam pattern.", SOURCE_USER))
        steps.append("No registered Indian financial entity can promise guaranteed high returns. Check SEBI/RBI registration yourself.")
    if ctx.pressure_present:
        signals.append(RiskSignal("URGENT_PRESSURE", "Urgent pressure", 25,
            "You reported a deadline, threat or penalty pushing you to pay quickly.", SOURCE_USER))
        steps.append("Pause for 15 minutes. Genuine organisations allow time to verify.")

    # 2. Call-state context (never detected automatically in this prototype).
    # Being on a call while paying a known payee a small amount is common, so it only adds
    # real weight together with a new payee, a large amount or a coercion factor.
    concerning_call = active_call and (is_new_payee or amount >= 10_000 or any_coercion_flag)
    if active_call:
        source = SOURCE_DEMO_DEVICE if call_state == CALL_STATE_DEMO else SOURCE_USER
        origin = ("A demo-simulated call-state signal (not real device detection) shows that" if call_state == CALL_STATE_DEMO
                  else "You reported that")
        if concerning_call:
            signals.append(RiskSignal("ACTIVE_CALL", "Payment during an active call", 20,
                f"{origin} a phone or video call is in progress while paying a new payee, a large amount, or under pressure.", source))
            steps.append("End the call before paying. Call the organisation back on a number you already know.")
        else:
            signals.append(RiskSignal("ACTIVE_CALL", "Payment during an active call", 0,
                f"{origin} a call is in progress, but this is a small payment to a known payee, so it does not pause the payment.", source))

    # 3. Recipient patterns
    found_keywords = [kw for kw in INSTITUTIONAL_VPA_KEYWORDS if kw in vpa]
    if found_keywords:
        signals.append(RiskSignal("INSTITUTIONAL_KEYWORD_VPA", "Official-sounding UPI ID", 30,
            f"The UPI ID contains '{', '.join(found_keywords)}', which scammers use to look official on individual accounts.", SOURCE_RECIPIENT))
    if ctx.authority_claimed and any(vpa.endswith(s) for s in PERSONAL_PSP_SUFFIXES):
        signals.append(RiskSignal("PRIVATE_HANDLE_FOR_OFFICIAL_PAYMENT", "Official payment to a personal handle", 20,
            "An 'official' payment is being requested to a personal retail UPI handle.", SOURCE_RECIPIENT))

    found_terms = [t for t in PURPOSE_RISK_TERMS if t in purpose]
    if found_terms:
        signals.append(RiskSignal("PURPOSE_RISK_TERMS", "Purpose matches scam scripts", 15,
            f"The stated purpose mentions '{', '.join(found_terms)}', which commonly appear in scam scripts.", SOURCE_PURPOSE))

    # 4. Transaction-history context
    recent_same_payee = [h for h in items if h.payee_vpa.strip().lower() == vpa and _as_utc(h.created_at) > now - ESTABLISHED_PAYEE_MIN_AGE]

    if is_new_payee:
        if amount >= 10_000:
            points = 20
        elif amount >= 2_000:
            points = 8
        else:
            points = 0
        basis = "no earlier payment to this UPI ID in your last 90 days of history" if items else "you marked this recipient as new (no transaction history available)"
        if items and ctx.self_reported_new_recipient is False:
            basis += " — although you marked them as known"
        explanation = f"First-time payee: {basis}."
        if points == 0:
            explanation += f" Small amounts ({_inr(amount)}) to new payees are common, so no risk points were added."
        signals.append(RiskSignal("NEW_PAYEE", "New payee", points, explanation, SOURCE_HISTORY if items else SOURCE_USER))
        if points:
            steps.append("Confirm the payee's identity with a ₹1 test payment or a call on a number you already know.")

    if recent_same_payee:
        signals.append(RiskSignal("REPEAT_PAYMENT_TO_RECENT_PAYEE", "Repeated payment to a recent payee", 15,
            f"You already paid this UPI ID {len(recent_same_payee)} time(s) in the last 24 hours. Repeated 'unlock' or 'release' fees are a common scam pattern.",
            SOURCE_HISTORY))

    amounts = [h.amount for h in items]
    history_summary: Dict = {"transactions_considered": len(items), "window_days": HISTORY_WINDOW_DAYS}
    if len(amounts) >= MIN_HISTORY_FOR_BASELINE:
        median = statistics.median(amounts)
        p90 = _percentile(amounts, 90)
        history_summary.update({"median_amount": round(median, 2), "p90_amount": round(p90, 2)})
        if amount >= 5_000 and amount > 3 * p90:
            ratio = amount / p90 if p90 > 0 else float("inf")
            points = 25 if ratio > 10 else 15
            signals.append(RiskSignal("AMOUNT_DEVIATION", "Unusually large for you", points,
                f"{_inr(amount)} is {ratio:.1f}x your usual larger payments (90th percentile {_inr(p90)}, median {_inr(median)}) over the last {HISTORY_WINDOW_DAYS} days.",
                SOURCE_HISTORY))
    else:
        history_summary["baseline_note"] = (
            f"Only {len(amounts)} past transaction(s) available; at least {MIN_HISTORY_FOR_BASELINE} are needed for a spending baseline."
        )

    recent = [h for h in items if _as_utc(h.created_at) > now - VELOCITY_WINDOW]
    recent_total = sum(h.amount for h in recent)
    history_summary.update({"payments_last_30_min": len(recent), "amount_last_30_min": round(recent_total, 2)})
    if len(recent) >= 2 or (recent and recent_total + amount >= HIGH_VALUE_THRESHOLD and amount >= 5_000):
        signals.append(RiskSignal("RAPID_VELOCITY", "Rapid payments", 15,
            f"This would be payment #{len(recent) + 1} in 30 minutes ({_inr(recent_total)} already sent). Scammers often push several quick transfers.",
            SOURCE_HISTORY))

    # 5. Amount context
    if amount >= VERY_HIGH_VALUE_THRESHOLD:
        signals.append(RiskSignal("HIGH_VALUE", "Very high value", 15,
            f"{_inr(amount)} is a very high-value transfer; UPI payments are hard to reverse.", SOURCE_AMOUNT))
    elif amount >= HIGH_VALUE_THRESHOLD:
        signals.append(RiskSignal("HIGH_VALUE", "High value", 10,
            f"{_inr(amount)} is a high-value transfer; UPI payments are hard to reverse.", SOURCE_AMOUNT))

    raw = 10 + sum(s.points for s in signals)
    risk_score = min(max(raw, 12), 99)

    # Amount/history signals alone describe unusual behaviour, not coercion, so they can pause a
    # payment (AMBER) but never label it as a scam (RED).
    has_scam_indicator = any(s.code in SCAM_INDICATOR_CODES and s.points > 0 for s in signals)

    if (
        (risk_score >= 70 and has_scam_indicator)
        or (ctx.authority_claimed and ctx.secrecy_demanded)
        or ctx.guaranteed_returns
        or (active_call and ctx.authority_claimed)
    ):
        tier, outcome, severity = "RED", "SEEK_TRUSTED_HELP", "HIGH_RISK"
        rationale = (
            "CRITICAL COERCION DETECTED: This transaction displays hallmarks of social engineering fraud "
            "(such as digital arrest, authority impersonation, or Ponzi investment). DO NOT TRANSFER MONEY."
        )
        steps.append("Immediately alert your Family Shield guardian to review this payment.")
        steps.append("Call India's 1930 National Cyber Fraud Helpline to verify any alleged legal notice.")
    elif risk_score >= 40 or ctx.pressure_present or concerning_call:
        tier, outcome, severity = "AMBER", "PAUSE_AND_VERIFY", "CAUTION"
        rationale = (
            "ELEVATED RISK: Suspicious elements found (unusual amount, new payee, urgency or an active call). "
            "Pause the payment and perform independent out-of-band verification."
        )
        steps.append("Verify with the intended recipient via an independent phone call on their saved number.")
    else:
        tier, outcome, severity = "GREEN", "PROCEED_WITH_CAUTION", "SAFE"
        rationale = (
            "LOW RISK INDICATORS: No direct coercion detected. However, a low-risk result NEVER guarantees that "
            "a transaction is 100% safe. Always verify the beneficiary name on the UPI PIN screen."
        )
        steps.append("Ensure the name displayed on your UPI app matches the intended beneficiary.")
        steps.append("Remember: Entering your UPI PIN ALWAYS debits your account; it is never required to receive money.")

    guardian_recommended = tier == "RED" or (tier == "AMBER" and amount >= GUARDIAN_REVIEW_AMOUNT)

    return PaymentAssessment(
        risk_score=risk_score,
        policy_tier=tier,
        outcome=outcome,
        severity=severity,
        decision_rationale=rationale,
        is_new_payee=is_new_payee,
        guardian_approval_recommended=guardian_recommended,
        signals=signals,
        verification_steps=list(dict.fromkeys(steps)),
        history_summary=history_summary,
    )


def load_history(db, user_id: int, now: Optional[datetime] = None) -> List[HistoryItem]:
    """Loads completed mock-ledger transactions for the user (last 90 days)."""
    from backend.app.models import TransactionRecord

    now = _as_utc(now or datetime.now(timezone.utc))
    since = now - timedelta(days=HISTORY_WINDOW_DAYS)
    rows = db.query(TransactionRecord).filter(
        TransactionRecord.user_id == user_id,
        TransactionRecord.status == "COMPLETED",
    ).all()
    items = [HistoryItem(r.payee_vpa, float(r.amount), _as_utc(r.created_at)) for r in rows if r.created_at]
    return [i for i in items if i.created_at >= since]
