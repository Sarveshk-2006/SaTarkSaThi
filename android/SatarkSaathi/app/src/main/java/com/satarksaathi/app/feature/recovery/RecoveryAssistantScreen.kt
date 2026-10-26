package com.satarksaathi.app.feature.recovery

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.ui.components.IndianHelplineCard
import com.satarksaathi.app.core.ui.components.OfficialBanner
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.AlertRedLight
import com.satarksaathi.app.core.ui.theme.BackgroundLight
import com.satarksaathi.app.core.ui.theme.BorderSubtle
import com.satarksaathi.app.core.ui.theme.PrimaryDark
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary

@Composable
fun RecoveryAssistantScreen(
    viewModel: RecoveryViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val sampleDisputeLetter = """
To,
The Nodal Officer / Fraud Dispute Desk,
[Bank Name], India

Subject: Immediate Transaction Recall & Lien Hold Request Under RBI Customer Protection Framework

Dear Sir / Madam,

I am writing to report an unauthorized / fraudulent digital financial transaction executed from my account:
- Bank Account No: [Your Account Number]
- Transaction Reference (UTR / IMPS): [Transaction UTR ID]
- Date and Time: [Date and Time]
- Disputed Amount: ₹[Amount]
- Beneficiary Account / UPI ID: [Suspect Account Details]

I have immediately reported this matter on the National Cybercrime Reporting Portal (Helpline 1930) under Acknowledgement Reference: [1930 Ack Number].

Under RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18 on "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions", I request your bank to immediately initiate an inter-bank reversal, freeze the destination beneficiary account, and register an official fraud dispute.

Yours sincerely,
[Your Name]
[Registered Mobile Number]
    """.trimIndent()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SatarkTopBar(
            title = "Golden Hour Recovery",
            subtitle = "1930 Cyber Helpline & Bank Disputes",
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
            // Urgent 1930 Call Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = AlertRed),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "GOLDEN HOUR PRIORITY: DIAL 1930",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SurfaceWhite
                        )
                        Surface(
                            color = SurfaceWhite.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "24x7 MHA HELPLINE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = SurfaceWhite,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Call 1930 Immediately",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = SurfaceWhite
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "The first 2 to 3 hours after unauthorized fraud are critical before fraudsters withdraw cash through ATM networks. Calling 1930 activates an emergency inter-bank lien hold.",
                        style = MaterialTheme.typography.bodySmall,
                        color = SurfaceWhite.copy(alpha = 0.9f),
                        lineHeight = 18.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:1930"))
                            context.startActivity(intent)
                        },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SurfaceWhite),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Call, contentDescription = null, tint = AlertRed, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Dial 1930 Now", color = AlertRed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }

            // 4-Step Golden Hour Protocol
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "4-Step Golden Hour Protocol",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryNavy
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    val steps = state.goldenHourSteps.ifEmpty {
                        listOf(
                            "1. DIAL 1930 IMMEDIATELY: Keep transaction UTR / Reference ID and Bank Account ready.",
                            "2. CONTACT DEBITING BANK: Demand immediate transaction recall under RBI Customer Protection norms.",
                            "3. SUBMIT FORMAL COMPLAINT: Register dispute on cybercrime.gov.in using the pre-filled draft.",
                            "4. FREEZE CARDS & NETBANKING: Disable UPI services immediately via bank mobile app or SMS hotlist."
                        )
                    }

                    steps.forEach { step ->
                        Row(modifier = Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.Top) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SafetyTeal, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(step, style = MaterialTheme.typography.bodySmall, color = TextPrimary, lineHeight = 18.sp)
                        }
                    }
                }
            }

            // Formal Bank Dispute Draft Template
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Bank Dispute Notice Template",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        OutlinedButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                clipboard.setPrimaryClip(ClipData.newPlainText("Dispute Letter", sampleDisputeLetter))
                                Toast.makeText(context, "Copied dispute notice draft to clipboard", Toast.LENGTH_SHORT).show()
                            },
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copy Draft", fontSize = 11.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        color = BackgroundLight,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = sampleDisputeLetter,
                            fontSize = 11.sp,
                            color = TextSecondary,
                            lineHeight = 16.sp,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            }

            // Portal Handoff Button
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, BorderSubtle)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "National Cyber Crime Reporting Portal",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Formal registration portal of the Ministry of Home Affairs to generate an official acknowledgement slip and legal FIR tracking reference.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://cybercrime.gov.in/"))
                            context.startActivity(intent)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.5.dp, PrimaryNavy)
                    ) {
                        Text("Open Official Cybercrime Portal (cybercrime.gov.in)", color = PrimaryNavy, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(Icons.Default.OpenInNew, contentDescription = null, tint = PrimaryNavy, modifier = Modifier.size(16.dp))
                    }
                }
            }

            OfficialBanner(
                title = "1930 & RBI Norms Notice",
                message = "Calling 1930 and intimating your bank within 2 hours enables the Indian Cyber Crime Coordination Centre (I4C) to mark an inter-bank lien hold on the recipient bank account. Recovery is subject to the remaining balance in the mule account."
            )
        }
    }
}
