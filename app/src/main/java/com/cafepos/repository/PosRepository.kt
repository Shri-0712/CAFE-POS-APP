package com.cafepos.repository

import com.cafepos.data.local.CafeDatabase
import com.cafepos.data.model.*
import kotlinx.coroutines.flow.first
import kotlin.math.max

class PosRepository(db: CafeDatabase) {
    private val dao = db.posDao()
    val activeOrders = dao.activeOrders()
    val menu = dao.menu()
    val settings = dao.settings()
    fun reports(from: Long, to: Long) = dao.reports(from, to)
    fun order(id: Long) = dao.order(id)

    suspend fun createOrder(type: OrderType, table: String): Long = dao.insertOrder(OrderEntity(orderType = type, tableNumber = table))
    suspend fun addItem(orderId: Long, item: MenuItemEntity) = dao.insertItem(OrderItemEntity(orderId = orderId, name = item.name, quantity = 1, price = item.price)).also { recalc(orderId) }
    suspend fun startGame(orderId: Long, item: MenuItemEntity) = dao.insertSession(GamingSessionEntity(orderId = orderId, gameName = item.name, pricePerHour = item.price)).also { recalc(orderId) }
    suspend fun stopGame(session: GamingSessionEntity) {
        val end = System.currentTimeMillis()
        dao.updateSession(session.copy(endTime = end, cost = gameCost(session, end)))
        recalc(session.orderId)
    }
    suspend fun checkout(order: OrderEntity) {
        val details = dao.order(order.id).first() ?: return
        details.sessions.filter { it.endTime == null }.forEach { stopGame(it) }
        recalc(order.id)
        val latest = dao.order(order.id).first()?.order ?: order
        dao.updateOrder(latest.copy(status = OrderStatus.Completed, isPaid = true, completedAt = System.currentTimeMillis()))
    }
    suspend fun upsertMenu(item: MenuItemEntity) = if (item.id == 0L) dao.insertMenuItem(item) else dao.updateMenuItem(item)
    suspend fun deleteMenu(id: Long) = dao.deleteMenuItem(id)
    suspend fun saveSettings(settings: SettingsEntity) = dao.saveSettings(settings)

    suspend fun recalc(orderId: Long) {
        val details = dao.order(orderId).first() ?: return
        val settings = dao.settings().first() ?: SettingsEntity()
        val now = System.currentTimeMillis()
        val subtotal = details.items.sumOf { it.quantity * it.price }
        val gaming = details.sessions.sumOf { if (it.endTime == null) gameCost(it, now) else it.cost }
        val tax = (subtotal + gaming) * ((settings.cgstPercent + settings.sgstPercent) / 100.0)
        dao.updateOrder(details.order.copy(subtotal = subtotal, gamingTotal = gaming, taxAmount = tax, total = subtotal + gaming + tax))
    }

    companion object {
        fun gameCost(session: GamingSessionEntity, now: Long = System.currentTimeMillis()): Double {
            val end = session.endTime ?: now
            val hours = max(1.0 / 60.0, (end - session.startTime) / 3_600_000.0)
            return hours * session.pricePerHour
        }
    }
}
