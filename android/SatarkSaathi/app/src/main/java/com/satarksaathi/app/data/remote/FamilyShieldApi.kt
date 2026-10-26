package com.satarksaathi.app.data.remote

import com.satarksaathi.app.data.models.FamilyAlertResponse
import com.satarksaathi.app.data.models.TrustedContactCreate
import com.satarksaathi.app.data.models.TrustedContactResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface FamilyShieldApi {
    @GET("contacts")
    suspend fun getContacts(): List<TrustedContactResponse>

    @POST("contacts")
    suspend fun addContact(@Body request: TrustedContactCreate): TrustedContactResponse

    @GET("alerts")
    suspend fun getAlerts(): List<FamilyAlertResponse>
}
