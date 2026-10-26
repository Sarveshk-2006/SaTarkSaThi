package com.satarksaathi.app.data.repositories

import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.FamilyAlertResponse
import com.satarksaathi.app.data.models.TrustedContactCreate
import com.satarksaathi.app.data.models.TrustedContactResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FamilyShieldRepository(private val apiClient: ApiClient) {

    suspend fun getContacts(): Resource<List<TrustedContactResponse>> = withContext(Dispatchers.IO) {
        try {
            val contacts = apiClient.familyShieldApi.getContacts()
            Resource.Success(contacts)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to load trusted contacts.")
        }
    }

    suspend fun addContact(name: String, phone: String, relationship: String): Resource<TrustedContactResponse> = withContext(Dispatchers.IO) {
        try {
            val created = apiClient.familyShieldApi.addContact(
                TrustedContactCreate(
                    name = name.trim(),
                    phoneNumber = phone.trim(),
                    relationship = relationship.trim()
                )
            )
            Resource.Success(created)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to add trusted contact.")
        }
    }

    suspend fun getAlerts(): Resource<List<FamilyAlertResponse>> = withContext(Dispatchers.IO) {
        try {
            val alerts = apiClient.familyShieldApi.getAlerts()
            Resource.Success(alerts)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to load family safety alerts.")
        }
    }
}
