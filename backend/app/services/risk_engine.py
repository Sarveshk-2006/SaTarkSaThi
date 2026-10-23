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
from backend.app.services.risk_policy import RiskPolicy, PolicyTier
from backend.app.services.text_utils import (
    normalize_text, token_distance_pattern, normalize_with_mapping,
    extract_original_excerpt, is_prohibition_context, detect_script
)

logger = logging.getLogger(__name__)


# ── Signal Category Definitions ──────────────────────────────────────────────

SCAM_PATTERNS: Dict[str, Dict[str, Any]] = {
    "DIGITAL_ARREST": {
        "title": "Digital Arrest / Law Enforcement Impersonation",
        "reason_code": "SIG_DIGITAL_ARREST",
        "regex": [
            r"\b(cbi|crime branch|cyber cell|mumbai police|delhi police|ed|enforcement directorate|customs\s+(?:officer|official|dept|department|authority|clearance|seizure|interception)|narcotics|ncb)\b",
            r"\b(arrest warrant|digital arrest|video call interrogation|money laundering|drugs found|passport seized|mdma|non[- ]?bailable)\b",
            r"\b(rbi clearance|national security|supreme court order|confidential verification)\b",
            r"\b(skype|video call|zoom call)\b.{0,60}\b(interrogation|verification|arrest|court)\b",
            r"\b(police station|police is threatening|register fir|police custody|arrest me|in custody|bail money|inspector|advocate)\b",
            r"\b(police verification notice|passport renewal.{0,30}suspended|case registered under section 420|settle verification report)\b",
            r"(?i)(सीबीआई|साइबर\s*सेल|क्राइम\s*ब्रांच|मुंबई\s*पुलिस|दिल्ली\s*पुलिस|ईडी|प्रवर्तन\s*निदेशालय|कस्टम्स|नारकोटिक्स|एनसीबी)",
            r"(?i)(डिजिटल\s*अरेस्ट|गिरफ्तारी\s*वारंट|गैर[- ]?जमानती|मनी\s*लॉन्ड्रिंग|ड्रग्स\s*मिले|पार्सल\s*जब्त|पासपोर्ट\s*जब्त)",
            r"(?i)(स्काइप|वीडियो\s*कॉल|कमरे\s*में\s*बंद|किसी\s*को\s*मत\s*बताना|गोपनीय\s*जांच|कैमरा\s*बंद\s*मत\s*करना)",
            r"(?i)(सत्यापन\s*खाता|क्लियरेंस\s*डिपॉजिट|सुरक्षा\s*राशि|आरबीआई\s*क्लियरेंस|पैसे\s*ट्रांसफर)",
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
        "reason_code": "SIG_UTILITY_DISCONNECT",
        "regex": [
            r"\b(electr[i]?c[i]?ty|bijl[ie]{1,2}|power)\b.{0,60}\b(discon[n]?e?ct|cut off|bill not update|bill updted|bill update|kat jayegi|tonite|tonight|immediately)\b",
            r"\b(contact|call)\s+(?:electr[i]?c[i]?ty\s+|power\s+)?of[f]?icer\b.{0,40}\b\d{10}\b",
            r"\b(contact officer|call immediately|call electricity officer)\b.{0,40}\b\d{10}\b",
            r"\b(bses|tata power|mahavitaran|uppcl|dhbvn|tneb|bescom|bseb)\b.{0,60}\b(disconnect|disconct|officer|oficer|call)\b",
            r"\b(smart meter|consumer meter)\b(?:\s+[^\s]+){0,20}?\s+\b(negative\s+₹?\s*[\d,]+|recharge\s+your|midnight\s+trip|trip\s+to\s+avoid)\b",
            r"\b(automatic midnight trip|midnight trip|late surcharge\s+₹?\s*[\d,]+\s+applicable)\b",
            r"(?i)(बिजली|विद्युत|पावर\s*कनेक्शन).{0,60}(काट\s*दी\s*जाएगी|कट\s*जाएगा|कट\s*जाएगी|काट\s*दिया\s*जाएगा|बंद\s*कर\s*दिया|बिल\s*अपडेट\s*नहीं|तुरंत\s*भुगतान|आज\s*रात)",
            r"(?i)(बिजली\s*अधिकारी|अधिकारी\s*से\s*संपर्क|तुरंत\s*कॉल\s*करें).{0,40}\b\d{10}\b",
            r"(?i)(स्मार्ट\s*मीटर|कनेक्शन\s*काटने\s*का\s*नोटिस)",
        ],
        "weight": 45,
        "tactics": ["ARTIFICIAL_URGENCY", "AUTHORITY_IMPERSONATION"],
        "advice": "Utility providers never send disconnection threats from personal mobile numbers or demand immediate phone calls. Check your service directly on the official portal.",
        "verification": [
            "Log in to your state electricity board portal to check actual status",
            "Call the official customer care number printed on your physical bill",
            "Official disconnection notices are never served via abrupt WhatsApp/SMS"
        ]
    },
    "BANK_KYC_EXPIRY": {
        "title": "Bank / EPFO KYC Deactivation Phishing",
        "reason_code": "SIG_KYC_PHISHING",
        "regex": [
            r"\b(sbi|hdfc|icici|axis|pnb|bob|kotak|canara|union bank)\b.{0,60}\b(kyc|pan|deactivated|blocked|suspended|hold)\b",
            r"\b(yono|netbanking|card block|account block)\b.{0,60}\b(update|verify|click|immediately)\b",
            r"\b(aadhaar card link|pan card link|submit kyc details|share otp to (?:update|unblock|verify))\b",
            r"\b(epfo|epf|uan|provident fund|income tax|gst portal)\b.{0,60}\b(kyc|blocked|deactivated|suspended|freeze|update)\b",
            r"\b(reward points?|bonus points?)\b.{0,40}\b(expiring|redeem|convert to cash|claim now)\b",
            r"\b(enter (?:your )?(?:netbanking|login credentials?))\b",
            r"(?i)(एसबीआई|एचडीएफसी|आईसीआईसीआई|पीएनबी|बैंक\s*खाता|नेटबैंकिंग).{0,60}(केवाईसी|पैन|आधार|ब्लॉक|निलंबित|बंद|सस्पेंड)",
            r"(?i)(ओटीपी\s*शेयर|ओटीपी\s*बताएं|केवाईसी\s*अपडेट\s*लिंक|खाता\s*चालू\s*रखने)",
            r"(?i)(रिवॉर्ड\s*पॉइंट|कैशबैक\s*रिडीम|बोनस\s*पॉइंट).{0,40}(समाप्त|क्लेम|प्राप्त\s*करें)",
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
        "reason_code": "SIG_TASK_PREPAID_FRAUD",
        "regex": [
            r"\b(part[- ]?time job|work from home|daily income|earn\s*₹?\s*[\d,]+|earn\s+[\d,]{3,6}\s*daily)\b",
            r"\b(like youtube videos|google reviews|hotel rating|rating \d+ luxury hotels?|pre[- ]?paid task|telegram group|telegram channel)\b",
            r"\b(recharge balance|crypto investment|high return|instant payout|welcome bonus|trial bonus to your upi|withdraw total profit)\b",
            r"\b(no interview|simple task|data entry work|freelance.{0,30}(?:translation|typing|data entry))\b.{0,60}\b(₹|rs\.?|inr|slot)\b",
            r"\b(refundable security deposit|security deposit.{0,25}refundable|merchant task level|recharge working account)\b",
            r"\b(resume on naukri|global staffing|hr manager)\b(?:\s+[^\s]+){0,25}?\s+\b(@[\w_]+|t\.me/[\w_]+|bit\.ly/[\w_-]+|tinyurl\.com/[\w_-]+)\b",
            r"(?i)(घर\s*बैठे\s*कमाएं|पार्ट[- ]?टाइम\s*जॉब|प्रतिदिन\s*कमाएं|रोजाना\s*कमाएं|दैनिक\s*आय)",
            r"(?i)(यूट्यूब\s*लाइक|टेलीग्राम\s*टास्क|होटल\s*रेटिंग|रिव्यू\s*करें|टास्क\s*पूरा)",
            r"(?i)(सुरक्षा\s*डिपॉजिट|रिचार्ज\s*करें|क्रिप्टो\s*निवेश|तुरंत\s*भुगतान|मुनाफा)",
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
        "reason_code": "SIG_REMOTE_DEVICE_TAKEOVER",
        "regex": [
            r"\b(anydesk|teamviewer|quicksupport|rustdesk|screen share|airdroid)\b",
            r"\b(install this app|download apk|support tool|verification app)\b",
            r"(?i)(एनीडेस्क|टीमव्यूअर|क्विकसपोर्ट|रस्टडेस्क|स्क्रीन\s*शेयर|स्क्रीन\s*साझा)",
            r"(?i)(यह\s*ऐप\s*इंस्टॉल\s*करें|एपीके\s*डाउनलोड|सपोर्ट\s*टूल|वेरिफिकेशन\s*ऐप)",
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
        "reason_code": "SIG_UPI_PIN_DECEPTION",
        "regex": [
            r"\b(scan qr to receive|enter upi pin to get|scan and accept payment|upi collect request)\b",
            r"\b(army officer|olx buyer|advance token|cashback reward)\b.{0,60}\b(scan|qr|upi pin)\b",
            r"(?i)(यूपीआई\s*पिन|पैसे\s*पाने\s*के\s*लिए\s*पिन|क्यूआर\s*कोड\s*स्कैन|रिफंड\s*प्राप्त\s*करने\s*के\s*लिए\s*पिन)",
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
        "reason_code": "SIG_COURIER_EXTORTION",
        "regex": [
            r"\b(india post|speed post|fedex|dhl|bluedart)\b.{0,80}\b(address incomplete|package detained|delivery failed|cannot be delivered|pay ₹\d+|reschedule delivery|update address link|update your address|incomplete street address)\b",
            r"\b(redelivery fee|customs clearance|update address link|customs duty clearance)\b",
            r"\b(customs officer|customs clearance fee|seize the package)\b",
            r"\b(diplomatic cargo|diplomatic consignee|consignee trunk|parcel sent from united kingdom)\b",
            r"\b(indira gandhi international airport cargo|airport cargo terminal|customs diplomatic clearance)\b",
            r"\b(anti[- ]?money laundering clearance fee|aml clearance fee|diplomatic clearance certificate|rbi clearing escrow)\b",
            r"\b(videshi parcel|airport par rok|jail se bachne ke liye|clearance fee ₹?\s*[\d,]+)\b",
            r"\b(customs commissioner|undeclared foreign currency|penalty clearance|port courier|consignment held|foreign parcel)\b",
            r"\b(indiapost|speedpost|indiapost-tracking)[-\w]*\.(?:top|xyz|site|online|live|club|link)\b",
        ],
        "weight": 45,
        "tactics": ["ARTIFICIAL_URGENCY", "SUSPICIOUS_LINK", "AUTHORITY_IMPERSONATION"],
        "advice": "Courier services and customs agencies do not hold diplomatic parcels and demand 'AML fees' or delivery fees via SMS/links. Check parcel tracking directly on official courier portals.",
        "verification": [
            "Track your parcel on indiapost.gov.in using the official consignment number",
            "Call the official courier customer care number",
            "Customs duties are never deposited into individual or clearing escrow accounts"
        ]
    },
    "LOTTERY_KBC": {
        "title": "Lottery / KBC / Prize Winner Scam",
        "reason_code": "SIG_LOTTERY_PRIZE_SCAM",
        "regex": [
            r"\b(kaun banega crorepati|kbc lottery|congratulations you won|lucky draw|25 lakh|car winner)\b",
            r"\b(dear customer won|whatsapp lottery|contact manager|registration fee|processing charges)\b",
            r"\b(prize money cheque|gst filing charge|gst charge|manager rana pratap)\b",
            r"\b(scratch card winner|won .{0,25}(?:car|suv|safari|tatapromo)|festive promo)\b",
            r"(?i)(लॉटरी|इनाम|लकी\s*ड्रॉ|विजेता|बधाई|केबीसी\s*लॉटरी).{0,60}(जीता|जीती|लाख|करोड़)",
            r"(?i)(दावा\s*करने|प्रोसेसिंग\s*फीस|पंजीकरण\s*शुल्क|टैक्स\s*जमा)",
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
        "reason_code": "SIG_INVESTMENT_UNREALISTIC",
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
        "reason_code": "SIG_PREDATORY_LOAN_EXTORTION",
        "regex": [
            r"\b(loan overdue|fastcash|loanease|loan account|loan app|recovery agents?)\b.{0,80}\b(morphed photos?|contacts? list|relatives|pan|aadhaar|photo gallery)\b",
            r"\b(pay\s*₹?\s*[\d,]+\s+in\s+\d+\s+minutes?|blackmail|send your details to all|send morphed photos)\b",
            r"\b(installment|loan|borrower|emergency loan)\b.{0,80}\b(phone book|contacts?|photos?|banner|social media|shaming|legal consequences)\b",
            r"(?i)(लोन\s*बकाया|तुरंत\s*लोन|मॉर्फ\s*फोटो|कांटेक्ट\s*लिस्ट|बदनाम\s*करेंगे|रिश्तेदारों\s*को\s*भेज)",
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
        "reason_code": "SIG_FAMILY_EMERGENCY_IMPERSONATION",
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
        "reason_code": "SIG_CREDENTIAL_THEFT_OTP",
        "regex": [
            r"\b(share.{0,10}otp|send.{0,10}otp|tell.{0,10}otp|give.{0,10}otp|provide.{0,10}otp|read.{0,10}otp)\b(?!.{0,35}\bdelivery\s+(?:partner|executive|agent|rider|person|associate|boy)\b)",
            r"\b(share|send|tell|give|provide)\b(?!.{0,15}delivery).{0,10}\b(upi\s+pin|atm\s+pin|bank\s+pin|mpin|password|cvv)\b",
            r"\b(share|send|tell|give|provide)\b(?!.{0,15}delivery).{0,10}\bpin\b",
            r"\b(share.{0,10}password|send.{0,10}password|tell.{0,10}password)\b",
            r"\b(otp|password|cvv)\b.{0,40}\b(verify|confirm|update|process|complete|block|transaction|compromised)\b",
            r"\b(tell me the\s+\w+\s*otp|6-digit otp|share the otp|read the otp)\b",
        ],
        "weight": 45,
        "tactics": ["CREDENTIAL_THEFT", "SOCIAL_ENGINEERING"],
        "advice": "NEVER share OTP, PIN, CVV, or password with anyone over phone, SMS, or message. Banks, payment apps, and government agencies will NEVER ask for these.",
        "verification": [
            "Banks explicitly state they never ask for OTP/PIN/CVV",
            "If someone asks for your OTP, they are attempting fraud",
            "Change your passwords immediately if you have shared them"
        ]
    },
    "SAFE_ACCOUNT_DECEPTION": {
        "title": "Coercive Safe Account / Escrow Deposit Scam",
        "reason_code": "SIG_SAFE_ACCOUNT_DECEPTION",
        "regex": [
            r"\b(safe\s+account|clearance\s+account|rbi\s+verification\s+account|govt\s+safety\s+account|secret\s+account|escrow\s+wallet)\b",
            r"\b(transfer\s+(?:all\s+)?funds?\s+to\s+(?:safety|verify|clearance|rbi))\b"
        ],
        "weight": 40,
        "tactics": ["FINANCIAL_PRESSURE", "DECEPTION", "AUTHORITY_IMPERSONATION"],
        "advice": "RBI and government agencies DO NOT maintain 'safe accounts' or 'clearance accounts' for citizens to deposit money during investigations. Any request to move money to a 'safe account' is 100% fraudulent.",
        "verification": [
            "RBI explicitly warns that it never opens accounts for individuals to deposit funds",
            "Never move personal funds to an unverified third-party account under claim of safety",
            "Consult your bank branch manager immediately"
        ]
    },
    "EXECUTIVE_GIFT_CARD_FRAUD": {
        "title": "Corporate Executive Impersonation / Gift Card Fraud",
        "reason_code": "SIG_EXECUTIVE_GIFT_CARD",
        "regex": [
            r"\b(purchase|buy|get)\s+(?:₹?\s*[\d,]+\s+)?(?:apple|amazon|google\s*play|steam|steam\s+wallet|vanilla|itunes|gift)\s*(?:gift\s*)?(?:cards?|vouchers?)\b",
            r"\b(ceo|coo|cfo|managing director|board of directors|executive director|founder)\b(?:\s+[^\s]+){0,25}?\s+\b(?:apple|amazon|google\s*play|steam|vanilla|itunes|gift)\s*(?:gift\s*)?(?:cards?|vouchers?)\b",
            r"\b(?:cards?|vouchers?)\b(?:\s+[^\s]+){0,20}?\s+\b(claim\s+codes?|card\s+numbers?|email\s+(?:the\s+)?codes?|scratch\s+codes?|send\s+(?:the\s+)?codes?|photo of backside|backside scratch code)\b",
            r"\b(urgent executive (?:board )?meeting|confidential task|in a meeting and can'?t take calls?)\b(?:\s+[^\s]+){0,25}?\s+\b(?:gift\s*cards?|amazon|apple)\b"
        ],
        "weight": 45,
        "tactics": ["AUTHORITY_IMPERSONATION", "FINANCIAL_PRESSURE", "SECRECY_AND_ISOLATION"],
        "advice": "Executives never instruct employees to purchase gift cards or send claim codes via message. This is a classic CEO fraud / gift card scam. Contact your executive in person before spending any money.",
        "verification": [
            "Verify the sender's actual email address, not just the display name",
            "Call your manager or executive on their verified internal office phone",
            "Company policy strictly forbids reimbursing personal funds for gift cards"
        ]
    },
    "MONEY_MULE_TRANSFER": {
        "title": "Money Mule / Transit Account Deception",
        "reason_code": "SIG_MONEY_MULE_TRANSFER",
        "regex": [
            r"\b(keep\s+₹?\s*[\d,]+|\d+%\s+commission|keep\s+(?:some|₹?[\d,]+)\s+for\s+your\s+(?:help|trouble))\b(?:\s+[^\s]+){0,25}?\s+\b(transfer|forward|send)\s+(?:₹?\s*[\d,]+|the\s+rest|remaining)\b",
            r"\b(upi\s+limit|daily\s+(?:upi\s+)?limit|bank\s+limit)\b(?:\s+[^\s]+){0,20}?\s+\b(send\s+(?:the\s+)?money\s+to\s+your|google\s*pay|gpay|phonepe|paytm)\b",
            r"\b(receive\s+₹?\s*[\d,]+\s+from\s+my\s+client|receive\s+money\s+for\s+me)\b(?:\s+[^\s]+){0,25}?\s+\b(transfer\s+₹?\s*[\d,]+\s+to|cash\s+agent)\b"
        ],
        "weight": 40,
        "tactics": ["FINANCIAL_PRESSURE", "DECEPTION", "MONEY_LAUNDERING_EXPLOITATION"],
        "advice": "Allowing unknown funds to route through your personal account makes you an accomplice in money laundering under PMLA. Your bank account will be frozen by police. Never receive and forward funds.",
        "verification": [
            "Do not allow third parties to route client funds through your personal UPI",
            "Receiving money from fraud victims makes your account subject to nationwide police lien",
            "Report money mule solicitations immediately to cybercrime.gov.in"
        ]
    },
    "UPI_COLLECT_PIN_TRAP": {
        "title": "UPI PIN Collect Request / Reverse Charge Fraud",
        "reason_code": "SIG_UPI_COLLECT_PIN_TRAP",
        "regex": [
            r"\b(enter\s+(?:your\s+)?(?:upi\s+)?pin\s+to\s+(?:approve|accept|receive|credit|get))\b",
            r"\b(collect\s+request\s+(?:of\s+₹?\s*[\d,]+)?\b(?:\s+[^\s]+){0,20}?\s+\b(?:approve|accept|credit|receive|upi\s+pin))\b",
            r"\b(olx|quikr|facebook marketplace|buyer)\b(?:\s+[^\s]+){0,25}?\s+\b(?:enter\s+(?:your\s+)?upi\s+pin|collect\s+request|accept\s+the\s+₹?\s*[\d,]+\s+credit)\b"
        ],
        "weight": 45,
        "tactics": ["FINANCIAL_PRESSURE", "DECEPTION", "CREDENTIAL_THEFT"],
        "advice": "CRITICAL: UPI PIN is entered ONLY to SEND money. You NEVER need to enter your UPI PIN or accept a collect request to RECEIVE money. Entering your PIN always deducts money.",
        "verification": [
            "Never enter your UPI PIN on collect requests to receive payments",
            "Sellers do not need to approve incoming credits with PINs",
            "Decline all collect requests from buyers immediately"
        ]
    },
    "CREDIT_SCORE_REPAIR_FRAUD": {
        "title": "Credit Score Repair / CIBIL Alteration Advance Fee",
        "reason_code": "SIG_CREDIT_SCORE_REPAIR_FRAUD",
        "regex": [
            r"(?:cibil|experian|equifax|credit score|cibil score)(?:\W+\w+){0,25}?\W+(?:remove\s+defaulted|boost\s+your\s+score|score\s+to\s+\d{3}\+|clear\s+defaults?|delete\s+default|fix\s+bad\s+credit|restoration)",
            r"(?:score\s+is\s+(?:currently\s+)?(?:poor|low)|\d{3}\s+to\s+\d{3}\+)(?:\W+\w+){0,20}?\W+(?:within\s+(?:24|48)\s+hours?\s+guaranteed|guaranteed\s+(?:clearance|boost|7\d{2}\+))",
            r"(?:cibil|credit|score|bureau|report|cibil\s+repair)(?:\W+\w+){0,25}?\W+(?:consultancy\s+charge|clearance\s+charge|processing\s+charge|processing\s+fee|file\s+processing|repair\s+fee)(?:\W+\w+){0,20}?\W+(?:payable\s+in\s+advance|advance|upi|paytm|₹\s*[\d,]+|to\s+our\s+advisor)"
        ],
        "weight": 45,
        "tactics": ["FALSE_AUTHORITY", "DECEPTION", "FINANCIAL_PRESSURE"],
        "advice": "Credit bureaus (CIBIL, Experian) and banks explicitly state that no private consultant can alter credit default records. Paying advance fees for credit score repair is an advance-fee scam.",
        "verification": [
            "Credit scores only improve through regular, on-time repayments over time",
            "Dispute incorrect credit report entries directly on cibil.com without paying third parties",
            "CIBIL does not have authorized consultants who alter records for fees"
        ]
    },
    "TELECOM_SIM_DISCONNECTION": {
        "title": "Telecom Department / TRAI SIM Disconnection Scare",
        "reason_code": "SIG_TELECOM_DISCONNECTION",
        "regex": [
            r"(?:department of telecommunications|dot notice|trai order|trai directive|trai|telecom regulatory|telecom nodal)(?:\W+\w+){0,25}?\W+(?:kyc|biometric|document audit|permanently stopped|deactivated|disconnected|suspended|outgoing services)",
            r"(?:outgoing and incoming calls|sim card|mobile connection|mobile number)(?:\W+\w+){0,20}?\W+(?:permanently stopped|disconnected|blocked|suspended)(?:\W+\w+){0,15}?\W+(?:within \d+ hours?|by trai|by dot)",
            r"(?:telecom nodal|verification desk|prevent deactivation)(?:\W+\w+){0,20}?\W+(?:\+?91|0)?[6-9]\d{9}",
            r"\b(airtel|jio|vi|vodafone|bsnl)\b.{0,60}\b(convert.{0,20}sim to esim|esim (?:conversion|upgrade|swap|activation)|5g sim upgrade|sim suspension|biometric e-kyc)\b",
            r"\b(convert your physical sim to esim|esim barcode|cancellation code.{0,20}\d{10}|cancel deactivation of your current sim|sim deactivation within \d+ (?:hours?|minutes?))\b",
            r"\b(sim card|mobile connection|sim upgrade)\b.{0,50}\b(suspended at midnight|deactivation within \d+|suspension at midnight)\b",
        ],
        "weight": 45,
        "tactics": ["AUTHORITY_IMPERSONATION", "FEAR_AND_INTIMIDATION", "ARTIFICIAL_URGENCY"],
        "advice": "TRAI and Department of Telecommunications (DoT) NEVER issue abrupt mobile disconnection notices or ask citizens to call personal numbers for Aadhaar verification.",
        "verification": [
            "Visit your telecom operator's official store (Airtel, Jio, Vodafone Idea) to check KYC status",
            "DoT never issues disconnection orders over phone calls or SMS",
            "Never share Aadhaar details or OTPs with unknown callers claiming to be telecom officers"
        ]
    },
    "DISCIPLINARY_BLACKMAIL_EXTORTION": {
        "title": "Academic / Institutional Disciplinary Blackmail",
        "reason_code": "SIG_DISCIPLINARY_BLACKMAIL",
        "regex": [
            r"(?:examination cell|disciplinary committee|college administration|syndicate meeting)(?:\W+\w+){0,25}?\W+(?:malpractice|unauthorized\s+mobile\s+notes|cheating|rustication|scheduled for rustication)",
            r"(?:expunge\s+(?:this\s+)?file|cancel\s+rustication|settle\s+the\s+matter)(?:\W+\w+){0,20}?\W+(?:transfer|processing\s+fee|₹\s*[\d,]+|upi|axl|paytm)"
        ],
        "weight": 45,
        "tactics": ["BLACKMAIL", "FEAR_AND_INTIMIDATION", "FINANCIAL_PRESSURE"],
        "advice": "Colleges and universities never conduct disciplinary investigations via informal messages or demand UPI payments to expunge malpractice allegations.",
        "verification": [
            "Meet your college principal or exam controller in person on campus",
            "Universities never accept private UPI transfers to cancel disciplinary proceedings",
            "File an extortion report on cybercrime.gov.in"
        ]
    },
    "EMOTIONAL_CHARITY_FRAUD": {
        "title": "Emotional Medical Crowdfunding / Fake Charity Lure",
        "reason_code": "SIG_EMOTIONAL_CHARITY_FRAUD",
        "regex": [
            r"\b(icu|ventilator|liver failure|cancer|severe illness)\b.{0,150}\b(stop treatment|ventilator cost|donate whatever you can|hospital will stop|exhausted all savings)\b",
            r"\b(volunteer personal upi|donation upi|donate to upi)\b.{0,60}\b[a-zA-Z0-9._-]+@[a-zA-Z0-9]+\b",
            r"\b(donate\s+(?:any\s+)?small\s+amount|save this (?:child|angel|baby))\b(?:\s+[^\s]+){0,20}?\s+\b(donation upi|help\.\w+@|milaap portal link)\b"
        ],
        "weight": 35,
        "tactics": ["EMOTIONAL_COERCION", "ARTIFICIAL_URGENCY", "DECEPTION"],
        "advice": "Scammers routinely copy photos of sick children from public crowdfunding campaigns to solicit donations directly into personal UPI wallets.",
        "verification": [
            "Verify medical campaigns directly on verified registered platforms (Ketto, Milaap)",
            "Never donate to personal UPI IDs shared on social media or WhatsApp",
            "Check with the hospital finance desk directly regarding patient admission"
        ]
    },
    "ARMY_QR_RENTAL_FRAUD": {
        "title": "Defence Personnel Impersonation / QR Advance Fraud",
        "reason_code": "SIG_ARMY_QR_RENTAL_FRAUD",
        "regex": [
            r"\b(flat listing|listing on nobroker|nobroker|magicbricks|rental listing|book the flat)\b(?:\s+[^\s]+){0,35}?\s+\b(indian army|defence personnel|army officer|cisf|military officer)\b",
            r"\b(indian army|defence welfare|army officer)\b(?:\s+[^\s]+){0,35}?\s+\b(scan (?:this )?(?:indian army |defence )?(?:welfare )?qr|qr code on your google pay to receive|welfare-portal)\b"
        ],
        "weight": 45,
        "tactics": ["AUTHORITY_IMPERSONATION", "DECEPTION", "FINANCIAL_PRESSURE"],
        "advice": "Scammers pose as Indian Army officers on rental platforms and send a fake 'Defence Welfare QR Code' claiming it is needed to deposit rent, which actually deducts funds.",
        "verification": [
            "You NEVER scan a QR code to RECEIVE rent or payment",
            "Indian Army does not have a 'Defence Welfare QR code' payment portal",
            "Meet tenants in person before accepting advance deposits or booking flats"
        ]
    },
    "FASTAG_TOLL_FRAUD": {
        "title": "FASTag / Highway Toll Blacklist Threat Fraud",
        "reason_code": "SIG_FASTAG_TOLL_FRAUD",
        "regex": [
            r"\b(fastag|toll plaza|nhai|highway toll)\b.{0,60}\b(blacklisted|vehicle impoundment|unpaid toll|penalty|settle immediately|entry will be denied|negative kyc|kyc suspension)\b",
            r"\b(clear pending (?:toll )?dues|fastag account .{0,30} blacklisted|penalty of (?:rs\.?|₹)\s*[\d,]+ assessed on fastag)\b",
            r"\b(fastag)[-\w]*\.(?:top|xyz|site|online|live|club|link)\b",
        ],
        "weight": 45,
        "tactics": ["ARTIFICIAL_URGENCY", "AUTHORITY_IMPERSONATION", "FINANCIAL_PRESSURE"],
        "advice": "NHAI and toll operators do not blacklist FASTags via SMS links with urgent deadlines. Check FASTag balance and vehicle status exclusively on the IHMCL portal or your issuing bank app.",
        "verification": [
            "Check FASTag status directly on ihmcl.co.in or your issuing bank portal",
            "NHAI never sends individual WhatsApp/SMS payment links for toll penalties",
            "Never pay highway toll dues through unofficial third-party links or shorteners"
        ]
    },
    "SOCIETY_MAINTENANCE_FRAUD": {
        "title": "Housing Society / RWA Maintenance & Utility Coercion",
        "reason_code": "SIG_SOCIETY_MAINTENANCE_FRAUD",
        "regex": [
            r"\b(society maintenance|rwa|resident welfare association|sinking fund|society dues?|apartment rwa)\b.{0,60}\b(overdue|water disconnection|elevator access suspension|pending|transfer today|avoid disconnection|clear today|are due|late fee)\b",
            r"\b(society manager|society treasurer|treasurer personal|treasurer|society office|apartment association)\b.{0,40}\b(upi|gpay|paytm|phonepe|transfer|scanner|scan attached qr|scan the attached|qr)\b",
            r"\b(palm grove society|green meadows rwa|apartment association)\b.{0,50}\b(pay rs\.?\s*[\d,]+|transfer today|immediate payment)\b",
        ],
        "weight": 40,
        "tactics": ["ARTIFICIAL_URGENCY", "FINANCIAL_PRESSURE", "DECEPTION"],
        "advice": "Fraudsters impersonate RWA or society managers demanding payments to personal UPI IDs under threat of water or elevator disconnection. Always pay through your society's registered app (MyGate, ADDA, NoBrokerHood) or verified bank account.",
        "verification": [
            "Verify maintenance dues directly on your society app (e.g. MyGate, NoBrokerHood)",
            "Confirm with the RWA office or management committee in person",
            "Never transfer society dues to personal UPI accounts or mobile numbers"
        ]
    },
    "TRAFFIC_ECHALLAN_FRAUD": {
        "title": "Traffic Police / E-Challan Phishing & Malware Scam",
        "reason_code": "SIG_TRAFFIC_ECHALLAN_FRAUD",
        "regex": [
            r"\b(traffic police|e[- ]?challan|motor vehicles act|parivahan e[- ]?challan)\b.{0,60}\b(pending e[- ]?challan|driving license will be seized|court summons apk|overspeeding|fine of (?:rs\.?|₹)\s*[\d,]+|clear challan|pay immediately)\b",
            r"\b(pending e[- ]?challan|download court summons|echallan-parivahan|speed violation recorded)\b",
            r"\b(echallan|challan|parivahan)[-\w]*\.(?:live|top|xyz|site|online|apk)\b",
        ],
        "weight": 45,
        "tactics": ["AUTHORITY_IMPERSONATION", "ARTIFICIAL_URGENCY", "MALICIOUS_LINK_OR_APP"],
        "advice": "Scammers send fake traffic e-challan notices with malicious APK downloads or phishing links. Official traffic challans are checked and paid ONLY on the official Parivahan portal (echallan.parivahan.gov.in).",
        "verification": [
            "Verify genuine e-challans exclusively at echallan.parivahan.gov.in",
            "Never download APK files or apps from SMS links to view or contest traffic fines",
            "Traffic police never demand immediate fine settlement via third-party web links"
        ]
    }
}


# ── Counter-Signals (reduce risk for legitimate patterns) ────────────────────

COUNTER_SIGNAL_PATTERNS = [
    {
        "name": "OFFICIAL_HELPLINE",
        "reason_code": "CTR_OFFICIAL_HELPLINE",
        "regex": r"\b(1800\d{6,8}|1930|112|100|181|155260)\b",
        "weight_reduction": 10,
        "reason": "Message contains official toll-free helpline numbers"
    },
    {
        "name": "STANDARD_DEBIT_NOTIFICATION",
        "reason_code": "CTR_STANDARD_BANK_DEBIT",
        "regex": r"\b(debited|credited|a/c\s*xx\d+|available\s*bal|if not you)\b",
        "weight_reduction": 15,
        "reason": "Follows standard bank transaction notification format"
    },
    {
        "name": "LEGITIMATE_DELIVERY_UPDATE",
        "reason_code": "CTR_ECOMMERCE_DELIVERY",
        "regex": r"\b(out for delivery|successfully delivered|your order|order confirmed|shipment dispatched)\b",
        "weight_reduction": 15,
        "reason": "Follows standard e-commerce delivery notification format"
    },
    {
        "name": "PERSONAL_CONVERSATION",
        "reason_code": "CTR_PERSONAL_GREETING",
        "regex": r"\b(how are you|happy birthday|good morning|take care|miss you|love you|see you|dinner tonight)\b",
        "weight_reduction": 20,
        "reason": "Contains casual personal conversation patterns"
    },
    {
        "name": "IN_PERSON_OFFICIAL_VISIT",
        "reason_code": "CTR_IN_PERSON_OFFICIAL_VISIT",
        "regex": r"\b(visit (?:the )?(?:nearest |local |chanakyapuri )?(?:police station|branch|office|rto|discom|post office)|in person with original|do not pay any fee)\b",
        "weight_reduction": 30,
        "reason": "Directs citizen to visit an official physical office/station in person with explicit instruction not to pay any fee"
    },
    {
        "name": "SECURITY_AWARENESS_ADVISORY",
        "reason_code": "CTR_SECURITY_AWARENESS_ADVISORY",
        "regex": r"\b(security advisory|awareness message|beware of (?:fake|fraud)|stay alert|will never ask for your (?:otp|pin|password|cvv))\b",
        "weight_reduction": 40,
        "reason": "Educational cybersecurity advisory warning citizens against fraud"
    }
]


# ── Suspicious URL / Link patterns ──────────────────────────────────────────

SUSPICIOUS_URL_INDICATORS = [
    (r"(bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|t\.co|t\.me)", "SIG_SUSPICIOUS_LINK_REDIRECT", "URL_SHORTENER", "URL shortener or redirect link used to hide actual destination"),
    (r"\.(xyz|top|live|club|icu|online|buzz|monster|rest|support|click|link)\b", "SIG_SUSPICIOUS_TLD", "SUSPICIOUS_TLD", "Uncommon top-level domain often associated with throwaway scam sites"),
    (r"(secure-banking|kyc-update|account-verify|login-verify|aadhaar-update|pan-verify)", "SIG_DECEPTIVE_SUBDOMAIN", "DECEPTIVE_SUBDOMAIN", "Misleading subdomain designed to appear as official banking/government site"),
    (r"(ngrok\.io|serveo\.net|loca\.lt|localhost\.run)", "SIG_TUNNEL_SERVICE", "TUNNEL_SERVICE", "Temporary tunnel service—legitimate services don't use these for customer-facing URLs"),
    (r"(\.apk\b|install.{0,30}\.apk|pm-kisan-update\.apk)", "SIG_APK_DOWNLOAD", "APK_DOWNLOAD", "Direct APK download or installation link—official apps are distributed through Play Store"),
]

URGENCY_PATTERNS = [
    (r"\b(immediately|within\s+\d+\s+(minutes?|hours?|mins?)|urgent|hurry|today itself|last chance|warning|immediate action|right now|act fast)\b", "SIG_ARTIFICIAL_URGENCY", "ARTIFICIAL_URGENCY", "Urgency language designed to prevent careful verification"),
    (r"\b(turant|jaldi|aaj hi|band ho jayega|abhi|foran)\b", "SIG_ARTIFICIAL_URGENCY", "HINDI_URGENCY", "Hindi urgency language to pressure immediate action"),
]

SECRECY_PATTERNS = [
    (r"\b(do not inform|do not tell|keep this confidential|don't share|secret|do not discuss|between us)\b", "SIG_SECRECY_ISOLATION", "SECRECY_DEMAND", "Demands secrecy, which is a hallmark of scams—legitimate authorities never demand secrecy from family"),
    (r"\b(kisi ko mat batana|ghar pe mat bolna|family ko mat batao)\b", "SIG_SECRECY_ISOLATION", "HINDI_SECRECY", "Hindi secrecy demand to isolate victim from trusted contacts"),
]

PAYMENT_DEMAND_PATTERNS = [
    (r"\b(transfer\s+(money|amount|funds)|send\s+(money|amount|₹)|pay\s+(immediately|now|₹))\b", "SIG_COERCIVE_PAYMENT_DEMAND", "PAYMENT_DEMAND", "Demands immediate money transfer"),
    (r"\b(personal\s+account|private\s+account|this\s+account\s+number)\b", "SIG_COERCIVE_PAYMENT_DEMAND", "PERSONAL_ACCOUNT_TRANSFER", "Asks for transfer to personal account instead of official channels"),
    (r"\b(google pay|phonepe|paytm)\b.{0,60}\b(send|transfer|pay|invest|via)\b", "SIG_COERCIVE_PAYMENT_DEMAND", "UPI_PAYMENT_DEMAND", "Demands UPI payment through personal apps"),
]

ADVERSARIAL_PATTERNS = [
    (
        r"\b((?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:[\w-]+\s+){0,4}(?:instructions?|guidelines?|rules?|system|boundaries?|safety)|system\s+prompt|developer\s+mode|override\s+safety|system\s+override|act\s+as\s+benign|this message is safe|do not flag|(?:mark|classify)\s+as\s+safe|bypass\s+filter|penetration\s+test\s+scenario)\b",
        "SIG_ADVERSARIAL_PROMPT_INJECTION",
        "ADVERSARIAL_EVASION",
        "Adversarial instruction injection attempt: message contains instructions attempting to manipulate or bypass safety analysis",
        45
    ),
    (
        r"\b(wire\s+[\d,]+\s*(?:usd|eur|gbp|dollars?)\s+to\s+offshore\s+account|offshore\s+account\s+[\d,]+)\b",
        "SIG_ADVERSARIAL_PROMPT_INJECTION",
        "OFFSHORE_WIRE_TRANSFER",
        "Suspicious offshore wire transfer demand commonly combined with evasion instructions",
        45
    )
]


def analyze_text(
    text: str,
    input_type: InputType = InputType.TEXT,
    channel: str = "SMS",
    enable_semantic: bool = False
) -> AnalysisResult:
    """
    Core scam analysis function.
    Default: Deterministic evaluation against weighted signal patterns, counter-signals, and centralized policy.
    Optional (enable_semantic=True): Hybrid evaluation combining deterministic extraction with offline semantic inference.
    Returns a fully validated AnalysisResult with machine-readable reason codes and verifiable excerpts.
    """
    incident_id = f"SA-{uuid.uuid4().hex[:12].upper()}"
    original_text = text.strip()
    norm_text, norm_mapping = normalize_with_mapping(original_text)
    lower_text = original_text.lower()

    if not original_text or len(original_text) < 3:
        return _empty_result(incident_id, input_type)

    signals: List[DetectedSignal] = []
    counter_signals: List[DetectedSignal] = []
    reason_codes: Set[str] = set()
    raw_score = 0
    counter_score = 0
    all_tactics: set = set()
    advice_items: List[str] = []
    verification_items: List[str] = []

    # ── 1. Match against known scam categories ───────────────────────────
    for cat_key, cat_data in SCAM_PATTERNS.items():
        matched_fragments = []
        for pattern in cat_data["regex"]:
            found_orig = False
            for match in re.finditer(pattern, original_text, re.IGNORECASE):
                if cat_key == "OTP_THEFT" and is_prohibition_context(original_text, match.start()):
                    continue
                matched_fragments.append(match.group(0))
                found_orig = True
                break
            if not found_orig:
                for match_norm in re.finditer(pattern, norm_text, re.IGNORECASE):
                    if cat_key == "OTP_THEFT" and is_prohibition_context(norm_text, match_norm.start()):
                        continue
                    orig_slice = extract_original_excerpt(
                        original_text, norm_mapping, match_norm.start(), match_norm.end()
                    )
                    if orig_slice:
                        matched_fragments.append(orig_slice)
                        break

        if matched_fragments:
            weight = cat_data["weight"]
            multi_match_bonus = min((len(matched_fragments) - 1) * 8, 20)
            total_weight = weight + multi_match_bonus
            raw_score += total_weight
            reason_code = cat_data.get("reason_code", f"SIG_{cat_key}")
            reason_codes.add(reason_code)

            for tactic in cat_data["tactics"]:
                all_tactics.add(tactic)

            signals.append(DetectedSignal(
                reason_code=reason_code,
                signal_type=cat_data["tactics"][0],
                severity="HIGH" if weight >= 30 else "MEDIUM",
                reason=f"Detected indicators of {cat_data['title']}",
                excerpt=matched_fragments[0] if matched_fragments else None,
                weight=total_weight,
                category=cat_data["title"]
            ))
            advice_items.append(cat_data["advice"])
            verification_items.extend(cat_data.get("verification", []))

    # ── 2. Check suspicious URL indicators ───────────────────────────────
    for pattern, r_code, signal_type, reason in SUSPICIOUS_URL_INDICATORS:
        match = re.search(pattern, original_text, re.IGNORECASE)
        excerpt = match.group(0) if match else None
        if not match:
            match_norm = re.search(pattern, norm_text, re.IGNORECASE)
            if match_norm:
                excerpt = extract_original_excerpt(
                    original_text, norm_mapping, match_norm.start(), match_norm.end()
                )
        if excerpt:
            url_weight = 35 if r_code == "SIG_APK_DOWNLOAD" else 20
            raw_score += url_weight
            all_tactics.add("SUSPICIOUS_LINK")
            reason_codes.add(r_code)
            signals.append(DetectedSignal(
                reason_code=r_code,
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=excerpt,
                weight=url_weight,
                category="Suspicious Phishing Link"
            ))
            break  # One URL signal is enough

    # ── 3. Check urgency patterns ────────────────────────────────────────
    for pattern, r_code, signal_type, reason in URGENCY_PATTERNS:
        match = re.search(pattern, original_text, re.IGNORECASE)
        excerpt = match.group(0) if match else None
        if not match:
            match_norm = re.search(pattern, norm_text, re.IGNORECASE)
            if match_norm:
                excerpt = extract_original_excerpt(
                    original_text, norm_mapping, match_norm.start(), match_norm.end()
                )
        if excerpt:
            raw_score += 12
            all_tactics.add("ARTIFICIAL_URGENCY")
            reason_codes.add(r_code)
            signals.append(DetectedSignal(
                reason_code=r_code,
                signal_type=signal_type,
                severity="MEDIUM",
                reason=reason,
                excerpt=excerpt,
                weight=12
            ))
            break

    # ── 4. Check secrecy demands ─────────────────────────────────────────
    for pattern, r_code, signal_type, reason in SECRECY_PATTERNS:
        match = re.search(pattern, original_text, re.IGNORECASE)
        excerpt = match.group(0) if match else None
        if not match:
            match_norm = re.search(pattern, norm_text, re.IGNORECASE)
            if match_norm:
                excerpt = extract_original_excerpt(
                    original_text, norm_mapping, match_norm.start(), match_norm.end()
                )
        if excerpt:
            raw_score += 18
            all_tactics.add("SECRECY_AND_ISOLATION")
            reason_codes.add(r_code)
            signals.append(DetectedSignal(
                reason_code=r_code,
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=excerpt,
                weight=18
            ))
            break

    # ── 5. Check payment demands ─────────────────────────────────────────
    for pattern, r_code, signal_type, reason in PAYMENT_DEMAND_PATTERNS:
        match = re.search(pattern, original_text, re.IGNORECASE)
        excerpt = match.group(0) if match else None
        if not match:
            match_norm = re.search(pattern, norm_text, re.IGNORECASE)
            if match_norm:
                excerpt = extract_original_excerpt(
                    original_text, norm_mapping, match_norm.start(), match_norm.end()
                )
        if excerpt:
            raw_score += 15
            all_tactics.add("FINANCIAL_PRESSURE")
            reason_codes.add(r_code)
            signals.append(DetectedSignal(
                reason_code=r_code,
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=excerpt,
                weight=15
            ))
            break

    # ── 6. Check for personal mobile in official context ─────────────────
    phone_matches = re.findall(r"(?:\+91|91|0)?[6-9]\d{9}", norm_text)
    official_keywords = ["police", "bank", "officer", "oficer", "discom", "power", "cbi", "court", "customs", "ed ", "rbi", "telecom", "trai", "fastag", "rwa"]
    if phone_matches and any(k in norm_text.lower() for k in official_keywords):
        raw_score += 15
        reason_codes.add("SIG_UNVERIFIED_PERSONAL_NUMBER")
        orig_phone = phone_matches[0]
        if orig_phone not in original_text:
            p_idx = norm_text.find(orig_phone)
            if p_idx >= 0:
                extracted = extract_original_excerpt(original_text, norm_mapping, p_idx, p_idx + len(orig_phone))
                if extracted:
                    orig_phone = extracted
        signals.append(DetectedSignal(
            reason_code="SIG_UNVERIFIED_PERSONAL_NUMBER",
            signal_type="UNVERIFIED_PERSONAL_NUMBER",
            severity="HIGH",
            reason="Personal mobile number presented as an official contact for a government agency or bank. Genuine agencies use toll-free or landline numbers.",
            excerpt=orig_phone,
            weight=15
        ))

    # ── 7. Check for adversarial injection attempts ──────────────────────
    for pattern, r_code, signal_type, reason, weight in ADVERSARIAL_PATTERNS:
        match = re.search(pattern, original_text, re.IGNORECASE)
        excerpt = match.group(0) if match else None
        if not match:
            match_norm = re.search(pattern, norm_text, re.IGNORECASE)
            if match_norm:
                excerpt = extract_original_excerpt(
                    original_text, norm_mapping, match_norm.start(), match_norm.end()
                )
        if excerpt:
            raw_score += weight
            reason_codes.add(r_code)
            all_tactics.add(signal_type)
            signals.append(DetectedSignal(
                reason_code=r_code,
                signal_type=signal_type,
                severity="HIGH",
                reason=reason,
                excerpt=excerpt,
                weight=weight,
                category="Adversarial Instruction / Evasion Attempt"
            ))
            break

    # ── 8. Apply counter-signals with verifiable excerpts ─────────────────
    for counter in COUNTER_SIGNAL_PATTERNS:
        cmatch = re.search(counter["regex"], original_text, re.IGNORECASE)
        cexcerpt = cmatch.group(0) if cmatch else None
        if not cmatch:
            cmatch_norm = re.search(counter["regex"], norm_text, re.IGNORECASE)
            if cmatch_norm:
                cexcerpt = extract_original_excerpt(
                    original_text, norm_mapping, cmatch_norm.start(), cmatch_norm.end()
                )
        if cexcerpt:
            reduction = counter["weight_reduction"]
            counter_score += reduction
            ctr_code = counter.get("reason_code", f"CTR_{counter['name']}")
            reason_codes.add(ctr_code)
            counter_signals.append(DetectedSignal(
                reason_code=ctr_code,
                signal_type=f"COUNTER_{counter['name']}",
                severity="LOW",
                reason=f"Legitimacy indicator: {counter['reason']}",
                excerpt=cexcerpt,
                weight=-reduction
            ))

    # All signals combined for legacy consumption
    combined_signals = signals + counter_signals

    # ── 8.5. Optional Offline Semantic Classifier (Phase 4.5 Feasibility Prototype) ──
    semantic_mode_active = False
    if enable_semantic:
        try:
            from backend.app.services.semantic_engine import OfflineSemanticEngine
            if OfflineSemanticEngine.is_available():
                sem_pred = OfflineSemanticEngine.predict(norm_text, original_text=original_text)
                if sem_pred.status == "SUCCESS":
                    semantic_mode_active = True
                    has_adversarial_injection = "SIG_ADVERSARIAL_PROMPT_INJECTION" in reason_codes
                    has_awareness_advisory = any(
                        cs.reason_code == "CTR_SECURITY_AWARENESS_ADVISORY" for cs in counter_signals
                    )

                    # Case A: High semantic scam affinity detected (p >= 0.65)
                    # Protect educational circulars: do not add scam score if security advisory counter-signal is present
                    if sem_pred.suggested_weight > 0 and not has_awareness_advisory:
                        raw_score += sem_pred.suggested_weight
                        reason_codes.add("SIG_SEMANTIC_SCAM_AFFINITY")
                        all_tactics.add("SEMANTIC_FRAUD_AFFINITY")

                        top_tokens_desc = ", ".join([f"'{t[0]}'" for t in sem_pred.top_scam_tokens[:3]])
                        excerpt_str = sem_pred.matched_excerpts[0] if sem_pred.matched_excerpts else (original_text[:50] + "...")
                        signals.append(DetectedSignal(
                            reason_code="SIG_SEMANTIC_SCAM_AFFINITY",
                            signal_type="SEMANTIC_SCAM_AFFINITY",
                            severity="HIGH" if sem_pred.suggested_weight >= 18 else "MEDIUM",
                            reason=f"Offline statistical classifier identified contextual phrasing characteristic of fraud (uncalibrated confidence: {sem_pred.probability:.2f}). Indicators: {top_tokens_desc}",
                            excerpt=excerpt_str,
                            weight=sem_pred.suggested_weight
                        ))

                    # Case B: High semantic benign affinity detected (p <= 0.35)
                    # Safeguard: never apply benign dampening if adversarial injection or acute threat is present
                    elif sem_pred.suggested_weight < 0:
                        has_acute = bool(reason_codes.intersection(RiskPolicy.ACUTE_THREAT_CODES))
                        if not has_adversarial_injection and not has_acute:
                            counter_reduction = abs(sem_pred.suggested_weight)
                            counter_score += counter_reduction
                            reason_codes.add("CTR_SEMANTIC_BENIGN_AFFINITY")
                            counter_signals.append(DetectedSignal(
                                reason_code="CTR_SEMANTIC_BENIGN_AFFINITY",
                                signal_type="COUNTER_SEMANTIC_BENIGN_AFFINITY",
                                severity="LOW",
                                reason=f"Offline statistical classifier recognized linguistic features typical of benign notices (uncalibrated confidence: {1.0 - sem_pred.probability:.2f}).",
                                excerpt=original_text[:50] + "...",
                                weight=-counter_reduction
                            ))
        except Exception as e:
            # Graceful degradation: never crash on semantic error
            logger.warning(f"Offline semantic classifier evaluation failed, continuing deterministic: {e}")

    # ── 9. Evaluate through Centralized RiskPolicy ────────────────────────
    (
        final_score,
        policy_tier,
        risk_level,
        severity,
        confidence,
        should_alert,
        recommended_actions,
        primary_action
    ) = RiskPolicy.evaluate(
        raw_score=raw_score,
        counter_reduction=counter_score,
        signals=signals,
        counter_signals=counter_signals
    )

    # Language support audit & limitation warning
    script_info = detect_script(original_text)
    if not script_info["is_supported"]:
        if final_score <= 34:
            confidence = ConfidenceLabel.LOW
            recommended_actions.append(
                "Language limitation: Scanned text contains regional Indic script (e.g. Tamil/Telugu/Bengali) with limited automated pattern coverage. "
                "Do not assume the message is safe; independently verify all demands."
            )

    verdict = _determine_verdict(signals, final_score, SCAM_PATTERNS)

    # Build plain-language human summary
    if policy_tier == PolicyTier.RED:
        tactic_names = ", ".join([t.replace("_", " ").title() for t in list(all_tactics)[:3]]) or "High Risk Manipulation"
        summary = (
            f"High-risk indicators detected (score: {final_score}/100, Tier: RED). "
            f"This communication shows strong characteristics of {verdict}, "
            f"employing tactics including {tactic_names}. "
            f"Do not engage further."
        )
    elif policy_tier == PolicyTier.AMBER:
        summary = (
            f"Moderate risk indicators detected (score: {final_score}/100, Tier: AMBER). "
            f"Some elements of this communication match known scam patterns or warrant independent verification. "
            f"Verify through official directory channels before taking any action."
        )
    else:
        if final_score >= 10:
            summary = (
                f"Low risk detected (score: {final_score}/100, Tier: GREEN). "
                f"Minor indicators were evaluated but the message appears largely standard. "
                f"Practice standard digital vigilance."
            )
        else:
            summary = (
                f"No significant risk indicators detected (score: {final_score}/100, Tier: GREEN). "
                f"The message does not match known scam patterns. "
                f"As always, never share OTPs, PINs, or passwords."
            )

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
        if sig.weight > 0:
            legacy_evidence.append({
                "factor_type": sig.signal_type,
                "severity": sig.severity,
                "description": sig.reason,
                "matched_text": sig.excerpt or ""
            })

    # Supporting evidence strings
    supporting_evidence = [
        f"{sig.signal_type}: {sig.reason}" + (f" (verbatim excerpt: '{sig.excerpt}')" if sig.excerpt else "")
        for sig in signals if sig.weight > 0
    ]

    return AnalysisResult(
        incident_id=incident_id,
        input_type=input_type,
        risk_level=risk_level,
        risk_score=final_score,
        policy_tier=policy_tier.value,
        confidence_label=confidence,
        verdict=verdict,
        plain_language_summary=summary,
        detected_signals=signals + counter_signals,
        counter_signals=counter_signals,
        reason_codes=sorted(list(reason_codes)),
        supporting_evidence=supporting_evidence,
        recommended_actions=recommended_actions,
        recommended_action=primary_action,
        verification_steps=unique_verification[:6],
        should_alert_family=should_alert,
        ai_provider="offline_semantic_tfidf" if semantic_mode_active else "none",
        analysis_mode=AnalysisMode.HYBRID if semantic_mode_active else AnalysisMode.RULE_BASED,
        # Legacy fields
        classification=verdict,
        severity=severity,
        summary=summary,
        advice=advice_items[0] if advice_items else "No specific advisory—practice standard digital safety.",
        suggested_action=primary_action,
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
    counter_signals: List[DetectedSignal] = []
    reason_codes: Set[str] = set()
    raw_score = 0
    counter_score = 0

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
    for pattern, r_code, signal_type, reason in SUSPICIOUS_URL_INDICATORS:
        match = re.search(pattern, lower_url, re.IGNORECASE)
        if match:
            raw_score += 25
            reason_codes.add(r_code)
            signals.append(DetectedSignal(
                reason_code=r_code,
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
                reason_codes.add("SIG_IMPERSONATION_DOMAIN")
                signals.append(DetectedSignal(
                    reason_code="SIG_IMPERSONATION_DOMAIN",
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
        reason_codes.add("SIG_EXCESSIVE_SUBDOMAINS")
        signals.append(DetectedSignal(
            reason_code="SIG_EXCESSIVE_SUBDOMAINS",
            signal_type="EXCESSIVE_SUBDOMAINS",
            severity="MEDIUM",
            reason="Unusually deep subdomain structure, often used to hide actual domain identity",
            excerpt=hostname,
            weight=15
        ))

    # Check for IP-based URL
    if re.match(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", hostname):
        raw_score += 20
        reason_codes.add("SIG_IP_BASED_URL")
        signals.append(DetectedSignal(
            reason_code="SIG_IP_BASED_URL",
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
        counter_score += 30
        reason_codes.add("CTR_KNOWN_SAFE_DOMAIN")
        counter_signals.append(DetectedSignal(
            reason_code="CTR_KNOWN_SAFE_DOMAIN",
            signal_type="KNOWN_SAFE_DOMAIN",
            severity="LOW",
            reason="Domain belongs to a well-known legitimate service",
            excerpt=hostname,
            weight=-30
        ))

    (
        final_score,
        policy_tier,
        risk_level,
        severity,
        confidence,
        should_alert,
        recommended_actions,
        primary_action
    ) = RiskPolicy.evaluate(
        raw_score=raw_score,
        counter_reduction=counter_score,
        signals=signals,
        counter_signals=counter_signals
    )

    if policy_tier == PolicyTier.RED:
        verdict = "Suspicious URL - Possible Phishing or Scam Site"
        summary = f"This URL shows {len(signals)} high-risk indicators (score: {final_score}/100, Tier: RED). Do not visit or enter any credentials."
    elif policy_tier == PolicyTier.AMBER:
        verdict = "URL Requires Verification"
        summary = f"Some suspicious indicators found (score: {final_score}/100, Tier: AMBER). Verify the URL through official channels before visiting."
    else:
        verdict = "URL Appears Standard"
        summary = f"No significant suspicious indicators detected (score: {final_score}/100, Tier: GREEN). Standard web safety practices apply."

    legacy_evidence = [
        {"factor_type": s.signal_type, "severity": s.severity, "description": s.reason, "matched_text": s.excerpt or ""}
        for s in signals if s.weight > 0
    ]
    supporting_evidence = [
        f"{s.signal_type}: {s.reason}" + (f" (verbatim excerpt: '{s.excerpt}')" if s.excerpt else "")
        for s in signals if s.weight > 0
    ]

    return AnalysisResult(
        incident_id=incident_id,
        input_type=InputType.URL,
        risk_level=risk_level,
        risk_score=final_score,
        policy_tier=policy_tier.value,
        confidence_label=confidence,
        verdict=verdict,
        plain_language_summary=summary,
        detected_signals=signals + counter_signals,
        counter_signals=counter_signals,
        reason_codes=sorted(list(reason_codes)),
        supporting_evidence=supporting_evidence,
        recommended_actions=recommended_actions,
        recommended_action=primary_action,
        verification_steps=[
            "Navigate directly to the official website instead of clicking links",
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
        suggested_action=primary_action,
        is_flagged_for_family=should_alert,
        evidence_items=legacy_evidence
    )


# ── Helper Functions ─────────────────────────────────────────────────────────

def _determine_verdict(
    signals: List[DetectedSignal], score: int, patterns: dict
) -> str:
    """
    Determine the primary verdict based on the strongest supported category evidence.
    Does NOT infer a specific scam category merely because generic tactics (urgency, secrecy) matched.
    """
    positive_signals = [s for s in signals if s.weight > 0]
    if not positive_signals:
        if score <= 10:
            return "Likely Legitimate Communication"
        return "Unclassified Communication"

    # 1. First prioritize signals with an explicit primary scam category
    category_signals = [s for s in positive_signals if getattr(s, "category", None)]
    if category_signals:
        strongest_category = max(category_signals, key=lambda s: s.weight)
        return strongest_category.category

    # 2. Check specific non-category threats (adversarial prompt injection, suspicious URLs)
    for s in positive_signals:
        r_code = getattr(s, "reason_code", "")
        if r_code == "SIG_ADVERSARIAL_PROMPT_INJECTION":
            return "Adversarial Instruction / Evasion Attempt"
        if r_code in ("SIG_APK_DOWNLOAD", "SIG_SUSPICIOUS_TLD", "SIG_BRAND_SQUATTING", "SIG_IP_IN_URL"):
            return "Suspicious Phishing Link"

    # 3. Handle generic suspicious signals without fabricating a specific category
    active_tactics = {s.signal_type for s in positive_signals}
    active_codes = {getattr(s, "reason_code", "") for s in positive_signals}

    has_payment = bool(
        active_tactics.intersection({"FINANCIAL_PRESSURE", "PAYMENT_DEMAND"}) or
        "SIG_COERCIVE_PAYMENT_DEMAND" in active_codes
    )
    has_urgency = bool(
        active_tactics.intersection({"ARTIFICIAL_URGENCY", "URGENCY_LANGUAGE", "HINDI_URGENCY"}) or
        "SIG_ARTIFICIAL_URGENCY" in active_codes
    )
    has_secrecy = bool(
        active_tactics.intersection({"SECRECY_AND_ISOLATION", "SECRECY_DEMAND", "HINDI_SECRECY"}) or
        "SIG_SECRECY_ISOLATION" in active_codes
    )

    if has_payment and (has_urgency or has_secrecy):
        return "Suspicious Coercive Payment Request"
    if has_payment:
        return "Unverified Payment Request"
    if has_secrecy:
        return "Suspicious Confidentiality Request"
    if has_urgency:
        return "Unverified Urgent Message"

    return "Suspicious Communication"


def _empty_result(incident_id: str, input_type: InputType) -> AnalysisResult:
    """Return a safe empty result for invalid or empty input."""
    return AnalysisResult(
        incident_id=incident_id,
        input_type=input_type,
        risk_level=RiskLevel.LOW,
        risk_score=0,
        policy_tier=PolicyTier.GREEN.value,
        confidence_label=ConfidenceLabel.LOW,
        verdict="Insufficient Input",
        plain_language_summary="The provided input was empty or too short to analyze meaningfully.",
        detected_signals=[],
        counter_signals=[],
        reason_codes=[],
        supporting_evidence=[],
        recommended_actions=["Please provide more text for analysis."],
        recommended_action="Please provide more text for analysis.",
        verification_steps=[],
        should_alert_family=False,
        ai_provider="none",
        analysis_mode=AnalysisMode.RULE_BASED,
        classification="Insufficient Input",
        severity="SAFE",
        summary="Input too short for meaningful analysis.",
        advice="Please provide a longer text for analysis.",
        suggested_action="Please provide more text for analysis.",
        is_flagged_for_family=False,
        evidence_items=[]
    )
