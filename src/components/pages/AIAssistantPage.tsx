import { useState } from 'react';
import { Bot, Mic, Send, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSettings, useItems, useBills } from '@/hooks/useDatabase';
import { generateMarketingMessage, generateDailyInsight, analyzeFastMovingItems } from '@/lib/mockAI';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export default function AIAssistantPage() {
  const { settings } = useSettings();
  const { items } = useItems();
  const { bills, todaySales } = useBills();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition();

  const handleGenerate = (type: 'marketing' | 'insight' | 'fast') => {
    let response = '';
    if (type === 'marketing') {
      response = generateMarketingMessage({ shopName: settings?.shopName || 'My Shop', discount: 20 });
    } else if (type === 'insight') {
      const insight = generateDailyInsight(todaySales.bills, []);
      response = `📊 Daily Insight:\nSales: ₹${insight.totalSales.toLocaleString()}\nBills: ${insight.billCount}\nTop Item: ${insight.topItem}\n${insight.comparison}`;
    } else {
      const fast = analyzeFastMovingItems(bills, items, 30).slice(0, 5);
      response = `🔥 Fast Moving Items:\n${fast.map((f, i) => `${i + 1}. ${f.name} - ${f.totalSold} sold`).join('\n') || 'Not enough data'}`;
    }
    setMessages(m => [...m, { role: 'ai', text: response }]);
    navigator.clipboard.writeText(response);
    toast({ title: 'Copied to clipboard!' });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { role: 'user', text: input }]);
    const response = generateMarketingMessage({ shopName: settings?.shopName || 'My Shop', occasion: input });
    setMessages(m => [...m, { role: 'ai', text: response }]);
    setInput('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6 text-primary" />AI Assistant</h2>
      
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="flex-col h-auto py-4" onClick={() => handleGenerate('marketing')}>
          <Sparkles className="h-5 w-5 mb-1" /><span className="text-xs">Marketing</span>
        </Button>
        <Button variant="outline" className="flex-col h-auto py-4" onClick={() => handleGenerate('insight')}>
          <MessageSquare className="h-5 w-5 mb-1" /><span className="text-xs">Insights</span>
        </Button>
        <Button variant="outline" className="flex-col h-auto py-4" onClick={() => handleGenerate('fast')}>
          <Bot className="h-5 w-5 mb-1" /><span className="text-xs">Fast Items</span>
        </Button>
      </div>

      <Card className="min-h-[300px]">
        <CardContent className="pt-4 space-y-3">
          {messages.length === 0 && <p className="text-center text-muted-foreground py-8">Ask AI for marketing messages, insights, or predictions</p>}
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
        {isSupported && <Button variant="outline" size="icon" onClick={isListening ? stopListening : startListening}><Mic className={`h-4 w-4 ${isListening ? 'text-destructive' : ''}`} /></Button>}
        <Button onClick={handleSend}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
