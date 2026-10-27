package com.satarksaathi.app.data.repositories

import android.content.Context
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.core.telecom.LocalCallerCache
import com.satarksaathi.app.data.models.*
import com.satarksaathi.app.data.remote.CallerShieldApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class CallerShieldRepository(
    private val api: CallerShieldApi,
    private val context: Context
) {
    private val cache = LocalCallerCache(context)

    fun lookupCaller(phoneNumber: String, userId: Int = 1): Flow<Resource<CallerLookupDto>> = flow {
        emit(Resource.Loading)

        val normalized = LocalCallerCache.normalizeNumber(phoneNumber)
        // 1. Emit cached data immediately if present
        cache.get(normalized)?.let { cached ->
            emit(Resource.Success(cached))
        }

        // 2. Fetch fresh intelligence from backend
        try {
            val response = api.lookupCaller(phoneNumber = normalized, userId = userId)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                cache.put(dto)
                emit(Resource.Success(dto))
            } else if (cache.get(normalized) == null) {
                emit(Resource.Error("Caller lookup returned ${response.code()}"))
            }
        } catch (e: Exception) {
            if (cache.get(normalized) == null) {
                // If offline and not in cache, emit offline safe default
                emit(
                    Resource.Success(
                        CallerLookupDto(
                            phoneNumber = phoneNumber,
                            normalizedNumber = normalized,
                            displayTag = "Offline Reputation Check",
                            category = "UNKNOWN",
                            riskScore = 10,
                            riskLevel = "UNKNOWN",
                            action = "ALLOW",
                            ibmSummary = "Device offline. Displaying local cache baseline.",
                            recommendedAction = "Never disclose OTPs, NetBanking passwords, or PINs."
                        )
                    )
                )
            }
        }
    }.flowOn(Dispatchers.IO)

    fun submitReport(request: CallerReportRequest, userId: Int = 1): Flow<Resource<CallerReportDto>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.submitReport(report = request, userId = userId)
            if (res.isSuccessful && res.body() != null) {
                emit(Resource.Success(res.body()!!))
            } else {
                emit(Resource.Error("Failed to submit report: HTTP ${res.code()}"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Network error submitting report: ${e.message}"))
        }
    }.flowOn(Dispatchers.IO)

    fun sendFeedback(phoneNumber: String, isSpam: Boolean, userId: Int = 1): Flow<Resource<Boolean>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.sendFeedback(CallerFeedbackRequest(phoneNumber, isSpam), userId = userId)
            if (res.isSuccessful) {
                emit(Resource.Success(true))
            } else {
                emit(Resource.Error("Failed to record feedback"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Network error"))
        }
    }.flowOn(Dispatchers.IO)

    fun getBlocklist(userId: Int = 1): Flow<Resource<List<CallerBlocklistDto>>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.getBlocklist(userId = userId)
            if (res.isSuccessful && res.body() != null) {
                emit(Resource.Success(res.body()!!))
            } else {
                emit(Resource.Error("Failed to load blocklist: ${res.code()}"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to load blocklist"))
        }
    }.flowOn(Dispatchers.IO)

    fun addToBlocklist(
        phoneNumber: String,
        action: String = "BLOCK",
        displayName: String? = null,
        reason: String? = null,
        userId: Int = 1
    ): Flow<Resource<Boolean>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.addToBlocklist(
                CallerBlocklistRequest(phoneNumber, action, displayName, reason),
                userId = userId
            )
            if (res.isSuccessful) {
                emit(Resource.Success(true))
            } else {
                emit(Resource.Error("Failed to add to blocklist"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to update blocklist"))
        }
    }.flowOn(Dispatchers.IO)

    fun removeFromBlocklist(phoneNumber: String, userId: Int = 1): Flow<Resource<Boolean>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.removeFromBlocklist(phoneNumber, userId = userId)
            if (res.isSuccessful) {
                emit(Resource.Success(true))
            } else {
                emit(Resource.Error("Failed to remove number"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to remove number"))
        }
    }.flowOn(Dispatchers.IO)

    fun getTopThreats(): Flow<Resource<List<CallerLookupDto>>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.getTopThreats(limit = 10)
            if (res.isSuccessful && res.body() != null) {
                emit(Resource.Success(res.body()!!))
            } else {
                emit(Resource.Error("Failed to load threats"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Network error"))
        }
    }.flowOn(Dispatchers.IO)

    fun getStats(): Flow<Resource<CallerStatsDto>> = flow {
        emit(Resource.Loading)
        try {
            val res = api.getStats()
            if (res.isSuccessful && res.body() != null) {
                emit(Resource.Success(res.body()!!))
            } else {
                emit(Resource.Error("Failed to load stats"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Network error"))
        }
    }.flowOn(Dispatchers.IO)

    fun isAutoBlockEnabled(): Boolean = cache.isAutoBlockEnabled()
    fun setAutoBlockEnabled(enabled: Boolean) = cache.setAutoBlockEnabled(enabled)
}
