package com.satarksaathi.app.feature.telecom

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
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
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportSuspiciousCommunicationScreen(
    onNavigateBack: () -> Unit,
    onNavigateToScanner: () -> Unit
) {
    val context = LocalContext.current

    val categories = listOf(
        "Electricity / Power Disconnection Threat",
        "Bank KYC Expiry / PAN Update APK",
        "Digital Arrest / Fake Police / CBI Video Call",
        "Part-Time Job / Task Deposit Scam",
        "Courier Customs / Narcotics Seizure Parcel",
        "Lottery / Free Recharge Phishing Link"
    )

    var expanded by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf(categories[0]) }
    var senderInfo by remember { mutableStateOf("") }
    var messageText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Report Communication",
            subtitle = "Chakshu Sanchar Saathi Facility",
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
            // Explanation Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Report, contentDescription = null, tint = AlertRed, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Suspected Fraud Reporting Draft",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Prepare your draft details below to analyze threat signals with Satark Saathi AI, then submit to the Department of Telecommunications' Chakshu facility.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        lineHeight = 18.sp
                    )
                }
            }

            // Category Selector
            Text(
                text = "Suspected Fraud Category:",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedCategory,
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                    shape = RoundedCornerShape(10.dp)
                )

                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    categories.forEach { cat ->
                        DropdownMenuItem(
                            text = { Text(cat, fontSize = 13.sp) },
                            onClick = {
                                selectedCategory = cat
                                expanded = false
                            }
                        )
                    }
                }
            }

            // Sender Information Input
            OutlinedTextField(
                value = senderInfo,
                onValueChange = { senderInfo = it },
                label = { Text("Sender ID / Mobile Number") },
                placeholder = { Text("e.g. +91 9876543210 or VM-SBIINB") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            )

            // Message Content
            OutlinedTextField(
                value = messageText,
                onValueChange = { messageText = it },
                label = { Text("Message Body / Threat Summary") },
                placeholder = { Text("Paste exact SMS text, WhatsApp forward, or threat description...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp),
                shape = RoundedCornerShape(10.dp)
            )

            // Actions
            Button(
                onClick = onNavigateToScanner,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
            ) {
                Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Analyze Risk with Satark Saathi AI", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }

            OutlinedButton(
                onClick = {
                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://sancharsaathi.gov.in/sfc/"))
                    context.startActivity(browserIntent)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.5.dp, PrimaryNavy)
            ) {
                Text("Open Official Chakshu Portal", color = PrimaryNavy, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(6.dp))
                Icon(Icons.Default.OpenInNew, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(16.dp))
            }

            // Official Disclaimer Notice
            OfficialBanner(
                title = "DoT Chakshu Boundary",
                message = "Chakshu is the official citizen reporting facility of DoT. Satark Saathi helps you analyze risk and format reports, but cannot claim a complaint has been officially registered until submitted on the DoT portal."
            )
        }
    }
}
