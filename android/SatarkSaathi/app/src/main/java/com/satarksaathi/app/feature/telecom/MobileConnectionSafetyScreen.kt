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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryDark
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary

@Composable
fun MobileConnectionSafetyScreen(
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Mobile Connection Safety",
            subtitle = "TAFCOP Know Your Mobile Connections",
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
                        Icon(Icons.Default.SimCard, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(22.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "What is TAFCOP?",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Telecom Analytics for Fraud management and Consumer Protection (TAFCOP) is a facility by the Department of Telecommunications (DoT) that enables Indian subscribers to check the number of mobile connections registered under their name / Aadhaar.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextPrimary,
                        lineHeight = 19.sp
                    )
                }
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "How to Verify Your SIM Connections",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryNavy
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    val steps = listOf(
                        "Visit the official TAFCOP portal using the button below.",
                        "Enter your active 10-digit mobile number and receive an OTP.",
                        "Review all numbers issued against your identity documents.",
                        "If you find numbers you do not recognize, select 'This is not my number' or 'Not required' to request disconnection directly with DoT."
                    )

                    steps.forEachIndexed { i, step ->
                        Row(modifier = Modifier.padding(vertical = 4.dp)) {
                            Text("${i + 1}. ", fontWeight = FontWeight.Bold, color = PrimaryNavy, fontSize = 13.sp)
                            Text(step, style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                        }
                    }
                }
            }

            // Handoff to Official TAFCOP Portal
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Official TAFCOP Portal",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Authenticate via official DoT OTP on the government portal to view your registered SIMs.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://tafcop.sancharsaathi.gov.in/"))
                            context.startActivity(intent)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.5.dp, PrimaryNavy)
                    ) {
                        Text("Open TAFCOP Portal (tafcop.sancharsaathi.gov.in)", color = PrimaryNavy, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(Icons.Default.OpenInNew, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(16.dp))
                    }
                }
            }

            // Boundary Disclaimer
            OfficialBanner(
                title = "Privacy & Security Assurance",
                message = "Satark Saathi never accesses private telecom SIM databases or collects your Aadhaar OTP. All SIM identity checks are performed exclusively by the subscriber on the government TAFCOP portal."
            )
        }
    }
}
