package com.satarksaathi.app.core.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    data object Home : BottomNavItem(Screen.Home.route, "Home", Icons.Default.Home)
    data object SafetyCenter : BottomNavItem(Screen.TelecomSafety.route, "Safety Center", Icons.Default.Security)
    data object MyCases : BottomNavItem(Screen.IncidentHistory.route, "My Cases", Icons.Default.Assignment)
    data object Profile : BottomNavItem(Screen.Profile.route, "Profile", Icons.Default.Person)

    companion object {
        val items = listOf(Home, SafetyCenter, MyCases, Profile)
    }
}
