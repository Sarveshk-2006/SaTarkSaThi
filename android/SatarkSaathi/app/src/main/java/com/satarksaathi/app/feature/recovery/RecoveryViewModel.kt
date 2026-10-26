package com.satarksaathi.app.feature.recovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.BankHelpline
import com.satarksaathi.app.data.models.OfficialGuidance
import com.satarksaathi.app.data.repositories.RecoveryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RecoveryUiState(
    val helplines: List<BankHelpline> = emptyList(),
    val officialGuidance: OfficialGuidance = OfficialGuidance(),
    val goldenHourSteps: List<String> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class RecoveryViewModel(private val recoveryRepository: RecoveryRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(RecoveryUiState())
    val uiState: StateFlow<RecoveryUiState> = _uiState.asStateFlow()

    init {
        loadRecoveryProtocols()
    }

    fun loadRecoveryProtocols() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = recoveryRepository.getHelplines()) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        helplines = res.data.emergencyHelplines,
                        officialGuidance = res.data.officialGuidance,
                        goldenHourSteps = res.data.goldenHourProtocol,
                        isLoading = false
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }
}
