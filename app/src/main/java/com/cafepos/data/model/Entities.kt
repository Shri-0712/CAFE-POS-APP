package com.cafepos.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

enum class OrderStatus { Active, Completed }
enum class OrderType { DineIn, Takeaway }
enum class MenuCategory { Beverages, Snacks, Desserts, Games }

@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val orderType: OrderType = OrderType.DineIn,
    val tableNumber: String = "",
    val status: OrderStatus = OrderStatus.Active,
    val isPaid: Boolean = false,
    val subtotal: Double = 0.0,
    val taxAmount: Double = 0.0,
    val gamingTotal: Double = 0.0,
    val total: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null
)

@Entity(
    tableName = "order_items",
    foreignKeys = [ForeignKey(entity = OrderEntity::class, parentColumns = ["id"], childColumns = ["orderId"], onDelete = ForeignKey.CASCADE)],
    indices = [Index("orderId")]
)
data class OrderItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val orderId: Long,
    val name: String,
    val quantity: Int,
    val price: Double
)

@Entity(
    tableName = "gaming_sessions",
    foreignKeys = [ForeignKey(entity = OrderEntity::class, parentColumns = ["id"], childColumns = ["orderId"], onDelete = ForeignKey.CASCADE)],
    indices = [Index("orderId")]
)
data class GamingSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val orderId: Long,
    val gameName: String,
    val pricePerHour: Double,
    val startTime: Long = System.currentTimeMillis(),
    val endTime: Long? = null,
    val cost: Double = 0.0
)

@Entity(tableName = "menu_items")
data class MenuItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val category: MenuCategory,
    val price: Double,
    val isActive: Boolean = true
)

@Entity(tableName = "settings")
data class SettingsEntity(
    @PrimaryKey val id: Int = 1,
    val cafeName: String = "Game Brew Café",
    val address: String = "Main Market, City",
    val gstNumber: String = "GSTIN000000000",
    val cgstPercent: Double = 2.5,
    val sgstPercent: Double = 2.5
)
