package com.satarksaathi.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TrustedContactResponse(
    @SerialName("id") val id: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("name") val name: String,
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("relationship") val relationship: String,
    @SerialName("alert_level") val alertLevel: String = "ALL_ALERTS",
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("is_primary") val isPrimary: Boolean = false,
    @SerialName("consent_granted") val consentGranted: Boolean = true,
    @SerialName("contact_consent_status") val contactConsentStatus: String = "PENDING"
)

@Serializable
data class TrustedContactCreate(
    @SerialName("name") val name: String,
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("relationship") val relationship: String,
    @SerialName("alert_level") val alertLevel: String = "ALL_ALERTS",
    @SerialName("is_primary") val isPrimary: Boolean = false
)

@Serializable
data class FamilyAlertResponse(
    @SerialName("id") val id: Int,
    @SerialName("incident_id") val incidentId: String? = null,
    @SerialName("threat_title") val threatTitle: String,
    @SerialName("message_content") val messageContent: String,
    @SerialName("risk_level") val riskLevel: String,
    @SerialName("recommended_action") val recommendedAction: String? = null,
    @SerialName("delivery_channel") val deliveryChannel: String = "IN_APP_SIMULATION",
    @SerialName("status") val status: String = "DELIVERED",
    @SerialName("delivered_at") val deliveredAt: String? = null
)
