package com.satarksaathi.app.feature.scanner

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.AnalysisResponse
import com.satarksaathi.app.data.models.IncidentCreate
import com.satarksaathi.app.data.models.IncidentResponse
import com.satarksaathi.app.data.repositories.IncidentRepository
import com.satarksaathi.app.data.repositories.ScannerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ScannerUiState(
    val inputText: String = "",
    val inputUrl: String = "",
    val selectedChannel: String = "SMS",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val analysisResult: AnalysisResponse? = null,
    val caseCreatedMessage: String? = null
)

class ScannerViewModel(
    private val scannerRepository: ScannerRepository,
    private val incidentRepository: IncidentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScannerUiState())
    val uiState: StateFlow<ScannerUiState> = _uiState.asStateFlow()

    fun onTextChanged(text: String) {
        _uiState.value = _uiState.value.copy(inputText = text, errorMessage = null)
    }

    fun onUrlChanged(url: String) {
        _uiState.value = _uiState.value.copy(inputUrl = url, errorMessage = null)
    }

    fun onChannelSelected(channel: String) {
        _uiState.value = _uiState.value.copy(selectedChannel = channel)
    }

    fun analyzeText(onSuccess: () -> Unit) {
        val text = _uiState.value.inputText.trim()
        if (text.length < 5) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter at least 5 characters to analyze.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = scannerRepository.analyzeText(text, _uiState.value.selectedChannel)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        analysisResult = res.data
                    )
                    onSuccess()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }

    fun analyzeUrl(onSuccess: () -> Unit) {
        val url = _uiState.value.inputUrl.trim()
        if (url.length < 5) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid URL to analyze.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = scannerRepository.analyzeUrl(url)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        analysisResult = res.data
                    )
                    onSuccess()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }

    fun logAsCase(onComplete: (String) -> Unit) {
        val res = _uiState.value.analysisResult ?: return
        viewModelScope.launch {
            val incident = IncidentCreate(
                title = "${res.verdict} Alert",
                scamType = res.inputType.ifBlank { "Scam Threat" },
                description = _uiState.value.inputText.ifBlank { _uiState.value.inputUrl },
                financialLoss = 0.0,
                severity = res.riskLevel,
                riskLevel = res.riskLevel
            )
            when (val created = incidentRepository.createIncident(incident)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(caseCreatedMessage = "Created Case #${created.data.incidentId}")
                    onComplete(created.data.incidentId)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(errorMessage = created.message)
                }
                else -> Unit
            }
        }
    }
}
