import hashlib
import random
import secrets
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import TrustedContact, AuditEvent, UserProfile
from backend.app.dependencies import get_current_user_id
from backend.app.schemas import (
    TrustedContactCreate,
    TrustedContactUpdate,
    TrustedContactResponse,
    ContactVerificationConfirm,
    ContactInvitationResponse,
    InvitationDecisionRequest,
    InvitationCodeDecisionRequest,
)
from backend.app.services.family_guardian import (
    MAX_TRUSTED_CONTACTS, CONTACT_ACCEPTED, CONTACT_DECLINED, CONTACT_PENDING,
    as_utc, contact_matches_profile, contacts_matching_user,
)

router = APIRouter(prefix="/contacts", tags=["Family Shield Contacts"])

INVITE_TTL = timedelta(hours=72)
INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _hash_invite_code(code: str) -> str:
    return hashlib.sha256(code.strip().upper().encode("utf-8")).hexdigest()


def _apply_contact_decision(db: Session, contact: TrustedContact, decision: str, actor: str):
    contact.contact_consent_status = CONTACT_ACCEPTED if decision == "ACCEPT" else CONTACT_DECLINED
    contact.contact_consent_at = datetime.now(timezone.utc)
    contact.invite_code_hash = None
    contact.invite_expires_at = None
    db.add(AuditEvent(
        user_id=contact.user_id,
        event_type="CONTACT_INVITATION_ACCEPTED" if decision == "ACCEPT" else "CONTACT_INVITATION_DECLINED",
        entity_type="contact",
        entity_id=str(contact.id),
        description=f"Trusted contact '{contact.name}' {'accepted' if decision == 'ACCEPT' else 'declined'} the Family Shield invitation ({actor}).",
    ))
    db.commit()
    db.refresh(contact)

@router.get("", response_model=List[TrustedContactResponse])
def get_contacts(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List all configured trusted family contacts for the authenticated user.
    """
    return db.query(TrustedContact)\
        .filter(TrustedContact.user_id == current_user_id)\
        .order_by(TrustedContact.is_primary.desc(), TrustedContact.name.asc())\
        .all()

@router.post("", response_model=TrustedContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_in: TrustedContactCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Add a new trusted family contact to the Family Shield network (maximum of two).

    CONSENT MODEL (two-sided):
    1. Owner consent: `consent_granted` defaults to False and must be deliberately granted by the user.
    2. Contact consent: `contact_consent_status` starts as PENDING. The invited person must accept,
       either in-app (if their profile matches the phone/email) or with a one-time invitation code.
    Alerts, incident sharing and guardian approvals require BOTH.
    """
    existing_count = db.query(TrustedContact).filter(TrustedContact.user_id == current_user_id).count()
    if existing_count >= MAX_TRUSTED_CONTACTS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Family Shield allows at most {MAX_TRUSTED_CONTACTS} trusted contacts. Remove one before adding another.",
        )

    owner = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    probe = TrustedContact(phone_number=contact_in.phone_number, email=contact_in.email)
    if contact_matches_profile(probe, owner):
        raise HTTPException(status_code=400, detail="You cannot add yourself as your own trusted contact.")

    # If set as primary, unmark others for this user
    if contact_in.is_primary:
        db.query(TrustedContact).filter(TrustedContact.user_id == current_user_id).update({"is_primary": False})
        db.commit()

    # Generate 6-digit verification code
    v_code = str(random.randint(100000, 999999))
    now = datetime.now(timezone.utc)

    contact = TrustedContact(
        user_id=current_user_id,
        name=contact_in.name,
        relationship=contact_in.relationship,
        phone_number=contact_in.phone_number,
        email=contact_in.email,
        alert_level=contact_in.alert_level,
        is_active=contact_in.is_active,
        is_primary=contact_in.is_primary,
        is_verified=False,
        verification_code=v_code,
        verification_sent_at=now,
        consent_granted=contact_in.consent_granted,
        contact_consent_status=CONTACT_PENDING,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="CONTACT_ADDED",
        entity_type="contact",
        entity_id=str(contact.id),
        description=f"Added trusted family contact '{contact.name}' ({contact.relationship}). Awaiting the contact's acceptance."
    )
    db.add(audit)
    db.commit()

    return contact


@router.get("/invitations", response_model=List[ContactInvitationResponse])
def list_my_invitations(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Invitations where the signed-in user is the invited person (matched by profile phone/email)."""
    result = []
    for c in contacts_matching_user(db, current_user_id):
        owner = db.query(UserProfile).filter(UserProfile.id == c.user_id).first()
        result.append(ContactInvitationResponse(
            contact_id=c.id,
            owner_user_id=c.user_id,
            owner_name=owner.full_name if owner else f"User {c.user_id}",
            relationship=c.relationship,
            contact_consent_status=c.contact_consent_status or CONTACT_PENDING,
            owner_consent_granted=bool(c.consent_granted),
            created_at=c.created_at,
        ))
    return result


@router.post("/invitations/respond-with-code", response_model=ContactInvitationResponse)
def respond_with_invite_code(req: InvitationCodeDecisionRequest, db: Session = Depends(get_db)):
    """
    For invited people without an app account: accept or decline with the one-time code they received.
    The code is stored only as a SHA-256 hash and expires after 72 hours.
    """
    contact = db.query(TrustedContact).filter(TrustedContact.invite_code_hash == _hash_invite_code(req.invite_code)).first()
    expires = as_utc(contact.invite_expires_at) if contact else None
    if not contact or not expires or datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=404, detail="Invitation code is invalid or has expired.")
    _apply_contact_decision(db, contact, req.decision, "via one-time invitation code")
    owner = db.query(UserProfile).filter(UserProfile.id == contact.user_id).first()
    return ContactInvitationResponse(
        contact_id=contact.id,
        owner_user_id=contact.user_id,
        owner_name=owner.full_name if owner else f"User {contact.user_id}",
        relationship=contact.relationship,
        contact_consent_status=contact.contact_consent_status,
        owner_consent_granted=bool(contact.consent_granted),
        created_at=contact.created_at,
    )


@router.post("/invitations/{contact_id}/respond", response_model=ContactInvitationResponse)
def respond_to_invitation(
    contact_id: int,
    req: InvitationDecisionRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """In-app acceptance: only the person whose profile matches the contact's phone/email can respond."""
    contact = db.query(TrustedContact).filter(TrustedContact.id == contact_id).first()
    profile = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if not contact or contact.user_id == current_user_id or not contact_matches_profile(contact, profile):
        raise HTTPException(status_code=403, detail="Only the invited person can respond to this invitation.")
    _apply_contact_decision(db, contact, req.decision, f"in-app by user {current_user_id}")
    owner = db.query(UserProfile).filter(UserProfile.id == contact.user_id).first()
    return ContactInvitationResponse(
        contact_id=contact.id,
        owner_user_id=contact.user_id,
        owner_name=owner.full_name if owner else f"User {contact.user_id}",
        relationship=contact.relationship,
        contact_consent_status=contact.contact_consent_status,
        owner_consent_granted=bool(contact.consent_granted),
        created_at=contact.created_at,
    )


@router.post("/{contact_id}/invite")
def send_contact_invitation(
    contact_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generates a one-time invitation code for the contact to accept or decline.
    DEMO: the code is returned in the response because no real SMS/WhatsApp gateway is used.
    """
    contact = db.query(TrustedContact).filter(
        TrustedContact.id == contact_id,
        TrustedContact.user_id == current_user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Trusted contact not found or access denied")
    if contact.contact_consent_status == CONTACT_ACCEPTED:
        raise HTTPException(status_code=409, detail="This contact has already accepted the invitation.")

    code = "".join(secrets.choice(INVITE_ALPHABET) for _ in range(10))
    contact.invite_code_hash = _hash_invite_code(code)
    contact.invite_expires_at = datetime.now(timezone.utc) + INVITE_TTL
    contact.contact_consent_status = CONTACT_PENDING
    db.add(AuditEvent(
        user_id=current_user_id,
        event_type="CONTACT_INVITATION_SENT",
        entity_type="contact",
        entity_id=str(contact.id),
        description=f"Family Shield invitation generated for '{contact.name}' (simulated delivery).",
    ))
    db.commit()

    return {
        "status": "success",
        "contact_id": contact.id,
        "expires_at": contact.invite_expires_at,
        "demo_invite_code": code,
        "demo_mode": True,
        "channel": "IN_APP_SIMULATION_ONLY",
        "message": (
            "[DEMO SIMULATION — No real SMS was sent] Share this code with the contact. They open "
            "'Accept invitation' in Satark Saathi and enter it to accept or decline."
        ),
    }

@router.put("/{contact_id}", response_model=TrustedContactResponse)
def update_contact(
    contact_id: int,
    contact_in: TrustedContactUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update details of a trusted contact, including consent and alert threshold.
    """
    contact = db.query(TrustedContact).filter(
        TrustedContact.id == contact_id,
        TrustedContact.user_id == current_user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Trusted contact not found or access denied")

    update_data = contact_in.model_dump(exclude_unset=True)
    if update_data.get("is_primary"):
        db.query(TrustedContact).filter(
            TrustedContact.user_id == current_user_id,
            TrustedContact.id != contact_id
        ).update({"is_primary": False})

    identity_changed = any(
        field in update_data and update_data[field] != getattr(contact, field)
        for field in ("phone_number", "email")
    )
    if identity_changed:
        owner = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
        probe = TrustedContact(
            phone_number=update_data.get("phone_number", contact.phone_number),
            email=update_data.get("email", contact.email),
        )
        if contact_matches_profile(probe, owner):
            raise HTTPException(status_code=400, detail="You cannot add yourself as your own trusted contact.")

    for field, value in update_data.items():
        setattr(contact, field, value)

    # A new phone/email may belong to a different person, so their earlier acceptance no longer applies.
    if identity_changed:
        contact.contact_consent_status = CONTACT_PENDING
        contact.contact_consent_at = None
        contact.is_verified = False
        contact.verified_at = None
        contact.invite_code_hash = None
        contact.invite_expires_at = None

    db.commit()
    db.refresh(contact)
    return contact

@router.post("/{contact_id}/verify/request")
def request_verification_code(
    contact_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Request a new 6-digit OTP verification code for a contact.
    Simulates sending via SMS/WhatsApp and returns the code for in-app demo verification.
    """
    contact = db.query(TrustedContact).filter(
        TrustedContact.id == contact_id,
        TrustedContact.user_id == current_user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Trusted contact not found or access denied")

    v_code = str(random.randint(100000, 999999))
    contact.verification_code = v_code
    contact.verification_sent_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "message": (
            f"[DEMO SIMULATION — No real SMS was sent] "
            f"A verification code has been generated for {contact.phone_number}. "
            f"In a production deployment, this would be delivered via an SMS gateway."
        ),
        "demo_verification_code": v_code,  # Returned only because this is a demo environment
        "demo_mode": True,
        "channel": "IN_APP_SIMULATION_ONLY",
        "disclaimer": (
            "This code is returned in the API response for evaluation convenience. "
            "It does NOT represent real OTP delivery or real identity verification."
        ),
    }

@router.post("/{contact_id}/verify/confirm", response_model=TrustedContactResponse)
def confirm_verification_code(
    contact_id: int,
    req: ContactVerificationConfirm,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Verify contact by entering the 6-digit OTP code received by the family member.
    """
    contact = db.query(TrustedContact).filter(
        TrustedContact.id == contact_id,
        TrustedContact.user_id == current_user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Trusted contact not found or access denied")

    if not contact.verification_code or contact.verification_code.strip() != req.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")

    contact.is_verified = True
    contact.verified_at = datetime.now(timezone.utc)
    contact.verification_code = None  # Clear code after successful verification
    db.commit()
    db.refresh(contact)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="CONTACT_VERIFIED",
        entity_type="contact",
        entity_id=str(contact.id),
        description=f"Trusted contact '{contact.name}' ({contact.relationship}) successfully verified."
    )
    db.add(audit)
    db.commit()

    return contact

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Remove a trusted contact from Family Shield with ownership check.
    """
    contact = db.query(TrustedContact).filter(
        TrustedContact.id == contact_id,
        TrustedContact.user_id == current_user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Trusted contact not found or access denied")

    db.delete(contact)
    db.commit()
    return None
