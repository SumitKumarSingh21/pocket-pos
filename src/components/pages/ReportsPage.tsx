import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/db';

export default function ReportsPage() {
  const [dailySales, setDailySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [billCount, setBillCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      
      const todayBills = await db.bills.where('createdAt').above(today.getTime()).toArray();
      const monthBills = await db.bills.where('createdAt').above(monthStart.getTime()).toArray();
      
      setDailySales(todayBills.reduce((s,b) => s + b.totalAmount, 0));
      setMonthlySales(monthBills.reduce((s,b) => s + b.totalAmount, 0));
      setBillCount(monthBills.length);
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reports</h2>
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Today</p><p className="text-xl font-bold">₹{dailySales.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">This Month</p><p className="text-xl font-bold">₹{monthlySales.toLocaleString()}</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-4 text-center"><BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">Detailed charts coming soon</p><p className="text-sm">{billCount} bills this month</p></CardContent></Card>
    </div>
  );
}
