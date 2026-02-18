import { Order } from '@/types/pos';
import { X, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getAdminSettings, calculateGamingCharge } from '@/lib/store';

interface BillPreviewProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
}

export const BillPreview = ({ order, open, onClose, onPrint, onDownloadPDF }: BillPreviewProps) => {
  if (!order) return null;

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

  const gamingSessions = order.gamingSessions || [];
  const hasGaming = gamingSessions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <div className="bg-card">
          {/* Receipt Content - 80mm thermal format */}
          <div id="bill-content" className="p-4 font-mono text-xs bg-white text-black" style={{ maxWidth: '80mm' }}>
            <div className="text-center mb-3">
              <h1 className="text-lg font-bold">{settings.cafeName}</h1>
              {settings.address && <p className="text-[10px] text-gray-600">{settings.address}</p>}
              {settings.phone && <p className="text-[10px] text-gray-600">Ph: {settings.phone}</p>}
              {settings.gstNumber && <p className="text-[10px] text-gray-600">GSTIN: {settings.gstNumber}</p>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="flex justify-between text-[10px] mb-1">
              <span>Order: {order.id}</span>
              <span>{order.orderType.toUpperCase()}</span>
            </div>
            {order.tableNumber && (
              <div className="text-[10px] font-semibold text-center mb-1">
                📍 {order.tableNumber}
              </div>
            )}
            <div className="text-[10px] text-gray-600 mb-2">
              {formatDate(order.createdAt)}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Food Items */}
            {order.items.length > 0 && (
              <table className="w-full text-[10px] mb-2">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-0.5">Item</th>
                    <th className="text-center py-0.5">Qty</th>
                    <th className="text-right py-0.5">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.menuItem.id}>
                      <td className="py-0.5">{item.menuItem.name}</td>
                      <td className="text-center py-0.5">{item.quantity}</td>
                      <td className="text-right py-0.5">₹{(item.menuItem.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Gaming Charges */}
            {hasGaming && (
              <>
                <div className="border-t border-dashed border-gray-400 my-2" />
                <p className="text-[10px] font-bold mb-1">🎮 GAMING CHARGES</p>
                <table className="w-full text-[10px] mb-2">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-0.5">Game</th>
                      <th className="text-center py-0.5">Dur</th>
                      <th className="text-right py-0.5">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gamingSessions.map(session => {
                      const { durationMinutes, totalCharge } = calculateGamingCharge(session);
                      const hrs = Math.floor(durationMinutes / 60);
                      const mins = durationMinutes % 60;
                      return (
                        <tr key={session.id}>
                          <td className="py-0.5">{session.gameItem.name}</td>
                          <td className="text-center py-0.5">{hrs > 0 ? `${hrs}h${mins}m` : `${mins}m`}</td>
                          <td className="text-right py-0.5">₹{totalCharge.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Totals */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {(order.gamingTotal || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Gaming</span>
                  <span>₹{order.gamingTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST</span>
                <span>₹{(order.taxAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST</span>
                <span>₹{(order.taxAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                <span>GRAND TOTAL</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-center text-[10px]">
              <p className="font-semibold">
                Payment: {order.paymentMode?.toUpperCase()} {order.isPaid ? '✓ PAID' : '- UNPAID'}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-center text-[10px] text-gray-600">
              <p>Thank you for visiting!</p>
              <p>Visit again 🎮☕</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 bg-secondary/50 border-t border-border flex gap-2">
            <button
              onClick={onPrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:bg-accent/90 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-card border border-border rounded-xl hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
