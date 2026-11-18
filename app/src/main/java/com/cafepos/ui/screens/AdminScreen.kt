package com.cafepos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.cafepos.data.model.SettingsEntity
import com.cafepos.viewmodel.PosViewModel

@Composable
fun AdminScreen(vm: PosViewModel) {
    val settings by vm.settings.collectAsState()
    var cafe by remember(settings) { mutableStateOf(settings.cafeName) }
    var address by remember(settings) { mutableStateOf(settings.address) }
    var gst by remember(settings) { mutableStateOf(settings.gstNumber) }
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Admin Settings", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(cafe, { cafe = it }, label = { Text("Café Name") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(address, { address = it }, label = { Text("Address") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(gst, { gst = it }, label = { Text("GST Number") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = { vm.saveSettings(SettingsEntity(cafeName = cafe, address = address, gstNumber = gst)) }) { Text("Save") }
    }
}
