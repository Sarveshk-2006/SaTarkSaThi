package com.satarksaathi.app.feature.caller

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.satarksaathi.app.core.network.Resource
import com.satarksaathi.app.core.security.MaskingUtils
import com.satarksaathi.app.core.ui.components.RiskBadge
import com.satarksaathi.app.core.ui.components.SatarkTopBar
import com.satarksaathi.app.core.ui.theme.*
import com.satarksaathi.app.data.models.CallerLookupDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CallerShieldScreen(
    onNavigateBack: () -> Unit,
    viewModel: CallerShieldViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    var showReportDialog by remember { mutableStateOf(false) }
    var reportNumberInput by remember { mutableStateOf("") }
    var reportCategoryInput by remember { mutableStateOf("DIGITAL_ARREST") }
    var reportNameInput by remember { mutableStateOf("") }
    var reportDescInput by remember { mutableStateOf("") }

    // Role launcher for Android Q+
    val roleLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        viewModel.checkScreeningRole()
    }

    Scaffold(
        topBar = {
            SatarkTopBar(
                title = "Satark Caller Shield",
                subtitle = "Incoming Call Intelligence & Fraud Protection",
                canNavigateBack = true,
                onNavigateBack = onNavigateBack
            )
        },
        containerColor = BackgroundLight
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. Android Telecom Call-Screening Role Status Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (uiState.isRoleGranted) Color(0xFFE8F5E9) else Color(0xFFFFF8E1)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(if (uiState.isRoleGranted) SafetyTeal else WarningAmber),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (uiState.isRoleGranted) Icons.Default.Shield else Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = if (uiState.isRoleGranted) "Caller Shield Active" else "Call Screening Not Enabled",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = if (uiState.isRoleGranted) Color(0xFF1B5E20) else Color(0xFFB78103)
                                )
                                Text(
                                    text = if (uiState.isRoleGranted)
                                        "Android Telecom service is inspecting incoming calls in real time."
                                    else
                                        "Grant Android Call Screening role to identify scammers before answering.",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                            }
                        }

                        if (!uiState.isRoleGranted) {
                            Button(
                                onClick = {
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                        val roleManager = context.getSystemService(RoleManager::class.java)
                                        if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                                            val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                                            roleLauncher.launch(intent)
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Enable Call Screening Protection", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Auto-Block Known Extortionists", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    Text("Disconnect calls with risk score ≥ 95", fontSize = 11.sp, color = TextTertiary)
                                }
                                Switch(
                                    checked = uiState.isAutoBlockEnabled,
                                    onCheckedChange = { viewModel.toggleAutoBlock(it) }
                                )
                            }
                        }
                    }
                }
            }

            // 2. Navigation Tabs (Threat Radar | Search | Blocklist)
            item {
                TabRow(
                    selectedTabIndex = uiState.activeTab,
                    containerColor = Color.White,
                    contentColor = PrimaryNavy,
                    modifier = Modifier.clip(RoundedCornerShape(12.dp))
                ) {
                    Tab(
                        selected = uiState.activeTab == 0,
                        onClick = { viewModel.selectTab(0) },
                        text = { Text("Threat Radar", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = uiState.activeTab == 1,
                        onClick = { viewModel.selectTab(1) },
                        text = { Text("Caller Lookup", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = uiState.activeTab == 2,
                        onClick = { viewModel.selectTab(2) },
                        text = { Text("My Blocklist", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            // 3. TAB CONTENT
            when (uiState.activeTab) {
                0 -> {
                    // TAB 0: THREAT RADAR
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Top Scam Callers in India",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryDark
                            )
                            IconButton(onClick = { showReportDialog = true }) {
                                Icon(Icons.Default.Add, contentDescription = "Report Number", tint = PrimaryNavy)
                            }
                        }
                    }

                    when (val threats = uiState.topThreats) {
                        is Resource.Loading -> {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = PrimaryNavy, modifier = Modifier.size(28.dp))
                                }
                            }
                        }
                        is Resource.Success -> {
                            items(threats.data ?: emptyList()) { item ->
                                ThreatCallerCard(
                                    caller = item,
                                    onSimulateCall = { viewModel.simulateIncomingCall(item) },
                                    onSearch = {
                                        viewModel.selectTab(1)
                                        viewModel.onSearchNumberChanged(item.normalizedNumber)
                                        viewModel.searchCaller(item.normalizedNumber)
                                    }
                                )
                            }
                        }
                        is Resource.Error -> {
                            item {
                                Text("Failed to load threats: ${threats.message}", color = AlertRed, fontSize = 12.sp)
                            }
                        }
                        else -> {}
                    }
                }

                1 -> {
                    // TAB 1: CALLER LOOKUP
                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text("Check Any Phone Number", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryDark)
                                Text("Query Satark Saathi community reputation & IBM AI classification.", fontSize = 11.sp, color = TextSecondary)

                                OutlinedTextField(
                                    value = uiState.searchNumber,
                                    onValueChange = { viewModel.onSearchNumberChanged(it) },
                                    label = { Text("Phone Number (e.g. +91 98765 00001)") },
                                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryNavy) },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(
                                        keyboardType = KeyboardType.Phone,
                                        imeAction = ImeAction.Search
                                    ),
                                    keyboardActions = KeyboardActions(onSearch = {
                                        focusManager.clearFocus()
                                        viewModel.searchCaller()
                                    }),
                                    shape = RoundedCornerShape(10.dp)
                                )

                                Button(
                                    onClick = {
                                        focusManager.clearFocus()
                                        viewModel.searchCaller()
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Verify Caller Intelligence", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Search Result Section
                    uiState.searchResult?.let { res ->
                        item {
                            when (res) {
                                is Resource.Loading -> {
                                    Box(modifier = Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
                                        CircularProgressIndicator(color = PrimaryNavy, modifier = Modifier.size(24.dp))
                                    }
                                }
                                is Resource.Success -> {
                                    res.data?.let { dto ->
                                        CallerDetailsCard(
                                            caller = dto,
                                            onSimulateCall = { viewModel.simulateIncomingCall(dto) },
                                            onAddToBlocklist = {
                                                viewModel.addToBlocklist(dto.normalizedNumber, dto.displayTag, "User Block")
                                            },
                                            onRemoveFromBlocklist = {
                                                viewModel.removeFromBlocklist(dto.normalizedNumber)
                                            }
                                        )
                                    }
                                }
                                is Resource.Error -> {
                                    Text("Search error: ${res.message}", color = AlertRed, fontSize = 12.sp)
                                }
                                else -> {}
                            }
                        }
                    }
                }

                2 -> {
                    // TAB 2: PERSONAL BLOCKLIST
                    item {
                        Text(
                            text = "Your Blocked & Trusted Numbers",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryDark
                        )
                    }

                    when (val blocklist = uiState.blocklist) {
                        is Resource.Loading -> {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = PrimaryNavy, modifier = Modifier.size(24.dp))
                                }
                            }
                        }
                        is Resource.Success -> {
                            val itemsList = blocklist.data ?: emptyList()
                            if (itemsList.isEmpty()) {
                                item {
                                    Text("No numbers in personal blocklist.", fontSize = 12.sp, color = TextTertiary)
                                }
                            } else {
                                items(itemsList) { item ->
                                    Card(
                                        shape = RoundedCornerShape(12.dp),
                                        colors = CardDefaults.cardColors(containerColor = Color.White),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = item.displayName ?: item.normalizedNumber,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = PrimaryDark
                                                )
                                                Text(
                                                    text = item.normalizedNumber,
                                                    fontSize = 11.sp,
                                                    color = TextSecondary
                                                )
                                                item.reason?.let {
                                                    Text(text = "Reason: $it", fontSize = 10.sp, color = TextTertiary)
                                                }
                                            }
                                            IconButton(onClick = { viewModel.removeFromBlocklist(item.normalizedNumber) }) {
                                                Icon(Icons.Default.Delete, contentDescription = "Unblock", tint = AlertRed)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        is Resource.Error -> {
                            item {
                                Text("Failed to load blocklist: ${blocklist.message}", color = AlertRed, fontSize = 12.sp)
                            }
                        }
                        else -> {}
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }
        }
    }

    // 4. Incoming Call Simulation Dialog
    uiState.incomingCallSimulation?.let { caller ->
        IncomingCallSimulatorDialog(
            caller = caller,
            onDismiss = { viewModel.dismissIncomingCallSimulation() }
        )
    }

    // 5. Submit Report Dialog
    if (showReportDialog) {
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            title = { Text("Report Scam Caller", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = reportNumberInput,
                        onValueChange = { reportNumberInput = it },
                        label = { Text("Phone Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                    )
                    OutlinedTextField(
                        value = reportNameInput,
                        onValueChange = { reportNameInput = it },
                        label = { Text("Name Claimed (e.g. CBI Officer)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = reportDescInput,
                        onValueChange = { reportDescInput = it },
                        label = { Text("Incident Details / Conversation") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (reportNumberInput.isNotBlank()) {
                            viewModel.submitReport(
                                phoneNumber = reportNumberInput,
                                category = reportCategoryInput,
                                claimedName = reportNameInput.ifBlank { null },
                                description = reportDescInput.ifBlank { null }
                            )
                            showReportDialog = false
                            reportNumberInput = ""
                            reportNameInput = ""
                            reportDescInput = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy)
                ) {
                    Text("Submit Report")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReportDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ThreatCallerCard(
    caller: CallerLookupDto,
    onSimulateCall: () -> Unit,
    onSearch: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = caller.displayTag,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryDark
                    )
                    Text(
                        text = MaskingUtils.maskPhoneNumber(caller.phoneNumber),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = TextSecondary
                    )
                }
                RiskBadge(riskLevel = caller.riskLevel)
            }

            caller.ibmSummary?.let {
                Text(
                    text = it,
                    fontSize = 11.sp,
                    color = TextSecondary,
                    maxLines = 2
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${caller.totalReports} community reports",
                    fontSize = 10.sp,
                    color = TextTertiary,
                    fontWeight = FontWeight.Medium
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onSimulateCall,
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.height(30.dp)
                    ) {
                        Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Simulate Call", fontSize = 10.sp)
                    }
                    Button(
                        onClick = onSearch,
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryNavy),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.height(30.dp)
                    ) {
                        Text("Details", fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun CallerDetailsCard(
    caller: CallerLookupDto,
    onSimulateCall: () -> Unit,
    onAddToBlocklist: () -> Unit,
    onRemoveFromBlocklist: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(caller.displayTag, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = PrimaryDark)
                    Text(caller.phoneNumber, fontSize = 12.sp, color = TextSecondary)
                }
                RiskBadge(riskLevel = caller.riskLevel)
            }

            Divider(color = BorderSubtle)

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Category", fontSize = 10.sp, color = TextTertiary)
                    Text(caller.category.replace("_", " ").lowercase().capitalize(), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                Column {
                    Text("Carrier Verified", fontSize = 10.sp, color = TextTertiary)
                    Text(if (caller.carrierVerified) "Yes (${caller.carrierName ?: "BSNL"})" else "Unverified", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                Column {
                    Text("Total Reports", fontSize = 10.sp, color = TextTertiary)
                    Text("${caller.totalReports}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            caller.ibmSummary?.let {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFF0F4F8))
                        .padding(10.dp)
                ) {
                    Column {
                        Text("IBM watsonx.ai Threat Summary", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = PrimaryNavy)
                        Text(it, fontSize = 11.sp, color = TextSecondary)
                    }
                }
            }

            caller.recommendedAction?.let {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFFFF8E1))
                        .padding(10.dp)
                ) {
                    Column {
                        Text("Recommended Citizen Action", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = WarningAmber)
                        Text(it, fontSize = 11.sp, color = TextSecondary)
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onSimulateCall,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Simulate Call", fontSize = 12.sp)
                }

                if (caller.isBlocked) {
                    Button(
                        onClick = onRemoveFromBlocklist,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = AlertRed),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Unblock", fontSize = 12.sp)
                    }
                } else {
                    Button(
                        onClick = onAddToBlocklist,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryDark),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Block Number", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

/**
 * Truecaller-Style Incoming Call Simulation Dialog.
 * Demonstrates the pre-answer caller intelligence card presented to the citizen.
 */
@Composable
fun IncomingCallSimulatorDialog(
    caller: CallerLookupDto,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (caller.riskScore >= 70) AlertRed else SafetyTeal)
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = if (caller.riskScore >= 70) "🚨 SUSPECTED FRAUD CALL" else "✅ VERIFIED CALLER",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Avatar / Icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(if (caller.riskScore >= 70) Color(0xFFFFEBEE) else Color(0xFFE8F5E9)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (caller.riskScore >= 70) Icons.Default.CallEnd else Icons.Default.Call,
                        contentDescription = null,
                        tint = if (caller.riskScore >= 70) AlertRed else SafetyTeal,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = caller.displayTag,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = PrimaryDark
                    )
                    Text(
                        text = caller.phoneNumber,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = TextSecondary
                    )
                }

                RiskBadge(riskLevel = caller.riskLevel)

                caller.ibmSummary?.let {
                    Text(
                        text = it,
                        fontSize = 11.sp,
                        color = TextSecondary,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }

                // Call Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(54.dp)
                                .clip(CircleShape)
                                .background(AlertRed)
                        ) {
                            Icon(Icons.Default.CallEnd, contentDescription = "Decline", tint = Color.White)
                        }
                        Text("Decline", fontSize = 11.sp, color = AlertRed, fontWeight = FontWeight.Bold)
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(54.dp)
                                .clip(CircleShape)
                                .background(SafetyTeal)
                        ) {
                            Icon(Icons.Default.Call, contentDescription = "Answer", tint = Color.White)
                        }
                        Text("Answer", fontSize = 11.sp, color = SafetyTeal, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
