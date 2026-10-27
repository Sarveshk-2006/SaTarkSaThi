"""
Caller Intelligence Service for Satark Saathi Caller Shield.
Provides phone number normalization, deterministic risk scoring,
fast local lookup, community report ingestion, and personal blocklist management.
"""

import re
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models import (
    CallerReputation,
    CallerReport,
    CallerBlocklist,
    CallerLookupAudit,
)

# Category base risk weights (0 to 100)
CATEGORY_BASE_RISKS: Dict[str, int] = {
    "DIGITAL_ARREST": 95,
    "KYC_FRAUD": 90,
    "ELECTRICITY_SCAM": 88,
    "COURIER_CUSTOMS": 92,
    "LOTTERY_FRAUD": 85,
    "LOAN_APP_EXTORTION": 90,
    "SEXTORTION_CALL": 98,
    "FAKE_JOB_OFFER": 80,
    "TELEMARKETING_SPAM": 65,
    "HARASSMENT": 75,
    "LEGITIMATE_BUSINESS": 5,
    "UNKNOWN": 10,
}


def normalize_phone_number(raw: str) -> str:
    """
    Normalizes any raw phone number into an international E.164 formatted string.
    Specifically handles Indian formats:
    - 9876543210 -> +919876543210
    - 09876543210 -> +919876543210
    - +91 98765-43210 -> +919876543210
    - International numbers (e.g. +923001234567) preserved.
    """
    if not raw:
        return ""
    
    # Strip whitespace, dashes, parentheses
    cleaned = re.sub(r"[\s\-\(\)\.]", "", raw.strip())
    
    if cleaned.startswith("+"):
        digits_only = re.sub(r"\D", "", cleaned[1:])
        return f"+{digits_only}"
    
    # Check 10-digit Indian mobile format
    if re.fullmatch(r"[6-9]\d{9}", cleaned):
        return f"+91{cleaned}"
    
    # Check 11-digit leading 0 format: 09876543210
    if len(cleaned) == 11 and cleaned.startswith("0") and cleaned[1] in "6789":
        return f"+91{cleaned[1:]}"
    
    # Check 12-digit Indian format with 91: 919876543210
    if len(cleaned) == 12 and cleaned.startswith("91"):
        return f"+{cleaned}"
    
    # Default fallback: add + if digits present
    digits = re.sub(r"\D", "", cleaned)
    return f"+{digits}" if digits else ""


def format_display_number(normalized: str) -> str:
    """Formats an E.164 number into human-readable Indian or international format."""
    if not normalized:
        return ""
    if normalized.startswith("+91") and len(normalized) == 13:
        num = normalized[3:]
        return f"+91 {num[:5]} {num[5:]}"
    if len(normalized) > 5:
        return f"{normalized[:3]} {normalized[3:6]} {normalized[6:]}"
    return normalized


def compute_risk_score(
    category: str,
    total_reports: int,
    verified_reports: int,
    upvotes_spam: int,
    downvotes_safe: int,
    carrier_verified: bool,
    is_business: bool,
) -> Tuple[int, str, str]:
    """
    Calculates deterministic risk score (0-100), risk level, and confidence.
    """
    upvotes = upvotes_spam or 0
    downvotes = downvotes_safe or 0
    c_verified = bool(carrier_verified)
    b_verified = bool(is_business)

    if b_verified and c_verified:
        return (4, "LOW", "HIGH")
    
    base_risk = CATEGORY_BASE_RISKS.get(category, 15)
    
    if (total_reports or 0) == 0:
        if c_verified:
            return (5, "LOW", "MEDIUM")
        return (10, "UNKNOWN", "LOW")
    
    # Ratio of safe votes vs spam votes
    net_spam = upvotes - (downvotes * 1.5)
    if net_spam < 0 and (total_reports or 0) < 3:
        return (15, "LOW", "MEDIUM")
    
    # Scale based on report count (logarithmic curve capped at base risk)
    report_multiplier = min(1.0, (verified_reports * 0.2) + (total_reports * 0.05))
    computed = int(base_risk * 0.7 + (base_risk * 0.3 * report_multiplier))
    
    # If high report count, boost confidence
    computed = max(0, min(99, computed))
    
    if computed >= 85:
        level = "CRITICAL"
        conf = "HIGH"
    elif computed >= 70:
        level = "HIGH"
        conf = "HIGH" if total_reports > 5 else "MEDIUM"
    elif computed >= 40:
        level = "SUSPICIOUS"
        conf = "MEDIUM"
    else:
        level = "LOW"
        conf = "MEDIUM" if total_reports > 0 else "LOW"
        
    return (computed, level, conf)


class CallerIntelligenceService:
    def __init__(self, db: Session):
        self.db = db

    def lookup(
        self,
        phone_number: str,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Fast lookup for call screening and UI inspection.
        Returns reputation, risk score, signals, and personal block status.
        Execution target: < 25ms.
        """
        normalized = normalize_phone_number(phone_number)
        if not normalized:
            return {
                "phone_number": phone_number,
                "normalized_number": "",
                "risk_score": 0,
                "risk_level": "UNKNOWN",
                "display_tag": "Invalid Number Format",
                "category": "UNKNOWN",
                "action": "ALLOW",
                "is_blocked": False,
                "carrier_verified": False,
                "total_reports": 0,
                "ibm_summary": "Number format could not be parsed.",
                "evidence_signals": [],
                "recommended_action": "Verify number accuracy."
            }

        # 1. Check personal user blocklist first
        user_rule = None
        if user_id:
            user_rule = (
                self.db.query(CallerBlocklist)
                .filter_by(user_id=user_id, normalized_number=normalized)
                .first()
            )

        # 2. Query caller reputation table
        rep = (
            self.db.query(CallerReputation)
            .filter_by(normalized_number=normalized)
            .first()
        )

        # Audit logging (using privacy-preserving SHA-256 hash)
        try:
            phone_hash = hashlib.sha256(normalized.encode()).hexdigest()
            audit = CallerLookupAudit(
                user_id=user_id,
                number_hash=phone_hash,
                risk_score=rep.risk_score if rep else 0,
                risk_level=rep.risk_level if rep else "UNKNOWN",
                cache_hit=rep is not None,
            )
            self.db.add(audit)
            self.db.commit()
        except Exception:
            self.db.rollback()

        # Parse signals safely
        signals = []
        if rep and rep.evidence_signals:
            try:
                signals = json.loads(rep.evidence_signals)
            except Exception:
                signals = []

        is_blocked = False
        action = "ALLOW"
        if user_rule:
            action = user_rule.action
            is_blocked = (action == "BLOCK")
        elif rep and rep.risk_score >= 85:
            action = "WARN"

        if rep:
            return {
                "phone_number": rep.raw_display_number,
                "normalized_number": rep.normalized_number,
                "display_tag": rep.display_tag or f"Reported as {rep.category.replace('_', ' ').title()}",
                "category": rep.category,
                "risk_score": rep.risk_score,
                "risk_level": rep.risk_level,
                "confidence": rep.confidence,
                "action": action,
                "is_blocked": is_blocked,
                "carrier_verified": rep.carrier_verified,
                "carrier_name": rep.carrier_name,
                "is_business": rep.is_business,
                "business_name": rep.business_name,
                "total_reports": rep.total_reports,
                "verified_reports": rep.verified_reports,
                "ibm_summary": rep.ibm_summary or "Deterministic community threat analysis.",
                "evidence_signals": signals,
                "recommended_action": rep.recommended_action or "Exercise caution before sharing personal OTPs or financial details.",
                "last_reported_at": rep.last_reported_at.isoformat() if rep.last_reported_at else None,
            }

        # Unknown / Unreported number
        formatted = format_display_number(normalized)
        return {
            "phone_number": formatted,
            "normalized_number": normalized,
            "display_tag": "Unreported Caller",
            "category": "UNKNOWN",
            "risk_score": 10,
            "risk_level": "UNKNOWN",
            "confidence": "LOW",
            "action": action,
            "is_blocked": is_blocked,
            "carrier_verified": False,
            "total_reports": 0,
            "verified_reports": 0,
            "ibm_summary": "No verified reports recorded in the Satark Saathi community database.",
            "evidence_signals": [],
            "recommended_action": "Standard call handling. Never share banking OTPs, PINs, or UPI access with unknown callers.",
            "last_reported_at": None,
        }

    def submit_report(
        self,
        phone_number: str,
        category: str,
        claimed_caller_name: Optional[str] = None,
        description: Optional[str] = None,
        call_type: str = "INCOMING",
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Submits citizen report of spam or scam call.
        Updates or creates CallerReputation record atomically.
        """
        normalized = normalize_phone_number(phone_number)
        if not normalized:
            raise ValueError("Invalid phone number provided.")

        now = datetime.now(timezone.utc)
        formatted = format_display_number(normalized)

        # 1. Insert individual report
        report = CallerReport(
            user_id=user_id,
            normalized_number=normalized,
            category=category,
            claimed_caller_name=claimed_caller_name,
            description=description,
            call_type=call_type,
            call_timestamp=now,
            status="VERIFIED",
            created_at=now,
        )
        self.db.add(report)

        # 2. Fetch or create CallerReputation
        rep = (
            self.db.query(CallerReputation)
            .filter_by(normalized_number=normalized)
            .first()
        )

        if not rep:
            rep = CallerReputation(
                normalized_number=normalized,
                raw_display_number=formatted,
                category=category,
                total_reports=1,
                verified_reports=1,
                upvotes_spam=1,
                downvotes_safe=0,
                carrier_verified=False,
                is_business=False,
                last_reported_at=now,
                created_at=now,
            )
            self.db.add(rep)
        else:
            rep.total_reports += 1
            rep.verified_reports += 1
            rep.upvotes_spam += 1
            rep.category = category  # update to latest reported fraud category
            rep.last_reported_at = now

        # Recalculate score
        score, level, conf = compute_risk_score(
            category=rep.category,
            total_reports=rep.total_reports,
            verified_reports=rep.verified_reports,
            upvotes_spam=rep.upvotes_spam,
            downvotes_safe=rep.downvotes_safe,
            carrier_verified=rep.carrier_verified,
            is_business=rep.is_business,
        )
        rep.risk_score = score
        rep.risk_level = level
        rep.confidence = conf
        rep.display_tag = f"Suspected {category.replace('_', ' ').title()}"

        # Populate baseline signals
        signals = [f"REPORTED_{category}"]
        if rep.total_reports > 3:
            signals.append("MULTIPLE_COMMUNITY_REPORTS")
        if claimed_caller_name:
            signals.append("SUSPECTED_NAME_IMPERSONATION")
        rep.evidence_signals = json.dumps(signals)

        if not rep.recommended_action:
            rep.recommended_action = "Do not answer. Block caller and report to 1930 Cyber Crime Helpline."

        self.db.commit()
        self.db.refresh(rep)

        return {
            "status": "success",
            "message": "Caller report recorded and reputation updated.",
            "normalized_number": normalized,
            "risk_score": rep.risk_score,
            "risk_level": rep.risk_level,
            "total_reports": rep.total_reports,
        }

    def record_feedback(
        self,
        phone_number: str,
        is_spam: bool,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Records post-call feedback (spam upvote or safe downvote)."""
        normalized = normalize_phone_number(phone_number)
        rep = (
            self.db.query(CallerReputation)
            .filter_by(normalized_number=normalized)
            .first()
        )
        if not rep:
            return {"status": "not_found", "message": "No caller reputation record to vote on."}

        if is_spam:
            rep.upvotes_spam += 1
        else:
            rep.downvotes_safe += 1

        score, level, conf = compute_risk_score(
            category=rep.category,
            total_reports=rep.total_reports,
            verified_reports=rep.verified_reports,
            upvotes_spam=rep.upvotes_spam,
            downvotes_safe=rep.downvotes_safe,
            carrier_verified=rep.carrier_verified,
            is_business=rep.is_business,
        )
        rep.risk_score = score
        rep.risk_level = level
        rep.confidence = conf
        self.db.commit()

        return {
            "status": "success",
            "risk_score": rep.risk_score,
            "risk_level": rep.risk_level,
            "upvotes_spam": rep.upvotes_spam,
            "downvotes_safe": rep.downvotes_safe,
        }

    def update_blocklist(
        self,
        user_id: int,
        phone_number: str,
        action: str = "BLOCK",
        display_name: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Adds or updates a personal blocklist or allowlist entry."""
        normalized = normalize_phone_number(phone_number)
        if not normalized:
            raise ValueError("Invalid phone number provided.")

        entry = (
            self.db.query(CallerBlocklist)
            .filter_by(user_id=user_id, normalized_number=normalized)
            .first()
        )
        if not entry:
            entry = CallerBlocklist(
                user_id=user_id,
                normalized_number=normalized,
                display_name=display_name or format_display_number(normalized),
                action=action,
                reason=reason,
            )
            self.db.add(entry)
        else:
            entry.action = action
            if display_name:
                entry.display_name = display_name
            if reason:
                entry.reason = reason

        self.db.commit()
        return {
            "status": "success",
            "normalized_number": normalized,
            "action": entry.action,
            "display_name": entry.display_name,
        }

    def remove_from_blocklist(self, user_id: int, phone_number: str) -> bool:
        normalized = normalize_phone_number(phone_number)
        entry = (
            self.db.query(CallerBlocklist)
            .filter_by(user_id=user_id, normalized_number=normalized)
            .first()
        )
        if entry:
            self.db.delete(entry)
            self.db.commit()
            return True
        return False

    def list_blocklist(self, user_id: int) -> List[Dict[str, Any]]:
        entries = (
            self.db.query(CallerBlocklist)
            .filter_by(user_id=user_id)
            .order_by(desc(CallerBlocklist.created_at))
            .all()
        )
        return [
            {
                "id": e.id,
                "normalized_number": e.normalized_number,
                "display_name": e.display_name,
                "action": e.action,
                "reason": e.reason,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in entries
        ]

    def list_recent_threats(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Returns highest risk or recently reported callers for the dashboard."""
        reps = (
            self.db.query(CallerReputation)
            .filter(CallerReputation.risk_score >= 60)
            .order_by(desc(CallerReputation.last_reported_at), desc(CallerReputation.risk_score))
            .limit(limit)
            .all()
        )
        return [
            {
                "phone_number": r.raw_display_number or r.normalized_number,
                "normalized_number": r.normalized_number,
                "display_number": r.raw_display_number or r.normalized_number,
                "display_tag": r.display_tag or f"Reported as {r.category.replace('_', ' ').title()}",
                "category": r.category,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "confidence": r.confidence or "HIGH",
                "action": "BLOCK" if r.risk_score >= 85 else "WARN",
                "is_blocked": True if r.risk_score >= 85 else False,
                "carrier_verified": r.carrier_verified,
                "carrier_name": r.carrier_name,
                "is_business": r.is_business,
                "business_name": r.business_name,
                "total_reports": r.total_reports,
                "verified_reports": r.verified_reports,
                "ibm_summary": r.ibm_summary or "Deterministic community threat analysis.",
                "evidence_signals": json.loads(r.evidence_signals) if r.evidence_signals else [],
                "recommended_action": r.recommended_action or "Exercise caution before speaking or sharing OTPs.",
                "last_reported_at": r.last_reported_at.isoformat() if r.last_reported_at else None,
            }
            for r in reps
        ]
