package com.satarksaathi.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BankHelpline(
    @SerialName("bank") val bank: String,
    @SerialName("toll_free") val tollFree: String,
    @SerialName("sms_block") val smsBlock: String? = null,
    @SerialName("email") val email: String? = null,
    @SerialName("portal") val portal: String? = null,
    @SerialName("action") val action: String? = null,
    @SerialName("description") val description: String? = null
)

@Serializable
data class OfficialGuidance(
    @SerialName("primary_helpline") val primaryHelpline: String = "1930",
    @SerialName("primary_portal") val primaryPortal: String = "https://cybercrime.gov.in",
    @SerialName("disclaimer") val disclaimer: String = "",
    @SerialName("golden_hour_timeline") val goldenHourTimeline: String = ""
)

@Serializable
data class HelplinesResponse(
    @SerialName("emergency_helplines") val emergencyHelplines: List<BankHelpline> = emptyList(),
    @SerialName("official_guidance") val officialGuidance: OfficialGuidance = OfficialGuidance(),
    @SerialName("golden_hour_protocol") val goldenHourProtocol: List<String> = emptyList()
)

@Serializable
data class RecoveryCaseResponse(
    @SerialName("incident_id") val incidentId: String,
    @SerialName("title") val title: String,
    @SerialName("scam_type") val scamType: String,
    @SerialName("financial_loss") val financialLoss: Double = 0.0,
    @SerialName("currency") val currency: String = "INR",
    @SerialName("bank_name") val bankName: String? = null,
    @SerialName("transaction_ref") val transactionRef: String? = null,
    @SerialName("status") val status: String = "UNDER_REVIEW"
)
