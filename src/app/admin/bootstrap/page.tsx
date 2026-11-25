"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * One-time Super Admin bootstrap (Part D). Public until the first Super Admin
 * exists, then disabled server-side. Flow: check availability → request OTP →
 * verify OTP + set password → done.
 */
export default function BootstrapPage() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deliveryNote, setDeliveryNote] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/bootstrap')
      .then((r) => r.json())
      .then((d) => { setAvailable(!!d.available); setReason(typeof d.reason === 'string' ? d.reason : ''); setMaskedEmail(d.maskedEmail ?? ''); })
      .catch(() => setAvailable(false));
  }, []);

  async function requestOtp() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp' }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpRequestId(data.otpRequestId);
        setDeliveryNote(data.emailDeliveryNote);
        toast({ title: 'Code sent', description: data.message });
      } else {
        toast({ title: 'Unavailable', description: data.message ?? 'Bootstrap not available.', variant: 'destructive' });
        if (data.reason === 'already_complete') setAvailable(false);
      }
    } finally { setLoading(false); }
  }

  async function complete() {
    if (newPassword !== confirm) { toast({ title: 'Passwords differ', variant: 'destructive' }); return; }
    if (newPassword.length < 8) { toast({ title: 'Password too short', description: 'Min 8 chars, with a letter and a number.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', otpRequestId, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        toast({ title: 'Super Admin created', description: 'You can now log in.' });
      } else {
        toast({ title: 'Bootstrap failed', description: data.message ?? 'Try again.', variant: 'destructive' });
        if (data.reason === 'already_complete') setAvailable(false);
      }
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
            <CardTitle>Super Admin created</CardTitle>
            <CardDescription>The bootstrap is now disabled. Log in to the admin portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/admin/login')}>Go to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Super Admin bootstrap</CardTitle>
            <CardDescription>
              {available === null ? 'Checking…' : available ? `One-time setup for ${maskedEmail}.` : 'Bootstrap is not available.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {available === false && (
              <Alert><Info className="h-4 w-4" /><AlertDescription>
                {reason === 'not_configured'
                  ? 'Bootstrap is disabled because SUPERADMIN_BOOTSTRAP_EMAIL is not set in the server environment. Set it to the intended Super Admin email (contact@prabhat.online) in Vercel Project Settings → Environment Variables, then redeploy. Bootstrap + recovery are both disabled until this is set.'
                  : reason === 'already_complete'
                    ? 'A Super Admin account already exists, so the one-time bootstrap is disabled. If you have lost the password, use the recovery page (/admin/recover) to reset it securely via email verification.'
                    : reason === 'unavailable'
                      ? 'Bootstrap is temporarily unavailable — the Firebase Admin SDK did not initialize. Check the FIREBASE_ADMIN_* environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) in Vercel, then redeploy.'
                      : 'A Super Admin already exists, or the bootstrap email is not configured. Bootstrap is disabled.'}
              </AlertDescription></Alert>
            )}
            {available && !otpRequestId && (
              <Button className="w-full" onClick={requestOtp} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : 'Send verification code'}
              </Button>
            )}
            {available && otpRequestId && (
              <div className="space-y-4">
                <Alert className="bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">A code was sent to {maskedEmail}. Enter it and set your password.</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="np">New password</Label>
                  <Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min 8 chars, letter + number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cp">Confirm password</Label>
                  <Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                <Button className="w-full" onClick={complete} disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : 'Create Super Admin'}
                </Button>
                <button type="button" className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center" onClick={requestOtp} disabled={loading}>Resend code</button>
              </div>
            )}
            {deliveryNote && (
              <Alert className="bg-amber-50/70 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">{deliveryNote}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">No public registration. Bootstrap runs once, then disables itself.</p>
      </div>
    </div>
  );
}
