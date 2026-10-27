package com.satarksaathi.app.feature.caller

import android.app.Application
import android.app.role.RoleManager
import android.content.Context
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.*
import com.satarksaathi.app.data.remote.CallerShieldApi
import com.satarksaathi.app.data.repositories.CallerShieldRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CallerShieldUiState(
    val searchNumber: String = "",
    val searchResult: Resource<CallerLookupDto>? = null,
    val topThreats: Resource<List<CallerLookupDto>> = Resource.Loading,
    val blocklist: Resource<List<CallerBlocklistDto>> = Resource.Loading,
    val stats: Resource<CallerStatsDto> = Resource.Loading,
    val isRoleGranted: Boolean = false,
    val isAutoBlockEnabled: Boolean = false,
    val activeTab: Int = 0, // 0: Live Radar, 1: Search, 2: Blocklist
    val incomingCallSimulation: CallerLookupDto? = null,
    val reportSuccessMessage: String? = null
)

class CallerShieldViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: CallerShieldRepository

    private val _uiState = MutableStateFlow(CallerShieldUiState())
    val uiState: StateFlow<CallerShieldUiState> = _uiState.asStateFlow()

    init {
        val api = ApiClient.create(application).create(CallerShieldApi::class.java)
        repository = CallerShieldRepository(api, application)
        checkScreeningRole()
        loadInitialData()
    }

    fun checkScreeningRole() {
        val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getApplication<Application>().getSystemService(RoleManager::class.java)
            roleManager?.isRoleHeld(RoleManager.ROLE_CALL_SCREENING) ?: false
        } else {
            true // Pre-Q devices have default telecom screening capability
        }
        _uiState.value = _uiState.value.copy(
            isRoleGranted = isGranted,
            isAutoBlockEnabled = repository.isAutoBlockEnabled()
        )
    }

    fun loadInitialData() {
        loadThreats()
        loadBlocklist()
        loadStats()
    }

    fun loadThreats() {
        viewModelScope.launch {
            repository.getTopThreats().collect { res ->
                _uiState.value = _uiState.value.copy(topThreats = res)
            }
        }
    }

    fun loadBlocklist() {
        viewModelScope.launch {
            repository.getBlocklist().collect { res ->
                _uiState.value = _uiState.value.copy(blocklist = res)
            }
        }
    }

    fun loadStats() {
        viewModelScope.launch {
            repository.getStats().collect { res ->
                _uiState.value = _uiState.value.copy(stats = res)
            }
        }
    }

    fun onSearchNumberChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchNumber = query)
    }

    fun searchCaller(number: String? = null) {
        val target = number ?: _uiState.value.searchNumber
        if (target.isBlank()) return

        viewModelScope.launch {
            repository.lookupCaller(target).collect { res ->
                _uiState.value = _uiState.value.copy(searchResult = res)
            }
        }
    }

    fun toggleAutoBlock(enabled: Boolean) {
        repository.setAutoBlockEnabled(enabled)
        _uiState.value = _uiState.value.copy(isAutoBlockEnabled = enabled)
    }

    fun selectTab(tabIndex: Int) {
        _uiState.value = _uiState.value.copy(activeTab = tabIndex)
    }

    fun simulateIncomingCall(caller: CallerLookupDto) {
        _uiState.value = _uiState.value.copy(incomingCallSimulation = caller)
    }

    fun dismissIncomingCallSimulation() {
        _uiState.value = _uiState.value.copy(incomingCallSimulation = null)
    }

    fun submitReport(
        phoneNumber: String,
        category: String,
        claimedName: String?,
        description: String?
    ) {
        viewModelScope.launch {
            val req = CallerReportRequest(
                phoneNumber = phoneNumber,
                category = category,
                claimedCallerName = claimedName,
                description = description
            )
            repository.submitReport(req).collect { res ->
                if (res is Resource.Success) {
                    _uiState.value = _uiState.value.copy(
                        reportSuccessMessage = "Report submitted successfully! Community reputation updated."
                    )
                    loadThreats()
                    loadStats()
                }
            }
        }
    }

    fun clearReportSuccessMessage() {
        _uiState.value = _uiState.value.copy(reportSuccessMessage = null)
    }

    fun addToBlocklist(phoneNumber: String, name: String?, reason: String?) {
        viewModelScope.launch {
            repository.addToBlocklist(phoneNumber, "BLOCK", name, reason).collect { res ->
                if (res is Resource.Success) {
                    loadBlocklist()
                    searchCaller(phoneNumber)
                }
            }
        }
    }

    fun removeFromBlocklist(phoneNumber: String) {
        viewModelScope.launch {
            repository.removeFromBlocklist(phoneNumber).collect { res ->
                if (res is Resource.Success) {
                    loadBlocklist()
                    searchCaller(phoneNumber)
                }
            }
        }
    }
}
