'use client';
/**
 * /auth/signup — multi-step email-first registration (Prompt 05Q §2, §11).
 *
 * Step 1: name + email + CAPTCHA + Terms/Privacy acknowledgement → /api/auth/register/init
 * Step 2: OTP verification → /api/auth/otp/verify (+ resend → /api/auth/otp/request)
 * Step 3: password + confirm → /api/auth/register/complete
 * Step 4: success → redirect to /candidate/profile
 *
 * The password fields are NOT visible before successful OTP verification (Step 2).
 * Progress is shown so the candidate understands which stage they are in.
 * Preserves a ?redirect= target (for the apply flow) through to the final redirect.
 */
import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaptchaWidget } from '@/components/auth/captcha-widget';
import { safeRedirect } from '@/lib/safe-redirect';
import { useAuth } from '@/contexts/auth-context';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const STEPS = ['Details', 'Verify email', 'Set password', 'Done'] as const;

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'), '/candidate/profile');
  const { refresh } = useAuth();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  // Step 1 state.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [ack, setAck] = useState(false);

  // Step 2 state.
  const [otpRequestId, setOtpRequestId] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  // Step 3 state.
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);

  const submitDetails = useCallback(async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/register/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, captchaToken, consentAcknowledged: ack }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error ||'Could not start registration.'); return; }
      setOtpRequestId(data.otpRequestId);
      setNote(data.emailDeliveryNote || 'A verification code was sent to your email.');
      setStep(1);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [name, email, captchaToken, ack]);

  const submitOtp = useCallback(async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpRequestId, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error ||'Invalid or expired code.'); return; }
      setVerificationToken(data.verificationToken);
      setStep(2);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [otpRequestId, code]);

  const resendOtp = useCallback(async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error ||'Could not resend.'); return; }
      setOtpRequestId(data.otpRequestId);
      setNote('A new code was sent.');
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }, [email]);

  const submitPassword = useCallback(async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationToken, password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error ||'Could not complete registration.'); return; }
      // Refresh the AuthProvider's server-verified state so the navbar reflects
      // the new session before the redirect (the complete route issues a user
      // session cookie). Without this the candidate lands on /candidate/profile
      // with a stale logged-out navbar.
      await refresh();
      setStep(3);
      setTimeout(() => router.push(redirect), 1500);
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }, [verificationToken, password, confirm, router, redirect, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your candidate account</CardTitle>
          <CardDescription>Paragonel Careers — secure email-first registration.</CardDescription>
          <div className="flex items-center gap-1.5 mt-3" aria-label="Registration progress">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                <span className={`text-[10px] ${i === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {note && !error && step === 1 && <p className="text-sm text-muted-foreground">{note}</p>}

          {step === 0 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} />
                <p className="text-xs text-muted-foreground">You will receive a verification code at this address.</p>
              </div>
              <CaptchaWidget onVerify={setCaptchaToken} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
                <span>I agree to the <Link href="/terms" className="text-primary underline" target="_blank">Terms</Link> + <Link href="/privacy-policy" className="text-primary underline" target="_blank">Privacy Policy</Link>.</span>
              </label>
              <Button onClick={submitDetails} disabled={busy || !name || !email || !captchaToken || !ack} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send verification code'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account? <Link href="/auth/login" className="text-primary underline">Log in</Link>
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
              <div className="space-y-1.5">
                <Label htmlFor="code">Verification code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="text-center tracking-widest text-lg" maxLength={6} />
              </div>
              <Button onClick={submitOtp} disabled={busy || code.length !== 6} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify code'}
              </Button>
              <Button onClick={resendOtp} disabled={busy} variant="ghost" className="w-full text-sm">
                Resend code
              </Button>
              <Button onClick={() => setStep(0)} variant="link" className="w-full text-xs text-muted-foreground">
                <ArrowLeft className="h-3 w-3 mr-1" /> Back to details
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Email verified. Set a password to complete your account.</p>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <div className="relative">
                  <Input id="pw" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={128} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">8–128 chars, with at least one letter + one number.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={128} />
              </div>
              <Button onClick={submitPassword} disabled={busy || !password || password !== confirm} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-lg font-medium">Account created!</p>
              <p className="text-sm text-muted-foreground">Redirecting to your profile…</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
