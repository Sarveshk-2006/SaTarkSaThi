package com.satarksaathi.app.data.repositories

import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.core.storage.TokenManager
import com.satarksaathi.app.data.models.DemoTokenRequest
import com.satarksaathi.app.data.models.LoginRequest
import com.satarksaathi.app.data.models.TokenResponse
import com.satarksaathi.app.data.models.UserProfileResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val apiClient: ApiClient,
    private val tokenManager: TokenManager
) {
    suspend fun login(identifier: String, passcode: String): Resource<TokenResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.authApi.login(LoginRequest(identifier, passcode))
            tokenManager.saveAuth(
                token = response.accessToken,
                userId = response.userId,
                fullName = response.fullName,
                role = response.role
            )
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Authentication failed. Check your phone number or passcode.")
        }
    }

    suspend fun demoLogin(userId: Int): Resource<TokenResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.authApi.issueDemoToken(DemoTokenRequest(userId))
            tokenManager.saveAuth(
                token = response.accessToken,
                userId = response.userId,
                fullName = response.fullName,
                role = response.role
            )
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Demo login failed. Verify backend connectivity.")
        }
    }

    suspend fun getProfile(): Resource<UserProfileResponse> = withContext(Dispatchers.IO) {
        try {
            val profile = apiClient.authApi.getProfile()
            Resource.Success(profile)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Unable to fetch user profile.")
        }
    }

    suspend fun logout(): Resource<Unit> = withContext(Dispatchers.IO) {
        try {
            apiClient.authApi.logout()
        } catch (_: Exception) {
            // Advisory logout: proceed to clear local token regardless of network failure
        }
        tokenManager.clear()
        Resource.Success(Unit)
    }

    fun isAuthenticated(): Boolean = tokenManager.isAuthenticated()
    fun getCurrentUserId(): Int = tokenManager.getUserId()
    fun getCurrentFullName(): String = tokenManager.getFullName()
    fun getCurrentRole(): String = tokenManager.getRole()
}
