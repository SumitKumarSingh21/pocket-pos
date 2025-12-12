import { Menu, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface AppHeaderProps {
  shopName: string;
  onMenuClick: () => void;
}

export default function AppHeader({ shopName, onMenuClick }: AppHeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <h1 className="text-lg font-bold tracking-tight">{shopName}</h1>
        
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-primary-foreground/80" />
          ) : (
            <WifiOff className="h-5 w-5 text-warning" />
          )}
        </div>
      </div>
    </header>
  );
}
