"""
Shared Family Shield rules: guardian eligibility (two-sided consent), contact matching,
and guardian approval requests. Every router uses these helpers so the consent and
authorization boundary is enforced in one place on the backend.
"""

import json
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, Iterable, List, Optional, Set

from sqlalchemy.orm import Session

from backend.app.models import (
    AuditEvent, FamilyAlert, GuardianApprovalRequest, PaymentSimulation, TrustedContact, UserProfile,
)

MAX_TRUSTED_CONTACTS = 2
APPROVAL_TTL = timedelta(minutes=15)
CONTACT_ACCEPTED = "ACCEPTED"
CONTACT_PENDING = "PENDING"
CONTACT_DECLINED = "DECLINED"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def is_eligible_guardian(contact: TrustedContact) -> bool:
    """Alerts, incident sharing and approvals require BOTH the owner's grant and the contact's acceptance."""
    return bool(
        contact.is_active
        and contact.consent_granted
        and (contact.contact_consent_status or CONTACT_PENDING) == CONTACT_ACCEPTED
    )


def eligible_guardian_contacts(db: Session, user_id: int) -> List[TrustedContact]:
    contacts = db.query(TrustedContact).filter(TrustedContact.user_id == user_id).all()
    return [c for c in contacts if is_eligible_guardian(c)]


def contact_matches_profile(contact: TrustedContact, profile: Optional[UserProfile]) -> bool:
    if not profile:
        return False
    if contact.phone_number and contact.phone_number == profile.phone_number:
        return True
    return bool(contact.email and profile.email and contact.email == profile.email)


def contacts_matching_user(db: Session, user_id: int) -> List[TrustedContact]:
    """Contacts (owned by other users) that refer to this user's own phone number or email."""
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not profile:
        return []
    query = db.query(TrustedContact).filter(
        (TrustedContact.phone_number == profile.phone_number)
        | ((TrustedContact.email.isnot(None)) & (TrustedContact.email == profile.email))
    )
    return [c for c in query.all() if c.user_id != user_id]


def user_ids_for_contacts(db: Session, contacts: Iterable[TrustedContact]) -> Set[int]:
    ids: Set[int] = set()
    profiles = db.query(UserProfile).all()
    for c in contacts:
        for p in profiles:
            if contact_matches_profile(c, p) and p.id != c.user_id:
                ids.add(p.id)
    return ids


def refresh_expiry(req: GuardianApprovalRequest) -> bool:
    """Marks a pending request as EXPIRED when past its deadline. Returns True if it changed."""
    if req.status == "PENDING" and as_utc(req.expires_at) and utcnow() > as_utc(req.expires_at):
        req.status = "EXPIRED"
        return True
    return False


def new_request_ref(db: Session) -> str:
    while True:
        ref = f"GA-{random.randint(100000, 999999)}"
        if not db.query(GuardianApprovalRequest).filter(GuardianApprovalRequest.request_ref == ref).first():
            return ref


def latest_request_for_simulation(db: Session, simulation_id: str) -> Optional[GuardianApprovalRequest]:
    return (
        db.query(GuardianApprovalRequest)
        .filter(GuardianApprovalRequest.simulation_id == simulation_id)
        .order_by(GuardianApprovalRequest.id.desc())
        .first()
    )


def create_approval_request(
    db: Session,
    sim: PaymentSimulation,
    requester_user_id: int,
    reason_codes: List[str],
    is_discreet: bool = False,
) -> Optional[GuardianApprovalRequest]:
    """Creates (or reuses a live) approval request. Returns None when no eligible guardian exists."""
    existing = latest_request_for_simulation(db, sim.simulation_id)
    if existing:
        refresh_expiry(existing)
        if existing.status == "PENDING":
            if is_discreet and not existing.is_discreet:
                existing.is_discreet = True
                db.commit()
            return existing

    guardians = eligible_guardian_contacts(db, requester_user_id)
    if not guardians:
        return None

    now = utcnow()
    req = GuardianApprovalRequest(
        request_ref=new_request_ref(db),
        simulation_id=sim.simulation_id,
        requester_user_id=requester_user_id,
        eligible_contact_ids=json.dumps([c.id for c in guardians]),
        amount=sim.requested_amount,
        payee=sim.vpa_or_account,
        reason_codes=json.dumps(reason_codes),
        status="PENDING",
        is_discreet=is_discreet,
        created_at=now,
        expires_at=now + APPROVAL_TTL,
    )
    db.add(req)
    db.add(AuditEvent(
        user_id=requester_user_id,
        event_type="GUARDIAN_APPROVAL_REQUESTED",
        entity_type="simulation",
        entity_id=sim.simulation_id,
        description=f"Guardian approval {req.request_ref} requested from {len(guardians)} eligible guardian(s) for ₹{sim.requested_amount:,.2f}.",
    ))
    db.commit()
    db.refresh(req)
    return req


def deciding_contact_for_user(db: Session, req: GuardianApprovalRequest, user_id: int) -> Optional[TrustedContact]:
    """Returns the still-eligible guardian contact that this user is allowed to decide as, if any."""
    if user_id == req.requester_user_id:
        return None
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    for cid in json.loads(req.eligible_contact_ids or "[]"):
        contact = db.query(TrustedContact).filter(TrustedContact.id == cid).first()
        if (
            contact
            and contact.user_id == req.requester_user_id
            and is_eligible_guardian(contact)
            and contact_matches_profile(contact, profile)
        ):
            return contact
    return None


def serialize_request(db: Session, req: GuardianApprovalRequest, viewer_user_id: int) -> Dict:
    requester = db.query(UserProfile).filter(UserProfile.id == req.requester_user_id).first()
    role = "REQUESTER" if viewer_user_id == req.requester_user_id else "GUARDIAN"
    data = {
        "request_ref": req.request_ref,
        "simulation_id": req.simulation_id,
        "requester_name": requester.full_name if requester else f"User {req.requester_user_id}",
        "amount": req.amount,
        "payee": req.payee,
        "status": req.status,
        "created_at": as_utc(req.created_at),
        "expires_at": as_utc(req.expires_at),
        "decided_at": as_utc(req.decided_at),
        "decision_note": req.decision_note,
        "viewer_role": role,
        "reason_codes": [],
        "guardian_guidance": None,
    }
    # Guardians see the reasons; a discreet request adds call-first guidance without revealing why.
    if role == "GUARDIAN":
        data["reason_codes"] = json.loads(req.reason_codes or "[]")
        if req.is_discreet:
            data["guardian_guidance"] = (
                "Please call them now on the number you already know before deciding. "
                "Do not mention this request on speakerphone."
            )
    return data


def send_discreet_alerts(db: Session, requester_user_id: int, simulation_id: str) -> List[FamilyAlert]:
    """
    Creates guardian-only alerts that never contain the phrase or the word 'duress',
    and are hidden from the requester's own alert history.
    """
    requester = db.query(UserProfile).filter(UserProfile.id == requester_user_id).first()
    name = requester.full_name if requester else "Your family member"
    alerts: List[FamilyAlert] = []
    for contact in eligible_guardian_contacts(db, requester_user_id):
        alert = FamilyAlert(
            incident_id=None,
            contact_id=contact.id,
            user_id=requester_user_id,
            threat_title="Please call now — safety check",
            message_content=(
                f"{name} started a payment check and may need help. Call them now on the number you already know. "
                "Do not mention this alert on speakerphone."
            ),
            risk_level="CRITICAL",
            recommended_action="Call them directly and review the pending payment request in Family Shield.",
            delivery_channel="IN_APP_SIMULATION",
            status="DELIVERED",
            is_discreet=True,
            is_seed_data=False,
            delivered_at=utcnow(),
        )
        db.add(alert)
        alerts.append(alert)
    db.add(AuditEvent(
        user_id=requester_user_id,
        event_type="DISCREET_SAFETY_ESCALATION",
        entity_type="safety",
        entity_id=simulation_id,
        description=f"Discreet safety escalation sent to {len(alerts)} eligible guardian(s).",
    ))
    db.commit()
    for a in alerts:
        db.refresh(a)
    return alerts
