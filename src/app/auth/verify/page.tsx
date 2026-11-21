"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function VerifyInner() {
  const params = useSearchParams();
  const otpRequestId = params.get('otpRequestId') ?? '';
  const purpose = (params.get('purpose') ?? 'register') as 'register' | 'password_reset';
  const email = params.get('email') ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpRequestId, code }),
      });
      const data = await res.json();
      if (res.ok) {
        if (purpose === 'register') {
          toast({ title: 'Email verified', description: 'You can now log in.' });
          router.push('/auth/login');
        } else {
          setVerificationToken(data.verificationToken);
          toast({ title: 'Email verified', description: 'Set your new password.' });
          router.push(`/auth/reset-password?token=${encodeURIComponent(data.verificationToken)}`);
        }
      } else {
        toast({ title: 'Verification failed', description: data.message ?? 'Invalid code.', variant: 'destructive' });
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>{email ? `Sent to ${email}.` : 'Check your email.'} Single-use, expires in 10 minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="code">6-digit code</Label><Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required placeholder="000000" /></div>
            <Button type="submit" className="w-full" disabled={loading || !otpRequestId}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : 'Verify'}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground"><Link href={purpose === 'register' ? '/auth/signup' : '/auth/forgot-password'} className="underline">Back</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={null}><VerifyInner /></Suspense>;
}
