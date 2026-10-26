package com.satarksaathi.app.data.remote

import com.satarksaathi.app.data.models.AuditEventResponse
import com.satarksaathi.app.data.models.IncidentCreate
import com.satarksaathi.app.data.models.IncidentResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface IncidentApi {
    @GET("incidents")
    suspend fun getIncidents(
        @Query("search") search: String? = null,
        @Query("scam_type") scamType: String? = null,
        @Query("risk_level") riskLevel: String? = null,
        @Query("status") status: String? = null
    ): List<IncidentResponse>

    @GET("incidents/{incident_id}")
    suspend fun getIncidentDetail(@Path("incident_id") incidentId: String): IncidentResponse

    @POST("incidents")
    suspend fun createIncident(@Body request: IncidentCreate): IncidentResponse

    @GET("incidents/{incident_id}/audit")
    suspend fun getIncidentAudit(@Path("incident_id") incidentId: String): List<AuditEventResponse>
}
