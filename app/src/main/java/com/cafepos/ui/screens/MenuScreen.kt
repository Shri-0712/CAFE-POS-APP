package com.cafepos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.cafepos.data.model.MenuCategory
import com.cafepos.data.model.MenuItemEntity
import com.cafepos.viewmodel.PosViewModel

@Composable
fun MenuScreen(vm: PosViewModel) {
    val menu by vm.menu.collectAsState()
    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(MenuCategory.Beverages) }
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(name, { name = it }, label = { Text("Item / Game") }, modifier = Modifier.weight(1f))
            OutlinedTextField(price, { price = it }, label = { Text("Price") }, modifier = Modifier.width(120.dp))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MenuCategory.entries.forEach { FilterChip(selected = category == it, onClick = { category = it }, label = { Text(it.name) }) }
        }
        Button(onClick = { vm.upsertMenu(MenuItemEntity(name = name, category = category, price = price.toDoubleOrNull() ?: 0.0)); name = ""; price = "" }) { Text("Add Menu Item") }
        LazyVerticalGrid(columns = GridCells.Adaptive(150.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(menu) { item ->
                ElevatedCard(onClick = { vm.addMenuItem(item) }) { Column(Modifier.padding(14.dp)) { Text(item.name); Text(if (item.category == MenuCategory.Games) "₹${item.price}/hr" else "₹${item.price}") } }
            }
        }
    }
}
