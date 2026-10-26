package com.satarksaathi.app.feature.telecom

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.ContactPhone
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.PhoneDisabled
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.satarksaathi.app.core.navigation.Screen
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.components.ServiceCard
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.PrimaryDark
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary
import com.satarksaathi.app.core.ui.theme.WarningAmber

@Composable
fun TelecomSafetyCenterScreen(
    onNavigate: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Telecom Safety Center",
            subtitle = "Citizen Telecom Protection & Verification"
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Citizen Security Services",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "Select a service category below to verify devices, report threats, or access official DoT portals.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            // Category A: Report Suspicious Communication
            item {
                ServiceCard(
                    title = "Report Suspicious Communication",
                    description = "Analyze deceptive SMS, WhatsApp threats, and phishing links. Prepare complaint drafts.",
                    icon = Icons.Default.Report,
                    iconTint = AlertRed,
                    iconBackground = AlertRed.copy(alpha = 0.1f),
                    badge = "CHAKSHU GUIDED",
                    badgeColor = AlertRed,
                    onClick = { onNavigate(Screen.ReportSuspicious.route) }
                )
            }

            // Category B: Lost or Stolen Phone
            item {
                ServiceCard(
                    title = "Lost or Stolen Mobile Device",
                    description = "Guided blocking checklist, masked IMEI details, police complaint reference, and CEIR portal.",
                    icon = Icons.Default.PhoneDisabled,
                    iconTint = PrimaryNavy,
                    badge = "CEIR BLOCKING",
                    onClick = { onNavigate(Screen.LostOrStolenPhone.route) }
                )
            }

            // Category C: Device Genuineness
            item {
                ServiceCard(
                    title = "Check Device Genuineness",
                    description = "Find your device's 15-digit IMEI (*#06#), run syntax validation, and follow second-hand phone checklist.",
                    icon = Icons.Default.VerifiedUser,
                    iconTint = SafetyTeal,
                    iconBackground = SafetyTeal.copy(alpha = 0.1f),
                    badge = "IMEI VALIDATOR",
                    badgeColor = SafetyTeal,
                    onClick = { onNavigate(Screen.IMEIVerificationGuide.route) }
                )
            }

            // Category D: Mobile Connection Safety
            item {
                ServiceCard(
                    title = "Mobile Connection Safety",
                    description = "Learn how to discover unauthorized SIM cards registered under your Aadhaar using TAFCOP.",
                    icon = Icons.Default.SimCard,
                    iconTint = PrimaryDark,
                    badge = "TAFCOP FACILITY",
                    onClick = { onNavigate(Screen.MobileConnectionSafety.route) }
                )
            }

            // Category E: Suspicious International Caller ID
            item {
                ServiceCard(
                    title = "Suspicious Caller-ID Report",
                    description = "Report international spoofed calls claiming to be Indian Police, Customs, or TRAI authorities.",
                    icon = Icons.Default.ContactPhone,
                    iconTint = WarningAmber,
                    iconBackground = WarningAmber.copy(alpha = 0.1f),
                    badge = "CALLER SPOOFING",
                    badgeColor = WarningAmber,
                    onClick = { onNavigate(Screen.SuspiciousCallerReport.route) }
                )
            }

            // Category F: Trusted Bank Contacts
            item {
                ServiceCard(
                    title = "Trusted Bank Contacts",
                    description = "Official toll-free phone directory and instant SMS block numbers for Indian banks.",
                    icon = Icons.Default.AccountBalance,
                    iconTint = SafetyTeal,
                    iconBackground = SafetyTeal.copy(alpha = 0.1f),
                    badge = "VERIFIED DIRECTORY",
                    badgeColor = SafetyTeal,
                    onClick = { onNavigate(Screen.TrustedBankContacts.route) }
                )
            }

            // Official Service Disclaimer
            item {
                OfficialBanner(
                    portalName = "Department of Telecommunications",
                    portalUrl = "https://www.sancharsaathi.gov.in/"
                )
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }
        }
    }
}
