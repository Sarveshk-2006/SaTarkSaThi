package com.satarksaathi.app

import android.app.Application
import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.NetworkConfig
import com.satarksaathi.app.core.storage.PreferencesManager
import com.satarksaathi.app.core.storage.TokenManager
import com.satarksaathi.app.data.repositories.AuthRepository
import com.satarksaathi.app.data.repositories.FamilyShieldRepository
import com.satarksaathi.app.data.repositories.IncidentRepository
import com.satarksaathi.app.data.repositories.RecoveryRepository
import com.satarksaathi.app.data.repositories.ScannerRepository
import com.satarksaathi.app.data.repositories.TelecomSafetyRepository

class SatarkSaathiApp : Application() {

    lateinit var tokenManager: TokenManager
        private set

    lateinit var preferencesManager: PreferencesManager
        private set

    lateinit var apiClient: ApiClient
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var scannerRepository: ScannerRepository
        private set

    lateinit var incidentRepository: IncidentRepository
        private set

    lateinit var familyShieldRepository: FamilyShieldRepository
        private set

    lateinit var recoveryRepository: RecoveryRepository
        private set

    lateinit var telecomSafetyRepository: TelecomSafetyRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        tokenManager = TokenManager(this)
        preferencesManager = PreferencesManager(this)

        // Apply saved custom base URL override if present
        val savedBaseUrl = preferencesManager.getBaseUrlOverride()
        if (!savedBaseUrl.isNullOrBlank()) {
            NetworkConfig.setBaseUrlOverride(savedBaseUrl)
        }

        apiClient = ApiClient(tokenManager)
        authRepository = AuthRepository(apiClient, tokenManager)
        scannerRepository = ScannerRepository(apiClient)
        incidentRepository = IncidentRepository(apiClient)
        familyShieldRepository = FamilyShieldRepository(apiClient)
        recoveryRepository = RecoveryRepository(apiClient)
        telecomSafetyRepository = TelecomSafetyRepository()
    }

    companion object {
        lateinit var instance: SatarkSaathiApp
            private set
    }
}
