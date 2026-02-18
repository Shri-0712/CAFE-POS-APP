import React, { useEffect } from "react";
import { useState, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { BillPreview } from '@/components/pos/BillPreview';
import { TableBillModal } from '@/components/pos/TableBillModal';
import { 
  getCategories, 
  getMenuItems, 
  saveOrder, 
  generateOrderId,
  saveTableBill,
  getTableBill,
  clearTableBill,
  saveTablePendingItems,
  getTablePendingItems,
  getGameItems,
  getAdminSettings,
  calculateGamingCharge,
  TableBill,
  useStore
} from '@/lib/store';
import { MenuItem, OrderItem, Order, GamingSession, GameItem, CustomerTab } from '@/types/pos';
import { ShoppingBag, RotateCcw, Plus, X, Gamepad2, Play, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Index = () => {
  const categories = getCategories();
  const menuItems = getMenuItems();
  const gameItems = getGameItems();
  const adminSettings = getAdminSettings();
  
  // Get tabs from store for persistence across navigation
  const { tabs, activeTabId, addTab, removeTab, setActiveTab, updateTab } = useStore();
  const [isRenamingTab, setIsRenamingTab] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [tableBillModalOpen, setTableBillModalOpen] = useState(false);
  const [viewingTableBill, setViewingTableBill] = useState<TableBill | null>(null);
  const [settlingTableBill, setSettlingTableBill] = useState(false);
  const [showGamePanel, setShowGamePanel] = useState(false);
  const [, forceUpdate] = useState({});
  
  // Timer for gaming sessions
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const hasRunning = activeTab?.gamingSessions.some(s => s.isRunning);
      if (hasRunning) forceUpdate({});
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTab]);

  // Helper to update active tab - uses store
  const updateActiveTab = useCallback((updater: (tab: CustomerTab) => CustomerTab) => {
    updateTab(activeTabId, updater);
  }, [activeTabId, updateTab]);

  const orderItems = useMemo(() => activeTab?.orderItems || [], [activeTab]);
  const gamingSessions = useMemo(() => activeTab?.gamingSessions || [], [activeTab]);
  const orderType = activeTab?.orderType || 'dine-in';

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  const { subtotal, taxAmount, gamingTotal, gamingTax, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    
    orderItems.forEach(item => {
      const itemTotal = item.menuItem.price * item.quantity;
      sub += itemTotal;
      tax += itemTotal * (item.menuItem.taxPercent / 100);
    });

    let gTotal = 0;
    let gTax = 0;
    gamingSessions.forEach(session => {
      const { totalCharge } = calculateGamingCharge(session);
      gTotal += totalCharge;
      gTax += totalCharge * (session.gameItem.taxPercent / 100);
    });

    return {
      subtotal: sub,
      taxAmount: tax,
      gamingTotal: gTotal,
      gamingTax: gTax,
      total: sub + tax + gTotal + gTax,
    };
  }, [orderItems, gamingSessions]);

  // Tab management
  const handleAddTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newTab: CustomerTab = {
      id: newId,
      name: `Customer ${tabs.length + 1}`,
      customerPhone: '',
      orderItems: [],
      gamingSessions: [],
      orderType: 'dine-in',
      createdAt: new Date().toISOString(),
    };
    addTab(newTab);
    toast.success('New tab created');
  }, [tabs.length, addTab]);

  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && (tab.orderItems.length > 0 || tab.gamingSessions.length > 0)) {
      toast.error('Settle or clear this tab before closing');
      return;
    }
    if (tabs.length <= 1) {
      toast.error('Cannot close the last tab');
      return;
    }
    removeTab(tabId);
    toast.success('Tab closed');
  }, [tabs, removeTab]);

  const handleStartRename = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setRenameValue(tab.name);
      setIsRenamingTab(tabId);
    }
  }, [tabs]);

  const handleFinishRename = useCallback(() => {
    if (isRenamingTab && renameValue.trim()) {
      updateTab(isRenamingTab, (tab) => ({ ...tab, name: renameValue.trim() }));
    }
    setIsRenamingTab(null);
  }, [isRenamingTab, renameValue, updateTab]);

  const handleAddItem = useCallback((item: MenuItem) => {
    updateActiveTab(tab => {
      const existing = tab.orderItems.find(o => o.menuItem.id === item.id);
      if (existing) {
        return { ...tab, orderItems: tab.orderItems.map(o => o.menuItem.id === item.id ? { ...o, quantity: o.quantity + 1 } : o) };
      }
      return { ...tab, orderItems: [...tab.orderItems, { menuItem: item, quantity: 1 }] };
    });
    toast.success(`Added ${item.name}`);
  }, [updateActiveTab]);

  const handleQuantityChange = useCallback((itemId: string, delta: number) => {
    updateActiveTab(tab => ({
      ...tab,
      orderItems: tab.orderItems
        .map(item => item.menuItem.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter(item => item.quantity > 0)
    }));
  }, [updateActiveTab]);

  const handleRemoveItem = useCallback((itemId: string) => {
    updateActiveTab(tab => ({ ...tab, orderItems: tab.orderItems.filter(item => item.menuItem.id !== itemId) }));
  }, [updateActiveTab]);

  const handleOrderTypeChange = useCallback((type: 'dine-in' | 'takeaway') => {
    updateActiveTab(tab => ({ ...tab, orderType: type }));
  }, [updateActiveTab]);

  const handleClearOrder = useCallback(() => {
    updateActiveTab(tab => ({ ...tab, orderItems: [], gamingSessions: [] }));
    forceUpdate({});
    toast.info('Order cleared');
  }, [updateActiveTab]);

  // Gaming functions
  const handleStartGame = useCallback((game: GameItem) => {
    const session: GamingSession = {
      id: `gs-${Date.now()}`,
      gameItem: game,
      startTime: new Date().toISOString(),
      endTime: null,
      isRunning: true,
      durationMinutes: 0,
      totalCharge: 0,
    };
    updateActiveTab(tab => ({ ...tab, gamingSessions: [...tab.gamingSessions, session] }));
    toast.success(`${game.name} timer started`);
  }, [updateActiveTab]);

  const handleStopGame = useCallback((sessionId: string) => {
    updateActiveTab(tab => ({
      ...tab,
      gamingSessions: tab.gamingSessions.map(s => {
        if (s.id === sessionId && s.isRunning) {
          const endTime = new Date().toISOString();
          const { durationMinutes, totalCharge } = calculateGamingCharge({ ...s, endTime });
          return { ...s, endTime, isRunning: false, durationMinutes, totalCharge };
        }
        return s;
      })
    }));
    toast.success('Game timer stopped');
  }, [updateActiveTab]);

  const handleRemoveSession = useCallback((sessionId: string) => {
    updateActiveTab(tab => ({
      ...tab,
      gamingSessions: tab.gamingSessions.filter(s => s.id !== sessionId)
    }));
  }, [updateActiveTab]);

  const handlePayment = useCallback((paymentMode: 'cash' | 'upi' | 'card') => {
    // Stop all running sessions first
    const finalSessions = gamingSessions.map(s => {
      if (s.isRunning) {
        const endTime = new Date().toISOString();
        const { durationMinutes, totalCharge } = calculateGamingCharge({ ...s, endTime });
        return { ...s, endTime, isRunning: false, durationMinutes, totalCharge };
      }
      return s;
    });

    const order: Order = {
      id: generateOrderId(),
      items: orderItems,
      gamingSessions: finalSessions,
      orderType,
      tableNumber: activeTab?.name || null,
      customerPhone: activeTab?.customerPhone || null,
      paymentMode,
      isPaid: true,
      createdAt: new Date(),
      subtotal,
      taxAmount,
      gamingTotal,
      total,
      isCompleted: false,
    };

    saveOrder(order);
    setCurrentOrder(order);
    setPaymentModalOpen(false);
    setBillPreviewOpen(true);
    
    // Clear the tab
    updateActiveTab(tab => ({ ...tab, orderItems: [], gamingSessions: [] }));
    forceUpdate({});
    toast.success('Payment successful!');
  }, [orderItems, gamingSessions, orderType, activeTab, subtotal, taxAmount, gamingTotal, total, updateActiveTab]);

  const handleViewTableBill = useCallback((table: string) => {
    const bill = getTableBill(table);
    if (bill) {
      setViewingTableBill(bill);
      setTableBillModalOpen(true);
    }
  }, []);

  const handleSettleTableBill = useCallback(() => {
    if (viewingTableBill) {
      setSettlingTableBill(true);
      setTableBillModalOpen(false);
      setPaymentModalOpen(true);
    }
  }, [viewingTableBill]);

  const handleTableBillPayment = useCallback((paymentMode: 'cash' | 'upi' | 'card') => {
    if (!viewingTableBill) return;

    const allItems: OrderItem[] = [];
    viewingTableBill.orders.forEach(order => {
      order.items.forEach(item => {
        const existing = allItems.find(i => i.menuItem.id === item.menuItem.id);
        if (existing) existing.quantity += item.quantity;
        else allItems.push({ ...item });
      });
    });

    let sub = 0, tax = 0;
    allItems.forEach(item => {
      const itemTotal = item.menuItem.price * item.quantity;
      sub += itemTotal;
      tax += itemTotal * (item.menuItem.taxPercent / 100);
    });

    const consolidatedOrder: Order = {
      id: generateOrderId(),
      items: allItems,
      gamingSessions: [],
      orderType: 'dine-in',
      tableNumber: viewingTableBill.tableNumber,
      paymentMode,
      isPaid: true,
      createdAt: new Date(),
      subtotal: sub,
      taxAmount: tax,
      gamingTotal: 0,
      total: sub + tax,
      isCompleted: false,
    };

    saveOrder(consolidatedOrder);
    clearTableBill(viewingTableBill.tableNumber);
    
    setCurrentOrder(consolidatedOrder);
    setPaymentModalOpen(false);
    setBillPreviewOpen(true);
    setSettlingTableBill(false);
    setViewingTableBill(null);
    forceUpdate({});
    toast.success(`${viewingTableBill.tableNumber} bill settled!`);
  }, [viewingTableBill]);

  const handlePrint = useCallback(() => {
    const content = document.getElementById('bill-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Bill</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 4px 0; }
              </style>
            </head>
            <body>${content.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    const content = document.getElementById('bill-content');
    if (content) {
      const canvas = await html2canvas(content, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * 80 / canvas.width],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);
      pdf.save(`bill-${currentOrder?.id || 'receipt'}.pdf`);
      toast.success('PDF downloaded!');
    }
  }, [currentOrder]);

  const handleTableBillPrint = useCallback(() => {
    const content = document.getElementById('table-bill-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Table Bill</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 4px 0; }
              </style>
            </head>
            <body>${content.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, []);

  const handleTableBillPDF = useCallback(async () => {
    const content = document.getElementById('table-bill-content');
    if (content && viewingTableBill) {
      const canvas = await html2canvas(content, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * 80 / canvas.width],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);
      pdf.save(`table-bill-${viewingTableBill.tableNumber}.pdf`);
      toast.success('PDF downloaded!');
    }
  }, [viewingTableBill]);

  const formatDuration = (session: GamingSession) => {
    const { durationMinutes } = calculateGamingCharge(session);
    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const enabledGames = gameItems.filter(g => g.enabled);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-20 lg:ml-64 flex h-screen flex-col">
        {/* Customer Tabs Bar */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-1 border-b border-border bg-card overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl cursor-pointer transition-all text-sm font-medium min-w-[120px] ${
                activeTabId === tab.id
                  ? 'bg-background text-foreground border border-b-0 border-border'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
              onClick={() => setActiveTab(tab.id)}
              onDoubleClick={() => handleStartRename(tab.id)}
            >
              {isRenamingTab === tab.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={e => e.key === 'Enter' && handleFinishRename()}
                  className="bg-transparent border-none outline-none w-full text-sm"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="truncate">{tab.name}</span>
              )}
              {tab.orderItems.length > 0 && (
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                  {tab.orderItems.length}
                </span>
              )}
              {tab.gamingSessions.some(s => s.isRunning) && (
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                  className="ml-1 p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddTab}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title="New customer tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Menu Section */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-foreground mb-1">New Order</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Tab: <strong>{activeTab?.name}</strong></span>
                <input
                  type="tel"
                  placeholder="Customer phone (optional)"
                  value={activeTab?.customerPhone || ''}
                  onChange={(e) => {
                    const phone = e.target.value;
                    updateTab(activeTabId, (tab) => ({ ...tab, customerPhone: phone }));
                  }}
                  className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 w-48"
                />
              </div>
            </div>

            {/* Categories + Games Toggle */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <CategoryTabs
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={(cat) => { setActiveCategory(cat); setShowGamePanel(false); }}
                />
              </div>
              {enabledGames.length > 0 && (
                <button
                  onClick={() => setShowGamePanel(!showGamePanel)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    showGamePanel
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span className="hidden md:inline">Games</span>
                </button>
              )}
            </div>

            {/* Menu Grid or Game Panel */}
            <div className="flex-1 overflow-y-auto pr-2">
              {showGamePanel ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {enabledGames.map(game => (
                    <button
                      key={game.id}
                      onClick={() => handleStartGame(game)}
                      className="pos-button animate-fade-in"
                    >
                      <Gamepad2 className="w-6 h-6 text-primary" />
                      <span className="text-lg font-semibold text-foreground text-center leading-tight">
                        {game.name}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ₹{game.pricePerHour}/hr
                      </span>
                      <span className="text-xs text-muted-foreground">
                        GST {game.taxPercent}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <MenuGrid items={filteredItems} onItemClick={handleAddItem} />
              )}
            </div>
          </div>

          {/* Order Panel */}
          <div className="w-[400px] border-l border-border bg-card p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Current Order
              </h2>
              {(orderItems.length > 0 || gamingSessions.length > 0) && (
                <button
                  onClick={handleClearOrder}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Clear order"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Order Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleOrderTypeChange('dine-in')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  orderType === 'dine-in'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                🍽️ Dine-in
              </button>
              <button
                onClick={() => handleOrderTypeChange('takeaway')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  orderType === 'takeaway'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                📦 Takeaway
              </button>
            </div>

            {/* Order Items + Gaming Sessions */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {orderItems.length === 0 && gamingSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <span className="text-4xl mb-2">🛒</span>
                  <p className="text-center">No items yet</p>
                  <p className="text-sm text-center">Tap menu items to add</p>
                </div>
              ) : (
                <>
                  {/* Food items */}
                  {orderItems.map(item => (
                    <div key={item.menuItem.id} className="order-item animate-fade-in">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">{item.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.menuItem.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary text-sm min-w-[50px] text-right">
                          ₹{item.menuItem.price * item.quantity}
                        </span>
                        <div className="flex items-center gap-0.5 bg-background rounded-lg p-0.5">
                          <button onClick={() => handleQuantityChange(item.menuItem.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-sm">−</button>
                          <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.menuItem.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-sm">+</button>
                        </div>
                        <button onClick={() => handleRemoveItem(item.menuItem.id)} className="w-7 h-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Gaming sessions */}
                  {gamingSessions.map(session => {
                    const { totalCharge } = calculateGamingCharge(session);
                    return (
                      <div key={session.id} className="order-item animate-fade-in border-l-4 border-l-primary">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm flex items-center gap-1">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            {session.gameItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session)}
                            {session.isRunning && <span className="text-success animate-pulse">● LIVE</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary text-sm min-w-[50px] text-right">
                            ₹{totalCharge.toFixed(0)}
                          </span>
                          {session.isRunning ? (
                            <button
                              onClick={() => handleStopGame(session.id)}
                              className="w-7 h-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md"
                              title="Stop timer"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRemoveSession(session.id)}
                              className="w-7 h-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              {subtotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Food Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              )}
              {gamingTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Gaming Charges</span>
                  <span>₹{gamingTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span>
                <span>₹{(taxAmount + gamingTax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => setPaymentModalOpen(true)}
              disabled={orderItems.length === 0 && gamingSessions.length === 0}
              className="mt-3 pos-button-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-6 h-6" />
              Checkout — ₹{total.toFixed(2)}
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSettlingTableBill(false);
        }}
        total={settlingTableBill && viewingTableBill 
          ? viewingTableBill.orders.reduce((sum, o) => sum + o.total, 0)
          : total
        }
        onConfirm={settlingTableBill ? handleTableBillPayment : handlePayment}
      />

      <BillPreview
        order={currentOrder}
        open={billPreviewOpen}
        onClose={() => setBillPreviewOpen(false)}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
      />

      <TableBillModal
        tableBill={viewingTableBill}
        open={tableBillModalOpen}
        onClose={() => {
          setTableBillModalOpen(false);
          forceUpdate({});
        }}
        onSettleBill={handleSettleTableBill}
        onPrint={handleTableBillPrint}
        onDownloadPDF={handleTableBillPDF}
      />
    </div>
  );
};

export default Index;

  // If you have a POS store, extract values from it here.
  // Example:
  // const { orders, activeOrderId, setActiveOrderId } = usePOSStore();

  // If you already have this line, add the following code immediately after it:
  // useEffect(() => {
  //   if (!activeOrderId && orders.length > 0) {
  //     const runningOrder = orders.find(o => !o.isCompleted);
  //     if (runningOrder) {
  //       setActiveOrderId(runningOrder.id);
  //     }
  //   }
  // }, [orders, activeOrderId, setActiveOrderId]);