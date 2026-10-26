package com.satarksaathi.app.feature.telecom

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.BankHelpline
import com.satarksaathi.app.data.models.IMEICheckResult
import com.satarksaathi.app.data.models.LostPhoneDraft
import com.satarksaathi.app.data.models.OfficialPortalInfo
import com.satarksaathi.app.data.models.SuspiciousCallerDraft
import com.satarksaathi.app.data.repositories.RecoveryRepository
import com.satarksaathi.app.data.repositories.TelecomSafetyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TelecomUiState(
    val imeiInput: String = "",
    val imeiResult: IMEICheckResult? = null,
    val lostPhoneDraft: LostPhoneDraft = LostPhoneDraft(),
    val callerDraft: SuspiciousCallerDraft = SuspiciousCallerDraft(),
    val bankHelplines: List<BankHelpline> = emptyList(),
    val officialPortals: List<OfficialPortalInfo> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class TelecomSafetyViewModel(
    private val telecomSafetyRepository: TelecomSafetyRepository,
    private val recoveryRepository: RecoveryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TelecomUiState())
    val uiState: StateFlow<TelecomUiState> = _uiState.asStateFlow()

    init {
        loadPortalsAndHelplines()
    }

    fun loadPortalsAndHelplines() {
        _uiState.value = _uiState.value.copy(
            officialPortals = telecomSafetyRepository.officialPortals,
            lostPhoneDraft = telecomSafetyRepository.getLostPhoneDraft(),
            callerDraft = telecomSafetyRepository.getCallerDraft(),
            isLoading = true
        )

        viewModelScope.launch {
            when (val res = recoveryRepository.getHelplines()) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        bankHelplines = res.data.emergencyHelplines,
                        isLoading = false
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = res.message
                    )
                }
                else -> Unit
            }
        }
    }

    fun onImeiInputChanged(value: String) {
        val clean = value.filter { it.isDigit() }.take(15)
        val result = if (clean.length == 15) telecomSafetyRepository.checkIMEISyntax(clean) else null
        _uiState.value = _uiState.value.copy(imeiInput = clean, imeiResult = result)
    }

    fun updateLostPhoneDraft(draft: LostPhoneDraft) {
        telecomSafetyRepository.saveLostPhoneDraft(draft)
        _uiState.value = _uiState.value.copy(lostPhoneDraft = draft)
    }

    fun updateCallerDraft(draft: SuspiciousCallerDraft) {
        telecomSafetyRepository.saveCallerDraft(draft)
        _uiState.value = _uiState.value.copy(callerDraft = draft)
    }
}
