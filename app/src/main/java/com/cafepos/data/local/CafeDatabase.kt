package com.cafepos.data.local

import android.content.Context
import androidx.room.*
import androidx.sqlite.db.SupportSQLiteDatabase
import com.cafepos.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(entities = [OrderEntity::class, OrderItemEntity::class, GamingSessionEntity::class, MenuItemEntity::class, SettingsEntity::class], version = 1)
@TypeConverters(Converters::class)
abstract class CafeDatabase : RoomDatabase() {
    abstract fun posDao(): PosDao

    companion object {
        @Volatile private var INSTANCE: CafeDatabase? = null
        fun getDatabase(context: Context): CafeDatabase = INSTANCE ?: synchronized(this) {
            Room.databaseBuilder(context, CafeDatabase::class.java, "cafe_pos.db")
                .addCallback(seedCallback)
                .build().also { INSTANCE = it }
        }

        private val seedCallback = object : Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        val dao = database.posDao()
                        dao.saveSettings(SettingsEntity())
                        listOf(
                            MenuItemEntity(name = "Cappuccino", category = MenuCategory.Beverages, price = 180.0),
                            MenuItemEntity(name = "Cold Coffee", category = MenuCategory.Beverages, price = 150.0),
                            MenuItemEntity(name = "French Fries", category = MenuCategory.Snacks, price = 120.0),
                            MenuItemEntity(name = "Brownie", category = MenuCategory.Desserts, price = 160.0),
                            MenuItemEntity(name = "FIFA", category = MenuCategory.Games, price = 100.0),
                            MenuItemEntity(name = "PS5 Racing", category = MenuCategory.Games, price = 150.0)
                        ).forEach { dao.insertMenuItem(it) }
                    }
                }
            }
        }
    }
}
