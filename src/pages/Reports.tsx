import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { OrderDetailsCard } from '@/components/pos/OrderDetailsCard';
import { getOrders, getAdminSettings, calculateGamingCharge } from '@/lib/store';
import { Order } from '@/types/pos';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Coffee, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Utensils,
  ShoppingCart,
  PieChart,
  Download,
  Gamepad2,
  FileSpreadsheet
} from 'lucide-react';
import { format, subDays, addDays, isToday, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRangeMode, setIsRangeMode] = useState(false);
  const allOrders = getOrders();
  const adminSettings = getAdminSettings();

  // Get orders for selected date range
  const dateOrders = useMemo(() => {
    if (isRangeMode) {
      return allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return isWithinInterval(orderDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return allOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return isSameDay(orderDate, startDate);
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, startDate, endDate, isRangeMode]);

  const analytics = useMemo(() => {
    const paidOrders = dateOrders.filter(o => o.isPaid);
    
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + o.taxAmount, 0);
    const totalSubtotal = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalGaming = paidOrders.reduce((sum, o) => sum + (o.gamingTotal || 0), 0);
    
    const orderCount = paidOrders.length;
    const dineInCount = paidOrders.filter(o => o.orderType === 'dine-in').length;
    const takeawayCount = paidOrders.filter(o => o.orderType === 'takeaway').length;
    
    const itemsSold = paidOrders.reduce((sum, o) => 
      sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
    
    const itemSales: Record<string, { 
      name: string; quantity: number; revenue: number; tax: number; category: string;
    }> = {};
    
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.menuItem.id]) {
          itemSales[item.menuItem.id] = {
            name: item.menuItem.name, quantity: 0, revenue: 0, tax: 0, category: item.menuItem.category,
          };
        }
        const itemTotal = item.menuItem.price * item.quantity;
        const itemTax = itemTotal * (item.menuItem.taxPercent / 100);
        itemSales[item.menuItem.id].quantity += item.quantity;
        itemSales[item.menuItem.id].revenue += itemTotal;
        itemSales[item.menuItem.id].tax += itemTax;
      });
    });
    
    const categorySales: Record<string, { quantity: number; revenue: number }> = {};
    Object.values(itemSales).forEach(item => {
      if (!categorySales[item.category]) {
        categorySales[item.category] = { quantity: 0, revenue: 0 };
      }
      categorySales[item.category].quantity += item.quantity;
      categorySales[item.category].revenue += item.revenue;
    });
    
    const paymentModes = {
      cash: paidOrders.filter(o => o.paymentMode === 'cash').length,
      upi: paidOrders.filter(o => o.paymentMode === 'upi').length,
      card: paidOrders.filter(o => o.paymentMode === 'card').length,
    };

    const paymentRevenue = {
      cash: paidOrders.filter(o => o.paymentMode === 'cash').reduce((s, o) => s + o.total, 0),
      upi: paidOrders.filter(o => o.paymentMode === 'upi').reduce((s, o) => s + o.total, 0),
      card: paidOrders.filter(o => o.paymentMode === 'card').reduce((s, o) => s + o.total, 0),
    };
    
    // Gaming stats
    const gamingOrders = paidOrders.filter(o => (o.gamingSessions || []).length > 0);
    const gamingSessionCount = paidOrders.reduce((sum, o) => sum + (o.gamingSessions || []).length, 0);
    
    let peakHour: number | null = null;
    let maxOrders = 0;
    const hourlyOrders: Record<number, { count: number; revenue: number }> = {};
    paidOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      if (!hourlyOrders[hour]) hourlyOrders[hour] = { count: 0, revenue: 0 };
      hourlyOrders[hour].count++;
      hourlyOrders[hour].revenue += order.total;
    });
    Object.entries(hourlyOrders).forEach(([hour, data]) => {
      if (data.count > maxOrders) { maxOrders = data.count; peakHour = parseInt(hour); }
    });
    
    return {
      totalSales, totalTax, totalSubtotal, totalGaming,
      orderCount, dineInCount, takeawayCount,
      itemsSold, avgOrderValue,
      itemSales: Object.values(itemSales).sort((a, b) => b.revenue - a.revenue),
      categorySales: Object.entries(categorySales).sort((a, b) => b[1].revenue - a[1].revenue),
      paymentModes, paymentRevenue,
      gamingOrders: gamingOrders.length, gamingSessionCount,
      hourlyOrders, peakHour,
    };
  }, [dateOrders]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setStartDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
    if (!isRangeMode) setEndDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const formatPeakHour = (hour: number | null) => {
    if (hour === null) return 'N/A';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:00 ${ampm}`;
  };

  // Export to Excel
  const handleExportExcel = () => {
    const paidOrders = dateOrders.filter(o => o.isPaid);
    const rows = paidOrders.map(o => ({
      'Order ID': o.id,
      'Date': format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm'),
      'Type': o.orderType,
      'Table/Customer': o.tableNumber || '-',
      'Customer Phone': o.customerPhone || '-',
      'Items': o.items.map(i => `${i.menuItem.name} x${i.quantity}`).join(', '),
      'Food Subtotal': o.subtotal.toFixed(2),
      'Gaming Total': (o.gamingTotal || 0).toFixed(2),
      'Tax': o.taxAmount.toFixed(2),
      'Total': o.total.toFixed(2),
      'Payment': o.paymentMode || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    
    // Summary sheet
    const summary = [
      { Metric: 'Cafe Name', Value: adminSettings.cafeName },
      { Metric: 'GST Number', Value: adminSettings.gstNumber },
      { Metric: 'Report Period', Value: isRangeMode ? `${format(startDate, 'dd/MM/yyyy')} to ${format(endDate, 'dd/MM/yyyy')}` : format(startDate, 'dd/MM/yyyy') },
      { Metric: 'Total Orders', Value: analytics.orderCount },
      { Metric: 'Total Revenue', Value: `₹${analytics.totalSales.toFixed(2)}` },
      { Metric: 'Food Sales', Value: `₹${analytics.totalSubtotal.toFixed(2)}` },
      { Metric: 'Gaming Revenue', Value: `₹${analytics.totalGaming.toFixed(2)}` },
      { Metric: 'Total GST', Value: `₹${analytics.totalTax.toFixed(2)}` },
      { Metric: 'Cash Orders', Value: analytics.paymentModes.cash },
      { Metric: 'UPI Orders', Value: analytics.paymentModes.upi },
      { Metric: 'Card Orders', Value: analytics.paymentModes.card },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
    
    XLSX.writeFile(wb, `report-${format(startDate, 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel report downloaded!');
  };

  // Export to PDF
  const handleExportPDF = async () => {
    const reportEl = document.getElementById('report-content');
    if (!reportEl) return;
    
    const canvas = await html2canvas(reportEl, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Header with cafe info
    pdf.setFontSize(16);
    pdf.text(adminSettings.cafeName, 105, 15, { align: 'center' });
    pdf.setFontSize(10);
    if (adminSettings.gstNumber) pdf.text(`GSTIN: ${adminSettings.gstNumber}`, 105, 22, { align: 'center' });
    if (adminSettings.address) pdf.text(adminSettings.address, 105, 28, { align: 'center' });
    
    pdf.setFontSize(12);
    const dateLabel = isRangeMode 
      ? `Report: ${format(startDate, 'dd/MM/yyyy')} to ${format(endDate, 'dd/MM/yyyy')}`
      : `Report: ${format(startDate, 'dd/MM/yyyy')}`;
    pdf.text(dateLabel, 105, 36, { align: 'center' });
    
    // Summary
    pdf.setFontSize(10);
    const y = 45;
    pdf.text(`Total Revenue: ₹${analytics.totalSales.toFixed(2)}`, 20, y);
    pdf.text(`Orders: ${analytics.orderCount}`, 20, y + 6);
    pdf.text(`Food Sales: ₹${analytics.totalSubtotal.toFixed(2)}`, 20, y + 12);
    pdf.text(`Gaming Revenue: ₹${analytics.totalGaming.toFixed(2)}`, 20, y + 18);
    pdf.text(`Total GST: ₹${analytics.totalTax.toFixed(2)}`, 120, y);
    pdf.text(`Cash: ${analytics.paymentModes.cash} · UPI: ${analytics.paymentModes.upi} · Card: ${analytics.paymentModes.card}`, 120, y + 6);
    
    // Add screenshot of charts
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (imgHeight + 70 < 280) {
      pdf.addImage(imgData, 'PNG', 10, 70, imgWidth, imgHeight);
    }
    
    pdf.save(`report-${format(startDate, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF report downloaded!');
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${analytics.totalSales.toFixed(0)}`,
      subValue: `Tax: ₹${analytics.totalTax.toFixed(0)}`,
      icon: DollarSign,
      color: 'bg-success',
    },
    {
      label: 'Orders',
      value: analytics.orderCount.toString(),
      subValue: `${analytics.dineInCount} dine-in · ${analytics.takeawayCount} takeaway`,
      icon: ShoppingBag,
      color: 'bg-primary',
    },
    {
      label: 'Food Sales',
      value: `₹${analytics.totalSubtotal.toFixed(0)}`,
      subValue: `${analytics.itemsSold} items sold`,
      icon: Coffee,
      color: 'bg-accent',
    },
    {
      label: 'Gaming Revenue',
      value: `₹${analytics.totalGaming.toFixed(0)}`,
      subValue: `${analytics.gamingSessionCount} sessions`,
      icon: Gamepad2,
      color: 'bg-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-20 lg:ml-64 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Sales Reports</h1>
            <p className="text-muted-foreground">
              {adminSettings.cafeName} · Detailed analytics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Range Toggle */}
            <button
              onClick={() => setIsRangeMode(!isRangeMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRangeMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {isRangeMode ? 'Range' : 'Single Day'}
            </button>

            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-card rounded-xl p-2 border border-border">
              <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-primary" />
                <input
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={e => setStartDate(new Date(e.target.value))}
                  className="bg-transparent border-none outline-none text-sm font-medium"
                />
                {isRangeMode && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <input
                      type="date"
                      value={format(endDate, 'yyyy-MM-dd')}
                      onChange={e => setEndDate(new Date(e.target.value))}
                      className="bg-transparent border-none outline-none text-sm font-medium"
                    />
                  </>
                )}
              </div>
              <button
                onClick={() => navigateDate('next')}
                disabled={isToday(startDate)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        <div id="report-content">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-panel p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground truncate">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Analytics Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Payment Modes */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Payment Modes
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Cash', count: analytics.paymentModes.cash, revenue: analytics.paymentRevenue.cash, color: 'bg-success' },
                  { label: 'UPI', count: analytics.paymentModes.upi, revenue: analytics.paymentRevenue.upi, color: 'bg-primary' },
                  { label: 'Card', count: analytics.paymentModes.card, revenue: analytics.paymentRevenue.card, color: 'bg-accent' },
                ].map(mode => (
                  <div key={mode.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${mode.color}`} />
                      <span className="text-sm text-foreground">{mode.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">{mode.count}</span>
                      <span className="text-xs text-muted-foreground ml-2">₹{mode.revenue.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Types */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Order Types
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Dine-in</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{analytics.dineInCount}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({analytics.orderCount > 0 ? ((analytics.dineInCount / analytics.orderCount) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground">Takeaway</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{analytics.takeawayCount}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({analytics.orderCount > 0 ? ((analytics.takeawayCount / analytics.orderCount) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Sales */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                Category Sales
              </h3>
              {analytics.categorySales.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data</p>
              ) : (
                <div className="space-y-2">
                  {analytics.categorySales.slice(0, 5).map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-foreground capitalize">{category}</span>
                      <div className="text-right">
                        <span className="font-semibold text-primary">₹{data.revenue.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground ml-1">({data.quantity})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Item-wise Sales */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Item-wise Sales</h2>
            {analytics.itemSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sales for this period</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {analytics.itemSales.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} sold · GST: ₹{item.tax.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-primary">₹{item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Order History</h2>
              <span className="text-sm text-muted-foreground">
                {dateOrders.length} order{dateOrders.length !== 1 ? 's' : ''}
              </span>
            </div>
            {dateOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders for this period</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {dateOrders.map((order) => (
                  <OrderDetailsCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
