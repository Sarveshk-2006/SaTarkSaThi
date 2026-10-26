package com.satarksaathi.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.satarksaathi.app.core.navigation.AppNavigation
import com.satarksaathi.app.core.ui.theme.SatarkSaathiTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as SatarkSaathiApp

        setContent {
            SatarkSaathiTheme {
                val navController = rememberNavController()
                AppNavigation(navController = navController, app = app)
            }
        }
    }
}
