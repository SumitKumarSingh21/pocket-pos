import { useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useExpenses, useBills, useSettings } from '@/hooks/useDatabase';
import { generatePLReport, downloadPDF } from '@/lib/pdfGenerator';

const categories = ['Rent', 'Salary', 'Utilities', 'Purchase', 'Transport', 'Marketing', 'Other'];

export default function FinancePage() {
  const { expenses, addExpense } = useExpenses();
  const { bills } = useBills();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ category: 'Other', description: '', amount: '', paymentMethod: 'cash' as const });

  const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalSales - totalExpenses;

  const handleSave = async () => {
    if (!form.amount) { toast({ title: 'Amount required', variant: 'destructive' }); return; }
    await addExpense({ ...form, amount: parseFloat(form.amount), date: Date.now() });
    toast({ title: 'Expense added!' });
    setShowDialog(false);
    setForm({ category: 'Other', description: '', amount: '', paymentMethod: 'cash' });
  };

  const exportPL = async () => {
    if (!settings) return;
    const blob = generatePLReport({ period: 'All Time', totalSales, totalPurchases: 0, totalExpenses, grossProfit: profit, netProfit: profit, gstCollected: bills.reduce((s,b) => s + b.taxAmount, 0), gstPaid: 0 }, settings);
    downloadPDF(blob, 'PL-Report.pdf');
    toast({ title: 'P&L Report downloaded!' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Finance</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={exportPL}><Download className="h-4 w-4" /></Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <Input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                <Button className="w-full" onClick={handleSave}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="h-5 w-5 mx-auto text-accent" /><p className="text-lg font-bold">₹{totalSales.toLocaleString()}</p><p className="text-xs text-muted-foreground">Sales</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingDown className="h-5 w-5 mx-auto text-destructive" /><p className="text-lg font-bold">₹{totalExpenses.toLocaleString()}</p><p className="text-xs text-muted-foreground">Expenses</p></CardContent></Card>
        <Card className={profit >= 0 ? 'border-accent/50' : 'border-destructive/50'}><CardContent className="pt-4 text-center"><Wallet className={`h-5 w-5 mx-auto ${profit >= 0 ? 'text-accent' : 'text-destructive'}`} /><p className={`text-lg font-bold ${profit >= 0 ? 'text-accent' : 'text-destructive'}`}>₹{profit.toLocaleString()}</p><p className="text-xs text-muted-foreground">Profit</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader><CardContent className="space-y-2">{expenses.slice(0,5).map(e => <div key={e.id} className="flex justify-between text-sm"><span>{e.category}: {e.description}</span><span className="font-medium">₹{e.amount}</span></div>)}{expenses.length === 0 && <p className="text-muted-foreground text-center py-4">No expenses recorded</p>}</CardContent></Card>
    </div>
  );
}
