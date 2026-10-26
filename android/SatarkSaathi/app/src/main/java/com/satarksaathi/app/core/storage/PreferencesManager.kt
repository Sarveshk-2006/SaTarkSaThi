package com.satarksaathi.app.core.storage

import android.content.Context
import android.content.SharedPreferences

class PreferencesManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("satark_app_prefs", Context.MODE_PRIVATE)

    fun isOnboardingCompleted(): Boolean = prefs.getBoolean(KEY_ONBOARDING, false)

    fun setOnboardingCompleted(completed: Boolean) {
        prefs.edit().putBoolean(KEY_ONBOARDING, completed).apply()
    }

    fun getBaseUrlOverride(): String? = prefs.getString(KEY_BASE_URL_OVERRIDE, null)

    fun setBaseUrlOverride(url: String?) {
        if (url.isNullOrBlank()) {
            prefs.edit().remove(KEY_BASE_URL_OVERRIDE).apply()
        } else {
            val formatted = if (!url.endsWith("/")) "$url/" else url
            prefs.edit().putString(KEY_BASE_URL_OVERRIDE, formatted).apply()
        }
    }

    companion object {
        private const val KEY_ONBOARDING = "onboarding_completed"
        private const val KEY_BASE_URL_OVERRIDE = "custom_base_url"
    }
}
