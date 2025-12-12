import { BarChart3, FileText, Package, Users } from 'lucide-react';
import type { ActivePage } from '@/pages/Index';

interface BottomNavProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

const navItems: { id: ActivePage; label: string; icon: typeof BarChart3 }[] = [
  { id: 'home', label: 'Dashboard', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: FileText },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
];

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-bottom">
      <div className="flex justify-around py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
              activePage === item.id 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className={`h-5 w-5 ${activePage === item.id ? 'scale-110' : ''} transition-transform`} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
