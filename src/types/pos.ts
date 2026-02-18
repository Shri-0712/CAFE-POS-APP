export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  taxPercent: number;
  enabled: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface GameItem {
  id: string;
  name: string;
  pricePerHour: number;
  taxPercent: number;
  enabled: boolean;
}

export interface GamingSession {
  id: string;
  gameItem: GameItem;
  startTime: string;
  endTime: string | null;
  isRunning: boolean;
  durationMinutes: number;
  totalCharge: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  gamingSessions: GamingSession[];
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string | null;
  customerPhone: string | null;
  paymentMode: 'cash' | 'upi' | 'card' | null;
  isPaid: boolean;
  createdAt: Date;
  subtotal: number;
  taxAmount: number;
  isCompleted: boolean;
  gamingTotal: number;
  total: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface DailySales {
  date: string;
  totalSales: number;
  orderCount: number;
  itemSales: Record<string, { name: string; quantity: number; revenue: number }>;
}

export interface AdminSettings {
  cafeName: string;
  gstNumber: string;
  address: string;
  phone: string;
  email: string;
}

export interface CustomerTab {
  id: string;
  name: string;
  customerPhone: string;
  orderItems: OrderItem[];
  gamingSessions: GamingSession[];
  orderType: 'dine-in' | 'takeaway';
  createdAt: string;
}
