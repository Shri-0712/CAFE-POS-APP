import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { getMenuItems, saveMenuItems, getCategories, saveCategories } from '@/lib/store';
import { MenuItem, Category } from '@/types/pos';
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const MenuManagement = () => {
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(getMenuItems());
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Category management state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', icon: '' });

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: categories[0]?.id || 'coffee',
    taxPercent: '5',
  });

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleOpenAdd = () => {
    setFormData({ name: '', price: '', category: categories[0]?.id || 'coffee', taxPercent: '5' });
    setIsAddingNew(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      taxPercent: item.taxPercent.toString(),
    });
    setEditingItem(item);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.price) {
      toast.error('Please fill all fields');
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      taxPercent: parseFloat(formData.taxPercent),
      enabled: editingItem?.enabled ?? true,
    };

    let updatedItems: MenuItem[];
    if (editingItem) {
      updatedItems = menuItems.map(item =>
        item.id === editingItem.id ? newItem : item
      );
      toast.success('Item updated');
    } else {
      updatedItems = [...menuItems, newItem];
      toast.success('Item added');
    }

    setMenuItems(updatedItems);
    saveMenuItems(updatedItems);
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    const updatedItems = menuItems.filter(item => item.id !== id);
    setMenuItems(updatedItems);
    saveMenuItems(updatedItems);
    toast.success('Item deleted');
  };

  const handleToggleEnabled = (id: string) => {
    const updatedItems = menuItems.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setMenuItems(updatedItems);
    saveMenuItems(updatedItems);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  // Category management functions
  const handleOpenCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
  };

  const handleOpenAddCategory = () => {
    setCategoryFormData({ name: '', icon: '📦' });
    setIsAddingCategory(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setCategoryFormData({ name: category.name, icon: category.icon });
    setEditingCategory(category);
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    let updatedCategories: Category[];
    
    if (editingCategory) {
      updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: categoryFormData.name.trim(), icon: categoryFormData.icon || '📦' }
          : cat
      );
      toast.success('Category updated');
    } else {
      const newCategory: Category = {
        id: categoryFormData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: categoryFormData.name.trim(),
        icon: categoryFormData.icon || '📦',
      };
      updatedCategories = [...categories, newCategory];
      toast.success('Category added');
    }

    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const itemsInCategory = menuItems.filter(item => item.category === categoryId);
    if (itemsInCategory.length > 0) {
      toast.error(`Cannot delete: ${itemsInCategory.length} items are in this category`);
      return;
    }

    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    
    if (selectedCategory === categoryId) {
      setSelectedCategory('all');
    }
    
    toast.success('Category deleted');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-20 lg:ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, or remove menu items and categories</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOpenCategoryDialog}
              className="flex items-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Categories
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'category-tab-active' : 'category-tab'}
          >
            All ({menuItems.length})
          </button>
          {categories.map(cat => {
            const count = menuItems.filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id ? 'category-tab-active' : 'category-tab'}
              >
                {cat.icon} {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`glass-panel p-4 transition-all duration-200 ${
                !item.enabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{getCategoryName(item.category)}</p>
                </div>
                <button
                  onClick={() => handleToggleEnabled(item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.enabled
                      ? 'text-success hover:bg-success/10'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  title={item.enabled ? 'Disable item' : 'Enable item'}
                >
                  {item.enabled ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">₹{item.price}</p>
                  <p className="text-xs text-muted-foreground">GST {item.taxPercent}%</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No items found</p>
            <p className="text-sm">Add some items to get started</p>
          </div>
        )}
      </main>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddingNew || !!editingItem} onOpenChange={() => { setIsAddingNew(false); setEditingItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Cappuccino"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., 180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.taxPercent}
                onChange={e => setFormData({ ...formData, taxPercent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., 5, 12, 18 or 0 for exempt"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setIsAddingNew(false); setEditingItem(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Check className="w-5 h-5" />
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={handleOpenAddCategory}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-medium text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({menuItems.filter(i => i.category === cat.id).length} items)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No categories yet. Add one to get started.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isAddingCategory || !!editingCategory} onOpenChange={() => { setIsAddingCategory(false); setEditingCategory(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category Name</label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Breakfast"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Icon (Emoji)</label>
              <input
                type="text"
                value={categoryFormData.icon}
                onChange={e => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl"
                placeholder="🍴"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter an emoji to represent this category</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSaveCategory}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Check className="w-5 h-5" />
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;