import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings, useAuth } from '@/hooks/useDatabase';
import { Toaster } from '@/components/ui/toaster';
import BottomNav from '@/components/layout/BottomNav';
import AppHeader from '@/components/layout/AppHeader';
import SideMenu from '@/components/layout/SideMenu';
import DashboardPage from '@/components/pages/DashboardPage';
import BillingPage from '@/components/pages/BillingPage';
import InventoryPage from '@/components/pages/InventoryPage';
import CustomersPage from '@/components/pages/CustomersPage';
import ReportsPage from '@/components/pages/ReportsPage';
import FinancePage from '@/components/pages/FinancePage';
import StaffPage from '@/components/pages/StaffPage';
import AIAssistantPage from '@/components/pages/AIAssistantPage';
import SettingsPage from '@/components/pages/SettingsPage';
import LoginPage from '@/components/pages/LoginPage';

export type ActivePage = 'home' | 'billing' | 'inventory' | 'customers' | 'reports' | 'finance' | 'staff' | 'ai' | 'settings';

export default function Index() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings, loading: settingsLoading } = useSettings();
  const { user, loading: authLoading } = useAuth();

  // Show login if not authenticated
  if (!authLoading && !user) {
    return <LoginPage />;
  }

  if (settingsLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <DashboardPage onNavigate={handleNavClick} />;
      case 'billing':
        return <BillingPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'customers':
        return <CustomersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'finance':
        return <FinancePage />;
      case 'staff':
        return <StaffPage />;
      case 'ai':
        return <AIAssistantPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        shopName={settings?.shopName || 'Revonn'} 
        onMenuClick={() => setMenuOpen(true)} 
      />
      
      <SideMenu 
        open={menuOpen} 
        onOpenChange={setMenuOpen}
        activePage={activePage}
        onNavigate={handleNavClick}
        shopName={settings?.shopName || 'My Shop'}
      />

      <main className="px-4 pt-4 pb-24">
        {renderPage()}
      </main>

      {/* Floating Action Button for quick billing */}
      {activePage !== 'billing' && (
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl z-40"
          onClick={() => setActivePage('billing')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <BottomNav activePage={activePage} onNavigate={handleNavClick} />
      <Toaster />
    </div>
  );
}
