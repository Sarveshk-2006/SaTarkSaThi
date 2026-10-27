package com.satarksaathi.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CallerLookupDto(
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("normalized_number") val normalizedNumber: String = "",
    @SerialName("display_tag") val displayTag: String = "Unknown",
    @SerialName("category") val category: String = "UNKNOWN",
    @SerialName("risk_score") val riskScore: Int = 0,
    @SerialName("risk_level") val riskLevel: String = "UNKNOWN",
    @SerialName("confidence") val confidence: String = "MEDIUM",
    @SerialName("action") val action: String = "ALLOW", // "ALLOW", "WARN", "BLOCK"
    @SerialName("is_blocked") val isBlocked: Boolean = false,
    @SerialName("carrier_verified") val carrierVerified: Boolean = false,
    @SerialName("carrier_name") val carrierName: String? = null,
    @SerialName("is_business") val isBusiness: Boolean = false,
    @SerialName("business_name") val businessName: String? = null,
    @SerialName("total_reports") val totalReports: Int = 0,
    @SerialName("verified_reports") val verifiedReports: Int = 0,
    @SerialName("ibm_summary") val ibmSummary: String? = null,
    @SerialName("evidence_signals") val evidenceSignals: List<String> = emptyList(),
    @SerialName("recommended_action") val recommendedAction: String? = null,
    @SerialName("last_reported_at") val lastReportedAt: String? = null
)

@Serializable
data class CallerReportRequest(
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("category") val category: String,
    @SerialName("claimed_caller_name") val claimedCallerName: String? = null,
    @SerialName("description") val description: String? = null,
    @SerialName("call_type") val callType: String = "INCOMING"
)

@Serializable
data class CallerReportDto(
    @SerialName("status") val status: String,
    @SerialName("message") val message: String,
    @SerialName("normalized_number") val normalizedNumber: String,
    @SerialName("risk_score") val riskScore: Int,
    @SerialName("risk_level") val riskLevel: String,
    @SerialName("total_reports") val totalReports: Int
)

@Serializable
data class CallerFeedbackRequest(
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("is_spam") val isSpam: Boolean = true
)

@Serializable
data class CallerBlocklistRequest(
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("action") val action: String = "BLOCK",
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("reason") val reason: String? = null
)

@Serializable
data class CallerBlocklistDto(
    @SerialName("id") val id: Int,
    @SerialName("normalized_number") val normalizedNumber: String,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("action") val action: String = "BLOCK",
    @SerialName("reason") val reason: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class CallerStatsDto(
    @SerialName("total_screened_numbers") val totalScreenedNumbers: Int = 0,
    @SerialName("active_threat_numbers") val activeThreatNumbers: Int = 0,
    @SerialName("community_reports_count") val communityReportsCount: Int = 0,
    @SerialName("personal_blocked_count") val personalBlockedCount: Int = 0,
    @SerialName("ibm_ai_status") val ibmAiStatus: String = "UNKNOWN",
    @SerialName("analysis_provider") val analysisProvider: String = "Deterministic Local Rule Engine"
)
