package com.cafepos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.cafepos.data.model.MenuCategory
import com.cafepos.data.model.OrderType
import com.cafepos.repository.PosRepository
import com.cafepos.viewmodel.PosViewModel
import kotlinx.coroutines.delay

@Composable
fun DashboardScreen(vm: PosViewModel, openBill: () -> Unit) {
    val orders by vm.activeOrders.collectAsState()
    val menu by vm.menu.collectAsState()
    val selected by vm.selectedOrder.collectAsState()
    var table by remember { mutableStateOf("") }
    var now by remember { mutableStateOf(System.currentTimeMillis()) }

    LaunchedEffect(Unit) {
        while (true) {
            now = System.currentTimeMillis()
            delay(1_000)
        }
    }

    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(table, { table = it }, label = { Text("Table / Customer") }, modifier = Modifier.weight(1f))
            Button(onClick = { vm.createOrder(OrderType.DineIn, table.ifBlank { "Takeaway" }) }) { Text("New Order") }
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxSize()) {
            item {
                Text("Active Orders", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                orders.forEach { details ->
                    ElevatedCard(onClick = { vm.selectOrder(details.order.id) }, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                        Column(Modifier.padding(16.dp)) {
                            Text("Order #${details.order.id} • Table ${details.order.tableNumber}", style = MaterialTheme.typography.titleMedium)
                            Text("₹${"%.2f".format(details.order.total)} • ${details.items.size} items • ${details.sessions.size} games")
                        }
                    }
                }
            }

            item {
                Text("Add Items to Bill", style = MaterialTheme.typography.titleMedium)
                Text(selected?.let { "Selected: Order #${it.order.id}" } ?: "Select or create an order first")
            }

            items(menu) { item ->
                ElevatedCard(onClick = { if (selected != null) vm.addMenuItem(item) }, modifier = Modifier.fillMaxWidth(), enabled = selected != null) {
                    Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(item.name, style = MaterialTheme.typography.titleMedium)
                            Text(if (item.category == MenuCategory.Games) "Game • ₹${"%.2f".format(item.price)}/hour" else item.category.name)
                        }
                        Text("₹${"%.2f".format(item.price)}")
                    }
                }
            }

            selected?.let { details ->
                item {
                    ElevatedCard(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("Current Bill", style = MaterialTheme.typography.titleMedium)
                            details.items.forEach { Text("${it.name} x${it.quantity}  ₹${"%.2f".format(it.quantity * it.price)}") }
                            details.sessions.forEach { session ->
                                val cost = if (session.endTime == null) PosRepository.gameCost(session, now) else session.cost
                                val seconds = ((session.endTime ?: now) - session.startTime) / 1000
                                Text("${session.gameName} • ${seconds / 60}m ${seconds % 60}s  ₹${"%.2f".format(cost)}")
                            }
                            Button(onClick = openBill) { Text("Open Full Bill") }
                        }
                    }
                }
            }
        }
    }
}
