package com.satarksaathi.app.core.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.satarksaathi.app.SatarkSaathiApp
import com.satarksaathi.app.core.ui.theme.PrimaryNavy
import com.satarksaathi.app.core.ui.theme.SurfaceWhite
import com.satarksaathi.app.core.ui.theme.TextPrimary
import com.satarksaathi.app.core.ui.theme.TextSecondary
import com.satarksaathi.app.feature.auth.LoginScreen
import com.satarksaathi.app.feature.auth.LoginViewModel
import com.satarksaathi.app.feature.auth.OnboardingScreen
import com.satarksaathi.app.feature.auth.SplashScreen
import com.satarksaathi.app.feature.family.FamilyShieldScreen
import com.satarksaathi.app.feature.family.FamilyShieldViewModel
import com.satarksaathi.app.feature.home.HomeScreen
import com.satarksaathi.app.feature.home.HomeViewModel
import com.satarksaathi.app.feature.incidents.IncidentDetailScreen
import com.satarksaathi.app.feature.incidents.IncidentHistoryScreen
import com.satarksaathi.app.feature.incidents.IncidentViewModel
import com.satarksaathi.app.feature.recovery.RecoveryAssistantScreen
import com.satarksaathi.app.feature.recovery.RecoveryViewModel
import com.satarksaathi.app.feature.profile.ProfileScreen
import com.satarksaathi.app.feature.scanner.ScanResultScreen
import com.satarksaathi.app.feature.scanner.ScannerViewModel
import com.satarksaathi.app.feature.scanner.ScamScannerScreen
import com.satarksaathi.app.feature.settings.NotificationsScreen
import com.satarksaathi.app.feature.settings.OfficialServiceHandoffScreen
import com.satarksaathi.app.feature.settings.PrivacyAndPermissionsScreen
import com.satarksaathi.app.feature.settings.SettingsScreen
import com.satarksaathi.app.feature.telecom.IMEIVerificationGuideScreen
import com.satarksaathi.app.feature.telecom.LostOrStolenPhoneScreen
import com.satarksaathi.app.feature.telecom.MobileConnectionSafetyScreen
import com.satarksaathi.app.feature.telecom.ReportSuspiciousCommunicationScreen
import com.satarksaathi.app.feature.telecom.SuspiciousCallerReportScreen
import com.satarksaathi.app.feature.telecom.TelecomSafetyCenterScreen
import com.satarksaathi.app.feature.telecom.TelecomSafetyViewModel
import com.satarksaathi.app.feature.telecom.TrustedBankContactsScreen

@Composable
fun AppNavigation(
    navController: NavHostController,
    app: SatarkSaathiApp
) {
    // Shared ViewModels
    val loginViewModel = LoginViewModel(app.authRepository)
    val homeViewModel = HomeViewModel(app.authRepository, app.incidentRepository, app.familyShieldRepository)
    val scannerViewModel = ScannerViewModel(app.scannerRepository, app.incidentRepository)
    val telecomViewModel = TelecomSafetyViewModel(app.telecomSafetyRepository, app.recoveryRepository)
    val incidentViewModel = IncidentViewModel(app.incidentRepository)
    val familyViewModel = FamilyShieldViewModel(app.familyShieldRepository)
    val recoveryViewModel = RecoveryViewModel(app.recoveryRepository)

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Show bottom bar on primary 4 destinations
    val showBottomBar = currentRoute in listOf(
        Screen.Home.route,
        Screen.TelecomSafety.route,
        Screen.IncidentHistory.route,
        Screen.Profile.route
    )

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = SurfaceWhite,
                    tonalElevation = 8.dp
                ) {
                    BottomNavItem.items.forEach { item ->
                        val selected = currentRoute == item.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                if (currentRoute != item.route) {
                                    navController.navigate(item.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.title
                                )
                            },
                            label = {
                                Text(
                                    text = item.title,
                                    fontSize = 11.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = PrimaryNavy,
                                selectedTextColor = PrimaryNavy,
                                unselectedIconColor = TextSecondary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = PrimaryNavy.copy(alpha = 0.12f)
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Splash.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // Auth Flow
            composable(Screen.Splash.route) {
                SplashScreen(onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Onboarding.route) {
                OnboardingScreen(onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Login.route) {
                LoginScreen(
                    viewModel = loginViewModel,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // Primary Destinations
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = homeViewModel,
                    onNavigate = { route -> navController.navigate(route) }
                )
            }
            composable(Screen.TelecomSafety.route) {
                TelecomSafetyCenterScreen(
                    onNavigate = { route -> navController.navigate(route) }
                )
            }
            composable(Screen.IncidentHistory.route) {
                IncidentHistoryScreen(
                    viewModel = incidentViewModel,
                    onNavigate = { route -> navController.navigate(route) }
                )
            }
            composable(Screen.Profile.route) {
                ProfileScreen(
                    onNavigate = { route -> navController.navigate(route) }
                )
            }

            // Scanner Flow
            composable(Screen.ScamScanner.route) {
                ScamScannerScreen(
                    viewModel = scannerViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToResult = { navController.navigate(Screen.ScanResult.route) }
                )
            }
            composable(Screen.ScanResult.route) {
                ScanResultScreen(
                    viewModel = scannerViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToIncident = { id ->
                        navController.navigate(Screen.IncidentDetail.createRoute(id))
                    }
                )
            }

            // Telecom Safety Services
            composable(Screen.ReportSuspicious.route) {
                ReportSuspiciousCommunicationScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToScanner = { navController.navigate(Screen.ScamScanner.route) }
                )
            }
            composable(Screen.LostOrStolenPhone.route) {
                LostOrStolenPhoneScreen(
                    viewModel = telecomViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.IMEIVerificationGuide.route) {
                IMEIVerificationGuideScreen(
                    viewModel = telecomViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.MobileConnectionSafety.route) {
                MobileConnectionSafetyScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.SuspiciousCallerReport.route) {
                SuspiciousCallerReportScreen(
                    viewModel = telecomViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.TrustedBankContacts.route) {
                TrustedBankContactsScreen(
                    viewModel = telecomViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            // Family & Recovery
            composable(Screen.FamilyShield.route) {
                FamilyShieldScreen(
                    viewModel = familyViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(
                route = Screen.IncidentDetail.route,
                arguments = listOf(navArgument("incidentId") { type = NavType.StringType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("incidentId") ?: ""
                IncidentDetailScreen(
                    incidentId = id,
                    viewModel = incidentViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToRecovery = { navController.navigate(Screen.RecoveryAssistant.route) }
                )
            }
            composable(Screen.RecoveryAssistant.route) {
                RecoveryAssistantScreen(
                    viewModel = recoveryViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            // Additional Features
            composable(Screen.Notifications.route) {
                NotificationsScreen(
                    familyViewModel = familyViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.OfficialServiceHandoff.route) {
                OfficialServiceHandoffScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.PrivacyAndPermissions.route) {
                PrivacyAndPermissionsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.Settings.route) {
                SettingsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
