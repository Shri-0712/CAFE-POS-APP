package com.cafepos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.cafepos.service.ExportService
import com.cafepos.viewmodel.PosViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ReportsScreen(vm: PosViewModel) {
    val reports by vm.reports.collectAsState()
    val newestFirst by vm.reportsNewestFirst.collectAsState()
    val context = LocalContext.current
    val fmt = remember { SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault()) }

    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Reports", style = MaterialTheme.typography.headlineSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = newestFirst, onClick = { vm.sortReportsByNewest(true) }, label = { Text("Newest first") })
            FilterChip(selected = !newestFirst, onClick = { vm.sortReportsByNewest(false) }, label = { Text("Oldest first") })
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { ExportService(context).exportReportsCsv(reports) }) { Text("Export Excel CSV") }
            Button(onClick = { ExportService(context).exportReportPdf(reports) }) { Text("Export PDF Report") }
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxSize()) {
            items(reports) { details ->
                ElevatedCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Bill #${details.order.id} • ₹${"%.2f".format(details.order.total)}", style = MaterialTheme.typography.titleMedium)
                        Text("Table ${details.order.tableNumber} • ${fmt.format(Date(details.order.completedAt ?: details.order.createdAt))}")
                        Text("Food: ₹${"%.2f".format(details.order.subtotal)} • Games: ₹${"%.2f".format(details.order.gamingTotal)} • Tax: ₹${"%.2f".format(details.order.taxAmount)}")
                    }
                }
            }
        }
    }
}
