import type { Order, OrderItem } from "@/types/pos";
import { MenuItem, Category, DailySales, AdminSettings, GameItem, GamingSession, CustomerTab } from '@/types/pos';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';


const MENU_KEY = 'cafe_pos_menu';
const ORDERS_KEY = 'cafe_pos_orders';
const CATEGORIES_KEY = 'cafe_pos_categories';
const TABLE_BILLS_KEY = 'cafe_pos_table_bills';
const ADMIN_SETTINGS_KEY = 'cafe_pos_admin_settings';
const GAME_ITEMS_KEY = 'cafe_pos_game_items';
const CUSTOMER_TABS_KEY = 'cafe_pos_customer_tabs';
const ACTIVE_ORDER_KEY = 'cafe_pos_active_order';

// ===== Admin Settings =====
const defaultAdminSettings: AdminSettings = {
  cafeName: 'Sunset Cafe',
  gstNumber: '',
  address: '',
  phone: '',
  email: '',
};

export const getAdminSettings = (): AdminSettings => {
  const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(defaultAdminSettings));
  return defaultAdminSettings;
};

export const saveAdminSettings = (settings: AdminSettings) => {
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
};

// ===== Game Items =====
export const getGameItems = (): GameItem[] => {
  const stored = localStorage.getItem(GAME_ITEMS_KEY);
  if (stored) return JSON.parse(stored);
  return [];
};

export const saveGameItems = (items: GameItem[]) => {
  localStorage.setItem(GAME_ITEMS_KEY, JSON.stringify(items));
};

// ===== Customer Tabs =====
export const getCustomerTabs = (): CustomerTab[] => {
  const stored = localStorage.getItem(CUSTOMER_TABS_KEY);
  if (stored) return JSON.parse(stored);
  return [];
};

export const saveCustomerTabs = (tabs: CustomerTab[]) => {
  localStorage.setItem(CUSTOMER_TABS_KEY, JSON.stringify(tabs));
};

// ===== Categories =====
const defaultCategories: Category[] = [
  { id: 'coffee', name: 'Coffee', icon: '☕' },
  { id: 'tea', name: 'Tea', icon: '🍵' },
  { id: 'snacks', name: 'Snacks', icon: '🥐' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
];

const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Espresso', price: 120, category: 'coffee', taxPercent: 5, enabled: true },
  { id: '2', name: 'Cappuccino', price: 180, category: 'coffee', taxPercent: 5, enabled: true },
  { id: '3', name: 'Latte', price: 200, category: 'coffee', taxPercent: 5, enabled: true },
  { id: '4', name: 'Americano', price: 150, category: 'coffee', taxPercent: 5, enabled: true },
  { id: '5', name: 'Mocha', price: 220, category: 'coffee', taxPercent: 5, enabled: true },
  { id: '6', name: 'Masala Chai', price: 80, category: 'tea', taxPercent: 5, enabled: true },
  { id: '7', name: 'Green Tea', price: 100, category: 'tea', taxPercent: 5, enabled: true },
  { id: '8', name: 'Iced Tea', price: 120, category: 'tea', taxPercent: 5, enabled: true },
  { id: '9', name: 'Croissant', price: 150, category: 'snacks', taxPercent: 12, enabled: true },
  { id: '10', name: 'Sandwich', price: 180, category: 'snacks', taxPercent: 12, enabled: true },
  { id: '11', name: 'Samosa', price: 40, category: 'snacks', taxPercent: 12, enabled: true },
  { id: '12', name: 'Brownie', price: 120, category: 'desserts', taxPercent: 12, enabled: true },
  { id: '13', name: 'Cheesecake', price: 250, category: 'desserts', taxPercent: 12, enabled: true },
  { id: '14', name: 'Cold Coffee', price: 180, category: 'beverages', taxPercent: 5, enabled: true },
  { id: '15', name: 'Fresh Lime Soda', price: 80, category: 'beverages', taxPercent: 5, enabled: true },
];

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  return defaultCategories;
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getMenuItems = (): MenuItem[] => {
  const stored = localStorage.getItem(MENU_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(MENU_KEY, JSON.stringify(defaultMenuItems));
  return defaultMenuItems;
};

export const saveMenuItems = (items: MenuItem[]) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(items));
};

export const getOrders = (): Order[] => {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (stored) {
    const orders = JSON.parse(stored);
    return orders.map((o: Order) => ({
      ...o,
      gamingSessions: o.gamingSessions || [],
      gamingTotal: o.gamingTotal || 0,
      createdAt: new Date(o.createdAt),
    }));
  }
  return [];
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const updateOrder = (order: Order) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === order.id);
  if (index !== -1) {
    orders[index] = order;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
};

export const generateOrderId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
};

export const getTodaysSales = (): DailySales => {
  const orders = getOrders();
  const today = new Date().toISOString().slice(0, 10);
  
  const todaysOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toISOString().slice(0, 10);
    return orderDate === today && o.isPaid;
  });

  const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  todaysOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSales[item.menuItem.id]) {
        itemSales[item.menuItem.id] = {
          name: item.menuItem.name,
          quantity: 0,
          revenue: 0,
        };
      }
      itemSales[item.menuItem.id].quantity += item.quantity;
      itemSales[item.menuItem.id].revenue += item.menuItem.price * item.quantity;
    });
  });

  return {
    date: today,
    totalSales: todaysOrders.reduce((sum, o) => sum + o.total, 0),
    orderCount: todaysOrders.length,
    itemSales,
  };
};

// Table Bills Management
export interface TableBill {
  tableNumber: string;
  orders: Order[];
  pendingItems: OrderItem[];
  isActive: boolean;
  createdAt: Date;
}

export const getTableBills = (): Record<string, TableBill> => {
  const stored = localStorage.getItem(TABLE_BILLS_KEY);
  if (stored) {
    const bills = JSON.parse(stored);
    Object.keys(bills).forEach(key => {
      bills[key].createdAt = new Date(bills[key].createdAt);
      bills[key].pendingItems = bills[key].pendingItems || [];
      bills[key].orders = bills[key].orders.map((o: Order) => ({
        ...o,
        gamingSessions: o.gamingSessions || [],
        gamingTotal: o.gamingTotal || 0,
        createdAt: new Date(o.createdAt),
      }));
    });
    return bills;
  }
  return {};
};

export const saveTableBill = (tableNumber: string, order: Order) => {
  const bills = getTableBills();
  
  if (!bills[tableNumber]) {
    bills[tableNumber] = {
      tableNumber,
      orders: [],
      pendingItems: [],
      isActive: true,
      createdAt: new Date(),
    };
  }
  
  bills[tableNumber].orders.push(order);
  bills[tableNumber].pendingItems = [];
  bills[tableNumber].isActive = true;
  localStorage.setItem(TABLE_BILLS_KEY, JSON.stringify(bills));
};

export const saveTablePendingItems = (tableNumber: string, items: OrderItem[]) => {
  const bills = getTableBills();
  
  if (!bills[tableNumber]) {
    bills[tableNumber] = {
      tableNumber,
      orders: [],
      pendingItems: items,
      isActive: true,
      createdAt: new Date(),
    };
  } else {
    bills[tableNumber].pendingItems = items;
    bills[tableNumber].isActive = true;
  }
  
  if (bills[tableNumber].orders.length === 0 && items.length === 0) {
    delete bills[tableNumber];
  }
  
  localStorage.setItem(TABLE_BILLS_KEY, JSON.stringify(bills));
};

export const getTablePendingItems = (tableNumber: string): OrderItem[] => {
  const bill = getTableBill(tableNumber);
  return bill?.pendingItems || [];
};

export const getTableBill = (tableNumber: string): TableBill | null => {
  const bills = getTableBills();
  return bills[tableNumber] || null;
};

export const closeTableBill = (tableNumber: string) => {
  const bills = getTableBills();
  if (bills[tableNumber]) {
    bills[tableNumber].isActive = false;
    localStorage.setItem(TABLE_BILLS_KEY, JSON.stringify(bills));
  }
};

export const clearTableBill = (tableNumber: string) => {
  const bills = getTableBills();
  delete bills[tableNumber];
  localStorage.setItem(TABLE_BILLS_KEY, JSON.stringify(bills));
};

export const getActiveTableNumbers = (): string[] => {
  const bills = getTableBills();
  return Object.keys(bills).filter(key => bills[key].isActive);
};

export const getTableTotal = (tableNumber: string): { subtotal: number; taxAmount: number; total: number } => {
  const bill = getTableBill(tableNumber);
  if (!bill) return { subtotal: 0, taxAmount: 0, total: 0 };
  
  let subtotal = 0;
  let taxAmount = 0;
  
  bill.orders.forEach(order => {
    subtotal += order.subtotal;
    taxAmount += order.taxAmount;
  });
  
  bill.pendingItems.forEach(item => {
    const itemTotal = item.menuItem.price * item.quantity;
    subtotal += itemTotal;
    taxAmount += itemTotal * (item.menuItem.taxPercent / 100);
  });
  
  return { subtotal, taxAmount, total: subtotal + taxAmount };
};

// ===== Gaming Helpers =====
export const calculateGamingCharge = (session: GamingSession): { durationMinutes: number; totalCharge: number } => {
  const start = new Date(session.startTime).getTime();
  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  const durationMinutes = Math.max(1, Math.ceil((end - start) / 60000));
  const totalCharge = (durationMinutes / 60) * session.gameItem.pricePerHour;
  return { durationMinutes, totalCharge };
};

// Backend API URL
const API_URL = 'http://localhost:3001/api/orders';

// Backend async functions
export const fetchActiveOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch(`${API_URL}?status=active`);
    if (!response.ok) throw new Error('Failed to fetch active orders');
    const orders: Order[] = await response.json();
    return orders.map(o => ({
      ...o,
      gamingSessions: o.gamingSessions || [],
      gamingTotal: o.gamingTotal || 0,
      createdAt: new Date(o.createdAt),
    }));
  } catch {
    // fallback to localStorage
    return getOrders().filter(o => !o.isPaid);
  }
};

export const fetchCompletedOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch(`${API_URL}?status=completed`);
    if (!response.ok) throw new Error('Failed to fetch completed orders');
    const orders: Order[] = await response.json();
    return orders.map(o => ({
      ...o,
      gamingSessions: o.gamingSessions || [],
      gamingTotal: o.gamingTotal || 0,
      createdAt: new Date(o.createdAt),
    }));
  } catch {
    // fallback to localStorage
    return getOrders().filter(o => o.isPaid);
  }
};

export const saveOrderToDB = async (order: Order): Promise<void> => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch {
    // fallback: save to localStorage
    saveOrder(order);
  }
};

export const completeOrderInDB = async (orderId: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/${orderId}/complete`, {
      method: 'POST',
    });
  } catch {
    // fallback: update in localStorage
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].isPaid = true;
      orders[index].isCompleted = true;
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
  }
};

interface StoreState {
  orders: Order[];
  activeOrderId: string | null;
  tabs: CustomerTab[];
  activeTabId: string;

  createNewOrder: () => Promise<void>;
  switchOrder: (id: string) => void;
  switchOrderWithUpdate: (id: string, updates: { orderType?: 'dine-in' | 'takeaway'; tableNumber?: string }) => Promise<void>;
  addItemToOrder: (orderId: string, item: OrderItem) => Promise<void>;
  addItemByMenuItemId: (orderId: string, menuItemId: string, quantity: number) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  addTab: (tab: CustomerTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updater: (tab: CustomerTab) => CustomerTab) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      orders: [],
      activeOrderId: null,
      tabs: [
        { id: 'tab-1', name: 'Customer 1', customerPhone: '', orderItems: [], gamingSessions: [], orderType: 'dine-in', createdAt: new Date().toISOString() }
      ],
      activeTabId: 'tab-1',

      createNewOrder: async () => {
        const newOrder: Order = {
          id: Date.now().toString(),
          items: [],
          createdAt: new Date(),
          orderType: "dine-in",
          tableNumber: "1",
          paymentMode: "cash",
          subtotal: 0,
          taxAmount: 0,
          total: 0,
          isPaid: false,
          isCompleted: false,
          gamingSessions: [],
          gamingTotal: 0
        };
        await saveOrderToDB(newOrder);
        const updatedOrders = [...get().orders, newOrder];
        set({
          orders: updatedOrders,
          activeOrderId: newOrder.id
        });
      },

      switchOrder: (id) => {
        set({
          activeOrderId: id
        });
      },

      switchOrderWithUpdate: async (id, updates) => {
        const order = get().orders.find(o => o.id === id);
        if (order) {
          const updatedOrder = { ...order, ...updates };
          await saveOrderToDB(updatedOrder);
          set((state) => ({
            orders: state.orders.map(o => o.id === id ? updatedOrder : o)
          }));
        }
      },

      addItemToOrder: async (orderId, item) => {
        set((state) => {
          const updatedOrders = state.orders.map(order =>
            order.id === orderId
              ? { ...order, items: [...order.items, item] }
              : order
          );
          return { orders: updatedOrders };
        });
        const order = get().orders.find(o => o.id === orderId);
        if (order) {
          await saveOrderToDB(order);
        }
      },

      addItemByMenuItemId: async (orderId, menuItemId, quantity) => {
        const menuItems = getMenuItems();
        const menuItem = menuItems.find(m => m.id === menuItemId);
        if (!menuItem) return;

        const orderItem: OrderItem = { menuItem, quantity };
        
        set((state) => {
          const updatedOrders = state.orders.map(order => {
            if (order.id !== orderId) return order;
            
            const existingItemIndex = order.items.findIndex(i => i.menuItem.id === menuItemId);
            let updatedItems: OrderItem[];
            
            if (existingItemIndex >= 0) {
              // Item exists, update quantity
              updatedItems = [...order.items];
              updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + quantity
              };
            } else {
              // New item
              updatedItems = [...order.items, orderItem];
            }
            
            return { ...order, items: updatedItems };
          });
          return { orders: updatedOrders };
        });
        
        const order = get().orders.find(o => o.id === orderId);
        if (order) {
          await saveOrderToDB(order);
        }
      },

      completeOrder: async (orderId) => {
        set((state) => {
          const updatedOrders = state.orders.map(order =>
            order.id === orderId
              ? { ...order, isPaid: true, isCompleted: true }
              : order
          );
          return { orders: updatedOrders };
        });
        await completeOrderInDB(orderId);
      },

      addTab: (tab) => {
        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: tab.id
        }));
      },

      removeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        if (tabs.length <= 1) return; // Don't remove the last tab
        
        const newTabs = tabs.filter(t => t.id !== tabId);
        const newActiveTabId = activeTabId === tabId 
          ? (newTabs[0]?.id || 'tab-1')
          : activeTabId;
        
        set({
          tabs: newTabs,
          activeTabId: newActiveTabId
        });
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },

      updateTab: (tabId, updater) => {
        set((state) => ({
          tabs: state.tabs.map(t => t.id === tabId ? updater(t) : t)
        }));
      }
    }),
    {
      name: 'cafe_pos_store',
      partialize: (state) => ({ 
        orders: state.orders, 
        activeOrderId: state.activeOrderId,
        tabs: state.tabs,
        activeTabId: state.activeTabId
      }),
    }
  )
);
