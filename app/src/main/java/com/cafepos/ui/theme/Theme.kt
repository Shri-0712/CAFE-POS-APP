package com.cafepos.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Light = lightColorScheme(primary = Color(0xFF0E7C66), secondary = Color(0xFFFFB000), tertiary = Color(0xFF7D4E24), background = Color(0xFFF7F4ED), surface = Color(0xFFFFFFFF))
private val Dark = darkColorScheme(primary = Color(0xFF5ED6B9), secondary = Color(0xFFFFC85A), tertiary = Color(0xFFE8B88A), background = Color(0xFF111411), surface = Color(0xFF1A211D))

@Composable
fun CafePosTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (darkTheme) Dark else Light, typography = Typography(), content = content)
}
