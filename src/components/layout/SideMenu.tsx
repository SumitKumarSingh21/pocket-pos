import { 
  BarChart3, FileText, Package, Users, Wallet, 
  UserCog, Bot, Settings, LogOut 
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useDatabase';
import type { ActivePage } from '@/pages/Index';

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  shopName: string;
}

const navItems: { id: ActivePage; label: string; icon: typeof BarChart3 }[] = [
  { id: 'home', label: 'Dashboard', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: FileText },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'staff', label: 'Staff', icon: UserCog },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function SideMenu({ open, onOpenChange, activePage, onNavigate, shopName }: SideMenuProps) {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <div className="bg-primary p-6">
          <h2 className="text-xl font-bold text-primary-foreground">Revonn</h2>
          <p className="text-sm text-primary-foreground/80">{shopName}</p>
          {user && (
            <p className="text-xs text-primary-foreground/60 mt-2">
              {user.name} • {user.role === 'owner' ? 'Owner' : 'Staff'}
            </p>
          )}
        </div>
        
        <nav className="p-3 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activePage === item.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
