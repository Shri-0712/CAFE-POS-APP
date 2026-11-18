package com.cafepos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.cafepos.ui.CafePosAppScreen
import com.cafepos.ui.theme.CafePosTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repo = (application as CafePosApp).repository
        setContent { CafePosTheme { CafePosAppScreen(repo) } }
    }
}
