"""
Legacy scanner router (/api/scanner).
Maintained for backward compatibility with the existing frontend.
Uses the new risk engine internally.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import ScamAnalysis, ScamEvidence, AuditEvent
from backend.app.schemas import AnalyzeRequest, ScamAnalysisResponse, PresetSample
from backend.app.services.factory import get_analyzer_service
from backend.app.dependencies import get_current_user_id

router = APIRouter(prefix="/scanner", tags=["Scam Scanner"])

PRESETS: List[PresetSample] = [
    PresetSample(
        id="digital-arrest",
        title="Digital Arrest / CBI Impersonation",
        category="Law Enforcement Impersonation",
        channel="WHATSAPP",
        text=(
            "URGENT: This is Senior Officer Vikram Singh from CBI New Delhi Headquarters. "
            "Your Aadhaar card was linked to a seized parcel in Mumbai containing 16 illegal passports and MDMA narcotics. "
            "A Non-Bailable Arrest Warrant is issued against you. You are placed under DIGITAL ARREST. "
            "You must join Skype video call immediately for confidential verification. "
            "Do not inform any family member or your bank will be frozen instantly. Contact 9811223344."
        ),
        description="High-profile extortion scam intimidating victims with bogus video arrest warrants."
    ),
    PresetSample(
        id="electricity-bill",
        title="Electricity Bill Disconnection Threat",
        category="Utility Impersonation",
        channel="SMS",
        text=(
            "Dear consumer, your electricity connection will be disconnected tonight at 9:30 PM from the power sub-station "
            "because your previous month bill was not updated. Please immediately contact our electricity officer at 9876501234. "
            "Do not make payment on app before calling."
        ),
        description="Panic-inducing threat targeting elderly citizens with sudden power disconnection."
    ),
    PresetSample(
        id="bank-kyc",
        title="Bank Account KYC / PAN Deactivation",
        category="Banking Phishing",
        channel="SMS",
        text=(
            "Dear SBI User, your NetBanking access and ATM card will be permanently blocked within 24 hours "
            "due to pending PAN card verification. Please click bit.ly/sbi-kyc-verify-2026 to update your Aadhaar and PAN immediately."
        ),
        description="Classic credential-stealing phishing SMS using URL shorteners."
    ),
    PresetSample(
        id="part-time-job",
        title="Part-Time Telegram Job Scam",
        category="Task Fraud",
        channel="WHATSAPP",
        text=(
            "Hi! I am Ananya from HR Global. We have simple work-from-home tasks: just like 5 YouTube videos "
            "and review Google Maps locations. Earn ₹3,500 daily directly to your UPI. "
            "No interview required. Join our official Telegram group t.me/daily-tasks-payouts to receive your first ₹500 welcome bonus!"
        ),
        description="Prepaid task fraud enticing users with initial small payouts before demanding deposits."
    ),
    PresetSample(
        id="india-post",
        title="India Post Stuck Parcel / Address Update",
        category="Courier Phishing",
        channel="SMS",
        text=(
            "India Post: Your package #IN782914 cannot be delivered due to incomplete house address. "
            "Please update your delivery details and pay redelivery fee of ₹25 at indiapost-track-delivery.xyz "
            "within 12 hours or package will be returned to sender."
        ),
        description="Phishing site masquerading as India Post to harvest debit card details."
    ),
    PresetSample(
        id="safe-transaction",
        title="Legitimate Bank Transaction SMS",
        category="Legitimate Notice",
        channel="SMS",
        text=(
            "Dear Customer, INR 1,450.00 debited from A/C XX8901 on 13-Oct-26 at 14:15 via UPI to BLINKIT GROCERY. "
            "Available Balance: INR 34,200.00. If this transaction was not authorized by you, please call SBI toll-free 1800112211 or SMS NO to 9223008333."
        ),
        description="Genuine banking debit notification with official toll-free reporting instructions."
    ),
    PresetSample(
        id="otp-theft",
        title="OTP Theft via Bank Impersonation",
        category="Credential Theft",
        channel="CALL_TRANSCRIPT",
        text=(
            "Hello sir, this is calling from HDFC Bank credit card department. "
            "Your credit card has been compromised and we need to verify your identity. "
            "Please share the OTP that was sent to your registered mobile number to block the unauthorized transaction. "
            "This is very urgent, the transaction is happening right now. Please tell me the 6-digit OTP immediately."
        ),
        description="Social engineering attack to steal OTP by impersonating bank staff."
    ),
    PresetSample(
        id="investment-fraud",
        title="Guaranteed Returns Investment Scam",
        category="Investment Fraud",
        channel="WHATSAPP",
        text=(
            "Join our exclusive Telegram trading group for guaranteed 100% returns on your investment within 30 days! "
            "We are SEBI registered advisors with insider stock market tips. "
            "Minimum investment ₹50,000 via Google Pay to our verified account. "
            "Already 5000+ happy investors. Join now: t.me/guaranteed-profits-india"
        ),
        description="Fraudulent investment scheme promising guaranteed returns through Telegram."
    )
]

@router.get("/presets", response_model=List[PresetSample])
def get_presets():
    """Returns curated preset scam scenarios for testing."""
    return PRESETS

@router.post("/analyze", response_model=ScamAnalysisResponse)
async def analyze_message(
    request: AnalyzeRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Analyzes a suspicious communication using the active analysis engine.
    Persists analysis and evidence in SQLite tied to the authenticated user.
    """
    analyzer = get_analyzer_service()
    result = await analyzer.analyze(request.text, request.channel)

    # Save analysis in database
    db_analysis = ScamAnalysis(
        user_id=current_user_id,
        input_text=request.text,
        channel=request.channel,
        classification=result.classification or result.verdict,
        risk_score=result.risk_score,
        severity=result.severity,
        summary=result.summary or result.plain_language_summary,
        advice=result.advice,
        suggested_action=result.suggested_action,
        is_flagged_for_family=result.is_flagged_for_family,
        is_seed_data=False
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    # Save evidence items
    for item in result.evidence_items:
        evidence = ScamEvidence(
            analysis_id=db_analysis.id,
            factor_type=item.get("factor_type", "GENERAL"),
            severity=item.get("severity", "MEDIUM"),
            description=item.get("description", ""),
            matched_text=item.get("matched_text", "")
        )
        db.add(evidence)

    # Log audit event
    audit = AuditEvent(
        user_id=current_user_id,
        event_type="SCAN_EXECUTED",
        entity_id=str(db_analysis.id),
        description=f"Analyzed {request.channel} message. Classification: '{result.classification}' with Risk Score {result.risk_score}/100."
    )
    db.add(audit)
    db.commit()
    db.refresh(db_analysis)

    return db_analysis

@router.get("/history", response_model=List[ScamAnalysisResponse])
def get_analysis_history(
    limit: int = 50,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Fetches analysis history for current user ordered by most recent."""
    return db.query(ScamAnalysis)\
        .filter(ScamAnalysis.user_id == current_user_id)\
        .order_by(ScamAnalysis.created_at.desc())\
        .limit(limit).all()

@router.get("/{analysis_id}", response_model=ScamAnalysisResponse)
def get_analysis_detail(
    analysis_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    analysis = db.query(ScamAnalysis).filter(
        ScamAnalysis.id == analysis_id,
        ScamAnalysis.user_id == current_user_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found or access denied")
    return analysis
