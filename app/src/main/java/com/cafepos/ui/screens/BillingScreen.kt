package com.cafepos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.cafepos.repository.PosRepository
import com.cafepos.service.ExportService
import com.cafepos.service.ReceiptFormatter
import com.cafepos.viewmodel.PosViewModel
import kotlinx.coroutines.delay

@Composable
fun BillingScreen(vm: PosViewModel) {
    val details by vm.selectedOrder.collectAsState()
    val settings by vm.settings.collectAsState()
    val context = LocalContext.current
    var now by remember { mutableStateOf(System.currentTimeMillis()) }

    LaunchedEffect(details?.order?.id) {
        while (true) {
            now = System.currentTimeMillis()
            delay(1_000)
        }
    }

    if (details == null) { Box(Modifier.fillMaxSize().padding(24.dp)) { Text("Select an active order from Dashboard") }; return }
    val d = details!!
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Bill Preview", style = MaterialTheme.typography.headlineSmall)
        ElevatedCard(Modifier.fillMaxWidth()) { Text(ReceiptFormatter.text(settings, d, now), fontFamily = FontFamily.Monospace, modifier = Modifier.padding(16.dp)) }
        d.sessions.filter { it.endTime == null }.forEach { s ->
            val seconds = (now - s.startTime) / 1000
            Button(onClick = { vm.stopGame(s) }) { Text("Stop ${s.gameName} • ${seconds / 60}m ${seconds % 60}s • ₹${"%.2f".format(PosRepository.gameCost(s, now))}") }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { ExportService(context).exportReceiptPdf(settings, d) }) { Text("Export PDF") }
            FilledTonalButton(onClick = { vm.checkout() }) { Text("Paid / Checkout") }
        }
    }
}
