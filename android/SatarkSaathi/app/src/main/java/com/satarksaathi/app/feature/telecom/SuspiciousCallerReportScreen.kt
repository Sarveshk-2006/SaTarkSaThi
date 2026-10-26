package com.satarksaathi.app.feature.telecom

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContactPhone
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Warning
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.satarksaathi.app.core.ui.theme.WarningAmber
import com.satarksaathi.app.core.ui.theme.WarningAmberLight
import com.satarksaathi.app.data.models.SuspiciousCallerDraft

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SuspiciousCallerReportScreen(
    viewModel: TelecomSafetyViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val draft = state.callerDraft
    val context = LocalContext.current

    val fraudCategories = listOf(
        "Digital Arrest / Fake Police / Supreme Court Judge",
        "TRAI / Telecom Disconnection Threat",
        "FedEx / Customs Illegal Narcotics Parcel",
        "Credit Card / Bank Fraud Investigation",
        "International VoIP Number Impersonating Indian Number"
    )

    var callerNumber by remember(draft) { mutableStateOf(draft.callerNumber) }
    var callTime by remember(draft) { mutableStateOf(draft.callTime) }
    var selectedCategory by remember(draft) { mutableStateOf(draft.impersonationCategory) }
    var description by remember(draft) { mutableStateOf(draft.description) }
    var expanded by remember { mutableStateOf(false) }

    val isForeignPrefix = callerNumber.startsWith("+92") || callerNumber.startsWith("+880") ||
            callerNumber.startsWith("+234") || callerNumber.startsWith("+44") || callerNumber.startsWith("+1")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Suspicious Caller-ID",
            subtitle = "International Spoofing & Impersonation",
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
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ContactPhone, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "DoT Advisory on International Spoofed Calls",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Scammers often route VoIP calls from abroad manipulating caller ID to display Indian numbers or fake police badges. Genuine Indian police and government agencies NEVER conduct interrogations or demand fund transfers over video calls.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextPrimary,
                        lineHeight = 18.sp
                    )
                }
            }

            // Caller Form
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Incident Report Details",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    OutlinedTextField(
                        value = callerNumber,
                        onValueChange = { callerNumber = it },
                        label = { Text("Displayed Caller Number") },
                        placeholder = { Text("e.g. +92 300 1234567 or +91 9876543210") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )

                    if (isForeignPrefix) {
                        Surface(
                            color = WarningAmberLight,
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "International country code detected! Scammers frequently use foreign SIMs/VoIP to impersonate Indian law enforcement.",
                                    fontSize = 11.sp,
                                    color = PrimaryDark,
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = callTime,
                        onValueChange = { callTime = it },
                        label = { Text("Call Date & Time") },
                        placeholder = { Text("e.g. 27 Oct 2026, 11:30 AM") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )

                    // Impersonation Category Dropdown
                    ExposedDropdownMenuBox(
                        expanded = expanded,
                        onExpandedChange = { expanded = !expanded },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedCategory,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Suspected Impersonation Category") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                            shape = RoundedCornerShape(8.dp)
                        )

                        ExposedDropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false }
                        ) {
                            fraudCategories.forEach { cat ->
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

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Call Transcript / Threat Narrative") },
                        placeholder = { Text("Caller claimed to be DCP Cyber Crime, threatened digital arrest unless money was deposited into verification account...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp),
                        shape = RoundedCornerShape(8.dp)
                    )

                    Button(
                        onClick = {
                            viewModel.updateCallerDraft(
                                SuspiciousCallerDraft(
                                    callerNumber = callerNumber,
                                    callTime = callTime,
                                    impersonationCategory = selectedCategory,
                                    description = description
                                )
                            )
                            Toast.makeText(context, "Draft incident saved locally", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Caller Draft Locally", fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Chakshu DoT Report Button
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Report to Chakshu Facility",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Official DoT repository to report suspected spoofed calls and trigger telecom carrier carrier-level blocking.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://sancharsaathi.gov.in/sfc/"))
                            context.startActivity(intent)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.5.dp, PrimaryNavy)
                    ) {
                        Text("Report on Sanchar Saathi Chakshu", color = PrimaryNavy, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(Icons.Default.OpenInNew, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(16.dp))
                    }
                }
            }

            OfficialBanner(
                title = "Telecom Origin Boundary",
                message = "Satark Saathi analyzes reported numbers and patterns locally. True network origin, carrier routing, and caller ID authentication are verified by authorized telecom service providers (TSPs) and DoT."
            )
        }
    }
}
