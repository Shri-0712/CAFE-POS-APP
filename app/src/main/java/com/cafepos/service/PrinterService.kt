package com.cafepos.service

import com.cafepos.data.model.OrderWithDetails
import com.cafepos.data.model.SettingsEntity

class PrinterService {
    fun escPosBytes(settings: SettingsEntity, details: OrderWithDetails): ByteArray {
        val init = byteArrayOf(0x1B, 0x40)
        val cut = byteArrayOf(0x1D, 0x56, 0x00)
        return init + ReceiptFormatter.text(settings, details).toByteArray(Charsets.UTF_8) + byteArrayOf(0x0A, 0x0A) + cut
    }

    suspend fun printBluetooth(address: String, payload: ByteArray): Result<Unit> = Result.failure(
        NotImplementedError("Connect to paired BluetoothSocket for $address and write ESC/POS bytes.")
    )

    suspend fun printUsb(payload: ByteArray): Result<Unit> = Result.failure(
        NotImplementedError("Use UsbManager, claim printer interface, then bulkTransfer ESC/POS bytes.")
    )
}
