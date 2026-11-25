'use client';
/**
 * /admin/recover — Super Admin credential recovery UI (Phase 4).
 *
 * Public page (NOT behind the admin session gate — the admin can't log in).
 * Restricted server-side: the email MUST equal SUPERADMIN_BOOTSTRAP_EMAIL + a
 * single-use OTP must verify before the password is reset. See
 * src/lib/auth/recovery.ts + /api/admin/recover/route.ts.
 *
 * Flow: enter the configured Super Admin email → request a verification code →
 * enter the code + a new password → submit. On success, the password is reset,
 * all prior sessions are revoked (tokenVersion bump), + MFA is forced
 * re-enrollment — the admin logs in with the new password, then completes TOTP
 * enrollment at /admin/mfa-enroll before reaching the portal.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Loader2, KeyRound, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Step = 'request' | 'complete' | 'done';

export default function RecoverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp', email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.available) {
        toast({ title: 'Could not send code', description: data?.message ?? 'Check the email + try again.', variant: 'destructive' });
        return;
      }
      setOtpRequestId(data.otpRequestId);
      setMaskedEmail(data.maskedEmail ?? '');
      setStep('complete');
      toast({ title: 'Code sent', description: data.message ?? 'A verification code was sent to the configured Super Admin email.' });
    } catch {
      toast({ title: 'Network error', description: 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Min 8 characters, with a letter + a number.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'complete', email, otpRequestId, code, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Recovery failed', description: data?.error ?? data?.message ?? 'Try again.', variant: 'destructive' });
        return;
      }
      setStep('done');
      toast({ title: 'Password reset', description: 'You can now log in with the new password.' });
    } catch {
      toast({ title: 'Network error', description: 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/admin/login" className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </Link>
        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#37DCF2]">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle className="text-xl">Super Admin Recovery</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Reset the Super Admin password for the configured account. Restricted to the server-side bootstrap email + a single-use verification code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'request' && (
              <form onSubmit={requestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Super Admin email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@prabhat.online" required className="bg-zinc-950 border-zinc-800" />
                  <p className="text-xs text-zinc-500">Must match the configured SUPERADMIN_BOOTSTRAP_EMAIL.</p>
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : <><MailCheck className="w-4 h-4 mr-2" /> Send verification code</>}
                </Button>
              </form>
            )}

            {step === 'complete' && (
              <form onSubmit={submitReset} className="space-y-4">
                <div className="rounded-md bg-zinc-950/60 border border-zinc-800 p-3 text-sm text-zinc-300">
                  Code sent to <strong>{maskedEmail || email}</strong>. Enter the code + a new password.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-zinc-300">Verification code</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" required className="bg-zinc-950 border-zinc-800 tracking-widest" inputMode="numeric" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-zinc-300">New password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="bg-zinc-950 border-zinc-800" placeholder="Min 8 chars, letter + number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-zinc-300">Confirm new password</Label>
                  <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="bg-zinc-950 border-zinc-800" />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting…</> : <><KeyRound className="w-4 h-4 mr-2" /> Reset password</>}
                </Button>
                <p className="text-xs text-zinc-500">All prior sessions are revoked + MFA must be re-enrolled after login.</p>
              </form>
            )}

            {step === 'done' && (
              <div className="space-y-4 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto text-emerald-400" />
                <p className="text-zinc-200">Password reset successfully.</p>
                <p className="text-sm text-zinc-400">Log in with the new password, then complete TOTP MFA enrollment to reach the admin portal.</p>
                <Button onClick={() => router.push('/admin/login')} className="w-full">Go to login</Button>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-zinc-600 mt-6">
          Recovery is restricted to the configured Super Admin email. Unauthorized attempts are rate-limited + logged.
        </p>
      </div>
    </div>
  );
}
