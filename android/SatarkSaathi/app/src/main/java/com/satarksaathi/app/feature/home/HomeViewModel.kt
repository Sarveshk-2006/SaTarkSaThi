package com.satarksaathi.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.IncidentResponse
import com.satarksaathi.app.data.models.UserProfileResponse
import com.satarksaathi.app.data.repositories.AuthRepository
import com.satarksaathi.app.data.repositories.FamilyShieldRepository
import com.satarksaathi.app.data.repositories.IncidentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val userName: String = "Citizen",
    val userRole: String = "USER",
    val recentIncidents: List<IncidentResponse> = emptyList(),
    val activeAlertsCount: Int = 0,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class HomeViewModel(
    private val authRepository: AuthRepository,
    private val incidentRepository: IncidentRepository,
    private val familyShieldRepository: FamilyShieldRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        val fullName = authRepository.getCurrentFullName()
        val role = authRepository.getCurrentRole()
        _uiState.value = _uiState.value.copy(userName = fullName, userRole = role, isLoading = true)

        viewModelScope.launch {
            // Load incidents
            val incidentsRes = incidentRepository.getIncidents()
            val incidents = if (incidentsRes is Resource.Success) incidentsRes.data.take(3) else emptyList()

            // Load alerts
            val alertsRes = familyShieldRepository.getAlerts()
            val alertsCount = if (alertsRes is Resource.Success) alertsRes.data.size else 0

            _uiState.value = _uiState.value.copy(
                recentIncidents = incidents,
                activeAlertsCount = alertsCount,
                isLoading = false
            )
        }
    }
}
