package com.cafepos.service

import android.content.Context
import android.graphics.pdf.PdfDocument
import android.os.Environment
import com.cafepos.data.model.OrderWithDetails
import com.cafepos.data.model.SettingsEntity
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ExportService(private val context: Context) {
    fun exportReceiptPdf(settings: SettingsEntity, details: OrderWithDetails): File {
        val doc = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(226, 720, 1).create()
        val page = doc.startPage(pageInfo)
        val paint = android.graphics.Paint().apply { textSize = 10f; isAntiAlias = true }
        ReceiptFormatter.text(settings, details).lines().forEachIndexed { index, line -> page.canvas.drawText(line, 8f, 18f + index * 14f, paint) }
        doc.finishPage(page)
        val file = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "receipt_${details.order.id}.pdf")
        FileOutputStream(file).use { doc.writeTo(it) }
        doc.close()
        return file
    }

    fun exportReportsCsv(reports: List<OrderWithDetails>): File {
        val file = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "reports.csv")
        val fmt = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        file.writeText(buildString {
            appendLine("Order ID,Table,Created,Completed,Subtotal,Gaming,Tax,Total")
            reports.forEach {
                val completed = it.order.completedAt?.let { ts -> fmt.format(Date(ts)) } ?: ""
                appendLine("${it.order.id},${it.order.tableNumber},${fmt.format(Date(it.order.createdAt))},$completed,${it.order.subtotal},${it.order.gamingTotal},${it.order.taxAmount},${it.order.total}")
            }
        })
        return file
    }

    fun exportReportPdf(reports: List<OrderWithDetails>): File {
        val doc = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = doc.startPage(pageInfo)
        val paint = android.graphics.Paint().apply { textSize = 12f; isAntiAlias = true }
        val fmt = SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault())
        page.canvas.drawText("Cafe POS Bills Report", 32f, 36f, paint)
        var y = 64f
        reports.forEach { details ->
            if (y > 800f) return@forEach
            val date = fmt.format(Date(details.order.completedAt ?: details.order.createdAt))
            page.canvas.drawText("#${details.order.id}  $date  Table ${details.order.tableNumber}  Total ₹${"%.2f".format(details.order.total)}", 32f, y, paint)
            y += 22f
        }
        doc.finishPage(page)
        val file = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "bills_report.pdf")
        FileOutputStream(file).use { doc.writeTo(it) }
        doc.close()
        return file
    }
}
