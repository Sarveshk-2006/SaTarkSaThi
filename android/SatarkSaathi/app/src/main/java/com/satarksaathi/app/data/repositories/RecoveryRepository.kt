package com.satarksaathi.app.data.repositories

import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.HelplinesResponse
import com.satarksaathi.app.data.models.RecoveryCaseResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class RecoveryRepository(private val apiClient: ApiClient) {

    suspend fun getHelplines(): Resource<HelplinesResponse> = withContext(Dispatchers.IO) {
        try {
            val helplines = apiClient.recoveryApi.getHelplines()
            Resource.Success(helplines)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to load bank emergency helplines.")
        }
    }

    suspend fun getRecoveryCase(id: String): Resource<RecoveryCaseResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.recoveryApi.getRecoveryCase(id)
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to load recovery case details.")
        }
    }
}
