package com.satarksaathi.app.core.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Onboarding : Screen("onboarding")
    data object Login : Screen("login")
    data object Home : Screen("home")
    data object TelecomSafety : Screen("telecom_safety")
    data object ReportSuspicious : Screen("report_suspicious")
    data object LostOrStolenPhone : Screen("lost_stolen_phone")
    data object IMEIVerificationGuide : Screen("imei_verification")
    data object MobileConnectionSafety : Screen("mobile_connection_safety")
    data object SuspiciousCallerReport : Screen("suspicious_caller_report")
    data object TrustedBankContacts : Screen("trusted_bank_contacts")
    data object ScamScanner : Screen("scam_scanner")
    data object ScanResult : Screen("scan_result")
    data object FamilyShield : Screen("family_shield")
    data object IncidentHistory : Screen("incident_history")
    data object IncidentDetail : Screen("incident_detail/{incidentId}") {
        fun createRoute(incidentId: String) = "incident_detail/$incidentId"
    }
    data object RecoveryAssistant : Screen("recovery_assistant")
    data object OfficialServiceHandoff : Screen("official_handoff")
    data object Notifications : Screen("notifications")
    data object Profile : Screen("profile")
    data object PrivacyAndPermissions : Screen("privacy_permissions")
    data object Settings : Screen("settings")
    data object CallerShield : Screen("caller_shield")
}
