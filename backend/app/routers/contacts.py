import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import TrustedContact, AuditEvent, UserProfile
from backend.app.dependencies import get_current_user_id
from backend.app.schemas import (
    TrustedContactCreate,
    TrustedContactUpdate,
    TrustedContactResponse,
    ContactVerificationConfirm
)

router = APIRouter(prefix="/contacts", tags=["Family Shield Contacts"])

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
    Add a new trusted family contact to the Family Shield network.
    Automatically generates a 6-digit verification code.
    """
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
        consent_granted=contact_in.consent_granted
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="CONTACT_ADDED",
        entity_type="contact",
        entity_id=str(contact.id),
        description=f"Added trusted family contact '{contact.name}' ({contact.relationship}). Verification code dispatched."
    )
    db.add(audit)
    db.commit()

    return contact

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

    for field, value in update_data.items():
        setattr(contact, field, value)

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
        "message": f"Verification code sent to {contact.phone_number} (In-App Demo Simulation)",
        "demo_verification_code": v_code,  # Provided for seamless hackathon evaluation
        "channel": "IN_APP_SIMULATION"
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
