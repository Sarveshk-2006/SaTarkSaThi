package com.satarksaathi.app.data.repositories

import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.AuditEventResponse
import com.satarksaathi.app.data.models.IncidentCreate
import com.satarksaathi.app.data.models.IncidentResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class IncidentRepository(private val apiClient: ApiClient) {

    suspend fun getIncidents(
        search: String? = null,
        scamType: String? = null,
        riskLevel: String? = null,
        status: String? = null
    ): Resource<List<IncidentResponse>> = withContext(Dispatchers.IO) {
        try {
            val list = apiClient.incidentApi.getIncidents(
                search = search?.ifBlank { null },
                scamType = scamType?.ifBlank { null },
                riskLevel = riskLevel?.ifBlank { null },
                status = status?.ifBlank { null }
            )
            Resource.Success(list)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to load incidents.")
        }
    }

    suspend fun getIncidentDetail(id: String): Resource<IncidentResponse> = withContext(Dispatchers.IO) {
        try {
            val detail = apiClient.incidentApi.getIncidentDetail(id)
            Resource.Success(detail)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Incident record not found or access denied.")
        }
    }

    suspend fun createIncident(incident: IncidentCreate): Resource<IncidentResponse> = withContext(Dispatchers.IO) {
        try {
            val created = apiClient.incidentApi.createIncident(incident)
            Resource.Success(created)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to log incident.")
        }
    }

    suspend fun getIncidentAudit(id: String): Resource<List<AuditEventResponse>> = withContext(Dispatchers.IO) {
        try {
            val audits = apiClient.incidentApi.getIncidentAudit(id)
            Resource.Success(audits)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to load incident audit trail.")
        }
    }
}
