import { useState } from 'react';
import { Phone, Lock, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/integration_stubs';
import { useAuth } from '@/hooks/useDatabase';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: 'Invalid phone number', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await auth.sendOtp(phone);
      if (result.success) {
        toast({ title: 'OTP Sent', description: result.message });
        setStep('otp');
      }
    } catch (error) {
      toast({ title: 'Failed to send OTP', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast({ title: 'Enter 6-digit OTP', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await auth.signInWithOtp(phone, otp);
      if (result.success && result.user) {
        await login({
          id: result.user.id,
          phone: result.user.phone,
          name: result.user.name,
          role: result.user.role
        });
        toast({ title: 'Login successful!' });
        window.location.reload();
      } else {
        toast({ title: result.error || 'Invalid OTP', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Login failed', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Revonn</CardTitle>
          <CardDescription>
            Complete retail management for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
              >
                {loading ? 'Sending...' : 'Get OTP'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter OTP</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 text-center text-xl tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Demo OTP: <span className="font-mono font-bold">123456</span>
                </p>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
              >
                {loading ? 'Verifying...' : 'Login'}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => { setStep('phone'); setOtp(''); }}
              >
                Change Phone Number
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground pt-4">
            All data is stored locally on your device. Works offline!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
