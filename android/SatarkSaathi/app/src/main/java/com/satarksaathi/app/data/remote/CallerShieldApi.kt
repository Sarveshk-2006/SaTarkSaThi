package com.satarksaathi.app.data.remote

import com.satarksaathi.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface CallerShieldApi {

    @GET("v1/caller-intelligence/lookup")
    suspend fun lookupCaller(
        @Query("phone_number") phoneNumber: String,
        @Query("user_id") userId: Int = 1
    ): Response<CallerLookupDto>

    @POST("v1/caller-intelligence/reports")
    suspend fun submitReport(
        @Body report: CallerReportRequest,
        @Query("user_id") userId: Int = 1
    ): Response<CallerReportDto>

    @POST("v1/caller-intelligence/feedback")
    suspend fun sendFeedback(
        @Body feedback: CallerFeedbackRequest,
        @Query("user_id") userId: Int = 1
    ): Response<Map<String, String>>

    @GET("v1/caller-intelligence/blocklist")
    suspend fun getBlocklist(
        @Query("user_id") userId: Int = 1
    ): Response<List<CallerBlocklistDto>>

    @POST("v1/caller-intelligence/blocklist")
    suspend fun addToBlocklist(
        @Body request: CallerBlocklistRequest,
        @Query("user_id") userId: Int = 1
    ): Response<Map<String, String>>

    @DELETE("v1/caller-intelligence/blocklist")
    suspend fun removeFromBlocklist(
        @Query("phone_number") phoneNumber: String,
        @Query("user_id") userId: Int = 1
    ): Response<Map<String, String>>

    @GET("v1/caller-intelligence/threats")
    suspend fun getTopThreats(
        @Query("limit") limit: Int = 10
    ): Response<List<CallerLookupDto>>

    @GET("v1/caller-intelligence/stats")
    suspend fun getStats(): Response<CallerStatsDto>
}
