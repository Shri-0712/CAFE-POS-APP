import { Link, useLocation } from 'react-router-dom';
import { Coffee, LayoutGrid, BarChart3, Settings } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Coffee, label: 'POS' },
    { path: '/menu', icon: LayoutGrid, label: 'Menu' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-20 lg:w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Coffee className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-lg text-foreground">Sunset Cafe</h1>
            <p className="text-xs text-muted-foreground">Gaming & Cafe POS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 mx-auto lg:mx-0" />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="hidden lg:block text-xs text-muted-foreground text-center">
          <p>Built by Shri Sabarish</p>
        </div>
        <div className="lg:hidden text-xs text-muted-foreground text-center">
          <p>SS</p>
        </div>
      </div>
    </aside>
  );
};
