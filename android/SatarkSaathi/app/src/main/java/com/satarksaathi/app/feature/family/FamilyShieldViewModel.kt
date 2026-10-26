package com.satarksaathi.app.feature.family

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.FamilyAlertResponse
import com.satarksaathi.app.data.models.TrustedContactResponse
import com.satarksaathi.app.data.repositories.FamilyShieldRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FamilyShieldUiState(
    val contacts: List<TrustedContactResponse> = emptyList(),
    val alerts: List<FamilyAlertResponse> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

class FamilyShieldViewModel(private val familyShieldRepository: FamilyShieldRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(FamilyShieldUiState())
    val uiState: StateFlow<FamilyShieldUiState> = _uiState.asStateFlow()

    init {
        loadFamilyData()
    }

    fun loadFamilyData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val contactsRes = familyShieldRepository.getContacts()
            val alertsRes = familyShieldRepository.getAlerts()

            val contacts = if (contactsRes is Resource.Success) contactsRes.data else emptyList()
            val alerts = if (alertsRes is Resource.Success) alertsRes.data else emptyList()

            _uiState.value = _uiState.value.copy(
                contacts = contacts,
                alerts = alerts,
                isLoading = false
            )
        }
    }

    fun addContact(name: String, phone: String, relationship: String, onSuccess: () -> Unit) {
        if (name.isBlank() || phone.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter contact name and mobile number.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = familyShieldRepository.addContact(name, phone, relationship)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Invited $name to Family Shield."
                    )
                    loadFamilyData()
                    onSuccess()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }
}
