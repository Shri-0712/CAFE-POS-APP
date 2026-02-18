import { Order, OrderItem } from '@/types/pos';
import { getActiveTableNumbers, getTableTotal, fetchActiveOrders, useStore } from '@/lib/store';
import { Minus, Plus, Trash2, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderPanelProps {
  onOrderTypeChange: (type: 'dine-in' | 'takeaway') => void;
  onTableNumberChange: (value: string) => void;
  onQuantityChange: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onViewTableBill: (tableNumber: string) => void;
}

const TABLE_BUTTONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const OrderPanel = ({
  onOrderTypeChange,
  onTableNumberChange,
  onQuantityChange,
  onRemoveItem,
  onViewTableBill,
}: OrderPanelProps) => {
  const { activeOrderId, addItemByMenuItemId, completeOrder, switchOrderWithUpdate } = useStore();
  const [activeTables, setActiveTables] = useState<string[]>([]);
  const [tableTotals, setTableTotals] = useState<Record<string, number>>({});
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order>({
    items: [],
    orderType: 'dine-in',
    tableNumber: null,
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    id: '',
    gamingSessions: [],
    paymentMode: null,
    isPaid: false,
    isCompleted: false,
    gamingTotal: 0,
    createdAt: new Date(),
  });

  useEffect(() => {
    async function initializeOrders() {
      const orders = await fetchActiveOrders();
      setActiveOrders(orders);
      if (activeOrderId) {
        const foundOrder = orders.find(order => order.id === activeOrderId);
        if (foundOrder) {
          setCurrentOrder(foundOrder);
        } else if (orders.length > 0) {
          setCurrentOrder(orders[0]);
        } else {
          setCurrentOrder({
            items: [],
            orderType: 'dine-in',
            tableNumber: null,
            subtotal: 0,
            taxAmount: 0,
            total: 0,
            id: '',
            gamingSessions: [],
            paymentMode: null,
            isPaid: false,
            isCompleted: false,
            gamingTotal: 0,
            createdAt: new Date(),
          });
        }
      } else if (orders.length > 0) {
        setCurrentOrder(orders[0]);
      } else {
        setCurrentOrder({
          items: [],
          orderType: 'dine-in',
          tableNumber: null,
          subtotal: 0,
          taxAmount: 0,
          total: 0,
          id: '',
          gamingSessions: [],
          paymentMode: null,
          isPaid: false,
          isCompleted: false,
          gamingTotal: 0,
          createdAt: new Date(),
        });
      }
    }

    async function fetchTables() {
      const tables = await getActiveTableNumbers();
      setActiveTables(tables);

      const totals: Record<string, number> = {};
      for (const table of tables) {
        const totalData = await getTableTotal(table);
        totals[table] = totalData.total;
      }
      setTableTotals(totals);
    }

    initializeOrders();
    fetchTables();
  }, [activeOrderId]);

  const isTableActive = (num: string) => activeTables.includes(`Table ${num}`);

  // Handler wrappers to update backend and refresh currentOrder
  const handleQuantityChange = async (itemId: string, delta: number) => {
    if (!currentOrder.id) return;
    await addItemByMenuItemId(currentOrder.id, itemId, delta);
    const updatedOrders = await fetchActiveOrders();
    setActiveOrders(updatedOrders);
    const updatedOrder = updatedOrders.find(order => order.id === currentOrder.id);
    if (updatedOrder) setCurrentOrder(updatedOrder);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!currentOrder.id) return;
    // Remove item by adding negative quantity equal to current quantity
    const item = currentOrder.items.find((i: OrderItem) => i.menuItem.id === itemId);
    if (!item) return;
    await addItemByMenuItemId(currentOrder.id, itemId, -item.quantity);
    const updatedOrders = await fetchActiveOrders();
    setActiveOrders(updatedOrders);
    const updatedOrder = updatedOrders.find(order => order.id === currentOrder.id);
    if (updatedOrder) setCurrentOrder(updatedOrder);
  };

  // Wrap passed-in handlers to integrate with backend updates
  const wrappedOnQuantityChange = (itemId: string, delta: number) => {
    handleQuantityChange(itemId, delta);
    onQuantityChange(itemId, delta);
  };

  const wrappedOnRemoveItem = (itemId: string) => {
    handleRemoveItem(itemId);
    onRemoveItem(itemId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Order Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={async () => {
            if (!currentOrder.id) return;
            onOrderTypeChange('dine-in');
            await switchOrderWithUpdate(currentOrder.id, { orderType: 'dine-in' });
            const updatedOrders = await fetchActiveOrders();
            setActiveOrders(updatedOrders);
            const updatedOrder = updatedOrders.find(order => order.id === currentOrder.id);
            if (updatedOrder) setCurrentOrder(updatedOrder);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            currentOrder.orderType === 'dine-in'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          🍽️ Dine-in
        </button>
        <button
          onClick={async () => {
            if (!currentOrder.id) return;
            onOrderTypeChange('takeaway');
            await switchOrderWithUpdate(currentOrder.id, { orderType: 'takeaway' });
            const updatedOrders = await fetchActiveOrders();
            setActiveOrders(updatedOrders);
            const updatedOrder = updatedOrders.find(order => order.id === currentOrder.id);
            if (updatedOrder) setCurrentOrder(updatedOrder);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            currentOrder.orderType === 'takeaway'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          📦 Takeaway
        </button>
      </div>

      {/* Quick Table Selection - Only for Dine-in */}
      {currentOrder.orderType === 'dine-in' && (
        <div className="mb-4 animate-fade-in">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Table
            {activeTables.length > 0 && (
              <span className="ml-2 text-xs text-accent">
                ({activeTables.length} active)
              </span>
            )}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {TABLE_BUTTONS.map((num) => {
              const active = isTableActive(num);
              const selected = currentOrder.tableNumber === `Table ${num}`;
              const tableTotal = active ? tableTotals[`Table ${num}`] ?? 0 : 0;

              return (
                <div key={num} className="relative">
                  <button
                    onClick={async () => {
                      if (!currentOrder.id) return;
                      onTableNumberChange(`Table ${num}`);
                      await switchOrderWithUpdate(currentOrder.id, { tableNumber: `Table ${num}` });
                      const updatedOrders = await fetchActiveOrders();
                      setActiveOrders(updatedOrders);
                      const updatedOrder = updatedOrders.find(order => order.id === currentOrder.id);
                      if (updatedOrder) setCurrentOrder(updatedOrder);
                    }}
                    className={`w-full py-2.5 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      selected
                        ? 'bg-accent text-accent-foreground shadow-md ring-2 ring-accent'
                        : active
                        ? 'bg-success/20 text-success border-2 border-success/50 hover:bg-success/30'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {num}
                  </button>
                  {active && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTableBill(`Table ${num}`);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform"
                      title={`View bill: ₹${tableTotal.toFixed(0)}`}
                    >
                      <Receipt className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {currentOrder.tableNumber && (
            <p className="mt-2 text-sm text-center font-medium text-primary">
              📍 {currentOrder.tableNumber} selected
              {isTableActive(currentOrder.tableNumber.replace('Table ', '')) && (
                <span className="ml-2 text-success">(has pending orders)</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {currentOrder.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-center">No items yet</p>
            <p className="text-sm text-center">Tap menu items to add</p>
          </div>
        ) : (
          currentOrder.items.map((item: OrderItem) => (
            <div key={item.menuItem.id} className="order-item animate-fade-in">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.menuItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  ₹{item.menuItem.price} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary min-w-[60px] text-right">
                  ₹{item.menuItem.price * item.quantity}
                </span>
                <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                  <button
                    onClick={() => wrappedOnQuantityChange(item.menuItem.id, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => wrappedOnQuantityChange(item.menuItem.id, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => wrappedOnRemoveItem(item.menuItem.id)}
                  className="w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Summary */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>₹{currentOrder.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>GST</span>
          <span>₹{currentOrder.taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
          <span>Total</span>
          <span className="text-primary">₹{currentOrder.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
