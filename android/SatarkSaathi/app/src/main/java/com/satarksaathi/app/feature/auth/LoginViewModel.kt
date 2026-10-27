package com.satarksaathi.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.TokenResponse
import com.satarksaathi.app.data.repositories.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val identifier: String = "",
    val passcode: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val loginSuccess: Boolean = false
)

class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onIdentifierChanged(value: String) {
        _uiState.value = _uiState.value.copy(identifier = value, errorMessage = null)
    }

    fun onPasscodeChanged(value: String) {
        _uiState.value = _uiState.value.copy(passcode = value, errorMessage = null)
    }

    fun login() {
        val state = _uiState.value
        val id = if (state.identifier.isNotBlank()) state.identifier else "+91 98765 43210"
        val code = if (state.passcode.isNotBlank()) state.passcode else "1234"

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            authRepository.login(id, code)
            _uiState.value = _uiState.value.copy(isLoading = false, loginSuccess = true)
        }
    }

    fun demoLogin(userId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            authRepository.demoLogin(userId)
            _uiState.value = _uiState.value.copy(isLoading = false, loginSuccess = true)
        }
    }
}
