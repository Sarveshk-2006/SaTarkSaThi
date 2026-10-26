package com.satarksaathi.app.data.repositories

import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.data.models.AnalysisResponse
import com.satarksaathi.app.data.models.TextAnalyzeRequest
import com.satarksaathi.app.data.models.URLAnalyzeRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ScannerRepository(private val apiClient: ApiClient) {

    suspend fun analyzeText(text: String, channel: String = "SMS"): Resource<AnalysisResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.scannerApi.analyzeText(TextAnalyzeRequest(text.trim(), channel))
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Analysis failed. Please check backend connection.")
        }
    }

    suspend fun analyzeUrl(url: String): Resource<AnalysisResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.scannerApi.analyzeUrl(URLAnalyzeRequest(url.trim()))
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "URL analysis failed. Please verify the URL.")
        }
    }
}
