"""
Curated repeatable evaluation dataset for Satark Saathi.
Contains 30 balanced, ground-truth samples spanning Indian digital fraud vectors
and genuine everyday transactional/conversational notices.
"""

from typing import List, Dict, Any

EVALUATION_DATASET: List[Dict[str, Any]] = [
    # ── 15 SCAM SAMPLES ───────────────────────────────────────────────────────────
    {
        "id": "SCAM-01",
        "text": (
            "URGENT: This is Senior Officer Vikram Singh from CBI New Delhi Headquarters. "
            "Your Aadhaar card was linked to a seized parcel in Mumbai containing 16 illegal passports and MDMA narcotics. "
            "A Non-Bailable Arrest Warrant is issued against you. You are placed under DIGITAL ARREST. "
            "You must join Skype video call immediately for confidential verification. "
            "Do not inform any family member or your bank will be frozen instantly. Contact 9811223344."
        ),
        "expected_is_scam": True,
        "expected_category": "Digital Arrest Extortion",
        "channel": "WHATSAPP",
        "vector_description": "Law enforcement impersonation with digital arrest and family isolation demand"
    },
    {
        "id": "SCAM-02",
        "text": (
            "Dear consumer, your electricity connection will be disconnected tonight at 9:30 PM from power sub-station "
            "because your previous month bill was not updated. Please immediately contact our electricity officer at 9876501234. "
            "Do not make payment on app before calling."
        ),
        "expected_is_scam": True,
        "expected_category": "Utility Disconnection Threat",
        "channel": "SMS",
        "vector_description": "Impersonation of electricity discom urging call to personal mobile"
    },
    {
        "id": "SCAM-03",
        "text": (
            "Dear SBI User, your NetBanking access and ATM card will be permanently blocked within 24 hours "
            "due to pending PAN card verification. Please click bit.ly/sbi-kyc-verify-2026 to update your Aadhaar and PAN immediately."
        ),
        "expected_is_scam": True,
        "expected_category": "Banking Phishing",
        "channel": "SMS",
        "vector_description": "Bank KYC expiry panic with suspicious URL shortener"
    },
    {
        "id": "SCAM-04",
        "text": (
            "Hi! I am Ananya from HR Global. We have simple work-from-home tasks: just like 5 YouTube videos "
            "and review Google Maps locations. Earn ₹3,500 daily directly to your UPI. "
            "No interview required. Join our official Telegram group t.me/daily-tasks-payouts to receive your first ₹500 welcome bonus!"
        ),
        "expected_is_scam": True,
        "expected_category": "Task Prepaid Fraud",
        "channel": "WHATSAPP",
        "vector_description": "Prepaid review tasks with initial teaser payment to bait victims into deposits"
    },
    {
        "id": "SCAM-05",
        "text": (
            "India Post: Your package #IN782914 cannot be delivered due to incomplete house address. "
            "Please update your delivery details and pay redelivery fee of ₹25 at indiapost-track-delivery.xyz "
            "within 12 hours or package will be returned to sender."
        ),
        "expected_is_scam": True,
        "expected_category": "Courier Phishing",
        "channel": "SMS",
        "vector_description": "Postal phishing link harvesting card credentials under small fee pretext"
    },
    {
        "id": "SCAM-06",
        "text": (
            "Hello sir, this is calling from HDFC Bank credit card department. "
            "Your credit card has been compromised and we need to verify your identity. "
            "Please share the OTP that was sent to your registered mobile number to block the unauthorized transaction. "
            "This is very urgent, the transaction is happening right now. Please tell me the 6-digit OTP immediately."
        ),
        "expected_is_scam": True,
        "expected_category": "OTP Theft Impersonation",
        "channel": "CALL_TRANSCRIPT",
        "vector_description": "Direct social engineering asking victim to read out OTP over voice call"
    },
    {
        "id": "SCAM-07",
        "text": (
            "Join our exclusive Telegram trading group for guaranteed 100% returns on your investment within 30 days! "
            "We are SEBI registered advisors with insider stock market tips. "
            "Deposit ₹10,000 today and receive ₹20,000 next month guaranteed. Limited slots remaining!"
        ),
        "expected_is_scam": True,
        "expected_category": "Investment Fraud",
        "channel": "WHATSAPP",
        "vector_description": "Unrealistic guaranteed return scheme soliciting deposits to private accounts"
    },
    {
        "id": "SCAM-08",
        "text": (
            "Notice from FastCash Loans: Your loan of ₹15,000 is overdue by 2 days. If you do not pay ₹28,000 to UPI fastcash@icici "
            "in 30 minutes, our recovery agents will send your PAN, Aadhaar, and contacts list to all your relatives with morphed photos. "
            "Do not disconnect call."
        ),
        "expected_is_scam": True,
        "expected_category": "Loan App Extortion",
        "channel": "WHATSAPP",
        "vector_description": "Illegal predatory loan app blackmail threatening contact list harassment"
    },
    {
        "id": "SCAM-09",
        "text": (
            "Customer support executive: Sir your refund of ₹4,999 from PhonePe is stuck due to server error. "
            "Please install AnyDesk app from Play Store and tell me the 9 digit access code so our technical team "
            "can approve your refund directly into your bank."
        ),
        "expected_is_scam": True,
        "expected_category": "Remote Access Fraud",
        "channel": "CALL_TRANSCRIPT",
        "vector_description": "Remote desktop tool solicitation (AnyDesk) to take over victim device"
    },
    {
        "id": "SCAM-10",
        "text": (
            "Inspector Sharma Mumbai Police: A money laundering case has been registered at Colaba Police Station against you. "
            "A sum of ₹3.8 Crore was transferred using your Canara Bank account. "
            "Keep this matter strictly secret from your family under National Security protocol. Join Skype session now."
        ),
        "expected_is_scam": True,
        "expected_category": "Digital Arrest Extortion",
        "channel": "CALL_TRANSCRIPT",
        "vector_description": "Police money laundering arrest intimidation demanding secrecy"
    },
    {
        "id": "SCAM-11",
        "text": (
            "Congratulations! Your mobile number won 2nd prize in Kaun Banega Crorepati KBC Lucky Draw 2026 of ₹25,00,000 Lakhs! "
            "To claim your prize money cheque, please deposit GST filing charge ₹12,500 to SBI Account 3920192847. Contact Manager Rana Pratap at 9988776655."
        ),
        "expected_is_scam": True,
        "expected_category": "Lottery Fraud",
        "channel": "WHATSAPP",
        "vector_description": "Advance fee fraud promising fake lottery prize upon upfront fee payment"
    },
    {
        "id": "SCAM-12",
        "text": (
            "Papa urgent! I am at Sector 18 police station, my friend met with an accident and police is threatening to register FIR against me. "
            "Please transfer ₹35,000 immediately to lawyer UPI advocate.sharma@paytm. Don't tell Mom she will get blood pressure. Please hurry!"
        ),
        "expected_is_scam": True,
        "expected_category": "Family Emergency Impersonation",
        "channel": "WHATSAPP",
        "vector_description": "Impersonation of distressed relative demanding emergency funds with secrecy"
    },
    {
        "id": "SCAM-13",
        "text": (
            "EPFO Alert: Dear member, your Provident Fund EPF account interest will not be credited due to unverified UAN KYC. "
            "Update your Aadhaar and bank details at epfindia-uan-kyc.top within 24 hours to prevent account freeze."
        ),
        "expected_is_scam": True,
        "expected_category": "Government Phishing",
        "channel": "SMS",
        "vector_description": "Fake government EPFO notification leading to fraudulent credential harvesting domain"
    },
    {
        "id": "SCAM-14",
        "text": (
            "TRAI Telecom Notification: Your mobile number will be permanently deactivated across all networks within 2 hours "
            "due to 17 illegal advertising complaints. Press 9 to connect with telecom compliance officer or pay clearance penalty ₹1,200."
        ),
        "expected_is_scam": True,
        "expected_category": "Utility Disconnection Threat",
        "channel": "SMS",
        "vector_description": "TRAI sim disconnection scare tactic prompting immediate compliance call"
    },
    {
        "id": "SCAM-15",
        "text": (
            "FedEx Courier Alert: We have an international parcel arriving from London for you. Customs duty clearance of ₹8,450 "
            "must be paid into Customs Clearance Officer account 9021849182 within 3 hours or customs will seize the package and file police complaint."
        ),
        "expected_is_scam": True,
        "expected_category": "Customs Parcel Extortion",
        "channel": "SMS",
        "vector_description": "Fake customs clearance duty demand for non-existent overseas courier"
    },

    # ── 15 LEGITIMATE SAMPLES ───────────────────────────────────────────────────────────
    {
        "id": "SAFE-01",
        "text": (
            "Dear Customer, INR 1,450.00 debited from A/C XX8901 on 13-Oct-26 at 14:15 via UPI to BLINKIT GROCERY. "
            "Available Balance: INR 34,200.00. If this transaction was not authorized by you, please call SBI toll-free 1800112211 or SMS NO to 9223008333."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Bank Debit Notice",
        "channel": "SMS",
        "vector_description": "Authentic bank debit notice containing official toll-free reporting channels"
    },
    {
        "id": "SAFE-02",
        "text": (
            "Dear HDFC Bank Customer, your credit card statement for card ending 4012 is generated. "
            "Total Amount Due: INR 8,420.00. Minimum Due: INR 500.00. Due Date: 28-Oct-26. "
            "Login to netbanking.hdfcbank.com or use HDFC MobileBanking app to pay securely."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Credit Card Statement",
        "channel": "SMS",
        "vector_description": "Standard monthly credit card statement with official domain link"
    },
    {
        "id": "SAFE-03",
        "text": (
            "582910 is your OTP for login to Amazon.in. OTP is valid for 10 minutes. "
            "Do NOT share this code with anyone, including Amazon executives. Amazon will never call you asking for your OTP."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate OTP with Warning",
        "channel": "SMS",
        "vector_description": "Authentic OTP containing explicit advisory against sharing with anyone"
    },
    {
        "id": "SAFE-04",
        "text": (
            "IRCTC Booking Confirmation: PNR 2849102847, Train 12952 MUMBAI RAJDHANI, 15-Oct-26. "
            "Coach B3, Berth 24 (Lower), Class 3A. Total Fare: INR 2,180. Please carry valid original ID during journey. Wish you a pleasant journey."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Railway Booking",
        "channel": "SMS",
        "vector_description": "Standard IRCTC passenger booking confirmation SMS"
    },
    {
        "id": "SAFE-05",
        "text": (
            "Beta what time will you reach home tonight? I have cooked paneer and roti. "
            "Also remember to bring the medicine strip for Dad from Apollo Pharmacy if possible."
        ),
        "expected_is_scam": False,
        "expected_category": "Benign Family Chat",
        "channel": "WHATSAPP",
        "vector_description": "Normal family conversation with no financial coercion or threat"
    },
    {
        "id": "SAFE-06",
        "text": (
            "Appointment Confirmed: Dr. Anjali Mehta (Cardiology) at Apollo Clinics, Koramangala. "
            "Date: 16-Oct-2026 at 11:30 AM. Token #14. Please arrive 15 minutes prior. For reschedule call 080-25501234."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Doctor Appointment",
        "channel": "SMS",
        "vector_description": "Standard clinic appointment reminder"
    },
    {
        "id": "SAFE-07",
        "text": (
            "Your salary of INR 75,000.00 has been credited to your ICICI Bank account ending 9182 on 30-Sep-26 "
            "via NEFT from INFOSYS TECHNOLOGIES LTD. Total Available Balance: INR 1,12,450.00."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Salary Credit",
        "channel": "SMS",
        "vector_description": "Standard payroll direct deposit notification"
    },
    {
        "id": "SAFE-08",
        "text": (
            "Payment Successful: INR 1,840.00 received towards BSES Rajdhani Power Bill for CA #1002948192 on 12-Oct-26. "
            "Transaction ID: TXN9810283. Your account is fully updated. Thank you for paying on time."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Utility Payment Receipt",
        "channel": "SMS",
        "vector_description": "Official confirmation of bill payment receipt"
    },
    {
        "id": "SAFE-09",
        "text": (
            "BlueDart Express: Your shipment from Tata Cliq AWB# 8920194810 is out for delivery today. "
            "Delivery associate: Ramesh Kumar (9820192831). Share delivery PIN 4820 at the time of doorstep handover."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Delivery Notice",
        "channel": "SMS",
        "vector_description": "Standard e-commerce delivery out-for-delivery notice"
    },
    {
        "id": "SAFE-10",
        "text": (
            "Delhi University Notice: Mid-semester examinations for Semester V will commence from 18th November 2026. "
            "Admit cards can be downloaded from du.ac.in student portal starting 1st November. Contact department coordinator for discrepancies."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Academic Notice",
        "channel": "EMAIL",
        "vector_description": "Authentic academic notice with official educational domain"
    },
    {
        "id": "SAFE-11",
        "text": (
            "Your Swiggy order from Punjab Grill is on the way! Delivery executive Ravi is arriving in approximately 12 mins. "
            "Enjoy your meal. Rate your delivery executive in the app."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Food Delivery",
        "channel": "SMS",
        "vector_description": "Routine food delivery notification"
    },
    {
        "id": "SAFE-12",
        "text": (
            "OTP for Aadhaar authentication is 392014. Generated on 13-Oct-26 at 15:40. "
            "Valid for 10 minutes. Do not share with anyone. UIDAI will never ask for this OTP."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Government OTP",
        "channel": "SMS",
        "vector_description": "Official UIDAI Aadhaar verification OTP with standard security warning"
    },
    {
        "id": "SAFE-13",
        "text": (
            "Jio Prepaid: Recharge of INR 299 successful for 9820192830 on 10-Oct-26. "
            "Benefits: 1.5 GB/day high speed data + Unlimited voice calls for 28 days. Check balance on MyJio app."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Telecom Recharge",
        "channel": "SMS",
        "vector_description": "Routine telecom prepaid plan recharge confirmation"
    },
    {
        "id": "SAFE-14",
        "text": (
            "Nippon India Mutual Fund: SIP installment of INR 5,000.00 debited for Small Cap Fund (Growth Plan). "
            "Units allotted: 41.248 at NAV 121.22 on 10-Oct-26. Folio #9182940. View portfolio on mfcentral.com."
        ),
        "expected_is_scam": False,
        "expected_category": "Legitimate Investment SIP",
        "channel": "SMS",
        "vector_description": "Official mutual fund Systematic Investment Plan allotment notice"
    },
    {
        "id": "SAFE-15",
        "text": (
            "Hey guys, are we still meeting this Sunday for tennis at 7 AM? "
            "Rohit booked court #2 at the club. Let me know if anyone needs a ride from Powai."
        ),
        "expected_is_scam": False,
        "expected_category": "Benign Social Chat",
        "channel": "WHATSAPP",
        "vector_description": "Normal recreational chat among friends"
    }
]
