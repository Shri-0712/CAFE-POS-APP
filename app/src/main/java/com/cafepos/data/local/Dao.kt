package com.cafepos.data.local

import androidx.room.*
import com.cafepos.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PosDao {
    @Transaction @Query("SELECT * FROM orders WHERE status = 'Active' ORDER BY createdAt DESC")
    fun activeOrders(): Flow<List<OrderWithDetails>>

    @Transaction @Query("SELECT * FROM orders WHERE status = 'Completed' AND completedAt BETWEEN :from AND :to ORDER BY completedAt DESC")
    fun reports(from: Long, to: Long): Flow<List<OrderWithDetails>>

    @Transaction @Query("SELECT * FROM orders WHERE id = :id")
    fun order(id: Long): Flow<OrderWithDetails?>

    @Insert suspend fun insertOrder(order: OrderEntity): Long
    @Update suspend fun updateOrder(order: OrderEntity)
    @Insert suspend fun insertItem(item: OrderItemEntity)
    @Update suspend fun updateItem(item: OrderItemEntity)
    @Delete suspend fun deleteItem(item: OrderItemEntity)
    @Insert suspend fun insertSession(session: GamingSessionEntity): Long
    @Update suspend fun updateSession(session: GamingSessionEntity)

    @Query("SELECT * FROM menu_items WHERE isActive = 1 ORDER BY category, name")
    fun menu(): Flow<List<MenuItemEntity>>
    @Insert suspend fun insertMenuItem(item: MenuItemEntity)
    @Update suspend fun updateMenuItem(item: MenuItemEntity)
    @Query("UPDATE menu_items SET isActive = 0 WHERE id = :id") suspend fun deleteMenuItem(id: Long)

    @Query("SELECT * FROM settings WHERE id = 1") fun settings(): Flow<SettingsEntity?>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun saveSettings(settings: SettingsEntity)
}
