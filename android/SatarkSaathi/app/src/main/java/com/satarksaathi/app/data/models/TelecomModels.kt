package com.satarksaathi.app.data.models

import kotlinx.serialization.Serializable

@Serializable
data class LostPhoneDraft(
    val brand: String = "",
    val model: String = "",
    val imei1: String = "",
    val imei2: String = "",
    val mobileNumber: String = "",
    val lossDate: String = "",
    val policeComplaintRef: String = "",
    val state: String = "",
    val district: String = "",
    val ceirStatus: String = "DRAFT_PREPARED" // DRAFT_PREPARED, PORTAL_OPENED, SUBMISSION_REPORTED
)

@Serializable
data class IMEICheckResult(
    val imei: String,
    val isValidFormat: Boolean,
    val syntaxMessage: String,
    val verificationNotice: String = "Format syntax check only. To verify official genuine device status, consult CEIR (DoT)."
)

@Serializable
data class SuspiciousCallerDraft(
    val callerNumber: String = "",
    val callTime: String = "",
    val impersonationCategory: String = "TRAI / DoT Police Impersonation",
    val description: String = "",
    val countryPrefixDetected: String = ""
)

@Serializable
data class OfficialPortalInfo(
    val name: String,
    val url: String,
    val authority: String,
    val description: String,
    val lastVerified: String = "October 2026",
    val requiredDocs: List<String>
)
