package com.satarksaathi.app.feature.settings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryDark
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.SafetyTealLight
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary

@Composable
fun PrivacyAndPermissionsScreen(
    onNavigateBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Privacy & Permissions",
            subtitle = "Transparent Android Security Declarations",
            canNavigateBack = true,
            onNavigateBack = onNavigateBack
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Permission Philosophy
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Security, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(22.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Zero-Intrusive Privacy Philosophy",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Satark Saathi strictly follows Google Play User-Initiated Data Privacy standards. Unlike intrusive scam detectors that demand access to read all citizen messages and call logs, Satark Saathi relies exclusively on voluntary user input.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextPrimary,
                        lineHeight = 19.sp
                    )
                }
            }

            // Declared Permissions (Active)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Active Android Permissions Declared",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = SafetyTeal
                    )

                    PermissionItem(
                        name = "android.permission.INTERNET",
                        purpose = "Required to connect to Satark Saathi backend APIs for live scam signal analysis, incident recording, and verified bank directory.",
                        isGranted = true
                    )

                    PermissionItem(
                        name = "android.permission.ACCESS_NETWORK_STATE",
                        purpose = "Required to monitor network connectivity and activate offline fallback guidance when disconnected.",
                        isGranted = true
                    )
                }
            }

            // Excluded Permissions (Deliberately NOT requested)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Dangerous Permissions Deliberately Excluded",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = AlertRed
                    )

                    ExcludedPermissionItem(
                        name = "READ_SMS / RECEIVE_SMS",
                        reason = "Excluded to safeguard banking OTPs and personal communications. Users voluntarily copy & paste suspicious text."
                    )

                    ExcludedPermissionItem(
                        name = "READ_CALL_LOG / PROCESS_OUTGOING_CALLS",
                        reason = "Excluded to prevent surveillance. Citizen reports international spoofing calls manually."
                    )

                    ExcludedPermissionItem(
                        name = "ACCESSIBILITY_SERVICE",
                        reason = "Excluded. Satark Saathi does not inspect screen contents of other banking or messaging apps."
                    )

                    ExcludedPermissionItem(
                        name = "ACCESS_FINE_LOCATION (Background)",
                        reason = "Excluded. Scam analysis does not require monitoring the user's physical geographic location."
                    )
                }
            }

            OfficialBanner(
                title = "Statutory Telecom Boundary",
                message = "Citizen reports created in this app are shared with government portals (Chakshu / CEIR / 1930) only upon explicit citizen authorization."
            )
        }
    }
}

@Composable
private fun PermissionItem(name: String, purpose: String, isGranted: Boolean) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SafetyTeal, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(purpose, fontSize = 11.sp, color = TextSecondary, lineHeight = 16.sp)
        }
    }
}

@Composable
private fun ExcludedPermissionItem(name: String, reason: String) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Icon(Icons.Default.Block, contentDescription = null, tint = AlertRed, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = AlertRed)
            Text(reason, fontSize = 11.sp, color = TextSecondary, lineHeight = 16.sp)
        }
    }
}
