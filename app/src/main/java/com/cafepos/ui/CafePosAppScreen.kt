package com.cafepos.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cafepos.repository.PosRepository
import com.cafepos.ui.screens.*
import com.cafepos.viewmodel.PosViewModel
import com.cafepos.viewmodel.PosViewModelFactory

enum class PosTab { Dashboard, Menu, Billing, Reports, Admin }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CafePosAppScreen(repo: PosRepository) {
    val vm: PosViewModel = viewModel(factory = PosViewModelFactory(repo))
    var tab by remember { mutableStateOf(PosTab.Dashboard) }
    Scaffold(
        topBar = { TopAppBar(title = { Text("CafePOS") }) },
        bottomBar = {
            NavigationBar {
                listOf(PosTab.Dashboard to Icons.Default.Dashboard, PosTab.Menu to Icons.Default.RestaurantMenu, PosTab.Billing to Icons.Default.Receipt, PosTab.Reports to Icons.Default.BarChart, PosTab.Admin to Icons.Default.Settings).forEach { (t, icon) ->
                    NavigationBarItem(selected = tab == t, onClick = { tab = t }, icon = { Icon(icon, null) }, label = { Text(t.name) })
                }
            }
        }
    ) { pad ->
        Box(Modifier.padding(pad).fillMaxSize()) {
            when (tab) {
                PosTab.Dashboard -> DashboardScreen(vm) { tab = PosTab.Billing }
                PosTab.Menu -> MenuScreen(vm)
                PosTab.Billing -> BillingScreen(vm)
                PosTab.Reports -> ReportsScreen(vm)
                PosTab.Admin -> AdminScreen(vm)
            }
        }
    }
}
