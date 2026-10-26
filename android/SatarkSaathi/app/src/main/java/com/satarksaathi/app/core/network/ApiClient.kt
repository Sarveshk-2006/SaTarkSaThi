package com.satarksaathi.app.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.satarksaathi.app.core.storage.TokenManager
import com.satarksaathi.app.data.remote.AuthApi
import com.satarksaathi.app.data.remote.FamilyShieldApi
import com.satarksaathi.app.data.remote.IncidentApi
import com.satarksaathi.app.data.remote.RecoveryApi
import com.satarksaathi.app.data.remote.ScannerApi
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

class ApiClient(private val tokenManager: TokenManager) {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
        encodeDefaults = true
    }

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenManager))
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private fun getRetrofit(): Retrofit {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(NetworkConfig.getBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }

    val authApi: AuthApi get() = getRetrofit().create(AuthApi::class.java)
    val scannerApi: ScannerApi get() = getRetrofit().create(ScannerApi::class.java)
    val incidentApi: IncidentApi get() = getRetrofit().create(IncidentApi::class.java)
    val familyShieldApi: FamilyShieldApi get() = getRetrofit().create(FamilyShieldApi::class.java)
    val recoveryApi: RecoveryApi get() = getRetrofit().create(RecoveryApi::class.java)
}
