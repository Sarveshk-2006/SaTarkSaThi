import json
import random
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import PaymentSimulation, AuditEvent, Incident, SafetyPreference
from backend.app.dependencies import get_current_user_id
from backend.app.schemas import (
    PaymentSimulationRequest,
    PaymentSimulationResponse,
    PaymentCheckRequest,
    IncidentResponse,
    CheckinRequest,
    CheckinResponse,
    CheckinQuestion,
    CheckinResult,
    CheckinReason,
    GuardianApprovalResponse,
)
from backend.app.services import safety_checkin as checkin
from backend.app.services.duress import contains_phrase
from backend.app.services.family_guardian import (
    create_approval_request, eligible_guardian_contacts, latest_request_for_simulation,
    refresh_expiry, send_discreet_alerts, serialize_request, user_ids_for_contacts,
)
from backend.app.services.transaction_risk import (
    CALL_STATE_NONE, PaymentContext, assess_payment, load_history,
)
from backend.app.services.alert_broadcaster import alert_broadcaster

logger = logging.getLogger("satark_saathi.payment")

router = APIRouter(prefix="/payment", tags=["Payment Checkpoint Sandbox"])

SIMULATION_DISCLAIMER = "SIMULATION ONLY: no real money has been moved or blocked."
OUTCOME_TIER = {"SEEK_TRUSTED_HELP": "RED", "PAUSE_AND_VERIFY": "AMBER", "PROCEED_WITH_CAUTION": "GREEN"}


def _json_list(value: Optional[str]) -> list:
    try:
        parsed = json.loads(value) if value else []
        return parsed if isinstance(parsed, list) else []
    except (TypeError, ValueError):
        return []


def simulation_to_response(sim: PaymentSimulation, db: Session, history_summary: Optional[Dict] = None) -> PaymentSimulationResponse:
    return PaymentSimulationResponse(
        id=sim.id,
        simulation_id=sim.simulation_id,
        vpa_or_account=sim.vpa_or_account,
        recipient_name=sim.recipient_name,
        is_new_recipient=bool(sim.is_new_recipient),
        requested_amount=sim.requested_amount,
        purpose=sim.purpose,
        pressure_present=bool(sim.pressure_present),
        authority_claimed=bool(sim.authority_claimed),
        secrecy_demanded=bool(sim.secrecy_demanded),
        guaranteed_returns=bool(sim.guaranteed_returns),
        call_state=sim.call_state or CALL_STATE_NONE,
        outcome=sim.outcome,
        policy_tier=OUTCOME_TIER.get(sim.outcome, "GREEN"),
        risk_score=sim.risk_score,
        severity=sim.severity,
        decision_rationale=sim.decision_rationale,
        evidence_factors=_json_list(sim.evidence_factors),
        verification_steps=_json_list(sim.verification_steps),
        risk_signals=_json_list(sim.risk_signals),
        history_summary=history_summary or {},
        guardian_approval_recommended=bool(sim.guardian_approval_recommended),
        eligible_guardian_count=len(eligible_guardian_contacts(db, sim.user_id)),
        checkin_status=sim.checkin_status or "NOT_STARTED",
        checkin_tier=sim.checkin_tier,
        source=sim.source or "SANDBOX",
        is_simulation=True,
        disclaimer=SIMULATION_DISCLAIMER,
        checked_at=sim.checked_at,
    )


def create_payment_simulation(
    db: Session,
    user_id: int,
    ctx: PaymentContext,
    source: str = "SANDBOX",
):
    """Runs the explainable risk assessment and persists it. Shared by the sandbox and the SDK boundary."""
    assessment = assess_payment(ctx, load_history(db, user_id))

    sim_id = f"SIM-{random.randint(100000, 999999)}"
    while db.query(PaymentSimulation).filter(PaymentSimulation.simulation_id == sim_id).first():
        sim_id = f"SIM-{random.randint(100000, 999999)}"

    sim = PaymentSimulation(
        simulation_id=sim_id,
        user_id=user_id,
        vpa_or_account=ctx.vpa,
        recipient_name=ctx.recipient_name,
        is_new_recipient=assessment.is_new_payee,
        requested_amount=ctx.amount,
        purpose=ctx.purpose,
        pressure_present=ctx.pressure_present,
        authority_claimed=ctx.authority_claimed,
        secrecy_demanded=ctx.secrecy_demanded,
        guaranteed_returns=ctx.guaranteed_returns,
        call_state=ctx.call_state,
        outcome=assessment.outcome,
        risk_score=assessment.risk_score,
        severity=assessment.severity,
        decision_rationale=assessment.decision_rationale,
        evidence_factors=json.dumps(assessment.evidence_factors),
        verification_steps=json.dumps(assessment.verification_steps),
        risk_signals=json.dumps([s.to_dict() for s in assessment.signals]),
        guardian_approval_recommended=assessment.guardian_approval_recommended,
        checkin_status="NOT_STARTED",
        source=source,
        is_simulation=True,
        checked_at=datetime.now(timezone.utc),
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)

    db.add(AuditEvent(
        user_id=user_id,
        event_type="PAYMENT_SIMULATION",
        entity_type="simulation",
        entity_id=sim_id,
        description=(
            f"{'Mock UPI SDK check' if source != 'SANDBOX' else 'Sandbox Payment Simulation'} #{sim_id}: "
            f"₹{ctx.amount:,.2f} to '{ctx.vpa}' -> {assessment.outcome} ({assessment.risk_score}/100)."
        ),
        metadata_json=json.dumps({"signal_codes": [s.code for s in assessment.signals], "call_state": ctx.call_state}),
    ))
    db.commit()
    return sim, assessment


def get_owned_simulation(
    db: Session,
    simulation_id: str,
    user_id: int,
    forbidden_detail: str = "Access forbidden: this payment check belongs to another user.",
) -> PaymentSimulation:
    sim = db.query(PaymentSimulation).filter(PaymentSimulation.simulation_id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Payment simulation '{simulation_id}' not found.")
    if sim.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=forbidden_detail)
    return sim


async def notify_guardians_of_request(db: Session, req, requester_user_id: int, discreet: bool):
    guardians = eligible_guardian_contacts(db, requester_user_id)
    targets = user_ids_for_contacts(db, guardians) - {requester_user_id}
    if not targets:
        return
    try:
        await alert_broadcaster.broadcast_alert({
            "type": "GUARDIAN_APPROVAL_REQUEST",
            "request_ref": req.request_ref,
            "threat_title": "Please call now — safety check" if discreet else "Payment needs your review",
            "risk_level": "CRITICAL" if discreet else "HIGH",
            "message_content": (
                "A family member may need help with a pending payment. Call them on the number you already know."
                if discreet else
                f"A family member asked you to review a ₹{req.amount:,.0f} payment before it continues."
            ),
            "recommended_action": "Open Family Shield to review the request.",
        }, target_user_ids=targets)
    except Exception as e:
        logger.warning(f"Guardian notification broadcast failed (request still stored): {e}")


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
    return [simulation_to_response(s, db) for s in sims]


@router.post("/simulate", response_model=PaymentSimulationResponse)
def simulate_payment_risk(
    req: PaymentSimulationRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Interactive Payment Checkpoint Sandbox Simulation.
    Combines user-reported coercion factors, recipient patterns, the user's mock transaction
    history (spending deviation, velocity, new payee) and an explicit call-state signal.
    Every score contribution is returned in `risk_signals` with its source.
    """
    if req.requested_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid amount: Payment amount must be greater than zero."
        )

    ctx = PaymentContext(
        vpa=req.vpa_or_account.strip(),
        amount=req.requested_amount,
        recipient_name=req.recipient_name,
        purpose=req.purpose,
        pressure_present=req.pressure_present,
        authority_claimed=req.authority_claimed,
        secrecy_demanded=req.secrecy_demanded,
        guaranteed_returns=req.guaranteed_returns,
        call_state=req.call_state,
        self_reported_new_recipient=req.is_new_recipient,
    )
    sim, assessment = create_payment_simulation(db, current_user_id, ctx, source="SANDBOX")
    return simulation_to_response(sim, db, assessment.history_summary)


@router.post("/simulations/{simulation_id}/checkin", response_model=CheckinResponse)
async def run_safety_checkin(
    simulation_id: str,
    req: CheckinRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Adaptive Safety Check-in. The client sends all answers so far (in order); the server
    validates the order, then returns either the next question or the final result.
    Free-text answers are analysed in memory and never stored or logged.
    """
    sim = get_owned_simulation(db, simulation_id, current_user_id)
    language = checkin.normalize_language(req.language)
    ctx = checkin.CheckinContext(
        objective_tier=OUTCOME_TIER.get(sim.outcome, "GREEN"),
        call_state=sim.call_state or CALL_STATE_NONE,
        authority_claimed=bool(sim.authority_claimed),
        secrecy_demanded=bool(sim.secrecy_demanded),
        guaranteed_returns=bool(sim.guaranteed_returns),
        pressure_present=bool(sim.pressure_present),
        purpose=sim.purpose or "",
    )

    answers: Dict[str, str] = {}
    for a in req.answers:
        expected = checkin.next_question_id(ctx, answers)
        if a.question_id != expected:
            raise HTTPException(status_code=422, detail=f"Answers must follow the check-in order (expected {expected}).")
        error = checkin.validate_answer(a.question_id, a.value)
        if error:
            raise HTTPException(status_code=422, detail=error)
        answers[a.question_id] = a.value.strip() if a.question_id == "Q_OWN_WORDS" else a.value

    next_id = checkin.next_question_id(ctx, answers)
    if next_id:
        total = len(checkin.build_sequence(ctx, answers))
        question = checkin.localize_question(next_id, language, len(answers) + 1, total)
        return CheckinResponse(
            simulation_id=sim.simulation_id,
            language=language,
            status="IN_PROGRESS",
            next_question=CheckinQuestion(**question),
        )

    free_text = answers.get("Q_OWN_WORDS", "")
    pref = db.query(SafetyPreference).filter(SafetyPreference.user_id == current_user_id).first()
    duress_triggered = bool(
        pref and pref.duress_enabled and contains_phrase(free_text, pref.duress_phrase_hash, pref.duress_word_count)
    )
    evaluation = checkin.evaluate(ctx, answers, checkin.analyze_free_text_tier(free_text))
    free_text = ""  # Drop the reference as soon as analysis is complete.

    guardians = eligible_guardian_contacts(db, current_user_id)
    final_tier = evaluation.final_tier
    guardian_request = None

    if duress_triggered:
        final_tier = "RED" if final_tier == "RED" else "AMBER"
        existing = latest_request_for_simulation(db, sim.simulation_id)
        already_discreet = bool(existing and existing.status == "PENDING" and existing.is_discreet)
        guardian_request = create_approval_request(db, sim, current_user_id, evaluation.reason_codes, is_discreet=True)
        if not already_discreet:
            alerts = send_discreet_alerts(db, current_user_id, sim.simulation_id)
            targets = user_ids_for_contacts(db, guardians) - {current_user_id}
            for alert in alerts:
                try:
                    await alert_broadcaster.broadcast_alert({
                        "type": "FAMILY_ALERT_NOTIFICATION",
                        "alert_id": alert.id,
                        "incident_id": None,
                        "threat_title": alert.threat_title,
                        "risk_level": alert.risk_level,
                        "message_content": alert.message_content,
                        "recommended_action": alert.recommended_action,
                        "contact_id": alert.contact_id,
                        "delivery_channel": alert.delivery_channel,
                    }, target_user_ids=targets)
                except Exception as e:
                    logger.warning(f"Discreet alert broadcast failed (alert still stored): {e}")
            if guardian_request:
                await notify_guardians_of_request(db, guardian_request, current_user_id, discreet=True)
        action = "WAIT_FOR_GUARDIAN" if guardian_request else ("DO_NOT_PAY" if final_tier == "RED" else "PAUSE_AND_VERIFY")
    elif final_tier == "RED":
        action = "DO_NOT_PAY"
    elif final_tier == "AMBER" and sim.requested_amount >= 25_000 and guardians:
        guardian_request = create_approval_request(db, sim, current_user_id, evaluation.reason_codes)
        if guardian_request:
            await notify_guardians_of_request(db, guardian_request, current_user_id, discreet=False)
        action = "WAIT_FOR_GUARDIAN" if guardian_request else "PAUSE_AND_VERIFY"
    elif final_tier == "AMBER":
        action = "PAUSE_AND_VERIFY"
    else:
        action = "PROCEED_WITH_CARE"

    sim.checkin_status = "COMPLETED"
    sim.checkin_tier = final_tier
    sim.checkin_signal_codes = json.dumps(evaluation.reason_codes)
    sim.checkin_completed_at = datetime.now(timezone.utc)
    if final_tier == "RED":
        sim.guardian_approval_recommended = True
    db.add(AuditEvent(
        user_id=current_user_id,
        event_type="SAFETY_CHECKIN_COMPLETED",
        entity_type="simulation",
        entity_id=sim.simulation_id,
        description=f"Safety check-in completed ({len(answers)} answers, language {language}) -> {final_tier} / {action}.",
        metadata_json=json.dumps({"reason_codes": evaluation.reason_codes}),
    ))
    db.commit()

    return CheckinResponse(
        simulation_id=sim.simulation_id,
        language=language,
        status="COMPLETED",
        result=CheckinResult(
            final_tier=final_tier,
            recommended_action=action,
            message=checkin.ACTION_MESSAGES[action][language],
            answers_could_not_clear=evaluation.answers_could_not_clear,
            answers_could_not_clear_message=checkin.ANSWERS_CANNOT_CLEAR[language] if evaluation.answers_could_not_clear else None,
            reasons=[CheckinReason(**r) for r in checkin.localized_reasons(evaluation.reason_codes, language)],
            guardian_request_ref=guardian_request.request_ref if guardian_request else None,
            eligible_guardian_count=len(guardians),
        ),
    )


@router.post("/simulations/{simulation_id}/guardian-approval", response_model=GuardianApprovalResponse, status_code=status.HTTP_201_CREATED)
async def request_guardian_approval(
    simulation_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Asks the user's accepted, consented guardians to approve or decline this payment."""
    sim = get_owned_simulation(db, simulation_id, current_user_id)
    reason_codes = [s.get("code") for s in _json_list(sim.risk_signals) if s.get("points", 0) > 0]
    req = create_approval_request(db, sim, current_user_id, reason_codes)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No eligible guardian. A guardian must be active, consented by you, and must have accepted your invitation.",
        )
    await notify_guardians_of_request(db, req, current_user_id, discreet=req.is_discreet)
    return GuardianApprovalResponse(**serialize_request(db, req, current_user_id))


@router.get("/simulations/{simulation_id}/guardian-approval", response_model=GuardianApprovalResponse)
def get_guardian_approval_status(
    simulation_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    get_owned_simulation(db, simulation_id, current_user_id)
    req = latest_request_for_simulation(db, simulation_id)
    if not req:
        raise HTTPException(status_code=404, detail="No guardian approval has been requested for this payment.")
    if refresh_expiry(req):
        db.commit()
    return GuardianApprovalResponse(**serialize_request(db, req, current_user_id))


@router.post("/simulations/{simulation_id}/save-incident", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def save_payment_simulation_as_incident(
    simulation_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Explicit user action to convert a high-risk sandbox payment simulation into an authoritative
    incident record for Golden Hour recovery and audit tracking.
    Prevents duplicate creation.
    """
    sim = get_owned_simulation(
        db, simulation_id, current_user_id,
        forbidden_detail="Access forbidden: You cannot convert another user's simulation.",
    )

    # Check for existing incident already linked to this simulation
    existing_incident = db.query(Incident).filter(
        Incident.user_id == current_user_id,
        Incident.transaction_ref == sim.vpa_or_account,
        Incident.financial_loss == sim.requested_amount
    ).first()

    if existing_incident:
        return existing_incident

    now = datetime.now(timezone.utc)
    incident_id_str = f"SA-{random.randint(100000, 999999)}"
    while db.query(Incident).filter(Incident.incident_id == incident_id_str).first():
        incident_id_str = f"SA-{random.randint(100000, 999999)}"

    factors = _json_list(sim.evidence_factors)

    incident = Incident(
        incident_id=incident_id_str,
        user_id=current_user_id,
        title=f"Coerced Payment Alert: ₹{sim.requested_amount:,.2f} to {sim.vpa_or_account}",
        scam_type="Suspicious Coerced Payment",
        description=(
            f"Payment Checkpoint flagged suspicious transfer of ₹{sim.requested_amount:,.2f} to recipient {sim.vpa_or_account}. "
            f"Outcome: {sim.outcome}. Rationale: {sim.decision_rationale}"
        ),
        financial_loss=sim.requested_amount,
        currency="INR",
        bank_name="UPI Payment App" if "@" in sim.vpa_or_account else "Bank Transfer",
        transaction_ref=sim.vpa_or_account,
        suspect_contact=sim.vpa_or_account,
        incident_date=now,
        status="UNDER_REVIEW",
        severity=sim.severity,
        risk_level="HIGH" if sim.outcome == "SEEK_TRUSTED_HELP" else ("MEDIUM" if sim.outcome == "PAUSE_AND_VERIFY" else "LOW"),
        risk_score=sim.risk_score,
        evidence_metadata=json.dumps({
            "simulation_id": sim.simulation_id,
            "evidence_factors": factors,
            "decision_rationale": sim.decision_rationale,
            "timeline": [
                f"{(sim.checked_at or now).strftime('%d-%b-%Y %H:%M UTC')}: Payment Checkpoint assessed ₹{sim.requested_amount:,.2f} to {sim.vpa_or_account} as {sim.outcome}."
            ],
        }),
        is_seed_data=False
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="INCIDENT_CREATED_FROM_PAYMENT",
        entity_type="incident",
        entity_id=incident.incident_id,
        description=f"Created incident #{incident.incident_id} from payment simulation #{sim.simulation_id}."
    )
    db.add(audit)
    db.commit()

    return incident


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
