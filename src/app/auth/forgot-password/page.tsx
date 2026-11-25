"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MailQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      // Uniform message — only proceed if an OTP was actually issued.
      if (res.ok && data.otpRequestId) {
        // Preserve the post-login redirect target through the reset chain so a
        // candidate mid-apply who forgot their password returns to the job.
        const redirect = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
        const verifyUrl =
          `/auth/verify?otpRequestId=${encodeURIComponent(data.otpRequestId)}&purpose=password_reset&email=${encodeURIComponent(email)}` +
          (redirect ? `&redirect=${encodeURIComponent(redirect)}` : '');
        router.push(verifyUrl);
      } else {
        setSubmitted(true);
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MailQuestion className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>If an account exists for that email, a reset code will be sent.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <p className="text-center text-sm text-muted-foreground">If an account exists for that email, a reset code has been sent. <Link href="/auth/login" className="underline">Back to login</Link></p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : 'Send reset code'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
