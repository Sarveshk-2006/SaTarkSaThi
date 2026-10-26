package com.satarksaathi.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TextAnalyzeRequest(
    @SerialName("text") val text: String,
    @SerialName("channel") val channel: String = "SMS"
)

@Serializable
data class URLAnalyzeRequest(
    @SerialName("url") val url: String
)

@Serializable
data class DetectedSignalResponse(
    @SerialName("reason_code") val reasonCode: String = "",
    @SerialName("signal_type") val signalType: String,
    @SerialName("severity") val severity: String,
    @SerialName("reason") val reason: String,
    @SerialName("excerpt") val excerpt: String? = null,
    @SerialName("weight") val weight: Double = 1.0,
    @SerialName("category") val category: String? = null
)

@Serializable
data class AnalysisResponse(
    @SerialName("incident_id") val incidentId: String = "",
    @SerialName("input_type") val inputType: String = "TEXT",
    @SerialName("risk_level") val riskLevel: String = "LOW",
    @SerialName("risk_score") val riskScore: Int = 0,
    @SerialName("policy_tier") val policyTier: String = "GREEN",
    @SerialName("confidence_label") val confidenceLabel: String = "HIGH",
    @SerialName("verdict") val verdict: String = "Analysis Complete",
    @SerialName("plain_language_summary") val plainLanguageSummary: String = "",
    @SerialName("detected_signals") val detectedSignals: List<DetectedSignalResponse> = emptyList(),
    @SerialName("counter_signals") val counterSignals: List<DetectedSignalResponse> = emptyList(),
    @SerialName("reason_codes") val reasonCodes: List<String> = emptyList(),
    @SerialName("supporting_evidence") val supportingEvidence: List<String> = emptyList(),
    @SerialName("recommended_actions") val recommendedActions: List<String> = emptyList(),
    @SerialName("recommended_action") val recommendedAction: String? = null,
    @SerialName("verification_steps") val verificationSteps: List<String> = emptyList(),
    @SerialName("should_alert_family") val shouldAlertFamily: Boolean = false,
    @SerialName("ai_provider") val aiProvider: String = "none",
    @SerialName("analysis_mode") val analysisMode: String = "rule_based",
    @SerialName("limitations") val limitations: List<String> = emptyList()
)
