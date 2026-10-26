package com.satarksaathi.app.feature.settings

import android.widget.Toast
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import com.satarksaathi.app.core.network.NetworkConfig
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.SafetyTealLight
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit
) {
    val app = SatarkSaathiApp.instance
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var baseUrlInput by remember { mutableStateOf(NetworkConfig.getBaseUrl()) }
    var pingStatus by remember { mutableStateOf<String?>(null) }
    var isCheckingHealth by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "App Settings",
            subtitle = "Backend Connection & Build Info",
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
            // Server Connection Config
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Backend Server URL Configuration",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Text(
                        text = "For Android Emulator, use 'http://10.0.2.2:8000/api/'. For physical device, enter your local Wi-Fi IP (e.g. 'http://192.168.1.15:8000/api/').",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        lineHeight = 18.sp
                    )

                    OutlinedTextField(
                        value = baseUrlInput,
                        onValueChange = { baseUrlInput = it },
                        label = { Text("API Base URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                app.preferencesManager.setBaseUrlOverride(baseUrlInput)
                                NetworkConfig.setBaseUrlOverride(baseUrlInput)
                                Toast.makeText(context, "Saved API URL: $baseUrlInput", Toast.LENGTH_SHORT).show()
                            },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Save URL", fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                baseUrlInput = NetworkConfig.DEFAULT_EMULATOR_BASE_URL
                                app.preferencesManager.setBaseUrlOverride(null)
                                NetworkConfig.setBaseUrlOverride(null)
                                Toast.makeText(context, "Reset to emulator default", Toast.LENGTH_SHORT).show()
                            },
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Reset")
                        }
                    }

                    // Test Connectivity Button
                    OutlinedButton(
                        onClick = {
                            isCheckingHealth = true
                            pingStatus = null
                            scope.launch {
                                try {
                                    val health = app.apiClient.scannerApi.getHealth()
                                    val status = health["status"] ?: "online"
                                    val provider = health["analysis_provider"] ?: "rule_based"
                                    pingStatus = "Success! Server is $status (AI Provider: $provider)"
                                } catch (e: Exception) {
                                    pingStatus = "Connection Failed: ${e.message}"
                                } finally {
                                    isCheckingHealth = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        if (isCheckingHealth) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = PrimaryNavy, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Pinging Backend...")
                        } else {
                            Icon(Icons.Default.NetworkCheck, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Test Server Connection (/api/v1/health)")
                        }
                    }

                    pingStatus?.let { msg ->
                        val isOk = msg.startsWith("Success")
                        Surface(
                            color = if (isOk) SafetyTealLight else AlertRed.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = msg,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isOk) SafetyTeal else AlertRed,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }
                }
            }

            // Build & Architecture Specifications
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Build & Platform Specifications",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    BuildSpecRow("Package Name", "com.satarksaathi.app")
                    BuildSpecRow("Version", "1.0.0 (Build 1)")
                    BuildSpecRow("Minimum SDK", "API 24 (Android 7.0 Nougat)")
                    BuildSpecRow("Target SDK", "API 35 (Android 15)")
                    BuildSpecRow("UI Stack", "Native Jetpack Compose + Material 3")
                    BuildSpecRow("Architecture", "Clean MVVM with Kotlin Coroutines & Flow")
                    BuildSpecRow("Serialization", "Kotlinx Serialization JSON")
                }
            }

            OfficialBanner(
                title = "Zero Bundled Bloat Guarantee",
                message = "This APK contains exclusively native Android Kotlin code and resources. No node_modules, Python binaries, Vite server, or AI model weights are bundled."
            )
        }
    }
}

@Composable
private fun BuildSpecRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}
