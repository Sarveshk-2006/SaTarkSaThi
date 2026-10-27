from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models import (
    UserProfile,
    TrustedContact,
    ScamAnalysis,
    ScamEvidence,
    FamilyAlert,
    Incident,
    RecoveryDraft,
    AuditEvent
)

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models import (
    UserProfile,
    TrustedContact,
    ScamAnalysis,
    ScamEvidence,
    FamilyAlert,
    Incident,
    PaymentSimulation,
    RecoveryDraft,
    AuditEvent,
    TransactionRecord,
    CallerReputation,
    CallerReport,
    CallerBlocklist,
)

def seed_default_data(db: Session, force: bool = False):
    """
    Populates sample seed records clearly marked with is_seed_data=True.
    Provides realistic demo profiles and connected records for hackathon evaluation.
    """
    # 1. Users / Demo Profiles (Rajesh Sharma: Protected Member, Aarav Sharma: Guardian)
    profile1 = db.query(UserProfile).filter_by(id=1).first()
    if not profile1 or force:
        if force:
            db.query(UserProfile).delete()
        profile1 = UserProfile(
            id=1,
            full_name="Rajesh Sharma",
            phone_number="+91 98765 43210",
            email="rajesh.sharma@example.in",
            role="PROTECTED_MEMBER",
            passcode_hash="pbkdf2:sha256:1234",
            preferred_language="English",
            city="New Delhi",
            bank_name="State Bank of India",
            notifications_enabled=True
        )
        profile2 = UserProfile(
            id=2,
            full_name="Aarav Sharma",
            phone_number="+91 98101 23456",
            email="aarav.sharma@example.com",
            role="GUARDIAN",
            passcode_hash="pbkdf2:sha256:1234",
            preferred_language="English",
            city="Bengaluru",
            bank_name="HDFC Bank",
            notifications_enabled=True
        )
        db.add_all([profile1, profile2])
        db.commit()

    # 2. Trusted Contacts
    if db.query(TrustedContact).count() == 0 or force:
        if force:
            db.query(TrustedContact).delete()

        now = datetime.now(timezone.utc)
        # Max two trusted contacts; both seeded as having accepted (demo data) so alerts work out of the box.
        contacts = [
            TrustedContact(
                user_id=1,
                name="Aarav Sharma",
                relationship="Son",
                phone_number="+91 98101 23456",
                email="aarav.sharma@example.com",
                alert_level="ALL",
                is_active=True,
                is_primary=True,
                is_verified=True,
                consent_granted=True,
                contact_consent_status="ACCEPTED",
                contact_consent_at=now - timedelta(days=30),
                verified_at=now - timedelta(days=30)
            ),
            TrustedContact(
                user_id=1,
                name="Priya Sharma",
                relationship="Daughter",
                phone_number="+91 98202 34567",
                email="priya.sharma@example.com",
                alert_level="HIGH_RISK_ONLY",
                is_active=True,
                is_primary=False,
                is_verified=True,
                consent_granted=True,
                contact_consent_status="ACCEPTED",
                contact_consent_at=now - timedelta(days=20),
                verified_at=now - timedelta(days=20)
            ),
        ]
        db.add_all(contacts)
        db.commit()

    # 3. Scam Analyses & Evidence
    if db.query(ScamAnalysis).count() == 0 or force:
        if force:
            db.query(RecoveryDraft).delete()
            db.query(PaymentSimulation).delete()
            db.query(Incident).delete()
            db.query(FamilyAlert).delete()
            db.query(ScamEvidence).delete()
            db.query(ScamAnalysis).delete()

        now = datetime.now(timezone.utc)

        # Seed Analysis 1: Digital Arrest Scam
        analysis1 = ScamAnalysis(
            incident_id="SA-202610-001",
            user_id=1,
            input_text=(
                "URGENT: This is Inspector Ajay Kumar from Mumbai Cyber Crime Cell. "
                "An arrest warrant has been issued against you under PMLA for 24 suspicious money laundering transactions. "
                "Join Skype video call interrogation immediately at 2:00 PM or local police will raid your premises. "
                "Do not disclose this to family or lawyer. Contact 9820198201 for verification."
            ),
            channel="WHATSAPP",
            classification="Digital Arrest / Police Impersonation Fraud",
            risk_score=94,
            severity="HIGH_RISK",
            risk_level="CRITICAL",
            summary=(
                "Severe threat detected (94/100). Impersonation of Mumbai Cyber Crime Cell using illegal threats "
                "of digital arrest and coercive isolation tactics."
            ),
            advice=(
                "CRITICAL: Digital arrest does not exist in Indian jurisprudence. Law enforcement never conducts "
                "video trials or demands secrecy. Block this number immediately."
            ),
            suggested_action="Block caller, alert Family Shield immediately, and do not make any transfers.",
            is_flagged_for_family=True,
            is_seed_data=True,
            created_at=now - timedelta(days=1, hours=3)
        )
        db.add(analysis1)
        db.commit()
        db.refresh(analysis1)

        evidence1_1 = ScamEvidence(
            analysis_id=analysis1.id,
            factor_type="AUTHORITY_IMPERSONATION",
            severity="HIGH",
            description="Fabricated identity of Mumbai Cyber Crime Cell Inspector.",
            matched_text="Inspector Ajay Kumar from Mumbai Cyber Crime Cell"
        )
        evidence1_2 = ScamEvidence(
            analysis_id=analysis1.id,
            factor_type="FEAR_AND_INTIMIDATION",
            severity="HIGH",
            description="Coercive threat of police raid and arrest warrant.",
            matched_text="arrest warrant has been issued ... local police will raid"
        )
        evidence1_3 = ScamEvidence(
            analysis_id=analysis1.id,
            factor_type="SECRECY_AND_ISOLATION",
            severity="HIGH",
            description="Classic isolation tactic preventing victim from verifying with trusted relatives.",
            matched_text="Do not disclose this to family or lawyer"
        )
        db.add_all([evidence1_1, evidence1_2, evidence1_3])

        # Seed Analysis 2: Electricity Bill Disconnection
        analysis2 = ScamAnalysis(
            incident_id="SA-202610-002",
            user_id=1,
            input_text=(
                "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from power office "
                "because your previous month bill was not updated. Please immediately contact our electricity officer at 9871234567."
            ),
            channel="SMS",
            classification="Electricity Bill Disconnection Threat",
            risk_score=88,
            severity="HIGH_RISK",
            risk_level="HIGH",
            summary="High risk detected (88/100). Fabricated utility disconnection threat sent from an unverified mobile number.",
            advice="DISCOMs in India do not send disconnection notices via personal mobile numbers. Check electricity board app directly.",
            suggested_action="Do not call the 10-digit number. Verify your bill on the official DISCOM website.",
            is_flagged_for_family=True,
            is_seed_data=True,
            created_at=now - timedelta(days=2, hours=5)
        )
        db.add(analysis2)
        db.commit()
        db.refresh(analysis2)

        evidence2_1 = ScamEvidence(
            analysis_id=analysis2.id,
            factor_type="ARTIFICIAL_URGENCY",
            severity="HIGH",
            description="Short deadline (9:30 PM tonight) to induce panic.",
            matched_text="tonight at 9:30 PM"
        )
        evidence2_2 = ScamEvidence(
            analysis_id=analysis2.id,
            factor_type="UNVERIFIED_SENDER",
            severity="HIGH",
            description="Personal 10-digit mobile number cited instead of official DISCOM helpline.",
            matched_text="contact our electricity officer at 9871234567"
        )
        db.add_all([evidence2_1, evidence2_2])

        # Seed Analysis 3: Legitimate Bank Alert (Safe example)
        analysis3 = ScamAnalysis(
            incident_id="SA-202610-003",
            user_id=1,
            input_text="Dear SBI Customer, INR 2,500.00 debited from A/C **4321 on 12-Oct-26 via UPI Ref 628901234567 to GROCERY MART. Bal: INR 48,210.50. If not you, SMS NO to 9223008333.",
            channel="SMS",
            classification="Legitimate Transaction Notification",
            risk_score=12,
            severity="SAFE",
            risk_level="LOW",
            summary="Low risk (12/100). Standard banking transaction alert adhering to RBI notification guidelines.",
            advice="Safe standard transaction notification. Keep records for monthly statement reconciliation.",
            suggested_action="No action required unless you do not recognize the merchant debit.",
            is_flagged_for_family=False,
            is_seed_data=True,
            created_at=now - timedelta(days=3)
        )
        db.add(analysis3)
        db.commit()

        # 4. Seed Incident / Recovery Case
        incident = Incident(
            incident_id="SA-202610-001",
            user_id=1,
            analysis_id=analysis2.id,
            title="Unauthorized Electricity Phishing UPI Debit",
            scam_type="Utility Impersonation Phishing",
            description="Victim called the number in the SMS; caller claimed to be BSES desk and asked victim to make a test payment of INR 10 on a custom link. A debit of INR 15,000 occurred.",
            financial_loss=15000.0,
            currency="INR",
            bank_name="State Bank of India",
            transaction_ref="SBI/UPI/6289901428/01",
            suspect_contact="9871234567 / officer-bses@ybl",
            incident_date=now - timedelta(days=2, hours=4),
            status="REPORTED_1930",
            severity="HIGH_RISK",
            risk_level="HIGH",
            risk_score=88,
            is_seed_data=True,
            created_at=now - timedelta(days=2, hours=4)
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # 5. Seed Family Alert
        primary_contact = db.query(TrustedContact).filter_by(is_primary=True).first()
        if primary_contact:
            alert = FamilyAlert(
                incident_id="SA-202610-001",
                analysis_id=analysis1.id,
                contact_id=primary_contact.id,
                user_id=1,
                threat_title="Digital Arrest Threat Blocked for Rajesh",
                message_content=(
                    "Satark Saathi Alert: Rajesh Sharma received a high-risk scam message impersonating Mumbai Police "
                    "with threats of digital arrest. Risk Score: 94/100. We advised Rajesh not to engage. "
                    "Please call to check in and reassure them."
                ),
                risk_level="CRITICAL",
                recommended_action="Call Rajesh Sharma immediately to verify that no funds are transferred.",
                delivery_channel="IN_APP_SIMULATION",
                status="DELIVERED",
                is_seed_data=True,
                delivered_at=now - timedelta(days=1, hours=2),
                acknowledged_at=now - timedelta(days=1, hours=1),
                acknowledged_by="Aarav Sharma"
            )
            db.add(alert)
            db.commit()

        # 6. Seed Payment Simulation (Sandbox record)
        simulation = PaymentSimulation(
            simulation_id="SIM-202610-001",
            user_id=1,
            vpa_or_account="officer-cbi-investigation@okhdfc",
            recipient_name="CBI Special Officer Escrow Account",
            is_new_recipient=True,
            requested_amount=25000.0,
            purpose="Security deposit to lift digital arrest warrant",
            pressure_present=True,
            authority_claimed=True,
            secrecy_demanded=True,
            guaranteed_returns=False,
            outcome="SEEK_TRUSTED_HELP",
            risk_score=95,
            severity="HIGH_RISK",
            decision_rationale="Simulated payment has multiple severe red flags: Claims police authority, demands secrecy, and imposes urgent pressure. Real law enforcement never uses personal UPI handles.",
            evidence_factors='["Claims police or government authority", "Demands secrecy from family", "Urgent coercive pressure applied", "New unverified beneficiary"]',
            verification_steps='["Do NOT enter your UPI PIN", "Call 1930 Cyber Fraud Helpline immediately", "Reach out to trusted family contact Aarav Sharma"]',
            is_simulation=True,
            checked_at=now - timedelta(days=1, hours=1)
        )
        db.add(simulation)
        db.commit()

        # 7. Seed Recovery Draft for Incident
        draft = RecoveryDraft(
            incident_id=incident.id,
            user_id=1,
            incident_datetime=now - timedelta(days=2, hours=4),
            scam_category="Utility Impersonation Phishing",
            communication_channel="SMS / Phone Call",
            incident_narrative="Victim called phone number from electricity disconnection SMS. Fraudster instructed payment of ₹10 via phishing link resulting in unauthorized ₹15,000 debit.",
            financial_loss=15000.0,
            transaction_reference="SBI/UPI/6289901428/01",
            bank_or_app="State Bank of India",
            transfer_status="COMPLETED",
            portal_complaint_text=(
                "COMPLAINT FOR NATIONAL CYBER CRIME REPORTING PORTAL (cybercrime.gov.in / 1930 Helpline)\n"
                f"Incident Date: {(now - timedelta(days=2)).strftime('%Y-%m-%d %H:%M')}\n"
                "Victim Name: Rajesh Sharma\n"
                "Complainant Bank: State Bank of India\n"
                "Transaction Reference (UTR): SBI/UPI/6289901428/01\n"
                "Amount Defrauded: INR 15,000.00\n"
                "Suspect Phone: 9871234567\n"
                "Suspect UPI ID: officer-bses@ybl\n"
                "Modus Operandi: Received deceptive SMS threatening power disconnection. Fraudster impersonated electricity officer and induced payment under false pretenses.\n"
                "Request: Immediate freeze of beneficiary account under Section 1930 Golden Hour Protocol."
            ),
            bank_complaint_text=(
                "To: The Nodal Officer / Fraud Dispute Cell, State Bank of India\n"
                "Subject: Urgent - Immediate Recall and Freeze of Fraudulent UPI Transaction SBI/UPI/6289901428/01\n\n"
                "Respected Sir/Madam,\n"
                "I am reporting an unauthorized fraudulent debit of INR 15,000.00 on my account via UPI.\n"
                "Transaction Ref: SBI/UPI/6289901428/01.\n"
                "In accordance with RBI Circular on Customer Protection (Limitation of Liability), I am lodging this dispute within the Golden Hour window. "
                "Kindly mark the beneficiary account in lien and initiate an inter-bank reversal chargeback."
            ),
            police_complaint_text=(
                "To: The Station House Officer (SHO), Cyber Police Station, New Delhi\n"
                "Subject: Formal Complaint regarding Cyber Financial Fraud punishable under IT Act 2000 (Sec 66D) and BNS.\n\n"
                "I, Rajesh Sharma, wish to lodge a formal complaint against unknown person(s) operating mobile number 9871234567 "
                "for impersonating an official entity and cheating by personation to fraudulently siphon INR 15,000 from my bank account."
            ),
            status="DRAFT",
            generated_at=now - timedelta(days=2, hours=3)
        )
        db.add(draft)
        db.commit()

        # Audit Event
        audit = AuditEvent(
            user_id=1,
            event_type="SEED_INITIALIZATION",
            entity_type="incident",
            entity_id=incident.incident_id,
            description="Initial seed records initialized for Satark Saathi local development and demo testing."
        )
        db.add(audit)
        db.commit()

    # 8. Mock transaction history (baseline for spending deviation / new-payee / velocity signals)
    if db.query(TransactionRecord).filter(TransactionRecord.user_id == 1).count() == 0 or force:
        if force:
            db.query(TransactionRecord).delete()
        now = datetime.now(timezone.utc)
        history = [
            # (payee, name, amount, category, days_ago)
            ("kirana.store@icici", "Sharma General Store", 640, "GROCERY", 2),
            ("kirana.store@icici", "Sharma General Store", 820, "GROCERY", 9),
            ("kirana.store@icici", "Sharma General Store", 575, "GROCERY", 16),
            ("kirana.store@icici", "Sharma General Store", 910, "GROCERY", 23),
            ("kirana.store@icici", "Sharma General Store", 700, "GROCERY", 30),
            ("milkman.ramesh@oksbi", "Ramesh Dairy", 1200, "DAIRY", 5),
            ("milkman.ramesh@oksbi", "Ramesh Dairy", 1200, "DAIRY", 35),
            ("bsesrajdhani.billdesk@hdfcbank", "BSES Rajdhani (BillDesk)", 2350, "UTILITY", 12),
            ("bsesrajdhani.billdesk@hdfcbank", "BSES Rajdhani (BillDesk)", 2180, "UTILITY", 42),
            ("airtel.prepaid@airtel", "Airtel Prepaid", 599, "TELECOM", 20),
            ("apollo.pharmacy@icici", "Apollo Pharmacy", 1450, "HEALTH", 8),
            ("apollo.pharmacy@icici", "Apollo Pharmacy", 980, "HEALTH", 38),
            ("society.maintenance@sbi", "Green Park RWA", 3500, "HOUSING", 14),
            ("society.maintenance@sbi", "Green Park RWA", 3500, "HOUSING", 44),
            ("priya.sharma@okhdfc", "Priya Sharma", 5000, "FAMILY", 25),
            ("lic.premium@axisbank", "LIC Premium", 4200, "INSURANCE", 60),
        ]
        db.add_all([
            TransactionRecord(
                user_id=1, payee_vpa=vpa, payee_name=name, amount=float(amount), category=category,
                status="COMPLETED", is_mock=True, is_seed_data=True, created_at=now - timedelta(days=days),
            )
            for vpa, name, amount, category, days in history
        ])
        db.commit()

    # 9. Caller Shield Intelligence Seed Data
    if db.query(CallerReputation).count() == 0 or force:
        if force:
            db.query(CallerReport).delete()
            db.query(CallerReputation).delete()
        now = datetime.now(timezone.utc)
        
        caller_seeds = [
            CallerReputation(
                normalized_number="+919876500001",
                raw_display_number="+91 98765 00001",
                display_tag="Suspected Fake Police / CBI Extortion",
                category="DIGITAL_ARREST",
                risk_score=98,
                risk_level="CRITICAL",
                confidence="HIGH",
                total_reports=142,
                verified_reports=96,
                upvotes_spam=138,
                downvotes_safe=1,
                carrier_verified=False,
                is_business=False,
                ibm_summary="Coordinated extortion campaign impersonating Mumbai Cyber Crime and CBI officers. Demands immediate video call interrogation and funds transfer under threat of imminent arrest.",
                ibm_enriched_at=now - timedelta(hours=2),
                evidence_signals='["IMPERSONATING_LAW_ENFORCEMENT", "THREAT_OF_IMMEDIATE_ARREST", "DEMAND_FOR_SECRECY", "SPOOFED_CALLER_ID"]',
                recommended_action="Do not answer or speak. Disconnect immediately. CBI or Police never arrest over phone calls or WhatsApp video.",
                last_reported_at=now - timedelta(hours=1),
                created_at=now - timedelta(days=15),
            ),
            CallerReputation(
                normalized_number="+919123456789",
                raw_display_number="+91 91234 56789",
                display_tag="Fake Electricity Disconnection Warning",
                category="ELECTRICITY_SCAM",
                risk_score=92,
                risk_level="HIGH",
                confidence="HIGH",
                total_reports=89,
                verified_reports=62,
                upvotes_spam=85,
                downvotes_safe=2,
                carrier_verified=False,
                is_business=False,
                ibm_summary="Fraudulent calls claiming power supply will be cut at 9:30 PM due to unpaid bills, prompting user to call an unauthorized mobile number or install remote access APKs.",
                ibm_enriched_at=now - timedelta(hours=4),
                evidence_signals='["ARTIFICIAL_URGENCY", "UTILITY_IMPERSONATION", "MALICIOUS_APK_PUSH"]',
                recommended_action="Do not call back or install any APK. Check current bill status only on your power discom official website.",
                last_reported_at=now - timedelta(hours=3),
                created_at=now - timedelta(days=20),
            ),
            CallerReputation(
                normalized_number="+923001234567",
                raw_display_number="+92 300 1234567",
                display_tag="Fake KBC Lottery WhatsApp Call",
                category="LOTTERY_FRAUD",
                risk_score=96,
                risk_level="CRITICAL",
                confidence="HIGH",
                total_reports=215,
                verified_reports=180,
                upvotes_spam=210,
                downvotes_safe=0,
                carrier_verified=False,
                is_business=False,
                ibm_summary="International spoofed call claiming a 25 Lakh INR lottery prize from Kaun Banega Crorepati. Demands registration fee payment via gift cards or UPI.",
                ibm_enriched_at=now - timedelta(hours=6),
                evidence_signals='["SPOOFED_INTERNATIONAL_PREFIX", "UNREALISTIC_LOTTERY_PRIZE", "UPFRONT_FEE_DEMAND"]',
                recommended_action="Block and report immediately. Never pay any fee or tax to claim prize money.",
                last_reported_at=now - timedelta(hours=2),
                created_at=now - timedelta(days=30),
            ),
            CallerReputation(
                normalized_number="+918000011111",
                raw_display_number="+91 80000 11111",
                display_tag="Fake SBI NetBanking KYC Suspension",
                category="KYC_FRAUD",
                risk_score=88,
                risk_level="HIGH",
                confidence="HIGH",
                total_reports=64,
                verified_reports=45,
                upvotes_spam=60,
                downvotes_safe=1,
                carrier_verified=False,
                is_business=False,
                ibm_summary="Impersonates bank security desk warning of immediate account freeze unless Aadhaar and OTP are disclosed.",
                ibm_enriched_at=now - timedelta(hours=8),
                evidence_signals='["BANK_IMPERSONATION", "OTP_SOLICITATION", "ACCOUNT_FREEZE_COERCION"]',
                recommended_action="Banks never ask for OTPs or passwords over phone. Report to 1930 Cyber Helpline.",
                last_reported_at=now - timedelta(hours=5),
                created_at=now - timedelta(days=10),
            ),
            CallerReputation(
                normalized_number="+912228540000",
                raw_display_number="+91 22 2854 0000",
                display_tag="State Bank of India (Official Corporate Desk)",
                category="LEGITIMATE_BUSINESS",
                risk_score=4,
                risk_level="LOW",
                confidence="HIGH",
                total_reports=0,
                verified_reports=0,
                upvotes_spam=0,
                downvotes_safe=48,
                carrier_verified=True,
                carrier_name="BSNL Enterprise Trunk",
                is_business=True,
                business_name="State Bank of India",
                ibm_summary="Verified official corporate communication trunk for State Bank of India. Cross-matched against RBI Sachet bank directory.",
                ibm_enriched_at=now - timedelta(days=1),
                evidence_signals='["CARRIER_VERIFIED_ENTERPRISE", "OFFICIAL_BANK_DIRECTORY_MATCH"]',
                recommended_action="Verified corporate caller. Still remember to never share NetBanking passwords or OTPs.",
                last_reported_at=None,
                created_at=now - timedelta(days=60),
            ),
        ]
        db.add_all(caller_seeds)
        db.commit()

        # Seed sample report
        db.add(CallerReport(
            user_id=1,
            normalized_number="+919876500001",
            category="DIGITAL_ARREST",
            claimed_caller_name="Inspector Vijay Rathore - CBI",
            description="Caller claimed my Aadhaar was linked to a money laundering case in Mumbai. Demanded Skype video call and transfer to verification account.",
            call_type="INCOMING",
            call_timestamp=now - timedelta(hours=2),
            status="VERIFIED",
            created_at=now - timedelta(hours=2)
        ))
        
        # Seed sample personal blocklist for user 1
        db.add(CallerBlocklist(
            user_id=1,
            normalized_number="+919876500001",
            display_name="CBI Impersonator Scammer",
            action="BLOCK",
            reason="Attempted extortion via digital arrest threat",
            created_at=now - timedelta(hours=1)
        ))
        db.commit()