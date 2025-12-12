import { useState } from 'react';
import { Plus, UserCheck, UserX, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStaff, useAttendance } from '@/hooks/useDatabase';

export default function StaffPage() {
  const { staff, addStaff } = useStaff();
  const { markAttendance, attendance } = useAttendance();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', salary: '', role: 'staff' as const });

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);

  const handleSave = async () => {
    if (!form.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    await addStaff({ ...form, salary: parseFloat(form.salary) || 0, joiningDate: Date.now(), permissions: [], isActive: true });
    toast({ title: 'Staff added!' });
    setShowDialog(false);
    setForm({ name: '', phone: '', salary: '', role: 'staff' });
  };

  const handleMarkAttendance = async (staffId: string, status: 'present' | 'absent') => {
    await markAttendance(staffId, status);
    toast({ title: `Marked ${status}` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Staff</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <Input type="number" placeholder="Monthly Salary" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Today's Attendance</CardTitle></CardHeader><CardContent className="space-y-2">
        {staff.map(s => {
          const att = todayAttendance.find(a => a.staffId === s.id);
          return (
            <div key={s.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">₹{s.salary}/month</p></div>
              <div className="flex gap-2">
                {att ? <Badge variant={att.status === 'present' ? 'default' : 'destructive'}>{att.status}</Badge> : <>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(s.id, 'present')}><UserCheck className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(s.id, 'absent')}><UserX className="h-4 w-4" /></Button>
                </>}
              </div>
            </div>
          );
        })}
        {staff.length === 0 && <p className="text-center text-muted-foreground py-4">No staff added</p>}
      </CardContent></Card>
    </div>
  );
}
