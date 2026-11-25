'use client';
/**
 * /admin/mfa-enroll — TOTP MFA enrollment (Phase 3).
 *
 * Shown to a super_admin whose session has mfaEnrolled !== true (the middleware
 * redirects them here + blocks every other admin page/API until enrolled). The
 * flow:
 *   1. POST /api/admin/auth/mfa/enroll → get secret + QR data URL + otpauth URI.
 *   2. Scan the QR with an authenticator app (Google Authenticator, Authy,
 *      1Password, etc.) OR enter the secret manually.
 *   3. Enter the 6-digit code from the app → POST /api/admin/auth/mfa/verify-enroll.
 *   4. On success: 10 single-use backup codes are shown ONCE — save them.
 *      tokenVersion is bumped → the admin is logged out + must log in again
 *      (now with email + password + the authenticator code).
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, KeyRound, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrollData {
  secret: string;
  otpauthUri: string;
  qrDataUrl: string;
}

export default function MfaEnrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [alreadyEnabled, setAlreadyEnabled] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/mfa/enroll', { method: 'POST' })
      .then(async (r) => {
        if (r.status === 409) { setAlreadyEnabled(true); return null; }
        if (!r.ok) throw new Error('enroll failed');
        return r.json();
      })
      .then((d) => { if (d) setEnrollData(d); })
      .catch(() => toast({ title: 'Error', description: 'Could not start enrollment.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/auth/mfa/verify-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setBackupCodes(data.backupCodes || []);
        toast({ title: 'MFA enabled', description: 'Save your backup codes.' });
      } else {
        toast({ title: 'Verification failed', description: data.error ?? 'Invalid code.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  }

  function copyCodes() {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (alreadyEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>MFA already enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Your account already has TOTP MFA enabled.</p>
            <Button onClick={() => router.push('/admin')} className="w-full">Go to admin portal</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (backupCodes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-center">Save your backup codes</CardTitle>
            <CardDescription className="text-center">Each is single-use. Store them securely — you will need them if you lose your authenticator device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm grid grid-cols-2 gap-1">
              {backupCodes.map((c) => <div key={c}>{c}</div>)}
            </div>
            <Button variant="outline" className="w-full" onClick={copyCodes}>
              {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied' : 'Copy all'}
            </Button>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You will be logged out. Log in again with your email + password + the authenticator code.</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => router.push('/admin/login')}>Log in again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollData) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set up MFA</CardTitle>
          <CardDescription>Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollData.qrDataUrl} alt="MFA QR code" width={200} height={200} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Or enter this secret manually:</Label>
            <div className="rounded-md border bg-muted/30 p-2 font-mono text-xs break-all select-all">{enrollData.secret}</div>
          </div>
          <form onSubmit={verify} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="code">Enter the 6-digit code from your app</Label>
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="000000" required />
            </div>
            <Button type="submit" className="w-full" disabled={verifying || code.length < 6}>
              {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</> : <><KeyRound className="h-4 w-4 mr-2" />Enable MFA</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
