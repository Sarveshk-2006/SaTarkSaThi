package com.satarksaathi.app.feature.incidents

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.AuditEventResponse
import com.satarksaathi.app.data.models.IncidentResponse
import com.satarksaathi.app.data.repositories.IncidentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class IncidentUiState(
    val incidents: List<IncidentResponse> = emptyList(),
    val selectedIncident: IncidentResponse? = null,
    val auditEvents: List<AuditEventResponse> = emptyList(),
    val searchQuery: String = "",
    val riskFilter: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class IncidentViewModel(private val incidentRepository: IncidentRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(IncidentUiState())
    val uiState: StateFlow<IncidentUiState> = _uiState.asStateFlow()

    init {
        loadIncidents()
    }

    fun loadIncidents() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = incidentRepository.getIncidents(
                search = _uiState.value.searchQuery,
                riskLevel = _uiState.value.riskFilter
            )) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(incidents = res.data, isLoading = false)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }

    fun onSearchChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadIncidents()
    }

    fun onRiskFilterSelected(risk: String?) {
        _uiState.value = _uiState.value.copy(riskFilter = risk)
        loadIncidents()
    }

    fun loadIncidentDetail(incidentId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val detailRes = incidentRepository.getIncidentDetail(incidentId)
            val auditRes = incidentRepository.getIncidentAudit(incidentId)

            val detail = if (detailRes is Resource.Success) detailRes.data else null
            val audits = if (auditRes is Resource.Success) auditRes.data else emptyList()

            _uiState.value = _uiState.value.copy(
                selectedIncident = detail,
                auditEvents = audits,
                isLoading = false,
                errorMessage = if (detail == null) "Unable to load case #$incidentId." else null
            )
        }
    }
}
