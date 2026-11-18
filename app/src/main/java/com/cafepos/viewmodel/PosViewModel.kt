package com.cafepos.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cafepos.data.model.*
import com.cafepos.repository.PosRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class PosViewModel(private val repo: PosRepository) : ViewModel() {
    val activeOrders = repo.activeOrders.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val menu = repo.menu.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val settings = repo.settings.map { it ?: SettingsEntity() }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SettingsEntity())
    private val _selectedOrderId = MutableStateFlow<Long?>(null)
    val selectedOrder = _selectedOrderId.flatMapLatest { id -> if (id == null) flowOf(null) else repo.order(id) }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
    private val _reportsNewestFirst = MutableStateFlow(true)
    val reportsNewestFirst: StateFlow<Boolean> = _reportsNewestFirst.asStateFlow()
    val reports = repo.reports(0L, Long.MAX_VALUE).combine(_reportsNewestFirst) { orders, newestFirst ->
        if (newestFirst) orders.sortedByDescending { it.order.completedAt ?: it.order.createdAt } else orders.sortedBy { it.order.completedAt ?: it.order.createdAt }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectOrder(id: Long) { _selectedOrderId.value = id }
    fun sortReportsByNewest(newestFirst: Boolean) { _reportsNewestFirst.value = newestFirst }
    fun createOrder(type: OrderType, table: String) = viewModelScope.launch { _selectedOrderId.value = repo.createOrder(type, table) }
    fun addMenuItem(item: MenuItemEntity) = selectedOrder.value?.let { order -> viewModelScope.launch { if (item.category == MenuCategory.Games) repo.startGame(order.order.id, item) else repo.addItem(order.order.id, item) } }
    fun stopGame(session: GamingSessionEntity) = viewModelScope.launch { repo.stopGame(session) }
    fun checkout() = selectedOrder.value?.let { viewModelScope.launch { repo.checkout(it.order) } }
    fun saveSettings(settings: SettingsEntity) = viewModelScope.launch { repo.saveSettings(settings) }
    fun upsertMenu(item: MenuItemEntity) = viewModelScope.launch { repo.upsertMenu(item) }
}

class PosViewModelFactory(private val repo: PosRepository) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T = PosViewModel(repo) as T
}
