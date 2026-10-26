package com.satarksaathi.app.core.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(context: Context) {

    private val prefs: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        // Fallback for emulator environments without hardware KeyStore support
        context.getSharedPreferences("${PREFS_NAME}_fallback", Context.MODE_PRIVATE)
    }

    fun saveAuth(token: String, userId: Int, fullName: String, role: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putInt(KEY_USER_ID, userId)
            .putString(KEY_FULL_NAME, fullName)
            .putString(KEY_ROLE, role)
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUserId(): Int = prefs.getInt(KEY_USER_ID, 1)

    fun getFullName(): String = prefs.getString(KEY_FULL_NAME, "Citizen User") ?: "Citizen User"

    fun getRole(): String = prefs.getString(KEY_ROLE, "USER") ?: "USER"

    fun isAuthenticated(): Boolean = !getToken().isNullOrBlank()

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "satark_secure_session"
        private const val KEY_TOKEN = "jwt_access_token"
        private const val KEY_USER_ID = "authenticated_user_id"
        private const val KEY_FULL_NAME = "authenticated_full_name"
        private const val KEY_ROLE = "authenticated_user_role"
    }
}
