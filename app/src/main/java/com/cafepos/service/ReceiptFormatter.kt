package com.cafepos.service

import com.cafepos.data.model.OrderWithDetails
import com.cafepos.data.model.SettingsEntity
import com.cafepos.repository.PosRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object ReceiptFormatter {
    private val fmt = SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault())
    fun text(settings: SettingsEntity, details: OrderWithDetails, now: Long = System.currentTimeMillis()): String {
        val liveGaming = details.sessions.sumOf { if (it.endTime == null) PosRepository.gameCost(it, now) else it.cost }
        val liveBase = details.items.sumOf { it.quantity * it.price } + liveGaming
        val liveTax = liveBase * ((settings.cgstPercent + settings.sgstPercent) / 100.0)
        return buildString {
            appendLine(settings.cafeName)
            appendLine(settings.address)
            appendLine("GST: ${settings.gstNumber}")
            appendLine("Table: ${details.order.tableNumber}  ${details.order.orderType}")
            appendLine("Start: ${fmt.format(Date(details.order.createdAt))}")
            appendLine("------------------------------")
            appendLine("Item              Qty  Amount")
            details.items.forEach { appendLine("${it.name.take(16).padEnd(16)} ${it.quantity.toString().padStart(2)} ₹${"%.2f".format(it.quantity * it.price)}") }
            details.sessions.forEach {
                val cost = if (it.endTime == null) PosRepository.gameCost(it, now) else it.cost
                val seconds = ((it.endTime ?: now) - it.startTime) / 1000
                appendLine("Game ${it.gameName.take(9).padEnd(9)} ${seconds / 60}m ${seconds % 60}s ₹${"%.2f".format(cost)}")
            }
            appendLine("------------------------------")
            appendLine("Subtotal        ₹${"%.2f".format(details.items.sumOf { it.quantity * it.price })}")
            appendLine("Gaming Total    ₹${"%.2f".format(liveGaming)}")
            appendLine("CGST+SGST       ₹${"%.2f".format(liveTax)}")
            appendLine("GRAND TOTAL     ₹${"%.2f".format(liveBase + liveTax)}")
            appendLine("Status: ${if (details.order.isPaid) "Paid" else "Running"}")
        }
    }
}
