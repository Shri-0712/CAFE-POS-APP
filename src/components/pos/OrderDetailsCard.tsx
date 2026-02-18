import { useState } from 'react';
import { Order } from '@/types/pos';
import { ChevronDown, ChevronUp, Clock, MapPin, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface OrderDetailsCardProps {
  order: Order;
}

export const OrderDetailsCard = ({ order }: OrderDetailsCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const getPaymentIcon = () => {
    switch (order.paymentMode) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-secondary/50 overflow-hidden transition-all">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start">
            <p className="font-medium text-foreground font-mono text-sm">{order.id}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="font-semibold text-primary">₹{order.total.toFixed(2)}</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  order.orderType === 'dine-in'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-accent/20 text-accent-foreground'
                }`}
              >
                {order.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}
              </span>
              {order.tableNumber && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {order.tableNumber}
                </span>
              )}
              {order.customerPhone && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                  📱 {order.customerPhone}
                </span>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          {/* Items List */}
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.menuItem.id}-${idx}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.menuItem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.menuItem.price} × {item.quantity} (GST {item.menuItem.taxPercent}%)
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span>
                <span>₹{order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground pt-1">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPaymentIcon()}
              <span className="text-sm text-muted-foreground capitalize">
                {order.paymentMode || 'Not specified'}
              </span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                order.isPaid
                  ? 'bg-success/20 text-success'
                  : 'bg-destructive/20 text-destructive'
              }`}
            >
              {order.isPaid ? 'PAID' : 'UNPAID'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
