package com.cafepos.data.local

import androidx.room.TypeConverter
import com.cafepos.data.model.MenuCategory
import com.cafepos.data.model.OrderStatus
import com.cafepos.data.model.OrderType

class Converters {
    @TypeConverter fun toOrderStatus(value: String) = OrderStatus.valueOf(value)
    @TypeConverter fun fromOrderStatus(value: OrderStatus) = value.name
    @TypeConverter fun toOrderType(value: String) = OrderType.valueOf(value)
    @TypeConverter fun fromOrderType(value: OrderType) = value.name
    @TypeConverter fun toMenuCategory(value: String) = MenuCategory.valueOf(value)
    @TypeConverter fun fromMenuCategory(value: MenuCategory) = value.name
}
