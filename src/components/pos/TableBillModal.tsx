import { Order } from '@/types/pos';
import { TableBill, getTableTotal, clearTableBill, getAdminSettings } from '@/lib/store';
import { X, Printer, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TableBillModalProps {
  tableBill: TableBill | null;
  open: boolean;
  onClose: () => void;
  onSettleBill: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
}

export const TableBillModal = ({ 
  tableBill, 
  open, 
  onClose, 
  onSettleBill,
  onPrint, 
  onDownloadPDF 
}: TableBillModalProps) => {
  if (!tableBill) return null;

  const totals = getTableTotal(tableBill.tableNumber);
  const settings = getAdminSettings();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearBill = () => {
    clearTableBill(tableBill.tableNumber);
    toast.success(`${tableBill.tableNumber} bill cleared`);
    onClose();
  };

  const aggregatedItems: Record<string, { name: string; quantity: number; price: number; total: number }> = {};
  
  tableBill.orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.menuItem.id;
      if (!aggregatedItems[key]) {
        aggregatedItems[key] = { name: item.menuItem.name, quantity: 0, price: item.menuItem.price, total: 0 };
      }
      aggregatedItems[key].quantity += item.quantity;
      aggregatedItems[key].total += item.menuItem.price * item.quantity;
    });
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            📋 {tableBill.tableNumber} - Running Bill
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-card max-h-[70vh] overflow-y-auto">
          <div id="table-bill-content" className="p-4 font-mono text-xs bg-white text-black" style={{ maxWidth: '80mm' }}>
            <div className="text-center mb-3">
              <h1 className="text-lg font-bold">{settings.cafeName}</h1>
              {settings.address && <p className="text-[10px] text-gray-600">{settings.address}</p>}
              {settings.gstNumber && <p className="text-[10px] text-gray-600">GSTIN: {settings.gstNumber}</p>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-center mb-2">
              <span className="font-bold text-sm">📍 {tableBill.tableNumber}</span>
            </div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>Started: {formatDate(tableBill.createdAt)}</span>
              <span>{tableBill.orders.length} order(s)</span>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <table className="w-full text-[10px] mb-2">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-0.5">Item</th>
                  <th className="text-center py-0.5">Qty</th>
                  <th className="text-right py-0.5">Amt</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(aggregatedItems).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-0.5">{item.name}</td>
                    <td className="text-center py-0.5">{item.quantity}</td>
                    <td className="text-right py-0.5">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST</span>
                <span>₹{(totals.taxAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST</span>
                <span>₹{(totals.taxAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                <span>GRAND TOTAL</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-center text-[10px] text-gray-600">
              <p>Running bill - Not yet settled</p>
            </div>
          </div>

          <div className="p-3 bg-secondary/50 border-t border-border space-y-2">
            <button onClick={onSettleBill} className="w-full pos-button-success text-sm">
              💳 Settle Bill — ₹{totals.total.toFixed(2)}
            </button>
            
            <div className="flex gap-2">
              <button onClick={onPrint} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={onDownloadPDF} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:bg-accent/90 transition-colors text-sm">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={handleClearBill} className="py-2.5 px-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/20 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="py-2.5 px-3 bg-card border border-border rounded-xl hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
