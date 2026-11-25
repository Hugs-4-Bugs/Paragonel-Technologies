"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Loader2, ShieldCheck, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

/**
 * Admin login — two-step (Part B/D): password (step 1) → SMTP OTP (step 2).
 * Password alone never grants access. After step 2 the qf_admin_token cookie is
 * set and the user is redirected to /admin.
 */
export default function AdminLoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step1Token, setStep1Token] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState<string | undefined>();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Login failed', description: data.message ?? 'Invalid credentials.', variant: 'destructive' });
        return;
      }
      setStep1Token(data.step1Token);
      setMfaRequired(!!data.mfaRequired);
      setOtpRequestId(data.otpRequestId || '');
      setDeliveryNote(data.emailDeliveryNote);
      setStep(2);
      toast({ title: 'Password accepted', description: data.mfaRequired ? 'Enter the code from your authenticator app.' : 'Enter the code sent to your email.' });
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step1Token, otpRequestId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Verification failed', description: data.message ?? 'Invalid code.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Logged in', description: 'Welcome to the admin portal.' });
      router.push('/admin');
      router.refresh();
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step1Token }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpRequestId(data.otpRequestId);
        setDeliveryNote(data.emailDeliveryNote);
        toast({ title: 'Code resent', description: 'A new code has been sent.' });
      } else {
        toast({ title: 'Resend failed', description: data.message ?? 'Try again later.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {step === 1 ? <Lock className="h-6 w-6 text-primary" /> : <ShieldCheck className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className="text-2xl font-bold">{step === 1 ? 'Admin Portal' : 'Enter verification code'}</CardTitle>
            <CardDescription>
              {step === 1
                ? 'Secure two-step login for Paragonel administrators.'
                : mfaRequired
                  ? `Enter the 6-digit code from your authenticator app (or a backup code).`
                  : `A one-time code was sent to ${email}. Password accepted — enter the code to finish.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={submitStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : 'Continue'}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="000000" maxLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : 'Log in'}
                </Button>
                <div className="flex justify-between text-sm">
                  {!mfaRequired && <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={resendCode} disabled={loading}>Resend code</button>}
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => { setStep(1); setCode(''); }}>Back</button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {deliveryNote && (
          <Alert className="bg-amber-50/70 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">{deliveryNote}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300 font-bold">Authorized access only</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
            Two-step login: password + email OTP. No public registration.{' '}
            <Link href="/admin/bootstrap" className="underline font-semibold">First-time Super Admin setup</Link>.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
