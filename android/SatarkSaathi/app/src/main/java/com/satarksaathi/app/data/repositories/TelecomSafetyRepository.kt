package com.satarksaathi.app.data.repositories

import com.satarksaathi.app.core.security.MaskingUtils
import com.satarksaathi.app.data.models.IMEICheckResult
import com.satarksaathi.app.data.models.LostPhoneDraft
import com.satarksaathi.app.data.models.OfficialPortalInfo
import com.satarksaathi.app.data.models.SuspiciousCallerDraft

class TelecomSafetyRepository {

    private var activeLostPhoneDraft = LostPhoneDraft()
    private var activeCallerDraft = SuspiciousCallerDraft()

    val officialPortals = listOf(
        OfficialPortalInfo(
            name = "Sanchar Saathi Portal",
            url = "https://www.sancharsaathi.gov.in/",
            authority = "Department of Telecommunications (DoT), Govt of India",
            description = "Centralized citizen-centric telecom security portal to track lost phones, check registered connections, and verify genuine devices.",
            requiredDocs = listOf("Aadhaar / ID Proof", "Active mobile number for OTP")
        ),
        OfficialPortalInfo(
            name = "CEIR Device Blocking Portal",
            url = "https://www.ceir.gov.in/",
            authority = "Central Equipment Identity Register (CEIR)",
            description = "Official portal to block and trace lost or stolen mobile devices across all Indian telecom service providers (TSPs).",
            requiredDocs = listOf("Police Complaint Reference / Digital FIR", "Purchase Invoice (Bill)", "Device 15-Digit IMEI", "Alternate Contact Mobile Number")
        ),
        OfficialPortalInfo(
            name = "TAFCOP Connection Verification",
            url = "https://tafcop.sancharsaathi.gov.in/",
            authority = "Telecom Analytics for Fraud management and Consumer Protection (DoT)",
            description = "Check the number of mobile connections issued in your name and report unauthorized numbers.",
            requiredDocs = listOf("Active Mobile Number", "OTP Verification")
        ),
        OfficialPortalInfo(
            name = "Chakshu Suspected Fraud Reporting",
            url = "https://sancharsaathi.gov.in/sfc/",
            authority = "Sanchar Saathi Chakshu Facility",
            description = "Report suspected fraudulent communication via SMS, WhatsApp, or calls claiming to be from KYC, banks, or courier agencies.",
            requiredDocs = listOf("Screenshot / Message Text", "Sender ID / Caller Number", "Date and Time")
        ),
        OfficialPortalInfo(
            name = "National Cyber Crime Reporting Portal (1930)",
            url = "https://cybercrime.gov.in/",
            authority = "Ministry of Home Affairs, Govt of India",
            description = "Official national portal for reporting cyber financial fraud, impersonation, and sextortion with emergency inter-bank lien marking.",
            requiredDocs = listOf("Bank Transaction Reference (UTR)", "Bank Account Details", "Communication Screenshots")
        )
    )

    fun checkIMEISyntax(imei: String): IMEICheckResult {
        val clean = imei.trim()
        val isValid = MaskingUtils.isValidIMEIFormat(clean)
        val msg = when {
            clean.length != 15 -> "IMEI must be exactly 15 numeric digits (entered: ${clean.length} digits)."
            !clean.all { it.isDigit() } -> "IMEI contains non-numeric characters. Only digits 0-9 are valid."
            !isValid -> "IMEI failed Luhn checksum validation. Please verify the 15-digit number."
            else -> "Valid 15-digit IMEI format and Luhn checksum. Note: To verify genuine hardware registration in India, use official CEIR portal."
        }
        return IMEICheckResult(
            imei = clean,
            isValidFormat = isValid,
            syntaxMessage = msg
        )
    }

    fun saveLostPhoneDraft(draft: LostPhoneDraft) {
        activeLostPhoneDraft = draft
    }

    fun getLostPhoneDraft(): LostPhoneDraft = activeLostPhoneDraft

    fun saveCallerDraft(draft: SuspiciousCallerDraft) {
        activeCallerDraft = draft
    }

    fun getCallerDraft(): SuspiciousCallerDraft = activeCallerDraft
}
