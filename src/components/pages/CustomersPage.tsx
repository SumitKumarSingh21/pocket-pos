import { useState } from 'react';
import { Plus, Search, Phone, User, Star, Crown, Tag, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/useDatabase';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', tag: 'new' as const });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: 'Name and phone required', variant: 'destructive' });
      return;
    }
    await addCustomer(formData);
    toast({ title: 'Customer added!' });
    setShowAddDialog(false);
    setFormData({ name: '', phone: '', tag: 'new' });
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hi ${name}! This is a reminder from our store.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              <Select value={formData.tag} onValueChange={(v: any) => setFormData(p => ({ ...p, tag: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>
      <div className="space-y-2">
        {filteredCustomers.map(c => (
          <Card key={c.id}>
            <CardContent className="pt-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant={c.tag === 'vip' ? 'default' : 'secondary'}>{c.tag}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
                <p className="text-xs">Total: ₹{c.totalPurchases.toLocaleString()}</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => sendWhatsApp(c.phone, c.name)}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {filteredCustomers.length === 0 && <p className="text-center text-muted-foreground py-8">No customers found</p>}
      </div>
    </div>
  );
}
