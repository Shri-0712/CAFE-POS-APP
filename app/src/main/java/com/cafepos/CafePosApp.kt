package com.cafepos

import android.app.Application
import com.cafepos.data.local.CafeDatabase
import com.cafepos.repository.PosRepository
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Settings

class CafePosApp : Application() {
    val database by lazy { CafeDatabase.getDatabase(this) }
    val repository by lazy { PosRepository(database) }
}
