'use client';
/**
 * /auth/login — candidate login (Prompt 05Q §5, §11).
 *
 * Email + password + CAPTCHA + required Terms/Privacy acknowledgement only.
 * No name, resume, profile, or job-preference fields (§5).
 *
 * Preserves a ?redirect= target (for the apply flow: /auth/login?redirect=/careers/{id})
 * and returns there after a successful login.
 */
import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaptchaWidget } from '@/components/auth/captcha-widget';
import { safeRedirect } from '@/lib/safe-redirect';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';

export default function UserLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'), '/');
  const { refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [ack, setAck] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken, consentAcknowledged: ack }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh the AuthProvider's server-verified state BEFORE navigating so
        // the navbar + the careers Apply guards see the fresh session
        // immediately. Without this, the AuthProvider keeps its mount-time
        // isAuthenticated:false → the navbar stays logged out (Issue A) and the
        // careers list Apply guard falsely redirects back to login (Issue B).
        await refresh();
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.message || data.error || 'Invalid email or password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [email, password, captchaToken, ack, router, redirect, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Log in to your Paragonel candidate account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <Input id="pw" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <CaptchaWidget onVerify={setCaptchaToken} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" required />
              <span>I acknowledge the <Link href="/terms" className="text-primary underline" target="_blank">Terms</Link> + <Link href="/privacy-policy" className="text-primary underline" target="_blank">Privacy Policy</Link>.</span>
            </label>
            <Button type="submit" className="w-full" disabled={busy || !email || !password || !captchaToken || !ack}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…</> : 'Log in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href={`/auth/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="underline">Create account</Link> · <Link href="/auth/forgot-password" className="underline">Forgot password?</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
