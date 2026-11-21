"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Accept an admin invitation (Part C). The invite token (emailed) authorizes;
 * no session required. The invitee sets their own password here.
 *
 * Wrapped in <Suspense> because useSearchParams() requires a suspense boundary
 * during prerender (Next.js build requirement).
 */
function AcceptInviteInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast({ title: 'Invalid link', description: 'No invitation token.', variant: 'destructive' }); return; }
    if (newPassword !== confirm) { toast({ title: 'Passwords differ', variant: 'destructive' }); return; }
    if (newPassword.length < 8) { toast({ title: 'Password too short', description: 'Min 8 chars, letter + number.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins/accept-invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password set', description: 'You can now log in.' });
        router.push('/admin/login');
      } else {
        toast({ title: 'Setup failed', description: data.message ?? 'Try again.', variant: 'destructive' });
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
          <CardTitle>Accept admin invitation</CardTitle>
          <CardDescription>Set your password to activate your administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min 8 chars, letter + number" required /></div>
            <div className="space-y-2"><Label htmlFor="cp">Confirm password</Label><Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting…</> : 'Set password & activate'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return <Suspense fallback={null}><AcceptInviteInner /></Suspense>;
}
