package com.satarksaathi.app.core.network

import com.satarksaathi.app.BuildConfig

object NetworkConfig {
    // 10.0.2.2 is the standard loopback IP for the host machine in the Android Emulator.
    const val DEFAULT_EMULATOR_BASE_URL = "http://10.0.2.2:8000/api/"
    const val PRODUCTION_BASE_URL = BuildConfig.BASE_URL

    private var activeUrlOverride: String? = null

    fun setBaseUrlOverride(url: String?) {
        activeUrlOverride = url
    }

    fun getBaseUrl(): String {
        return activeUrlOverride ?: PRODUCTION_BASE_URL.ifBlank { DEFAULT_EMULATOR_BASE_URL }
    }
}
