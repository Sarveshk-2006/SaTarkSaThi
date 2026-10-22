import re
import json
import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import PaymentSimulation, AuditEvent, TrustedContact
from backend.app.dependencies import get_current_user_id
from backend.app.schemas import (
    PaymentSimulationRequest,
    PaymentSimulationResponse,
    PaymentCheckRequest
)

router = APIRouter(prefix="/payment", tags=["Payment Checkpoint Sandbox"])

SIMULATION_DISCLAIMER = "SIMULATION ONLY: no real money has been moved or blocked."

@router.get("/simulations", response_model=List[PaymentSimulationResponse])
def get_past_simulations(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List past payment-risk simulation records for the user.
    Clearly marked as sandbox simulation runs, isolated from bank accounts.
    """
    sims = db.query(PaymentSimulation)\
        .filter(PaymentSimulation.user_id == current_user_id)\
        .order_by(PaymentSimulation.checked_at.desc())\
        .all()
    
    # Parse json fields for response
    results = []
    for s in sims:
        factors = json.loads(s.evidence_factors) if s.evidence_factors else []
        steps = json.loads(s.verification_steps) if s.verification_steps else []
        results.append(PaymentSimulationResponse(
            id=s.id,
            simulation_id=s.simulation_id,
            vpa_or_account=s.vpa_or_account,
            recipient_name=s.recipient_name,
            is_new_recipient=s.is_new_recipient,
            requested_amount=s.requested_amount,
            purpose=s.purpose,
            pressure_present=s.pressure_present,
            authority_claimed=s.authority_claimed,
            secrecy_demanded=s.secrecy_demanded,
            guaranteed_returns=s.guaranteed_returns,
            outcome=s.outcome,
            risk_score=s.risk_score,
            severity=s.severity,
            decision_rationale=s.decision_rationale,
            evidence_factors=factors,
            verification_steps=steps,
            is_simulation=True,
            disclaimer=SIMULATION_DISCLAIMER,
            checked_at=s.checked_at
        ))
    return results

@router.post("/simulate", response_model=PaymentSimulationResponse)
def simulate_payment_risk(
    req: PaymentSimulationRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Interactive Payment Checkpoint Sandbox Simulation.
    Evaluates financial transfer risk using behavioural coercion factors and recipient indicators.
    """
    if req.requested_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid amount: Payment amount must be greater than zero."
        )

    vpa = req.vpa_or_account.strip().lower()
    purpose = (req.purpose or "").strip().lower()
    amount = req.requested_amount

    risk_score = 10
    evidence_factors = []
    verification_steps = []

    # 1. Coercion & Social Engineering Evaluation
    if req.authority_claimed:
        risk_score += 40
        evidence_factors.append("Caller/Recipient falsely claims official police, customs, or court authority.")
        verification_steps.append("Law enforcement and courts in India NEVER conduct online trials or collect fines via personal UPI.")

    if req.secrecy_demanded:
        risk_score += 30
        evidence_factors.append("Recipient demands transaction secrecy and isolation from family or advisors.")
        verification_steps.append("Stop immediately. Discuss this transaction openly with your trusted family guardian.")

    if req.guaranteed_returns:
        risk_score += 35
        evidence_factors.append("Promised guaranteed or impossible investment/task returns (typical pyramid/task scam).")
        verification_steps.append("No registered Indian financial entity offers guaranteed double-digit daily or weekly returns.")

    if req.pressure_present:
        risk_score += 25
        evidence_factors.append("Urgent time pressure or threats of immediate penalty/disconnection applied.")
        verification_steps.append("Take a deep breath and pause for 15 minutes. Scammers rely on artificial urgency to bypass logic.")

    # 2. Handle / Recipient Characteristics
    suspicious_keywords = ["cbi", "police", "customs", "cyber", "lottery", "refund", "nodal", "discom", "power-desk"]
    found_keywords = [kw for kw in suspicious_keywords if kw in vpa]
    if found_keywords:
        risk_score += 30
        evidence_factors.append(f"UPI ID contains institutional keyword '{', '.join(found_keywords)}' used on an individual account.")

    is_personal_psp = any(vpa.endswith(suffix) for suffix in ["@ybl", "@oksbi", "@okhdfc", "@okaxis", "@paytm", "@ibl", "@apl"])
    if is_personal_psp and req.authority_claimed:
        risk_score += 20
        evidence_factors.append("Recipient is requesting an official government payment via a private retail UPI handle.")

    if req.is_new_recipient:
        risk_score += 10
        evidence_factors.append("First-time recipient handle not in your trusted transaction history.")
        verification_steps.append("Verify recipient identity with a ₹1 test transfer or voice call on their known personal phone.")

    if amount >= 25000:
        risk_score += 15
        evidence_factors.append(f"High-value transfer amount (₹{amount:,.2f}) exceeding standard first-time threshold.")

    # Cap score
    risk_score = min(max(risk_score, 12), 99)

    # 3. Determine Outcome Category (PROCEED_WITH_CAUTION, PAUSE_AND_VERIFY, SEEK_TRUSTED_HELP)
    if risk_score >= 70 or (req.authority_claimed and req.secrecy_demanded) or req.guaranteed_returns:
        outcome = "SEEK_TRUSTED_HELP"
        severity = "HIGH_RISK"
        decision_rationale = (
            "CRITICAL COERCION DETECTED: This transaction displays hallmarks of social engineering fraud "
            "(such as digital arrest, authority impersonation, or Ponzi investment). DO NOT TRANSFER MONEY."
        )
        verification_steps.append("Immediately click 'Alert Family Shield' to have a trusted guardian review this payment.")
        verification_steps.append("Call India's 1930 National Cyber Fraud Helpline to verify any alleged legal notice.")
    elif risk_score >= 40 or req.pressure_present or req.is_new_recipient:
        outcome = "PAUSE_AND_VERIFY"
        severity = "CAUTION"
        decision_rationale = (
            "ELEVATED RISK: Suspicious elements found (unverified recipient, urgency, or ambiguous purpose). "
            "Pause the payment and perform independent out-of-band verification."
        )
        verification_steps.append("Verify with the intended recipient via an independent phone call on their saved number.")
    else:
        outcome = "PROCEED_WITH_CAUTION"
        severity = "SAFE"
        decision_rationale = (
            "LOW RISK INDICATORS: No direct coercion detected. However, a low-risk result NEVER guarantees that "
            "a transaction is 100% safe. Always verify the beneficiary name on the UPI PIN screen."
        )
        verification_steps.append("Ensure the name displayed on your UPI app matches the intended beneficiary.")
        verification_steps.append("Remember: Entering your UPI PIN ALWAYS debits your account; it is never required to receive money.")

    # Generate simulation ID
    sim_id = f"SIM-{random.randint(100000, 999999)}"

    sim_record = PaymentSimulation(
        simulation_id=sim_id,
        user_id=current_user_id,
        vpa_or_account=req.vpa_or_account,
        recipient_name=req.recipient_name,
        is_new_recipient=req.is_new_recipient,
        requested_amount=req.requested_amount,
        purpose=req.purpose,
        pressure_present=req.pressure_present,
        authority_claimed=req.authority_claimed,
        secrecy_demanded=req.secrecy_demanded,
        guaranteed_returns=req.guaranteed_returns,
        outcome=outcome,
        risk_score=risk_score,
        severity=severity,
        decision_rationale=decision_rationale,
        evidence_factors=json.dumps(evidence_factors),
        verification_steps=json.dumps(verification_steps),
        is_simulation=True,
        checked_at=datetime.now(timezone.utc)
    )
    db.add(sim_record)
    db.commit()
    db.refresh(sim_record)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="PAYMENT_SIMULATION",
        entity_type="simulation",
        entity_id=sim_id,
        description=f"Sandbox Payment Simulation #{sim_id}: ₹{amount:,.2f} to '{req.vpa_or_account}' -> {outcome} ({risk_score}/100)."
    )
    db.add(audit)
    db.commit()

    return PaymentSimulationResponse(
        id=sim_record.id,
        simulation_id=sim_record.simulation_id,
        vpa_or_account=sim_record.vpa_or_account,
        recipient_name=sim_record.recipient_name,
        is_new_recipient=sim_record.is_new_recipient,
        requested_amount=sim_record.requested_amount,
        purpose=sim_record.purpose,
        pressure_present=sim_record.pressure_present,
        authority_claimed=sim_record.authority_claimed,
        secrecy_demanded=sim_record.secrecy_demanded,
        guaranteed_returns=sim_record.guaranteed_returns,
        outcome=sim_record.outcome,
        risk_score=sim_record.risk_score,
        severity=sim_record.severity,
        decision_rationale=sim_record.decision_rationale,
        evidence_factors=evidence_factors,
        verification_steps=verification_steps,
        is_simulation=True,
        disclaimer=SIMULATION_DISCLAIMER,
        checked_at=sim_record.checked_at
    )

# Legacy alias endpoint for backward compatibility with Prompt 1 / 2 tests
@router.post("/check", response_model=PaymentSimulationResponse)
def evaluate_payment_legacy(
    req: PaymentCheckRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    sim_req = PaymentSimulationRequest(
        vpa_or_account=req.vpa_or_account,
        recipient_name=req.recipient_name,
        is_new_recipient=True,
        requested_amount=req.requested_amount or 100.0,
        purpose=req.purpose,
        pressure_present=False,
        authority_claimed=False,
        secrecy_demanded=False,
        guaranteed_returns=False
    )
    return simulate_payment_risk(sim_req, current_user_id, db)
