package com.cafepos.data.model

import androidx.room.Embedded
import androidx.room.Relation

data class OrderWithDetails(
    @Embedded val order: OrderEntity,
    @Relation(parentColumn = "id", entityColumn = "orderId") val items: List<OrderItemEntity>,
    @Relation(parentColumn = "id", entityColumn = "orderId") val sessions: List<GamingSessionEntity>
)
