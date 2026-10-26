package com.satarksaathi.app.feature.scanner

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.navigation.Screen
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.AlertRedLight
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryDark
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScamScannerScreen(
    viewModel: ScannerViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToResult: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    val clipboardManager = LocalClipboardManager.current

    val channels = listOf("SMS", "WHATSAPP", "TELEGRAM", "EMAIL", "CALL_TRANSCRIPT")

    val sampleScams = listOf(
        "Electricity Bill: Dear consumer your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Update immediately call 9876543210 or install APK.",
        "SBI YONO Notice: Your SBI account has been locked due to unverified PAN. Update your KYC immediately by downloading sbi-yono-update.apk to avoid permanent debit block.",
        "Work From Home: Earn Rs 3,500 daily by liking YouTube videos and subscribing to channels. Instant payout on Telegram @earn_quick_india. Deposit Rs 1,000 security fee."
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "AI Scam Scanner",
            subtitle = "Verify Suspicious Messages & Links",
            canNavigateBack = true,
            onNavigateBack = onNavigateBack
        )

        PrimaryTabRow(
            selectedTabIndex = selectedTab,
            containerColor = SurfaceWhite,
            contentColor = PrimaryNavy
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("Message / Text", fontWeight = FontWeight.SemiBold) },
                icon = { Icon(Icons.Default.Message, contentDescription = null, modifier = Modifier.size(18.dp)) }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text("Phishing URL", fontWeight = FontWeight.SemiBold) },
                icon = { Icon(Icons.Default.Link, contentDescription = null, modifier = Modifier.size(18.dp)) }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (state.errorMessage != null) {
                Surface(
                    color = AlertRedLight,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = state.errorMessage ?: "",
                        color = AlertRed,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            if (selectedTab == 0) {
                // Channel Selection Chips
                Text(
                    text = "Select Communication Channel:",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    channels.take(3).forEach { ch ->
                        FilterChip(
                            selected = state.selectedChannel == ch,
                            onClick = { viewModel.onChannelSelected(ch) },
                            label = { Text(ch, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryNavy,
                                selectedLabelColor = SurfaceWhite
                            )
                        )
                    }
                }

                // Text Area Input
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, BorderSubtle)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Suspicious Message Text",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )

                            Row {
                                IconButton(
                                    onClick = {
                                        clipboardManager.getText()?.let {
                                            viewModel.onTextChanged(it.text)
                                        }
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.ContentPaste, contentDescription = "Paste", tint = PrimaryNavy, modifier = Modifier.size(16.dp))
                                }

                                if (state.inputText.isNotBlank()) {
                                    IconButton(
                                        onClick = { viewModel.onTextChanged("") },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextSecondary, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }

                        OutlinedTextField(
                            value = state.inputText,
                            onValueChange = { viewModel.onTextChanged(it) },
                            placeholder = { Text("Paste suspicious SMS, WhatsApp message, or email body here...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(140.dp),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }

                // Quick Sample Templates
                Text(
                    text = "Quick Sample Threats:",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontWeight = FontWeight.Bold
                )

                sampleScams.forEachIndexed { idx, sample ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.onTextChanged(sample) },
                        shape = RoundedCornerShape(8.dp),
                        color = SurfaceWhite,
                        border = BorderStroke(1.dp, BorderSubtle)
                    ) {
                        Text(
                            text = "Sample ${idx + 1}: ${sample.take(65)}...",
                            fontSize = 12.sp,
                            color = PrimaryNavy,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                // Scan Action Button
                Button(
                    onClick = { viewModel.analyzeText(onNavigateToResult) },
                    enabled = !state.isLoading && state.inputText.isNotBlank(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(color = SurfaceWhite, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Analyzing Signals...")
                    } else {
                        Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Analyze Message Threat", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }

            } else {
                // URL Tab
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, BorderSubtle)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Suspicious Link / URL",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Text(
                            text = "Analyze disguised domains, deceptive APK links, and phishing landing pages.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        OutlinedTextField(
                            value = state.inputUrl,
                            onValueChange = { viewModel.onUrlChanged(it) },
                            placeholder = { Text("https://sbi-kyc-update-portal.xyz/login") },
                            leadingIcon = { Icon(Icons.Default.Link, contentDescription = null, tint = PrimaryNavy) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(8.dp)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = { viewModel.analyzeUrl(onNavigateToResult) },
                            enabled = !state.isLoading && state.inputUrl.isNotBlank(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
                        ) {
                            if (state.isLoading) {
                                CircularProgressIndicator(color = SurfaceWhite, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                            } else {
                                Text("Analyze URL Safety", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Official Disclaimer Notice
            OfficialBanner(
                title = "Transparent Threat Analysis",
                message = "Analysis runs through Satark Saathi's backend rule engine and IBM Bob AI provider. Results are advisory indicators to help citizens make informed decisions."
            )
        }
    }
}
