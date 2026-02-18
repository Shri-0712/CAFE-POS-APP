import { useState } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { getAdminSettings, saveAdminSettings, getGameItems, saveGameItems } from '@/lib/store';
import { AdminSettings, GameItem } from '@/types/pos';
import { Save, Plus, Pencil, Trash2, X, Check, Gamepad2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [gameItems, setGameItems] = useState<GameItem[]>(getGameItems());
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [gameForm, setGameForm] = useState({ name: '', pricePerHour: '', taxPercent: '18' });

  const handleSaveSettings = () => {
    saveAdminSettings(settings);
    toast.success('Settings saved successfully');
  };

  const handleOpenAddGame = () => {
    setGameForm({ name: '', pricePerHour: '', taxPercent: '18' });
    setEditingGame(null);
    setIsGameDialogOpen(true);
  };

  const handleOpenEditGame = (game: GameItem) => {
    setGameForm({ name: game.name, pricePerHour: game.pricePerHour.toString(), taxPercent: game.taxPercent.toString() });
    setEditingGame(game);
    setIsGameDialogOpen(true);
  };

  const handleSaveGame = () => {
    if (!gameForm.name.trim() || !gameForm.pricePerHour) {
      toast.error('Please fill all fields');
      return;
    }

    const newGame: GameItem = {
      id: editingGame?.id || `game-${Date.now()}`,
      name: gameForm.name.trim(),
      pricePerHour: parseFloat(gameForm.pricePerHour),
      taxPercent: parseFloat(gameForm.taxPercent) || 0,
      enabled: editingGame?.enabled ?? true,
    };

    let updated: GameItem[];
    if (editingGame) {
      updated = gameItems.map(g => g.id === editingGame.id ? newGame : g);
      toast.success('Game updated');
    } else {
      updated = [...gameItems, newGame];
      toast.success('Game added');
    }

    setGameItems(updated);
    saveGameItems(updated);
    setIsGameDialogOpen(false);
    setEditingGame(null);
  };

  const handleDeleteGame = (id: string) => {
    const updated = gameItems.filter(g => g.id !== id);
    setGameItems(updated);
    saveGameItems(updated);
    toast.success('Game deleted');
  };

  const handleToggleGame = (id: string) => {
    const updated = gameItems.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g);
    setGameItems(updated);
    saveGameItems(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-20 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Admin Settings</h1>
          <p className="text-muted-foreground">Configure cafe details and game items</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cafe Settings */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">☕ Cafe Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cafe Name</label>
                <input
                  type="text"
                  value={settings.cafeName}
                  onChange={e => setSettings({ ...settings, cafeName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Sunset Cafe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">GST Number</label>
                <input
                  type="text"
                  value={settings.gstNumber}
                  onChange={e => setSettings({ ...settings, gstNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., 27XXXXX1234X1ZX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                <textarea
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                  placeholder="123 Main Street, City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="cafe@example.com"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Settings
              </button>
            </div>
          </div>

          {/* Game Items Management */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Game Items
              </h2>
              <button
                onClick={handleOpenAddGame}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Game
              </button>
            </div>

            {gameItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No games added yet</p>
                <p className="text-sm">Add games to enable time-based billing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gameItems.map(game => (
                  <div
                    key={game.id}
                    className={`flex items-center justify-between p-4 rounded-xl bg-secondary/50 transition-opacity ${!game.enabled ? 'opacity-50' : ''}`}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{game.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ₹{game.pricePerHour}/hr · GST {game.taxPercent}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleGame(game.id)}
                        className={`p-2 rounded-lg transition-colors ${game.enabled ? 'text-success' : 'text-muted-foreground'}`}
                      >
                        {game.enabled ? '✅' : '⬜'}
                      </button>
                      <button
                        onClick={() => handleOpenEditGame(game)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Game Dialog */}
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Game Name</label>
              <input
                type="text"
                value={gameForm.name}
                onChange={e => setGameForm({ ...gameForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., PlayStation 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price Per Hour (₹)</label>
              <input
                type="number"
                value={gameForm.pricePerHour}
                onChange={e => setGameForm({ ...gameForm, pricePerHour: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., 200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={gameForm.taxPercent}
                onChange={e => setGameForm({ ...gameForm, taxPercent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., 18"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsGameDialogOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSaveGame}
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

export default AdminSettingsPage;
