package com.satarksaathi.app.data.remote

import com.satarksaathi.app.data.models.HelplinesResponse
import com.satarksaathi.app.data.models.RecoveryCaseResponse
import retrofit2.http.GET
import retrofit2.http.Path

interface RecoveryApi {
    @GET("recovery/helplines")
    suspend fun getHelplines(): HelplinesResponse

    @GET("recovery/cases/{incident_id}")
    suspend fun getRecoveryCase(@Path("incident_id") incidentId: String): RecoveryCaseResponse
}
