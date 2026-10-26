package com.satarksaathi.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class IncidentCreate(
    @SerialName("title") val title: String,
    @SerialName("scam_type") val scamType: String,
    @SerialName("description") val description: String,
    @SerialName("financial_loss") val financialLoss: Double = 0.0,
    @SerialName("currency") val currency: String = "INR",
    @SerialName("bank_name") val bankName: String? = null,
    @SerialName("transaction_ref") val transactionRef: String? = null,
    @SerialName("suspect_contact") val suspectContact: String? = null,
    @SerialName("severity") val severity: String = "CAUTION",
    @SerialName("risk_level") val riskLevel: String = "MEDIUM",
    @SerialName("analysis_id") val analysisId: Int? = null
)

@Serializable
data class IncidentResponse(
    @SerialName("id") val id: Int,
    @SerialName("incident_id") val incidentId: String,
    @SerialName("user_id") val userId: Int,
    @SerialName("analysis_id") val analysisId: Int? = null,
    @SerialName("title") val title: String,
    @SerialName("scam_type") val scamType: String,
    @SerialName("description") val description: String,
    @SerialName("financial_loss") val financialLoss: Double = 0.0,
    @SerialName("currency") val currency: String = "INR",
    @SerialName("bank_name") val bankName: String? = null,
    @SerialName("transaction_ref") val transactionRef: String? = null,
    @SerialName("suspect_contact") val suspectContact: String? = null,
    @SerialName("severity") val severity: String = "CAUTION",
    @SerialName("risk_level") val riskLevel: String = "MEDIUM",
    @SerialName("risk_score") val riskScore: Int? = null,
    @SerialName("status") val status: String = "UNDER_REVIEW",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class AuditEventResponse(
    @SerialName("id") val id: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("event_type") val eventType: String,
    @SerialName("entity_type") val entityType: String,
    @SerialName("entity_id") val entityId: String,
    @SerialName("description") val description: String,
    @SerialName("timestamp") val timestamp: String? = null
)
