package com.satarksaathi.app.data.remote

import com.satarksaathi.app.data.models.AnalysisResponse
import com.satarksaathi.app.data.models.TextAnalyzeRequest
import com.satarksaathi.app.data.models.URLAnalyzeRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ScannerApi {
    @POST("v1/analyze")
    suspend fun analyzeText(@Body request: TextAnalyzeRequest): AnalysisResponse

    @POST("v1/analyze/url")
    suspend fun analyzeUrl(@Body request: URLAnalyzeRequest): AnalysisResponse

    @GET("v1/health")
    suspend fun getHealth(): Map<String, String>
}
