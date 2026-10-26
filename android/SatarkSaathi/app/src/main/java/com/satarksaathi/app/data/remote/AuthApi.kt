package com.satarksaathi.app.data.remote

import com.satarksaathi.app.data.models.DemoTokenRequest
import com.satarksaathi.app.data.models.LoginRequest
import com.satarksaathi.app.data.models.TokenResponse
import com.satarksaathi.app.data.models.UserProfileResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): TokenResponse

    @POST("auth/demo-token")
    suspend fun issueDemoToken(@Body request: DemoTokenRequest): TokenResponse

    @GET("auth/me")
    suspend fun getProfile(): UserProfileResponse

    @POST("auth/logout")
    suspend fun logout(): Map<String, String>
}
