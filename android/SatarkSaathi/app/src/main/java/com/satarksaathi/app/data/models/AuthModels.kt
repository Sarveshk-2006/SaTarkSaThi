package com.satarksaathi.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    @SerialName("identifier") val identifier: String,
    @SerialName("passcode") val passcode: String
)

@Serializable
data class DemoTokenRequest(
    @SerialName("user_id") val userId: Int
)

@Serializable
data class TokenResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String = "bearer",
    @SerialName("expires_in") val expiresIn: Int? = null,
    @SerialName("user_id") val userId: Int,
    @SerialName("role") val role: String = "USER",
    @SerialName("full_name") val fullName: String
)

@Serializable
data class UserProfileResponse(
    @SerialName("id") val id: Int,
    @SerialName("full_name") val fullName: String,
    @SerialName("phone_number") val phoneNumber: String,
    @SerialName("email") val email: String? = null,
    @SerialName("role") val role: String = "USER"
)
