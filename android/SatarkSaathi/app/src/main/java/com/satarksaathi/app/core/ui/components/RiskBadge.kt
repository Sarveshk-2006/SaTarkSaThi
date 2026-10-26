package com.satarksaathi.app.core.ui.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.satarksaathi.app.core.ui.theme.AlertRed
import com.satarksaathi.app.core.ui.theme.AlertRedLight
import com.satarksaathi.app.core.ui.theme.SafetyTeal
import com.satarksaathi.app.core.ui.theme.SafetyTealLight
import com.satarksaathi.app.core.ui.theme.WarningAmber
import com.satarksaathi.app.core.ui.theme.WarningAmberLight

@Composable
fun RiskBadge(
    riskLevel: String,
    modifier: Modifier = Modifier
) {
    val level = riskLevel.uppercase()
    val (bgColor, textColor, icon) = when {
        level.contains("HIGH") || level.contains("CRITICAL") || level.contains("RED") -> {
            Triple(AlertRedLight, AlertRed, Icons.Default.Warning)
        }
        level.contains("CAUTION") || level.contains("MEDIUM") || level.contains("AMBER") -> {
            Triple(WarningAmberLight, WarningAmber, Icons.Default.Warning)
        }
        else -> {
            Triple(SafetyTealLight, SafetyTeal, Icons.Default.CheckCircle)
        }
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(13.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = level.replace("_", " "),
                color = textColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
