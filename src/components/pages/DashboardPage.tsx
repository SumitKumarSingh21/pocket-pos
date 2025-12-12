import { useEffect, useState } from 'react';
import { Plus, Package, Users, TrendingUp, AlertTriangle, FileText, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBills, useItems, useCustomers, useExpenses } from '@/hooks/useDatabase';
import { db } from '@/lib/db';
import type { ActivePage } from '@/pages/Index';

interface DashboardPageProps {
  onNavigate: (page: ActivePage) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { todaySales, pendingBills } = useBills();
  const { items, lowStockItems } = useItems();
  const { customers } = useCustomers();
  const { expenses } = useExpenses();

  const [yesterdaySales, setYesterdaySales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const yesterdayBills = await db.bills
        .where('createdAt')
        .between(yesterday.getTime(), yesterdayEnd.getTime())
        .toArray();
      setYesterdaySales(yesterdayBills.reduce((sum, b) => sum + b.totalAmount, 0));

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthBills = await db.bills
        .where('createdAt')
        .above(monthStart.getTime())
        .toArray();
      setMonthSales(monthBills.reduce((sum, b) => sum + b.totalAmount, 0));
    };

    loadStats();
  }, [todaySales]);

  const salesChange = yesterdaySales > 0 
    ? ((todaySales.totalSales - yesterdaySales) / yesterdaySales) * 100 
    : 0;

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
      
      {/* Today's Sales - Hero Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">Today's Sales</p>
              <p className="text-4xl font-bold mt-1">
                ₹{todaySales.totalSales.toLocaleString('en-IN')}
              </p>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {todaySales.billCount} bills
              </p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
              salesChange >= 0 
                ? 'bg-green-500/20 text-green-100' 
                : 'bg-red-500/20 text-red-100'
            }`}>
              {salesChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{Math.abs(salesChange).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('reports')}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold">₹{monthSales.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${lowStockItems.length > 0 ? 'border-warning/50 bg-warning/5' : ''}`}
          onClick={() => onNavigate('inventory')}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${lowStockItems.length > 0 ? 'text-warning' : ''}`} />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-xl font-bold ${lowStockItems.length > 0 ? 'text-warning' : ''}`}>
              {lowStockItems.length}
            </p>
            <p className="text-xs text-muted-foreground">items</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('customers')}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-xl font-bold ${totalOutstanding > 0 ? 'text-destructive' : ''}`}>
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('customers')}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold">{customers.length}</p>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              className="flex-col h-auto py-4 px-2"
              onClick={() => onNavigate('billing')}
            >
              <Plus className="h-5 w-5 mb-1 text-primary" />
              <span className="text-xs">New Bill</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-4 px-2"
              onClick={() => onNavigate('inventory')}
            >
              <Package className="h-5 w-5 mb-1 text-primary" />
              <span className="text-xs">Add Item</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-4 px-2"
              onClick={() => onNavigate('customers')}
            >
              <Users className="h-5 w-5 mb-1 text-primary" />
              <span className="text-xs">Customer</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-col h-auto py-4 px-2"
              onClick={() => onNavigate('finance')}
            >
              <Wallet className="h-5 w-5 mb-1 text-primary" />
              <span className="text-xs">Expense</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Sync Alert */}
      {pendingBills.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{pendingBills.length} Pending</p>
                <p className="text-sm text-muted-foreground">Bills waiting to sync</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('settings')}>
              Sync Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* App Status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground">Offline Ready - All data stored locally</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
