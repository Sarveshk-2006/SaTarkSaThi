package com.satarksaathi.app.feature.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.ContactPhone
import androidx.compose.material.icons.filled.FamilyRestroom
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.PhoneDisabled
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.navigation.Screen
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.RiskBadge
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.components.ServiceCard
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.AlertRedLight
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryDark
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.SafetyTealLight
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary
import com.satarksaathi.app.core.ui.theme.WarningAmber

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.loadDashboard()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        // App Bar
        SatarkTopBar(
            title = "Satark Saathi",
            subtitle = "Namaste, ${state.userName}",
            onNotificationsClick = { onNavigate(Screen.Notifications.route) },
            onSettingsClick = { onNavigate(Screen.Settings.route) }
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. Primary Hero Card: Check Suspicious Message
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = PrimaryDark),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = SurfaceWhite.copy(alpha = 0.15f),
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Security,
                                        contentDescription = null,
                                        tint = SurfaceWhite,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = SafetyTeal.copy(alpha = 0.25f)
                            ) {
                                Text(
                                    text = "AI SCAM SCANNER",
                                    color = SurfaceWhite,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "Check a Suspicious Message",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = SurfaceWhite
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Paste any SMS, WhatsApp text, or payment URL to analyze risk, verify fraud signals, and get safety recommendations.",
                            style = MaterialTheme.typography.bodySmall,
                            color = SurfaceWhite.copy(alpha = 0.85f),
                            lineHeight = 18.sp
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = { onNavigate(Screen.ScamScanner.route) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Scan Message / URL Now", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // 2. Emergency 1930 Cyber Fraud Helpline Quick Bar
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigate(Screen.RecoveryAssistant.route) },
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = AlertRedLight),
                    border = BorderStroke(1.dp, AlertRed.copy(alpha = 0.3f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Surface(
                                shape = CircleShape,
                                color = AlertRed,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Call,
                                        contentDescription = "1930",
                                        tint = SurfaceWhite,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Dial 1930 Cyber Crime Helpline",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = AlertRed
                                )
                                Text(
                                    text = "National 24x7 Citizen Financial Fraud Reporting",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Open",
                            tint = AlertRed,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            // 3. Citizen Telecom Safety Grid Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Citizen Telecom Services",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Inspired by Sanchar Saathi citizen-centric workflows",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }

                    Text(
                        text = "View All",
                        style = MaterialTheme.typography.labelMedium,
                        color = PrimaryNavy,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { onNavigate(Screen.TelecomSafety.route) }
                    )
                }
            }

            // Service 0: Satark Caller Shield
            item {
                ServiceCard(
                    title = "Satark Caller Shield",
                    description = "Truecaller-style incoming call intelligence, real-time scam radar, and auto-blocking.",
                    icon = Icons.Default.ContactPhone,
                    badge = "CALL INTELLIGENCE",
                    onClick = { onNavigate(Screen.CallerShield.route) }
                )
            }

            // Service 1: Report Suspicious Communication
            item {
                ServiceCard(
                    title = "Report Suspicious Communication",
                    description = "Analyze SMS, WhatsApp, or URLs claiming to be bank KYC, lottery, or courier.",
                    icon = Icons.Default.Report,
                    badge = "AI POWERED",
                    onClick = { onNavigate(Screen.ReportSuspicious.route) }
                )
            }

            // Service 2: Lost or Stolen Phone (CEIR)
            item {
                ServiceCard(
                    title = "Lost or Stolen Mobile Device",
                    description = "Guided blocking checklist, masked IMEI record, and official CEIR handoff.",
                    icon = Icons.Default.PhoneDisabled,
                    badge = "CEIR GUIDE",
                    onClick = { onNavigate(Screen.LostOrStolenPhone.route) }
                )
            }

            // Service 3: Check Device Genuineness
            item {
                ServiceCard(
                    title = "Check Device Genuineness",
                    description = "15-digit IMEI syntax format validation & second-hand purchase safety checklist.",
                    icon = Icons.Default.VerifiedUser,
                    badge = "IMEI VERIFY",
                    onClick = { onNavigate(Screen.IMEIVerificationGuide.route) }
                )
            }

            // Service 4: Mobile Connection Safety (TAFCOP)
            item {
                ServiceCard(
                    title = "Mobile Connection Safety",
                    description = "Learn how to discover SIM cards issued under your Aadhaar and report unauthorized numbers.",
                    icon = Icons.Default.SimCard,
                    badge = "TAFCOP HANDOFF",
                    onClick = { onNavigate(Screen.MobileConnectionSafety.route) }
                )
            }

            // Service 5: Suspicious Caller-ID Report
            item {
                ServiceCard(
                    title = "Suspicious Caller-ID Report",
                    description = "Report international spoofed calls claiming to be from Police, Customs, or Telecom authorities.",
                    icon = Icons.Default.ContactPhone,
                    badge = "INTERNATIONAL SPOOF",
                    onClick = { onNavigate(Screen.SuspiciousCallerReport.route) }
                )
            }

            // Service 6: Trusted Bank Contacts
            item {
                ServiceCard(
                    title = "Trusted Bank Contacts",
                    description = "Verified toll-free helplines and SMS block hotlines for Indian financial institutions.",
                    icon = Icons.Default.AccountBalance,
                    badge = "VERIFIED DIRECTORY",
                    onClick = { onNavigate(Screen.TrustedBankContacts.route) }
                )
            }

            // 4. Family Shield & Golden Hour Quick Links
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Family Shield Card
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigate(Screen.FamilyShield.route) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        border = BorderStroke(1.dp, BorderSubtle)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Icon(
                                imageVector = Icons.Default.FamilyRestroom,
                                contentDescription = null,
                                tint = SafetyTeal,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Family Shield", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(
                                text = "${state.activeAlertsCount} Active Alert(s)",
                                fontSize = 11.sp,
                                color = if (state.activeAlertsCount > 0) AlertRed else TextSecondary
                            )
                        }
                    }

                    // Golden Hour Recovery Card
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigate(Screen.RecoveryAssistant.route) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        border = BorderStroke(1.dp, BorderSubtle)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Icon(
                                imageVector = Icons.Default.Assignment,
                                contentDescription = null,
                                tint = PrimaryNavy,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Recovery Drafts", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("1930 & Bank Disputes", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                }
            }

            // 5. Recent Incidents Preview (Real Data)
            if (state.recentIncidents.isNotEmpty()) {
                item {
                    Text(
                        text = "Recent Safety Cases",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }

                items(state.recentIncidents) { inc ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigate(Screen.IncidentDetail.createRoute(inc.incidentId)) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        border = BorderStroke(1.dp, BorderSubtle)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = inc.title,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Case #${inc.incidentId} • ${inc.scamType}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                            RiskBadge(riskLevel = inc.riskLevel)
                        }
                    }
                }
            }

            // 6. Official Portal Notice Banner
            item {
                OfficialBanner(
                    portalName = "Sanchar Saathi Portal",
                    portalUrl = "https://www.sancharsaathi.gov.in/"
                )
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}
