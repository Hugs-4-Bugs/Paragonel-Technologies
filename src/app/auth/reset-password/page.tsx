"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ResetInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const redirect = params.get('redirect') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { toast({ title: 'Passwords differ', variant: 'destructive' }); return; }
    if (newPassword.length < 8) { toast({ title: 'Password too short', description: 'Min 8 chars, letter + number.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationToken: token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password reset', description: 'You can now log in.' });
        router.push('/auth/login' + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''));
      } else {
        toast({ title: 'Reset failed', description: data.message ?? 'Try again.', variant: 'destructive' });
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Your email was verified. Set your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="min 8 chars, letter + number" /></div>
            <div className="space-y-2"><Label htmlFor="cp">Confirm password</Label><Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading || !token}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting…</> : 'Reset password'}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground"><Link href="/auth/login" className="underline">Back to login</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetInner /></Suspense>;
}
