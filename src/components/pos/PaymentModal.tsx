import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Banknote, CreditCard, Smartphone, Check } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (paymentMode: 'cash' | 'upi' | 'card', isCompleted: boolean) => void;
}

export const PaymentModal = ({ open, onClose, total, onConfirm }: PaymentModalProps) => {
  const [selectedMode, setSelectedMode] = useState<'cash' | 'upi' | 'card' | null>(null);

  const handleConfirm = () => {
    if (selectedMode) {
      onConfirm(selectedMode, true);
      setSelectedMode(null);
    }
  };

  const paymentModes = [
    { id: 'cash' as const, label: 'Cash', icon: Banknote, color: 'bg-success' },
    { id: 'upi' as const, label: 'UPI', icon: Smartphone, color: 'bg-accent' },
    { id: 'card' as const, label: 'Card', icon: CreditCard, color: 'bg-primary' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Payment</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">Amount to collect</p>
            <p className="text-5xl font-bold text-primary">₹{total.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {paymentModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedMode === mode.id
                    ? `${mode.color} text-white border-transparent shadow-lg`
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <mode.icon className="w-8 h-8 mb-2" />
                <span className="font-semibold">{mode.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            className="w-full pos-button-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-6 h-6" />
            Confirm Payment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
