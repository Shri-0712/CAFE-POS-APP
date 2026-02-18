import { MenuItem } from '@/types/pos';

interface MenuGridProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export const MenuGrid = ({ items, onItemClick }: MenuGridProps) => {
  const enabledItems = items.filter(item => item.enabled);

  if (enabledItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>No items in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {enabledItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item)}
          className="pos-button animate-fade-in"
        >
          <span className="text-lg font-semibold text-foreground text-center leading-tight">
            {item.name}
          </span>
          <span className="text-xl font-bold text-primary">
            ₹{item.price}
          </span>
          <span className="text-xs text-muted-foreground">
            GST {item.taxPercent}%
          </span>
        </button>
      ))}
    </div>
  );
};
