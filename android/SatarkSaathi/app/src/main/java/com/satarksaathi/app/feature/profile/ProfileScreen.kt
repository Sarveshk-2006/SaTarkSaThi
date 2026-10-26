package com.satarksaathi.app.feature.profile

import android.widget.Toast
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.FamilyRestroom
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.SatarkSaathiApp
import com.satarksaathi.app.core.navigation.Screen
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
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    onNavigate: (String) -> Unit
) {
    val app = SatarkSaathiApp.instance
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var showLogoutDialog by remember { mutableStateOf(false) }

    val fullName = app.authRepository.getCurrentFullName()
    val userId = app.authRepository.getCurrentUserId()
    val role = app.authRepository.getCurrentRole()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Citizen Profile",
            subtitle = "Account & Protection Settings"
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = PrimaryNavy.copy(alpha = 0.1f),
                        modifier = Modifier.size(54.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(28.dp))
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = fullName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.Default.Verified, contentDescription = "Verified", tint = SafetyTeal, modifier = Modifier.size(16.dp))
                        }

                        Text(
                            text = "Account Role: $role • ID: #$userId",
                            fontSize = 12.sp,
                            color = PrimaryNavy,
                            fontWeight = FontWeight.SemiBold
                        )

                        Text(
                            text = "Backend Session: Authenticated",
                            fontSize = 11.sp,
                            color = SafetyTeal
                        )
                    }
                }
            }

            // Demo Persona Instant Switcher
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Instant Demo Persona Switcher",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Quickly test both perspectives: protected senior parent vs guardian son.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = {
                                scope.launch {
                                    app.authRepository.demoLogin(1)
                                    Toast.makeText(context, "Switched to Rajesh Sharma (Elder)", Toast.LENGTH_SHORT).show()
                                    onNavigate(Screen.Home.route)
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Rajesh Sharma (#1)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                scope.launch {
                                    app.authRepository.demoLogin(2)
                                    Toast.makeText(context, "Switched to Aarav Sharma (Guardian)", Toast.LENGTH_SHORT).show()
                                    onNavigate(Screen.Home.route)
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Aarav Sharma (#2)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Quick Menu Items
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column {
                    ProfileMenuItem(
                        title = "Family Shield Protection",
                        subtitle = "Configure emergency guardians and alert thresholds",
                        icon = Icons.Default.FamilyRestroom,
                        onClick = { onNavigate(Screen.FamilyShield.route) }
                    )
                    ProfileMenuItem(
                        title = "Privacy & Permissions Transparency",
                        subtitle = "Review Android OS permissions and safeguards",
                        icon = Icons.Default.PrivacyTip,
                        onClick = { onNavigate(Screen.PrivacyAndPermissions.route) }
                    )
                    ProfileMenuItem(
                        title = "Server Connection Settings",
                        subtitle = "Configure backend API base URL and connection parameters",
                        icon = Icons.Default.Settings,
                        onClick = { onNavigate(Screen.Settings.route) }
                    )
                    ProfileMenuItem(
                        title = "Official Portals Handoff Guide",
                        subtitle = "Review required documents for CEIR and Cybercrime portals",
                        icon = Icons.Default.Security,
                        onClick = { onNavigate(Screen.OfficialServiceHandoff.route) }
                    )
                }
            }

            // Logout Button
            OutlinedButton(
                onClick = { showLogoutDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, AlertRed.copy(alpha = 0.5f))
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null, tint = AlertRed, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out", color = AlertRed, fontWeight = FontWeight.Bold)
            }

            OfficialBanner(
                title = "Security & Storage Notice",
                message = "Session credentials and cryptographic tokens are held in Android Keystore backed secure storage. Signing out purges client authentication tokens."
            )
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Confirm Sign Out", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to sign out of Satark Saathi? Local session tokens will be securely cleared.") },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            app.authRepository.logout()
                            showLogoutDialog = false
                            onNavigate(Screen.Login.route)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AlertRed)
                ) {
                    Text("Sign Out")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun ProfileMenuItem(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(22.dp))
        Spacer(modifier = Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = TextSecondary.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
    }
}
