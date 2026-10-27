package com.satarksaathi.app.core.telecom

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.core.app.NotificationCompat
import com.satarksaathi.app.MainActivity
import com.satarksaathi.app.R
import com.satarksaathi.app.core.network.ApiClient
import com.satarksaathi.app.core.security.MaskingUtils
import com.satarksaathi.app.data.remote.CallerShieldApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Native Android CallScreeningService for Satark Caller Shield.
 * Screens incoming calls against local reputation intelligence within Android's 5-second deadline.
 * Posts immediate citizen fraud warnings before call is answered.
 */
class SatarkCallScreeningService : CallScreeningService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var cache: LocalCallerCache

    override fun onCreate() {
        super.onCreate()
        cache = LocalCallerCache(applicationContext)
        createNotificationChannel()
    }

    override fun onScreenCall(callDetails: Call.Details) {
        val rawNumber = callDetails.handle?.schemeSpecificPart ?: ""
        val normalized = LocalCallerCache.normalizeNumber(rawNumber)

        // 1. Immediate local lookup (< 10ms)
        val cached = cache.get(normalized)

        // 2. Determine CallResponse
        val responseBuilder = CallResponse.Builder()

        val shouldBlock = cached != null && (cached.isBlocked || (cached.riskScore >= 95 && cache.isAutoBlockEnabled()))

        if (shouldBlock) {
            responseBuilder.setDisallowCall(true)
            responseBuilder.setRejectCall(true)
            responseBuilder.setSkipCallLog(false)
            responseBuilder.setSkipNotification(false)
        } else {
            responseBuilder.setDisallowCall(false)
            responseBuilder.setRejectCall(false)
            responseBuilder.setSkipCallLog(false)
            responseBuilder.setSkipNotification(false)
        }

        // Return immediately to Android Telecom Subsystem
        respondToCall(callDetails, responseBuilder.build())

        // 3. Post immediate heads-up fraud alert if suspicious/high risk
        if (cached != null && cached.riskScore >= 40) {
            showCallerWarningNotification(
                rawNumber = rawNumber,
                displayTag = cached.displayTag,
                riskScore = cached.riskScore,
                riskLevel = cached.riskLevel,
                action = if (shouldBlock) "BLOCKED" else "WARNING"
            )
        }

        // 4. Async background enrichment without blocking call
        serviceScope.launch {
            try {
                val api = ApiClient.create(applicationContext).create(CallerShieldApi::class.java)
                val response = api.lookupCaller(phoneNumber = normalized, userId = 1)
                if (response.isSuccessful && response.body() != null) {
                    val dto = response.body()!!
                    cache.put(dto)
                }
            } catch (e: Exception) {
                // Network unavailable or server offline; cached data remains authoritative
            }
        }
    }

    private fun showCallerWarningNotification(
        rawNumber: String,
        displayTag: String,
        riskScore: Int,
        riskLevel: String,
        action: String
    ) {
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("EXTRA_INCOMING_CALLER", rawNumber)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = if (action == "BLOCKED") {
            "🛑 Call Blocked: $displayTag"
        } else {
            "🚨 Caller Alert: $displayTag"
        }

        val content = "Risk Score: $riskScore/100 ($riskLevel). Suspected telecom scam. Do NOT share OTPs."

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_satark_logo)
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Caller Shield Fraud Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Real-time incoming caller fraud warnings and scam detection."
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "satark_caller_shield_alerts"
        const val NOTIFICATION_ID = 9001
    }
}
