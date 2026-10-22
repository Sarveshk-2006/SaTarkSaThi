"""
Enhanced rule-based scam analysis engine for Indian digital threats.
Implements weighted, configurable signals with counter-signals and uncertainty handling.

This is a deterministic heuristic engine. It does NOT produce calibrated probabilities.
Risk scores are signal-strength indicators, not fraud certainties.
"""

import re
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from backend.app.services.analysis_result import (
    AnalysisResult, DetectedSignal, RiskLevel, ConfidenceLabel,
    InputType, AnalysisMode
)

logger = logging.getLogger(__name__)


# ── Signal Category Definitions ──────────────────────────────────────────────

SCAM_PATTERNS: Dict[str, Dict[str, Any]] = {
    "DIGITAL_ARREST": {
        "title": "Digital Arrest / Law Enforcement Impersonation",
        "regex": [
            r"\b(cbi|crime branch|cyber cell|mumbai police|delhi police|ed|enforcement directorate|customs|narcotics|ncb)\b",
            r"\b(arrest warrant|digital arrest|video call interrogation|money laundering|drugs found|passport seized|mdma|non[- ]?bailable)\b",
            r"\b(rbi clearance|national security|supreme court order|confidential verification)\b",
            r"\b(skype|video call|zoom call)\b.{0,60}\b(interrogation|verification|arrest|court)\b",
            r"\b(police station|police is threatening|register fir|police custody|arrest me|in custody|bail money|inspector|advocate)\b",
        ],
        "weight": 35,
        "tactics": ["AUTHORITY_IMPERSONATION", "FEAR_AND_INTIMIDATION", "SECRECY_AND_ISOLATION"],
        "advice": "CRITICAL: Indian law enforcement (Police, CBI, ED, Customs) NEVER conducts arrests or legal proceedings over Skype/WhatsApp video calls. There is no legal concept of 'digital arrest'. Do not transfer funds to any 'verification account'.",
        "verification": [
            "Call 100 (Police) or 112 (Emergency) to verify any claimed warrant",
            "Visit your nearest police station in person",
            "Call the official CBI helpline: 011-24368638",
            "No genuine officer will demand secrecy from your family"
        ]
    },
    "ELECTRICITY_BILL": {
        "title": "Electricity Bill / Utility Disconnection Threat",
        "regex": [
            r"\b(electricity|power|bijli)\b.{0,60}\b(disconnect|cut off|bill update|kat jayegi|tonight|immediately)\b",
            r"\b(contact officer|call immediately|call electricity officer)\b.{0,40}\b\d{10}\b",
            r"\b(bses|tata power|mahavitaran|uppcl|dhbvn|tneb|bescom)\b.{0,60}\b(disconnect|officer|call)\b",
            r"\b(trai|telecom|sim card|mobile number)\b.{0,60}\b(deactivated|disconnected|blocked|within \d+ hours|penalty|illegal advertising)\b",
        ],
        "weight": 35,
        "tactics": ["ARTIFICIAL_URGENCY", "AUTHORITY_IMPERSONATION"],
        "advice": "Utility providers and TRAI never send disconnection threats from personal mobile numbers or demand immediate phone calls. Check your service directly on the official portal.",
        "verification": [
            "Log in to your state electricity board or telecom portal to check actual status",
            "Call the official customer care number printed on your physical bill",
            "Official disconnection notices are never served via abrupt WhatsApp/SMS"
        ]
    },
    "BANK_KYC_EXPIRY": {
        "title": "Bank / EPFO KYC Deactivation Phishing",
        "regex": [
            r"\b(sbi|hdfc|icici|axis|pnb|bob|kotak|canara|union bank)\b.{0,60}\b(kyc|pan|deactivated|blocked|suspended|hold)\b",
            r"\b(yono|netbanking|card block|account block)\b.{0,60}\b(update|verify|click|immediately)\b",
            r"\b(aadhaar card link|pan card link|submit details|share otp)\b",
            r"\b(epfo|epf|uan|provident fund|income tax|gst portal)\b.{0,60}\b(kyc|blocked|deactivated|suspended|freeze|update)\b",
        ],
        "weight": 35,
        "tactics": ["FEAR_AND_INTIMIDATION", "ARTIFICIAL_URGENCY", "CREDENTIAL_THEFT"],
        "advice": "Banks and EPFO NEVER ask members to update KYC via SMS links or share OTPs over phone. Never click on links in messages claiming account blockage.",
        "verification": [
            "Open your official bank or EPFO app directly (not through any link)",
            "Call the number printed on the back of your bank card",
            "Visit your home branch with your ID for actual KYC updates"
        ]
    },
    "PART_TIME_JOB": {
        "title": "Part-Time Job / Telegram Task Fraud",
        "regex": [
            r"\b(part[- ]?time job|work from home|daily income|earn\s*₹?\s*\d+|earn\s+\d{3,5}\s*daily)\b",
            r"\b(like youtube videos|google reviews|hotel rating|pre[- ]?paid task|telegram group)\b",
            r"\b(recharge balance|crypto investment|high return|instant payout|welcome bonus)\b",
            r"\b(no interview|simple task|data entry work)\b.{0,60}\b(₹|rs\.?|inr)\b"
        ],
        "weight": 35,
        "tactics": ["GREED_EXPLOITATION", "FINANCIAL_PRESSURE"],
        "advice": "Legitimate companies never pay ₹2,000-₹5,000 for liking YouTube videos. This is a classic task fraud pyramid where initial small payouts are used to lure victims into larger 'deposits'.",
        "verification": [
            "Search for the company name on the MCA portal (mca.gov.in)",
            "Check if the company has a verified website and office address",
            "No legitimate employer requires 'security deposits' from workers"
        ]
    },
    "REMOTE_ACCESS_APP": {
        "title": "Remote Screen Sharing / Device Takeover",
        "regex": [
            r"\b(anydesk|teamviewer|quicksupport|rustdesk|screen share|airdroid)\b",
            r"\b(install this app|download apk|support tool|verification app)\b"
        ],
        "weight": 45,
        "tactics": ["REMOTE_ACCESS_REQUEST", "MALICIOUS_LINK_OR_APP"],
        "advice": "DANGER: Never install AnyDesk, TeamViewer, or QuickSupport on instruction from an unknown caller. These apps give fraudsters full control to see your OTPs and operate your bank accounts.",
        "verification": [
            "Banks and government agencies NEVER ask you to install screen-sharing apps",
            "If already installed, immediately uninstall and change all banking passwords",
            "File a complaint at cybercrime.gov.in if you shared screen access"
        ]
    },
    "UPI_QR_FRAUD": {
        "title": "UPI / QR Code Payment Reversal Fraud",
        "regex": [
            r"\b(scan qr to receive|enter upi pin to get|scan and accept payment|upi collect request)\b",
            r"\b(army officer|olx buyer|advance token|cashback reward)\b.{0,60}\b(scan|qr|upi pin)\b"
        ],
        "weight": 35,
        "tactics": ["FINANCIAL_PRESSURE", "DECEPTION"],
        "advice": "Golden Rule of UPI: You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money. Entering your PIN always deducts money.",
        "verification": [
            "To receive money via UPI, the sender initiates the transfer—you don't scan anything",
            "Reject all 'collect' requests from unknown sources",
            "Report suspicious UPI IDs on the NPCI portal"
        ]
    },
    "COURIER_CUSTOMS": {
        "title": "Courier / India Post / Customs Delivery Fraud",
        "regex": [
            r"\b(india post|speed post|fedex|dhl|bluedart)\b.{0,60}\b(address incomplete|package detained|delivery failed|pay ₹\d+)\b",
            r"\b(redelivery fee|customs clearance|update address link|customs duty clearance)\b",
            r"\b(customs officer|customs clearance fee|seize the package)\b",
        ],
        "weight": 35,
        "tactics": ["ARTIFICIAL_URGENCY", "SUSPICIOUS_LINK"],
        "advice": "Courier services and India Post do not ask for small fees via SMS links. Check parcel tracking directly on indiapost.gov.in or the courier's official website.",
        "verification": [
            "Track your parcel on indiapost.gov.in using the consignment number",
            "Call the official courier customer care number",
            "Legitimate delivery fees are paid at the time of delivery, not via links"
        ]
    },
    "LOTTERY_KBC": {
        "title": "Lottery / KBC / Prize Winner Scam",
        "regex": [
            r"\b(kaun banega crorepati|kbc lottery|congratulations you won|lucky draw|25 lakh|car winner)\b",
            r"\b(dear customer won|whatsapp lottery|contact manager|registration fee|processing charges)\b",
            r"\b(prize money cheque|gst filing charge|gst charge|manager rana pratap)\b",
        ],
        "weight": 35,
        "tactics": ["GREED_EXPLOITATION", "AUTHORITY_IMPERSONATION"],
        "advice": "There is no KBC lottery. Sony TV / Amitabh Bachchan do not distribute prizes via WhatsApp. Never pay 'tax', 'registration', or 'processing fees' to claim prizes you never entered to win.",
        "verification": [
            "Check sonyliv.com for official KBC information",
            "No legitimate lottery requires advance fee payment",
            "Report such messages to cybercrime.gov.in"
        ]
    },
    "INVESTMENT_FRAUD": {
        "title": "Fraudulent Investment / Trading Scam",
        "regex": [
            r"\b(guaranteed\s+(?:\d+%\s+)?returns?|100%\s+profit|double\s+your\s+money|zero\s+risk\s+investment)\b",
            r"\b(forex trading|crypto trading|share market tips|stock market tips|ipo allotment|insider stock market tips|insider tips)\b",
            r"\b(whatsapp group|telegram trading group|telegram group|telegram channel)\b",
            r"\b(sebi registered|rbi approved)\b",
            r"\b(guaranteed|assured|fixed|100%)\b.{0,60}\b(return|profit|income|trading)\b",
        ],
        "weight": 40,
        "tactics": ["GREED_EXPLOITATION", "FALSE_AUTHORITY"],
        "advice": "No legitimate investment can guarantee returns. SEBI-registered advisors never solicit via WhatsApp/Telegram. Verify any advisor's SEBI registration on sebi.gov.in before investing.",
        "verification": [
            "Check SEBI's registered intermediary database at sebi.gov.in",
            "Verify the broker's registration on NSE/BSE website",
            "No legitimate investment promises guaranteed or fixed returns",
            "Report suspicious investment schemes to SEBI SCORES portal"
        ]
    },
    "LOAN_APP_EXTORTION": {
        "title": "Predatory Loan App Blackmail & Harassment",
        "regex": [
            r"\b(loan overdue|fastcash|loan app|recovery agents?)\b.{0,60}\b(morphed photos?|contacts list|relatives|pan|aadhaar)\b",
            r"\b(pay ₹?\d+ in \d+ minutes|blackmail|send your details to all)\b",
        ],
        "weight": 45,
        "tactics": ["FEAR_AND_INTIMIDATION", "BLACKMAIL", "EXTORTION"],
        "advice": "Predatory illegal loan apps use illegal harassment tactics. Do NOT pay under threats. File a cyber complaint immediately and block the numbers.",
        "verification": [
            "Check if the loan company is an RBI-registered NBFC on rbi.org.in",
            "File a harassment complaint on cybercrime.gov.in under Section 67 IT Act",
            "Inform family that scammers are using morphed imagery"
        ]
    },
    "FAMILY_EMERGENCY": {
        "title": "Family Emergency / Bail Impersonation",
        "regex": [
            r"\b(papa urgent|mom urgent|friend met with an accident|in police custody|register fir against me|don't tell mom|don't tell dad)\b",
            r"\b(transfer ₹?\d+ immediately to lawyer|bail money|emergency funds)\b",
        ],
        "weight": 45,
        "tactics": ["EMOTIONAL_COERCION", "SECRECY_AND_ISOLATION", "ARTIFICIAL_URGENCY"],
        "advice": "Scammers impersonate children or close relatives claiming arrest or accident to induce panic. Call your relative directly on their known phone number before transferring any funds.",
        "verification": [
            "Hang up and call your family member directly on their usual mobile number",
            "Call another family member to verify their current location",
            "Never send funds to a 'lawyer' or 'police' UPI account under distress"
        ]
    },
    "OTP_THEFT": {
        "title": "OTP / PIN / Password Theft Attempt",
        "regex": [
            r"\b(share.{0,10}otp|send.{0,10}otp|tell.{0,10}otp|give.{0,10}otp|provide.{0,10}otp)\b",
            r"\b(share.{0,10}pin|send.{0,10}pin|tell.{0,10}pin)\b",
            r"\b(share.{0,10}password|send.{0,10}password|tell.{0,10}password)\b",
            r"\b(otp|pin|password|cvv)\b.{0,40}\b(verify|confirm|update|process|complete|block|transaction|compromised)\b",
            r"\b(tell me the\s+\w+\s*otp|6-digit otp|share the otp)\b",
        ],
        "weight": 45,
        "tactics": ["CREDENTIAL_THEFT", "SOCIAL_ENGINEERING"],
        "advice": "NEVER share OTP, PIN, CVV, or password with anyone over phone, SMS, or message. Banks, payment apps, and government agencies will NEVER ask for these.",
        "verification": [
            "Banks explicitly state they never ask for OTP/PIN/CVV",
            "If someone asks for your OTP, they are attempting fraud",
            "Change your passwords immediately if you have shared them"
        ]
    }
}


# ── Counter-Signals (reduce risk for legitimate patterns) ────────────────────

COUNTER_SIGNAL_PATTERNS = [
    {
        "name": "OFFICIAL_HELPLINE",
        "regex": r"\b(1800\d{6,8}|1930|112|100|181|155260)\b",
        "weight_reduction": 10,
        "reason": "Message contains official toll-free helpline numbers"
    },
    {
        "name": "STANDARD_DEBIT_NOTIFICATION",
        "regex": r"\b(debited|credited|a/c\s*xx\d+|available\s*bal|if not you)\b",
        "weight_reduction": 15,
        "reason": "Follows standard bank transaction notification format"
    },
    {
        "name": "LEGITIMATE_DELIVERY_UPDATE",
        "regex": r"\b(out for delivery|successfully delivered|your order|order confirmed|shipment dispatched)\b",
        "weight_reduction": 12,
        "reason": "Follows standard e-commerce delivery notification format"
    },
    {
        "name": "PERSONAL_CONVERSATION",
        "regex": r"\b(how are you|happy birthday|good morning|take care|miss you|love you|see you|dinner tonight)\b",
        "weight_reduction": 20,
        "reason": "Contains casual personal conversation patterns"
    }
]


# ── Suspicious URL / Link patterns ──────────────────────────────────────────

SUSPICIOUS_URL_INDICATORS = [
    (r"(bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|t\.co|t\.me)", "URL_SHORTENER", "URL shortener or redirect link used to hide actual destination"),
    (r"\.(xyz|top|live|club|icu|online|buzz|monster|rest|support|click|link)\b", "SUSPICIOUS_TLD", "Uncommon top-level domain often associated with throwaway scam sites"),
    (r"(secure-banking|kyc-update|account-verify|login-verify|aadhaar-update|pan-verify)", "DECEPTIVE_SUBDOMAIN", "Misleading subdomain designed to appear as official banking/government site"),
    (r"(ngrok\.io|serveo\.net|loca\.lt|localhost\.run)", "TUNNEL_SERVICE", "Temporary tunnel service—legitimate services don't use these for customer-facing URLs"),
    (r"\.apk\b", "APK_DOWNLOAD", "Direct APK download link—official apps are distributed through Play Store"),
]

URGENCY_PATTERNS = [
    (r"\b(immediately|within\s+\d+\s+(minutes?|hours?|mins?)|urgent|hurry|today itself|last chance|warning|immediate action|right now|act fast)\b", "ARTIFICIAL_URGENCY", "Urgency language designed to prevent careful verification"),
    (r"\b(turant|jaldi|aaj hi|band ho jayega|abhi|foran)\b", "HINDI_URGENCY", "Hindi urgency language to pressure immediate action"),
]

SECRECY_PATTERNS = [
    (r"\b(do not inform|do not tell|keep this confidential|don't share|secret|do not discuss|between us)\b", "SECRECY_DEMAND", "Demands secrecy, which is a hallmark of scams—legitimate authorities never demand secrecy from family"),
    (r"\b(kisi ko mat batana|ghar pe mat bolna|family ko mat batao)\b", "HINDI_SECRECY", "Hindi secrecy demand to isolate victim from trusted contacts"),
]

PAYMENT_DEMAND_PATTERNS = [
    (r"\b(transfer\s+(money|amount|funds)|send\s+(money|amount|₹)|pay\s+(immediately|now|₹))\b", "PAYMENT_DEMAND", "Demands immediate money transfer"),
    (r"\b(personal\s+account|private\s+account|this\s+account\s+number)\b", "PERSONAL_ACCOUNT_TRANSFER", "Asks for transfer to personal account instead of official channels"),
    (r"\b(google pay|phonepe|paytm)\b.{0,60}\b(send|transfer|pay|invest|via)\b", "UPI_PAYMENT_DEMAND", "Demands UPI payment through personal apps"),
]


def analyze_text(
    text: str,
    input_type: InputType = InputType.TEXT,
    channel: str = "SMS"
) -> AnalysisResult:
    """
    Core deterministic analysis function.
    Evaluates text against weighted signal patterns and counter-signals.
    Returns a fully validated AnalysisResult.
    """
    incident_id = f"SA-{uuid.uuid4().hex[:12].upper()}"
    lower_text = text.lower().strip()
    original_text = text.strip()

    if not original_text or len(original_text) < 3:
        return _empty_result(incident_id, input_type)

    signals: List[DetectedSignal] = []
    raw_score = 0
    counter_score = 0
    all_tactics: set = set()
    advice_items: List[str] = []
    verification_items: List[str] = []

    # ── 1. Match against known scam categories ───────────────────────────
    for cat_key, cat_data in SCAM_PATTERNS.items():
        matched_fragments = []
        for pattern in cat_data["regex"]:
            match = re.search(pattern, lower_text, re.IGNORECASE)
            if match:
                matched_fragments.append(match.group(0))

        if matched_fragments:
            weight = cat_data["weight"]
            # Additional weight for multiple matches within same category
            multi_match_bonus = min((len(matched_fragments) - 1) * 8, 20)
            total_weight = weight + multi_match_bonus
            raw_score += total_weight

            for tactic in cat_data["tactics"]:
                all_tactics.add(tactic)

            signals.append(DetectedSignal(
                signal_type=cat_data["tactics"][0],
                severity="HIGH" if weight >= 30 else "MEDIUM",
                reason=f"Detected indicators of {cat_data['title']}",
                excerpt=", ".join(matched_fragments[:3]),
                weight=total_weight
            ))
            advice_items.append(cat_data["advice"])
            verification_items.extend(cat_data.get("verification", []))

    # ── 2. Check suspicious URL indicators ───────────────────────────────
    for pattern, signal_type, reason in SUSPICIOUS_URL_INDICATORS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            raw_score += 20
            all_tactics.add("SUSPICIOUS_LINK")
            signals.append(DetectedSignal(
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=match.group(0),
                weight=20
            ))
            break  # One URL signal is enough

    # ── 3. Check urgency patterns ────────────────────────────────────────
    for pattern, signal_type, reason in URGENCY_PATTERNS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            raw_score += 12
            all_tactics.add("ARTIFICIAL_URGENCY")
            signals.append(DetectedSignal(
                signal_type=signal_type,
                severity="MEDIUM",
                reason=reason,
                excerpt=match.group(0),
                weight=12
            ))
            break

    # ── 4. Check secrecy demands ─────────────────────────────────────────
    for pattern, signal_type, reason in SECRECY_PATTERNS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            raw_score += 18
            all_tactics.add("SECRECY_AND_ISOLATION")
            signals.append(DetectedSignal(
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=match.group(0),
                weight=18
            ))
            break

    # ── 5. Check payment demands ─────────────────────────────────────────
    for pattern, signal_type, reason in PAYMENT_DEMAND_PATTERNS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            raw_score += 15
            all_tactics.add("FINANCIAL_PRESSURE")
            signals.append(DetectedSignal(
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=match.group(0),
                weight=15
            ))
            break

    # ── 6. Check for personal mobile in official context ─────────────────
    phone_matches = re.findall(r"(?:\+91|91|0)?[6-9]\d{9}", original_text)
    official_keywords = ["police", "bank", "officer", "discom", "power", "cbi", "court", "customs", "ed ", "rbi"]
    if phone_matches and any(k in lower_text for k in official_keywords):
        raw_score += 15
        signals.append(DetectedSignal(
            signal_type="UNVERIFIED_PERSONAL_NUMBER",
            severity="HIGH",
            reason="Personal mobile number presented as an official contact for a government agency or bank. Genuine agencies use toll-free or landline numbers.",
            excerpt=phone_matches[0],
            weight=15
        ))

    # ── 7. Apply counter-signals ─────────────────────────────────────────
    for counter in COUNTER_SIGNAL_PATTERNS:
        if re.search(counter["regex"], lower_text, re.IGNORECASE):
            counter_score += counter["weight_reduction"]
            signals.append(DetectedSignal(
                signal_type=f"COUNTER_{counter['name']}",
                severity="LOW",
                reason=f"Legitimacy indicator: {counter['reason']}",
                excerpt=None,
                weight=-counter["weight_reduction"]
            ))

    # ── 8. Compute final score ───────────────────────────────────────────
    adjusted_score = max(raw_score - counter_score, 0)
    final_score = min(adjusted_score, 99)  # Never claim 100% certainty

    # ── 9. Determine risk level, confidence, and verdict ─────────────────
    risk_level, severity, confidence, should_alert = _classify_risk(final_score, len(signals))
    verdict = _determine_verdict(signals, final_score, SCAM_PATTERNS)

    # Build human-readable summary
    if final_score >= 70:
        tactic_names = ", ".join([t.replace("_", " ").title() for t in list(all_tactics)[:3]])
        summary = (
            f"High-risk indicators detected (score: {final_score}/100). "
            f"This communication shows strong characteristics of {verdict}, "
            f"employing tactics including {tactic_names}. "
            f"Do not engage further."
        )
    elif final_score >= 35:
        summary = (
            f"Moderate risk indicators detected (score: {final_score}/100). "
            f"Some elements of this communication match known scam patterns. "
            f"Verify through official channels before taking any action."
        )
    elif final_score >= 10:
        summary = (
            f"Low risk detected (score: {final_score}/100). "
            f"Minor indicators were found but the message appears largely legitimate. "
            f"Standard digital safety practices are still recommended."
        )
    else:
        summary = (
            f"No significant risk indicators detected (score: {final_score}/100). "
            f"The message does not match known scam patterns. "
            f"As always, never share OTPs, PINs, or passwords."
        )

    # Build recommended actions
    if final_score >= 60:
        recommended_actions = [
            "Do NOT reply to or call back this sender",
            "Do NOT click any links in this message",
            "Block the sender immediately",
            "Alert your family members about this attempt",
            "Report to cybercrime.gov.in or call 1930"
        ]
    elif final_score >= 35:
        recommended_actions = [
            "Do not click any links without independent verification",
            "Verify the sender's identity through official channels",
            "Do not share any personal or financial information",
            "Consider discussing with a trusted family member"
        ]
    else:
        recommended_actions = [
            "Continue with standard digital safety practices",
            "Never share OTPs, PINs, or passwords with anyone"
        ]

    # Deduplicate verification steps
    seen_verif = set()
    unique_verification = []
    for v in verification_items:
        if v not in seen_verif:
            seen_verif.add(v)
            unique_verification.append(v)

    # Build evidence list for legacy format
    legacy_evidence = []
    for sig in signals:
        if sig.weight > 0:  # Skip counter-signals in legacy format
            legacy_evidence.append({
                "factor_type": sig.signal_type,
                "severity": sig.severity,
                "description": sig.reason,
                "matched_text": sig.excerpt or ""
            })

    # Build supporting evidence strings
    supporting_evidence = [
        f"{sig.signal_type}: {sig.reason}" + (f" (found: '{sig.excerpt}')" if sig.excerpt else "")
        for sig in signals if sig.weight > 0
    ]

    return AnalysisResult(
        incident_id=incident_id,
        input_type=input_type,
        risk_level=risk_level,
        risk_score=final_score,
        confidence_label=confidence,
        verdict=verdict,
        plain_language_summary=summary,
        detected_signals=signals,
        supporting_evidence=supporting_evidence,
        recommended_actions=recommended_actions,
        verification_steps=unique_verification[:6],
        should_alert_family=should_alert,
        ai_provider="none",
        analysis_mode=AnalysisMode.RULE_BASED,
        # Legacy fields
        classification=verdict,
        severity=severity,
        summary=summary,
        advice=advice_items[0] if advice_items else "No specific advisory—practice standard digital safety.",
        suggested_action=recommended_actions[0] if recommended_actions else None,
        is_flagged_for_family=should_alert,
        evidence_items=legacy_evidence
    )


def analyze_url(url: str) -> AnalysisResult:
    """
    Analyze a URL for suspicious patterns without visiting it.
    Examines hostname, TLD, subdomain structure, and known indicators.
    """
    incident_id = f"SA-{uuid.uuid4().hex[:12].upper()}"
    signals: List[DetectedSignal] = []
    raw_score = 0

    lower_url = url.lower().strip()
    if not lower_url:
        return _empty_result(incident_id, InputType.URL)

    # Extract hostname
    hostname = lower_url
    for prefix in ["https://", "http://", "www."]:
        if hostname.startswith(prefix):
            hostname = hostname[len(prefix):]
    hostname = hostname.split("/")[0].split("?")[0]

    # Check against suspicious URL indicators
    for pattern, signal_type, reason in SUSPICIOUS_URL_INDICATORS:
        match = re.search(pattern, lower_url, re.IGNORECASE)
        if match:
            raw_score += 25
            signals.append(DetectedSignal(
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=match.group(0),
                weight=25
            ))

    # Check for deceptive subdomains (e.g., sbi-kyc.xyz, hdfc-verify.online)
    bank_names = ["sbi", "hdfc", "icici", "axis", "pnb", "kotak", "bob", "canara", "rbi"]
    govt_names = ["aadhaar", "pan", "india-post", "indiapost", "cybercrime", "incometax", "epfo"]
    for name in bank_names + govt_names:
        if name in hostname:
            # Check if it's NOT the official domain
            official_domains = [
                "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com",
                "pnbindia.in", "kotak.com", "aadhaar.gov.in", "indiapost.gov.in",
                "cybercrime.gov.in", "incometax.gov.in", "epfindia.gov.in"
            ]
            if not any(hostname.endswith(od) for od in official_domains):
                raw_score += 30
                signals.append(DetectedSignal(
                    signal_type="IMPERSONATION_DOMAIN",
                    severity="HIGH",
                    reason=f"Domain contains '{name}' but is not the official domain. Likely an impersonation site.",
                    excerpt=hostname,
                    weight=30
                ))
                break

    # Check for excessive subdomain depth (e.g., login.secure.bank.verify.xyz)
    subdomain_count = hostname.count(".")
    if subdomain_count >= 3:
        raw_score += 15
        signals.append(DetectedSignal(
            signal_type="EXCESSIVE_SUBDOMAINS",
            severity="MEDIUM",
            reason="Unusually deep subdomain structure, often used to hide actual domain identity",
            excerpt=hostname,
            weight=15
        ))

    # Check for IP-based URL
    if re.match(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", hostname):
        raw_score += 20
        signals.append(DetectedSignal(
            signal_type="IP_BASED_URL",
            severity="HIGH",
            reason="URL uses raw IP address instead of domain name—legitimate services use domain names",
            excerpt=hostname,
            weight=20
        ))

    # Check for known safe domains as counter-signal
    safe_domains = [
        "google.com", "amazon.in", "flipkart.com", "paytm.com",
        "phonepe.com", "npci.org.in", "rbi.org.in", "gov.in"
    ]
    if any(hostname.endswith(sd) for sd in safe_domains):
        raw_score = max(raw_score - 30, 0)
        signals.append(DetectedSignal(
            signal_type="KNOWN_SAFE_DOMAIN",
            severity="LOW",
            reason="Domain belongs to a well-known legitimate service",
            excerpt=hostname,
            weight=-30
        ))

    final_score = min(max(raw_score, 0), 99)
    risk_level, severity, confidence, should_alert = _classify_risk(final_score, len(signals))

    if final_score >= 50:
        verdict = "Suspicious URL - Possible Phishing or Scam Site"
        summary = f"This URL shows {len([s for s in signals if s.weight > 0])} suspicious characteristics (score: {final_score}/100). Do not visit or enter any information on this site."
    elif final_score >= 20:
        verdict = "URL Requires Verification"
        summary = f"Some suspicious indicators found (score: {final_score}/100). Verify the URL through official channels before visiting."
    else:
        verdict = "URL Appears Standard"
        summary = f"No significant suspicious indicators detected (score: {final_score}/100). Standard web safety practices apply."

    legacy_evidence = [
        {"factor_type": s.signal_type, "severity": s.severity, "description": s.reason, "matched_text": s.excerpt or ""}
        for s in signals if s.weight > 0
    ]
    supporting_evidence = [
        f"{s.signal_type}: {s.reason}" + (f" (found: '{s.excerpt}')" if s.excerpt else "")
        for s in signals if s.weight > 0
    ]

    return AnalysisResult(
        incident_id=incident_id,
        input_type=InputType.URL,
        risk_level=risk_level,
        risk_score=final_score,
        confidence_label=confidence,
        verdict=verdict,
        plain_language_summary=summary,
        detected_signals=signals,
        supporting_evidence=supporting_evidence,
        recommended_actions=[
            "Do not enter any login credentials or personal information",
            "Verify the URL by navigating directly to the official website",
            "Report suspicious URLs at cybercrime.gov.in"
        ] if final_score >= 30 else ["Standard web safety practices apply"],
        verification_steps=[
            f"Navigate directly to the official website instead of clicking links",
            "Check if the domain matches the official domain of the claimed organization",
            "Look for HTTPS and valid SSL certificates"
        ],
        should_alert_family=should_alert,
        ai_provider="none",
        analysis_mode=AnalysisMode.RULE_BASED,
        classification=verdict,
        severity=severity,
        summary=summary,
        advice="Do not click or visit this URL without verifying its authenticity." if final_score >= 30 else "No significant suspicious indicators found.",
        suggested_action="Block and report this URL" if final_score >= 50 else None,
        is_flagged_for_family=should_alert,
        evidence_items=legacy_evidence
    )


# ── Helper Functions ─────────────────────────────────────────────────────────

def _classify_risk(
    score: int, signal_count: int
) -> Tuple[RiskLevel, str, ConfidenceLabel, bool]:
    """Map score to risk level, legacy severity, confidence, and family alert flag."""
    if score >= 70:
        return RiskLevel.CRITICAL, "HIGH_RISK", ConfidenceLabel.HIGH, True
    elif score >= 50:
        return RiskLevel.HIGH, "HIGH_RISK", ConfidenceLabel.MEDIUM, True
    elif score >= 35:
        return RiskLevel.MEDIUM, "CAUTION", ConfidenceLabel.MEDIUM, False
    elif score >= 10:
        return RiskLevel.LOW, "SAFE", ConfidenceLabel.LOW, False
    else:
        return RiskLevel.LOW, "SAFE", ConfidenceLabel.LOW, False


def _determine_verdict(
    signals: List[DetectedSignal], score: int, patterns: dict
) -> str:
    """Determine the primary verdict based on the strongest signal."""
    positive_signals = [s for s in signals if s.weight > 0]
    if not positive_signals:
        if score <= 10:
            return "Likely Legitimate Communication"
        return "Unclassified Communication"

    # Find the strongest signal
    strongest = max(positive_signals, key=lambda s: s.weight)
    # Try to map back to a pattern title
    for cat_key, cat_data in patterns.items():
        if strongest.signal_type in cat_data.get("tactics", []):
            return cat_data["title"]

    return strongest.reason.split("indicators of ")[-1] if "indicators of" in strongest.reason else "Suspicious Communication"


def _empty_result(incident_id: str, input_type: InputType) -> AnalysisResult:
    """Return a safe empty result for invalid or empty input."""
    return AnalysisResult(
        incident_id=incident_id,
        input_type=input_type,
        risk_level=RiskLevel.LOW,
        risk_score=0,
        confidence_label=ConfidenceLabel.LOW,
        verdict="Insufficient Input",
        plain_language_summary="The provided input was empty or too short to analyze meaningfully.",
        detected_signals=[],
        supporting_evidence=[],
        recommended_actions=["Please provide more text for analysis."],
        verification_steps=[],
        should_alert_family=False,
        ai_provider="none",
        analysis_mode=AnalysisMode.RULE_BASED,
        classification="Insufficient Input",
        severity="SAFE",
        summary="Input too short for meaningful analysis.",
        advice="Please provide a longer text for analysis.",
        suggested_action=None,
        is_flagged_for_family=False,
        evidence_items=[]
    )
