package com.satarksaathi.app.feature.incidents

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
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.navigation.Screen
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.RiskBadge
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.AlertRedLight
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary
import java.text.NumberFormat
import java.util.Locale

@Composable
fun IncidentDetailScreen(
    incidentId: String,
    viewModel: IncidentViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToRecovery: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val inc = state.selectedIncident
    val context = LocalContext.current
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

    LaunchedEffect(incidentId) {
        viewModel.loadIncidentDetail(incidentId)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Case Details",
            subtitle = "Case #$incidentId",
            canNavigateBack = true,
            onNavigateBack = onNavigateBack
        )

        if (state.isLoading) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(color = PrimaryNavy)
                Spacer(modifier = Modifier.height(12.dp))
                Text("Loading case details...", color = TextSecondary)
            }
            return
        }

        if (inc == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(state.errorMessage ?: "Case not found or permission denied.", color = AlertRed)
            }
            return
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Case Overview Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "CASE #${inc.incidentId}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryNavy
                        )
                        RiskBadge(riskLevel = inc.riskLevel)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = inc.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Text(
                        text = "Category: ${inc.scamType} • Status: ${inc.status.replace("_", " ")}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Financial Loss Banner
                    Surface(
                        color = if (inc.financialLoss > 0) AlertRedLight else PrimaryNavy.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Reported Loss Amount:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text(
                                text = currencyFormat.format(inc.financialLoss),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (inc.financialLoss > 0) AlertRed else PrimaryNavy
                            )
                        }
                    }

                    if (!inc.bankName.isNullOrBlank() || !inc.transactionRef.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(10.dp))
                        inc.bankName?.let {
                            Text("Bank Involved: $it", style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                        }
                        inc.transactionRef?.let {
                            Text("Transaction Ref / UTR: $it", style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                        }
                    }

                    if (!inc.suspectContact.isNullOrBlank()) {
                        Text("Suspect Phone/Handle: ${inc.suspectContact}", style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                    }
                }
            }

            // Description Narrative
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Incident Narrative & Evidence Text",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = inc.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary,
                        lineHeight = 20.sp
                    )
                }
            }

            // Golden Hour Recovery CTA
            Button(
                onClick = onNavigateToRecovery,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
            ) {
                Icon(Icons.Default.Assignment, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Golden Hour 1930 Recovery Assistant", fontWeight = FontWeight.Bold)
            }

            // Chronological Audit Trail
            if (state.auditEvents.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, BorderSubtle)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.History, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Chronological Audit Trail (${state.auditEvents.size})",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        state.auditEvents.forEach { ev ->
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Text(
                                    text = "${ev.eventType} • ${ev.timestamp?.take(16) ?: ""}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryNavy
                                )
                                Text(
                                    text = ev.description,
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }
            }

            OfficialBanner(
                title = "Evidence Storage Assurance",
                message = "Incident records are cryptographically associated with your user session in Satark Saathi. Consented guardians can review cases to help coordinate 1930 dispute resolution."
            )
        }
    }
}
