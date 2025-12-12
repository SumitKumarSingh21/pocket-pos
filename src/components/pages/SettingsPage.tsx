import { useState } from 'react';
import { Save, Download, Upload, RefreshCw, Store, FileText, MessageSquare, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useDatabase';
import { createBackup, restoreBackup } from '@/lib/db';
import { syncPending } from '@/lib/integration_stubs';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleBackup = async () => {
    const data = await createBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `revonn-backup-${Date.now()}.json`; a.click();
    toast({ title: 'Backup downloaded!' });
  };

  const handleRestore = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        await restoreBackup(JSON.parse(text));
        toast({ title: 'Backup restored!' });
        window.location.reload();
      }
    };
    input.click();
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncPending();
    toast({ title: result.message });
    setSyncing(false);
  };

  if (!settings) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" />Shop Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><label className="text-sm">Shop Name</label><Input value={settings.shopName} onChange={e => updateSettings({ shopName: e.target.value })} /></div>
          <div><label className="text-sm">GSTIN</label><Input value={settings.gstin || ''} onChange={e => updateSettings({ gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" /></div>
          <div><label className="text-sm">Address</label><Input value={settings.address || ''} onChange={e => updateSettings({ address: e.target.value })} /></div>
          <div><label className="text-sm">Phone</label><Input value={settings.phone || ''} onChange={e => updateSettings({ phone: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Invoice</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><label className="text-sm">Invoice Prefix</label><Input value={settings.invoicePrefix} onChange={e => updateSettings({ invoicePrefix: e.target.value })} /></div>
          <div className="flex items-center justify-between"><span className="text-sm">Auto WhatsApp on Save</span><Switch checked={settings.autoWhatsApp} onCheckedChange={v => updateSettings({ autoWhatsApp: v })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" />AI Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between"><span className="text-sm">Use Mock AI (Offline)</span><Switch checked={settings.useMockAI} onCheckedChange={v => updateSettings({ useMockAI: v })} /></div>
          <p className="text-xs text-muted-foreground mt-1">Real AI requires API key setup</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Data Management</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleBackup}><Download className="h-4 w-4 mr-2" />Export Backup</Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleRestore}><Upload className="h-4 w-4 mr-2" />Restore Backup</Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleSync} disabled={syncing}><RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />Simulate Sync</Button>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">Revonn v1.0 • All data stored locally</p>
    </div>
  );
}
