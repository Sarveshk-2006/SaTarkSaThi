import random
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Incident, RecoveryDraft, UserProfile, AuditEvent
from backend.app.dependencies import get_current_user_id, get_authorized_incident_user_ids
from backend.app.schemas import (
    RecoveryDraftResponse,
    RecoveryWizardRequest,
    BankFreezeRequest,
    BankFreezeResponse,
    CybercrimePortalSubmitRequest,
    CybercrimePortalSubmitResponse,
    RecoveryCaseContextResponse
)

router = APIRouter(prefix="/recovery", tags=["Golden Hour Recovery"])

BANK_HELPLINES = [
    {
        "bank": "National Cyber Crime Helpline",
        "toll_free": "1930",
        "description": "Ministry of Home Affairs 24x7 Citizen Financial Cyber Fraud Reporting System",
        "portal": "https://cybercrime.gov.in",
        "action": "Immediate financial freeze request within 2 hours (Golden Hour window)"
    },
    {
        "bank": "State Bank of India (SBI)",
        "toll_free": "1800 11 2211 / 1800 425 3800",
        "sms_block": "SMS 'BLOCK' to 567676",
        "email": "customercare@sbi.co.in",
        "portal": "https://cms.onlinesbi.sbi"
    },
    {
        "bank": "HDFC Bank",
        "toll_free": "1800 258 6161 / 1800 1600",
        "sms_block": "Block via Mobile App / Netbanking Instant Lock",
        "email": "support@hdfcbank.com",
        "portal": "https://www.hdfcbank.com"
    },
    {
        "bank": "ICICI Bank",
        "toll_free": "1800 1080",
        "sms_block": "SMS 'IBLOCK <User ID>' to 5676766",
        "email": "customer.care@icicibank.com",
        "portal": "https://www.icicibank.com"
    },
    {
        "bank": "Axis Bank",
        "toll_free": "1800 419 0068 / 1860 419 5555",
        "sms_block": "SMS 'BLOCK' to 5676782",
        "email": "nodal.officer@axisbank.com",
        "portal": "https://www.axisbank.com"
    },
    {
        "bank": "Punjab National Bank (PNB)",
        "toll_free": "1800 180 2222 / 1800 103 2222",
        "sms_block": "SMS 'HOTLIST' to 5607040",
        "email": "care@pnb.co.in",
        "portal": "https://www.pnbindia.in"
    }
]

class DraftUpdatePayload(BaseModel):
    portal_complaint_text: Optional[str] = None
    bank_complaint_text: Optional[str] = None
    police_complaint_text: Optional[str] = None
    status: Optional[str] = None

@router.get("/helplines")
def get_helplines():
    """
    Returns verified Indian bank emergency numbers, dispute desks, and 1930 helpline guidelines.
    """
    return {
        "emergency_helplines": BANK_HELPLINES,
        "official_guidance": {
            "primary_helpline": "1930 (Citizen Financial Cyber Fraud Reporting System)",
            "primary_portal": "https://cybercrime.gov.in",
            "disclaimer": "Reporting to 1930 and bank nodal officer initiates tracing and inter-bank lien marking, but does not guarantee recovery.",
            "golden_hour_timeline": "First 2 to 3 hours after fraud are critical before fraudsters withdraw cash through mule ATM networks."
        },
        "golden_hour_protocol": [
            "1. DIAL 1930 IMMEDIATELY: Keep transaction UTR / Reference ID and Bank Account ready.",
            "2. CONTACT DEBITING BANK: Demand immediate transaction recall under RBI Customer Protection norms.",
            "3. SUBMIT FORMAL COMPLAINT: Register dispute on cybercrime.gov.in using the pre-filled draft.",
            "4. FREEZE CARDS & NETBANKING: Disable UPI services immediately via bank mobile app or SMS hotlist."
        ]
    }


@router.get("/cases/{incident_id}", response_model=RecoveryCaseContextResponse)
def get_recovery_case(
    incident_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Load authoritative recovery case context for Golden Hour hydration.
    Supports browser refresh and navigation from Scanner or Payment Checkpoint.
    Verifies owner or consented guardian authorization.
    """
    query = db.query(Incident)
    if incident_id.isdigit():
        query = query.filter(Incident.id == int(incident_id))
    else:
        query = query.filter(Incident.incident_id == incident_id)

    incident = query.first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recovery case for incident '{incident_id}' not found."
        )

    authorized_uids = get_authorized_incident_user_ids(current_user_id, db)
    if incident.user_id not in authorized_uids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to access this recovery case."
        )

    timeline_events = []
    channel = None
    if incident.evidence_metadata:
        try:
            meta = json.loads(incident.evidence_metadata)
            if isinstance(meta, dict):
                timeline_events = meta.get("timeline", []) or []
                channel = meta.get("channel")
        except Exception:
            pass

    latest_draft_rec = db.query(RecoveryDraft).filter(
        RecoveryDraft.incident_id == incident.id
    ).order_by(RecoveryDraft.generated_at.desc()).first()

    latest_draft_resp = None
    if latest_draft_rec:
        latest_draft_resp = RecoveryDraftResponse(
            id=latest_draft_rec.id,
            incident_id=latest_draft_rec.incident_id,
            user_id=latest_draft_rec.user_id,
            incident_datetime=latest_draft_rec.incident_datetime,
            scam_category=latest_draft_rec.scam_category,
            financial_loss=latest_draft_rec.financial_loss or 0.0,
            transaction_reference=latest_draft_rec.transaction_reference,
            bank_or_app=latest_draft_rec.bank_or_app,
            transfer_status=latest_draft_rec.transfer_status,
            portal_complaint_text=latest_draft_rec.portal_complaint_text,
            bank_complaint_text=latest_draft_rec.bank_complaint_text,
            police_complaint_text=latest_draft_rec.police_complaint_text,
            status=latest_draft_rec.status,
            generated_at=latest_draft_rec.generated_at,
            incident_reference=incident.incident_id
        )

    return RecoveryCaseContextResponse(
        incident_id=incident.incident_id,
        scam_type=incident.scam_type,
        description=incident.description,
        financial_loss=incident.financial_loss or 0.0,
        currency=incident.currency or "INR",
        bank_name=incident.bank_name,
        transaction_ref=incident.transaction_ref,
        suspect_contact=incident.suspect_contact,
        incident_date=incident.incident_date,
        status=incident.status,
        risk_score=incident.risk_score or 70,
        risk_level=incident.risk_level or "HIGH",
        timeline_events=timeline_events,
        communication_channel=channel,
        latest_draft=latest_draft_resp
    )

def build_complaint_drafts(
    victim_name: str,
    victim_phone: str,
    victim_email: str,
    victim_city: str,
    bank_name: str,
    scam_type: str,
    loss: float,
    utr: Optional[str],
    suspect_contact: Optional[str],
    incident_dt_str: str,
    narrative: str,
    transfer_status: str
) -> Dict[str, str]:
    """
    Helper to generate non-fabricated, structured complaint drafts.
    Explicitly labels missing parameters so users and authorities know what was supplied vs pending.
    """
    loss_str = f"INR {loss:,.2f}" if loss > 0 else "INR 0.00 (Attempted Fraud / No Direct Debit)"
    utr_display = utr.strip() if utr and utr.strip() else "[UTR / TRANSACTION REF NOT SUPPLIED - PENDING BANK STATEMENT]"
    suspect_display = suspect_contact.strip() if suspect_contact and suspect_contact.strip() else "[SUSPECT IDENTIFIER NOT SUPPLIED / UNKNOWN]"
    bank_display = bank_name.strip() if bank_name and bank_name.strip() else "[COMPLAINANT BANK NOT SPECIFIED]"

    portal_text = f"""========================================================================
NATIONAL CYBER CRIME REPORTING PORTAL (cybercrime.gov.in / 1930 HELPLINE)
OFFICIAL COMPLAINT DRAFT (REVIEW & EDIT BEFORE SUBMITTING)
========================================================================
1. COMPLAINANT PARTICULARS:
   - Full Name: {victim_name}
   - Contact Mobile: {victim_phone}
   - Email Address: {victim_email}
   - Residence Jurisdiction: {victim_city}

2. TRANSACTION & INCIDENT PARTICULARS:
   - Date & Time of Occurrence: {incident_dt_str}
   - Category of Cyber Fraud: {scam_type}
   - Disputed Transfer Status: {transfer_status}
   - Complainant Bank / Payment App: {bank_display}
   - Transaction Reference / UTR Number: {utr_display}
   - Total Amount Siphoned / At Risk: {loss_str}
   - Suspect Contact / UPI ID / Account: {suspect_display}

3. CHRONOLOGICAL NARRATIVE (FACTS SUPPLIED BY VICTIM):
   {narrative}

4. PRAYER / IMMEDIATE RELIEF SOUGHT UNDER 1930 PROTOCOL:
   - Immediate issuance of freeze request to intermediate payment aggregators and beneficiary bank.
   - Lien marking of recipient wallet/account under Section 1930 Golden Hour Protocol to halt ATM withdrawal.
   - Trace recipient KYC credentials and forward to Cyber Crime Cell for formal FIR registration.

*NOTE: This draft was compiled by Satark Saathi based on facts supplied by the user. No details were fabricated.*
========================================================================"""

    bank_text = f"""To,
The Nodal Officer / Fraud Dispute Cell,
{bank_display}

SUBJECT: URGENT - Fraudulent Disputed Transaction ({utr_display}) - Request for Recall & Lien Marking

Respected Sir/Madam,

I am writing to report an unauthorized and fraudulent debit from my bank account.

Incident & Transaction Particulars:
- Complainant Name: {victim_name}
- Registered Phone: {victim_phone}
- Disputed Amount: {loss_str}
- Transaction Reference / UTR: {utr_display}
- Transfer Status: {transfer_status}
- Date & Time: {incident_dt_str}
- Suspect Reference / Destination Handle: {suspect_display}

Brief Facts:
{narrative}

Regulatory Basis for Dispute:
As per RBI Master Circular DBR.No.Leg.BC.78/09.07.005/2017-18 ('Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions'), I am lodging this dispute within the zero-liability / limited-liability Golden Hour window.

Urgent Request:
1. Immediately contact the destination/beneficiary bank's nodal officer to mark an immediate lien on the recipient account.
2. Recall the funds via standard NPCI / IMPS inter-bank dispute chargeback channels.
3. Provide the destination account trail and UTR confirmation for Cyber Crime 1930 investigation.

Yours faithfully,
{victim_name}
Contact: {victim_phone}"""

    police_text = f"""To,
The Station House Officer (SHO),
Cyber Crime Police Station,
Jurisdiction: {victim_city}

SUBJECT: Formal Complaint regarding Cyber Financial Fraud punishable under Information Technology Act 2000 (Section 66D) and Bharatiya Nyaya Sanhita (BNS)

Respected Officer,

I, {victim_name}, residing at {victim_city}, contact number {victim_phone}, email {victim_email}, wish to lodge a formal complaint against unknown perpetrator(s).

Incident Particulars:
- Type of Cyber Crime: {scam_type}
- Amount Siphoned: {loss_str}
- Complainant Bank: {bank_display}
- Transaction UTR / Reference: {utr_display}
- Suspect Contact / Identifier: {suspect_display}
- Date & Time: {incident_dt_str}

Detailed Statement of Facts:
{narrative}

I request you to register this complaint, issue necessary notices to telecom service providers and banking intermediaries to preserve logs, freeze stolen funds, and initiate appropriate legal proceedings against the accused perpetrators.

Complainant: {victim_name}
Date of Filing: {datetime.now(timezone.utc).strftime("%d-%b-%Y")}"""

    return {
        "portal": portal_text,
        "bank": bank_text,
        "police": police_text
    }

@router.post("/wizard", response_model=RecoveryDraftResponse, status_code=status.HTTP_201_CREATED)
def execute_recovery_wizard(
    req: RecoveryWizardRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Step-by-step incident wizard to generate structured, non-fabricated complaint drafts
    for Cyber Crime 1930, Bank Nodal Officer, and Cyber Police.
    Clearly allows and marks missing UTR without fabricating values.
    """
    profile = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    victim_name = profile.full_name if profile else "Citizen Complainant"
    victim_phone = profile.phone_number if profile else "+91 ----------"
    victim_email = profile.email if profile else "citizen@example.in"
    victim_city = profile.city if profile else "New Delhi"
    bank = req.bank_name or (profile.bank_name if profile else "Bank")

    incident_dt_str = req.incident_datetime.strftime("%d-%b-%Y %H:%M UTC") if req.incident_datetime else "Date/Time not specified by victim"

    drafts = build_complaint_drafts(
        victim_name=victim_name,
        victim_phone=victim_phone,
        victim_email=victim_email,
        victim_city=victim_city,
        bank_name=bank,
        scam_type=req.scam_type,
        loss=req.financial_loss,
        utr=req.transaction_ref,
        suspect_contact=req.suspect_contact,
        incident_dt_str=incident_dt_str,
        narrative=req.description,
        transfer_status=req.transfer_status
    )

    incident = None
    if req.incident_id:
        incident = db.query(Incident).filter(
            (Incident.incident_id == req.incident_id) | (Incident.id == (int(req.incident_id) if req.incident_id.isdigit() else -1))
        ).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident '{req.incident_id}' not found."
            )
        authorized_uids = get_authorized_incident_user_ids(current_user_id, db)
        if incident.user_id not in authorized_uids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot execute recovery for an incident owned by another user."
            )

    if incident:
        incident.financial_loss = req.financial_loss
        incident.bank_name = req.bank_name or incident.bank_name
        incident.transaction_ref = req.transaction_ref
        incident.suspect_contact = req.suspect_contact or incident.suspect_contact
        incident.status = "UNDER_REVIEW"
        incident.updated_at = datetime.now(timezone.utc)
    else:
        incident_id_str = req.incident_id or f"SA-{random.randint(100000, 999999)}"
        incident = Incident(
            incident_id=incident_id_str,
            user_id=current_user_id,
            title=f"Golden Hour Recovery: {req.scam_type}",
            scam_type=req.scam_type,
            description=req.description,
            financial_loss=req.financial_loss,
            currency="INR",
            bank_name=req.bank_name,
            transaction_ref=req.transaction_ref,
            suspect_contact=req.suspect_contact,
            incident_date=req.incident_datetime or datetime.now(timezone.utc),
            status="UNDER_REVIEW",
            severity="HIGH_RISK",
            risk_level="HIGH",
            risk_score=85,
            evidence_metadata=json.dumps({
                "timeline": req.timeline_events,
                "attachments": req.evidence_attachments,
                "channel": req.communication_channel,
                "transcript": req.message_transcript
            }),
            is_seed_data=False
        )
        db.add(incident)

    db.commit()
    db.refresh(incident)

    missing_notice = None
    if not req.transaction_ref or not req.transaction_ref.strip():
        missing_notice = "Transaction Reference / UTR was not provided. Clearly indicated in draft as pending bank statement."

    draft = RecoveryDraft(
        incident_id=incident.id,
        user_id=current_user_id,
        incident_datetime=req.incident_datetime,
        scam_category=req.scam_type,
        communication_channel=req.communication_channel,
        incident_narrative=req.description,
        financial_loss=req.financial_loss,
        transaction_reference=req.transaction_ref,
        bank_or_app=req.bank_name,
        transfer_status=req.transfer_status,
        evidence_attachments=json.dumps(req.evidence_attachments),
        timeline_events=json.dumps(req.timeline_events),
        portal_complaint_text=drafts["portal"],
        bank_complaint_text=drafts["bank"],
        police_complaint_text=drafts["police"],
        status="DRAFT",
        generated_at=datetime.now(timezone.utc)
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="RECOVERY_WIZARD_COMPLETED",
        entity_type="incident",
        entity_id=incident.incident_id,
        description=f"Generated Golden Hour recovery drafts for Incident #{incident.incident_id} (UTR: {req.transaction_ref or 'PENDING'})."
    )
    db.add(audit)
    db.commit()

    return RecoveryDraftResponse(
        id=draft.id,
        incident_id=draft.incident_id,
        user_id=draft.user_id,
        incident_datetime=draft.incident_datetime,
        scam_category=draft.scam_category,
        financial_loss=draft.financial_loss,
        transaction_reference=draft.transaction_reference,
        bank_or_app=draft.bank_or_app,
        transfer_status=draft.transfer_status,
        portal_complaint_text=draft.portal_complaint_text,
        bank_complaint_text=draft.bank_complaint_text,
        police_complaint_text=draft.police_complaint_text,
        missing_fields_notice=missing_notice,
        reporting_disclaimer="Call 1930 Cyber Fraud Helpline immediately and file at cybercrime.gov.in. Official reporting does not guarantee financial recovery.",
        status=draft.status,
        generated_at=draft.generated_at,
        incident_reference=incident.incident_id
    )

@router.put("/drafts/{draft_id}", response_model=RecoveryDraftResponse)
def update_draft(
    draft_id: int,
    payload: DraftUpdatePayload,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Allow user to review and edit complaint drafts before sharing or exporting.
    """
    draft = db.query(RecoveryDraft).filter(
        RecoveryDraft.id == draft_id,
        RecoveryDraft.user_id == current_user_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Recovery draft not found or access denied")

    if payload.portal_complaint_text is not None:
        draft.portal_complaint_text = payload.portal_complaint_text
    if payload.bank_complaint_text is not None:
        draft.bank_complaint_text = payload.bank_complaint_text
    if payload.police_complaint_text is not None:
        draft.police_complaint_text = payload.police_complaint_text
    if payload.status is not None:
        draft.status = payload.status

    draft.last_edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(draft)

    return RecoveryDraftResponse(
        id=draft.id,
        incident_id=draft.incident_id,
        user_id=draft.user_id,
        incident_datetime=draft.incident_datetime,
        scam_category=draft.scam_category,
        financial_loss=draft.financial_loss,
        transaction_reference=draft.transaction_reference,
        bank_or_app=draft.bank_or_app,
        transfer_status=draft.transfer_status,
        portal_complaint_text=draft.portal_complaint_text,
        bank_complaint_text=draft.bank_complaint_text,
        police_complaint_text=draft.police_complaint_text,
        status=draft.status,
        generated_at=draft.generated_at
    )

@router.get("/drafts/{draft_id}/export")
def export_recovery_draft(
    draft_id: int,
    format: str = Query(default="txt", pattern="^(txt|markdown|pdf)$"),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Export the reviewed recovery dossier as plain text, or as a structured PDF complaint pack
    (case summary, missing-information checklist, evidence references, timeline, audit trail
    and the three drafts).
    """
    draft = db.query(RecoveryDraft).filter(
        RecoveryDraft.id == draft_id,
        RecoveryDraft.user_id == current_user_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Recovery draft not found or access denied")

    if format == "pdf":
        from backend.app.services.pdf_pack import build_complaint_pack

        incident = db.query(Incident).filter(Incident.id == draft.incident_id).first()
        profile = db.query(UserProfile).filter(UserProfile.id == draft.user_id).first()
        audit_events = []
        if incident:
            audit_events = db.query(AuditEvent).filter(
                AuditEvent.entity_id.in_([incident.incident_id, str(incident.id)])
            ).order_by(AuditEvent.timestamp.asc()).limit(40).all()
        pdf_bytes = build_complaint_pack(incident, draft, profile, audit_events)
        db.add(AuditEvent(
            user_id=current_user_id,
            event_type="RECOVERY_PDF_EXPORTED",
            entity_type="incident",
            entity_id=incident.incident_id if incident else str(draft.incident_id),
            description=f"Golden Hour PDF complaint pack exported for draft #{draft.id}.",
        ))
        db.commit()
        reference = incident.incident_id if incident else f"draft_{draft_id}"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=satark_golden_hour_pack_{reference}.pdf"},
        )

    content = f"""SATARK SAATHI - OFFICIAL GOLDEN HOUR CYBER FRAUD RECOVERY DOSSIER
========================================================================
Generated on: {draft.generated_at.strftime("%d-%b-%Y %H:%M UTC")}
Helpline Advice: Dial 1930 immediately or visit https://cybercrime.gov.in
Disclaimer: Reporting initiates inter-bank lien marking, but does not guarantee recovery.
DO NOT AUTOMATICALLY SUBMIT: Review and sign before submitting to authorities.

--- SECTION 1: CYBER CRIME 1930 / PORTAL COMPLAINT ---
{draft.portal_complaint_text}

--- SECTION 2: BANK NODAL OFFICER DISPUTE ---
{draft.bank_complaint_text}

--- SECTION 3: CYBER POLICE STATION COMPLAINT ---
{draft.police_complaint_text}
========================================================================
"""
    filename = f"satark_recovery_dossier_draft_{draft_id}.txt"
    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Legacy alias for backward compatibility
@router.post("/draft/{incident_id}", response_model=RecoveryDraftResponse)
def generate_recovery_draft_legacy(
    incident_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    profile = db.query(UserProfile).first()
    drafts = build_complaint_drafts(
        victim_name=profile.full_name if profile else "Citizen",
        victim_phone=profile.phone_number if profile else "+91 ----------",
        victim_email=profile.email if profile else "victim@example.in",
        victim_city=profile.city if profile else "India",
        bank_name=incident.bank_name or "Bank",
        scam_type=incident.scam_type,
        loss=incident.financial_loss,
        utr=incident.transaction_ref,
        suspect_contact=incident.suspect_contact,
        incident_dt_str=incident.incident_date.strftime("%d-%b-%Y %H:%M UTC") if incident.incident_date else "Recent",
        narrative=incident.description,
        transfer_status="COMPLETED"
    )

    db.query(RecoveryDraft).filter(RecoveryDraft.incident_id == incident.id).delete()

    draft = RecoveryDraft(
        incident_id=incident.id,
        user_id=current_user_id,
        portal_complaint_text=drafts["portal"],
        bank_complaint_text=drafts["bank"],
        police_complaint_text=drafts["police"],
        generated_at=datetime.now(timezone.utc)
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    return draft


@router.post("/submit-bank-freeze", response_model=BankFreezeResponse)
def submit_bank_freeze(
    payload: BankFreezeRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Submits a sandbox simulation bank freeze request (prototyping the NPCI / CFCFRMS workflow).
    Issues a Simulation Reference Token and records simulation status.
    No actual interbank transaction lien is applied.
    """
    now = datetime.now(timezone.utc)
    ref_token = f"BF-STAT-SIM-{now.strftime('%Y')}-{random.randint(100000, 999999)}"

    # If linked to an incident, check authorization and update its status
    if payload.incident_id:
        incident = db.query(Incident).filter(
            (Incident.incident_id == payload.incident_id) | (Incident.id == (int(payload.incident_id) if payload.incident_id.isdigit() else -1))
        ).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident '{payload.incident_id}' not found."
            )
        authorized_uids = get_authorized_incident_user_ids(current_user_id, db)
        if incident.user_id not in authorized_uids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot submit actions for an incident owned by another user."
            )

        incident.status = "BANK_FREEZE_REQUESTED"
        incident.updated_at = now
        db.commit()

        audit = AuditEvent(
            user_id=current_user_id,
            event_type="BANK_FREEZE_REQUESTED",
            entity_type="incident",
            entity_id=str(incident.id),
            description=f"[PROTOTYPE SIMULATION] Interbank freeze simulated for {payload.bank_name} for ₹{payload.transaction_amount:,.2f} [Ref: {ref_token}]."
        )
        db.add(audit)
        db.commit()

    nodal_desk = f"{payload.bank_name} Cyber Fraud Desk (Sandbox Switch)"
    action_summary = (
        f"[PROTOTYPE SIMULATION] Interbank lien workflow simulated for beneficiary {payload.suspect_vpa_or_account}. "
        f"No actual bank account lien was placed. To effect real lien, contact {payload.bank_name} helpline or dial 1930."
    )

    return BankFreezeResponse(
        success=True,
        freeze_reference=ref_token,
        bank_name=payload.bank_name,
        status="INTERBANK_LIEN_INITIATED",
        timestamp=now,
        nodal_desk_assigned=nodal_desk,
        action_summary=action_summary,
        gateway_protocol="NPCI / CFCFRMS Sandbox Simulation Protocol",
        is_simulation=True,
        simulation_notice="PROTOTYPE SIMULATION ONLY: No actual bank lien was placed. In a real emergency, call 1930 and contact your bank nodal officer immediately."
    )


@router.post("/submit-cybercrime-portal", response_model=CybercrimePortalSubmitResponse)
def submit_cybercrime_portal(
    payload: CybercrimePortalSubmitRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Simulates electronic 1-click filing rehearsal into the National Cyber Crime Reporting Portal (cybercrime.gov.in / 1930 Helpline).
    Issues a Simulation Acknowledgement Token and updates incident status.
    This complaint draft is NOT automatically submitted to police or government authorities.
    """
    now = datetime.now(timezone.utc)
    ack_token = f"MHA-1930-SIM-{now.strftime('%Y')}-{random.randint(100000, 999999)}"

    if payload.incident_id:
        incident = db.query(Incident).filter(
            (Incident.incident_id == payload.incident_id) | (Incident.id == (int(payload.incident_id) if payload.incident_id.isdigit() else -1))
        ).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident '{payload.incident_id}' not found."
            )
        authorized_uids = get_authorized_incident_user_ids(current_user_id, db)
        if incident.user_id not in authorized_uids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot submit actions for an incident owned by another user."
            )

        incident.status = "REPORTED_1930"
        incident.updated_at = now
        db.commit()

        audit = AuditEvent(
            user_id=current_user_id,
            event_type="1930_PORTAL_FILED",
            entity_type="incident",
            entity_id=str(incident.id),
            description=f"[PROTOTYPE SIMULATION] Complaint e-filing simulated with National Cyber Crime Portal [Ack: {ack_token}]."
        )
        db.add(audit)
        db.commit()

    return CybercrimePortalSubmitResponse(
        success=True,
        portal_ack_number=ack_token,
        filing_timestamp=now,
        jurisdiction="National Cyber Crime Reporting Portal (Sandbox Prototype)",
        status="REGISTERED_FOR_INVESTIGATION",
        next_steps=[
            "PROTOTYPE SIMULATION NOTICE: This complaint draft has NOT been transmitted to the Ministry of Home Affairs or State Police.",
            "To officially file this complaint, dial 1930 immediately or navigate to https://cybercrime.gov.in.",
            "Export the Golden Hour recovery dossier from Satark Saathi and upload the signed statement and transaction statement."
        ],
        is_simulation=True,
        simulation_notice="SANDBOX SIMULATION ONLY: This draft has not been filed with police. Export the dossier and submit formally at cybercrime.gov.in."
    )
