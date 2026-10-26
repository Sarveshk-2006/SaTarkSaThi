"""
Satark Safety SDK — prototype integration boundary (v0.1).

A host payment app calls these endpoints before and after a transfer. In this repository the
only host app is the Satark mock UPI web app; there is no integration with PhonePe, Google Pay,
Paytm, BHIM or any bank, and no real money moves. Completed mock payments are written to the
mock ledger so spending-baseline and velocity signals can be demonstrated.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.database import get_db
from backend.app.dependencies import get_current_user_id
from backend.app.models import AuditEvent, PaymentSimulation, TransactionRecord
from backend.app.routers.payment import OUTCOME_TIER, _json_list, create_payment_simulation, get_owned_simulation
from backend.app.schemas import SdkCompleteResponse, SdkDecisionResponse, SdkPreTransactionRequest
from backend.app.services.family_guardian import latest_request_for_simulation, refresh_expiry
from backend.app.services.transaction_risk import PaymentContext

router = APIRouter(prefix="/sdk/v1", tags=["Satark Safety SDK (prototype)"])


class MockLedgerEntry(BaseModel):
    id: int
    payee_vpa: str
    payee_name: Optional[str] = None
    amount: float
    status: str
    simulation_id: Optional[str] = None
    is_seed_data: bool
    created_at: datetime


def compute_decision(db: Session, sim: PaymentSimulation) -> SdkDecisionResponse:
    tier = OUTCOME_TIER.get(sim.outcome, "GREEN")
    checkin_done = sim.checkin_status == "COMPLETED"
    effective = (sim.checkin_tier or tier) if checkin_done else tier

    req = latest_request_for_simulation(db, sim.simulation_id)
    if req and refresh_expiry(req):
        db.commit()

    def build(decision: str, can_complete: bool, message: str) -> SdkDecisionResponse:
        return SdkDecisionResponse(
            decision=decision,
            simulation_id=sim.simulation_id,
            policy_tier=effective,
            risk_score=sim.risk_score,
            risk_signals=_json_list(sim.risk_signals),
            checkin_status=sim.checkin_status or "NOT_STARTED",
            guardian_request_ref=req.request_ref if req else None,
            guardian_status=req.status if req else None,
            can_complete=can_complete,
            user_message=message,
        )

    if req and req.status == "PENDING":
        return build("GUARDIAN_APPROVAL_REQUIRED", False, "Waiting for your family member to review this payment.")
    if req and req.status == "APPROVED":
        return build("ALLOW", True, "Your guardian approved this payment. Check the payee name before entering your PIN.")
    if req and req.status == "DECLINED":
        return build("BLOCK_RECOMMENDED", False, "Your guardian declined this payment. Please do not send this money.")
    if req and req.status == "EXPIRED":
        return build("GUARDIAN_APPROVAL_REQUIRED", False, "The guardian request expired. Ask again or cancel the payment.")
    if tier == "GREEN" and not checkin_done:
        return build("ALLOW", True, "No warning signs found. Check the payee name before entering your PIN.")
    if not checkin_done:
        return build("CHECKIN_REQUIRED", False, "Answer a short safety check-in before this payment can continue.")
    if effective == "RED":
        return build("BLOCK_RECOMMENDED", False, "This payment matches scam patterns. Ask a guardian to review it or call 1930.")
    if effective == "AMBER":
        return build("ALLOW", True, "Proceed only if you have verified the payee through a number you already know.")
    return build("ALLOW", True, "No warning signs found. Check the payee name before entering your PIN.")


@router.post("/pre-transaction-check", response_model=SdkDecisionResponse)
def pre_transaction_check(
    req: SdkPreTransactionRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    ctx = PaymentContext(
        vpa=req.payee_vpa.strip(),
        amount=req.amount,
        recipient_name=req.payee_name,
        purpose=req.note,
        call_state=req.call_state,
    )
    sim, _ = create_payment_simulation(db, current_user_id, ctx, source="MOCK_UPI_SDK")
    return compute_decision(db, sim)


@router.get("/transactions/{simulation_id}/decision", response_model=SdkDecisionResponse)
def get_decision(
    simulation_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return compute_decision(db, get_owned_simulation(db, simulation_id, current_user_id))


def _finish(db: Session, sim: PaymentSimulation, user_id: int, completed: bool) -> TransactionRecord:
    existing = db.query(TransactionRecord).filter(TransactionRecord.simulation_id == sim.simulation_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"This mock payment is already {existing.status}.")
    record = TransactionRecord(
        user_id=user_id,
        payee_vpa=sim.vpa_or_account,
        payee_name=sim.recipient_name,
        amount=sim.requested_amount,
        category="MOCK_UPI",
        status="COMPLETED" if completed else "CANCELLED",
        simulation_id=sim.simulation_id,
        is_mock=True,
        is_seed_data=False,
    )
    db.add(record)
    db.add(AuditEvent(
        user_id=user_id,
        event_type="MOCK_PAYMENT_COMPLETED" if completed else "MOCK_PAYMENT_CANCELLED",
        entity_type="simulation",
        entity_id=sim.simulation_id,
        description=f"Mock UPI payment of ₹{sim.requested_amount:,.2f} to {sim.vpa_or_account} {'completed' if completed else 'cancelled'} (no real money moved).",
    ))
    db.commit()
    db.refresh(record)
    return record


@router.post("/transactions/{simulation_id}/complete", response_model=SdkCompleteResponse)
def complete_mock_payment(
    simulation_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    sim = get_owned_simulation(db, simulation_id, current_user_id)
    decision = compute_decision(db, sim)
    if not decision.can_complete:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Payment cannot be completed: {decision.decision}. {decision.user_message}",
        )
    record = _finish(db, sim, current_user_id, completed=True)
    return SdkCompleteResponse(
        simulation_id=simulation_id,
        status="COMPLETED",
        transaction_id=record.id,
        message="Mock payment recorded in the demo ledger. No real money moved.",
    )


@router.post("/transactions/{simulation_id}/cancel", response_model=SdkCompleteResponse)
def cancel_mock_payment(
    simulation_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    sim = get_owned_simulation(db, simulation_id, current_user_id)
    record = _finish(db, sim, current_user_id, completed=False)
    return SdkCompleteResponse(
        simulation_id=simulation_id,
        status="CANCELLED",
        transaction_id=record.id,
        message="Mock payment cancelled.",
    )


@router.get("/ledger", response_model=List[MockLedgerEntry])
def get_mock_ledger(current_user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.query(TransactionRecord).filter(TransactionRecord.user_id == current_user_id)\
        .order_by(TransactionRecord.created_at.desc()).limit(30).all()
    return [MockLedgerEntry(
        id=r.id, payee_vpa=r.payee_vpa, payee_name=r.payee_name, amount=r.amount, status=r.status,
        simulation_id=r.simulation_id, is_seed_data=bool(r.is_seed_data), created_at=r.created_at,
    ) for r in rows]
