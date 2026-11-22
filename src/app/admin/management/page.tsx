"use client";

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ShieldCheck, UserCog, Users, ScrollText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/auth/rbac';

interface AdminRow { email: string; role: string; status: string; emailVerified: boolean; createdAt: unknown; suspendedAt: unknown | null }
interface UserRow { email: string; status: string; emailVerified: boolean; createdAt: unknown; lastLoginAt: unknown | null }
interface EventRow { id: string; type: string; email: string | null; detail: string | null; actor: string | null; timestamp: unknown }

function ts(t: unknown): string {
  if (!t) return '—';
  if (typeof t === 'object' && t && 'seconds' in (t as Record<string, unknown>)) {
    const s = (t as { seconds: number; nanoseconds?: number }).seconds;
    return new Date(s * 1000).toLocaleString();
  }
  return String(t);
}

export default function ManagementPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const { toast } = useToast();

  // create-admin form
  const [nEmail, setNEmail] = useState('');
  const [nRole, setNRole] = useState('editor');
  const [nMode, setNMode] = useState<'direct' | 'invite'>('invite');
  const [nPw, setNPw] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, u, e, m] = await Promise.all([
        fetch('/api/admin/admins').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/security-events').then((r) => r.json()),
        fetch('/api/admin/auth/me').then((r) => (r.ok ? r.json() : null)),
      ]);
      setAdmins(a.admins ?? []);
      setUsers(u.users ?? []);
      setEvents(e.events ?? []);
      setMe(m?.user ?? null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) { toast({ title: 'Action failed', description: data.message ?? data.error ?? 'Error', variant: 'destructive' }); return false; }
    toast({ title: 'Done', description: data.message ?? 'OK' });
    refresh();
    return true;
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call('/api/admin/admins', 'POST', { email: nEmail, role: nRole, mode: nMode, password: nMode === 'direct' ? nPw : undefined });
    if (ok) { setNEmail(''); setNPw(''); }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      suspended: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
      invited: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      pending_verification: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    };
    return <Badge variant="outline" className={map[s] ?? map.pending_verification}>{s}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Super Admin · Management</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{me?.email ?? '—'} · {me?.role ?? '—'}</span>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8">
        <Tabs defaultValue="admins">
          <TabsList>
            <TabsTrigger value="admins"><UserCog className="h-4 w-4 mr-1.5" /> Administrators</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" /> Users</TabsTrigger>
            <TabsTrigger value="audit"><ScrollText className="h-4 w-4 mr-1.5" /> Audit</TabsTrigger>
          </TabsList>

          {/* ADMINS */}
          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Create / invite administrator</CardTitle>
                <CardDescription>Direct create sets a password now; invite emails a verified-email setup link.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createAdmin} className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Email</Label><Input value={nEmail} onChange={(e) => setNEmail(e.target.value)} required type="email" /></div>
                  <div className="space-y-1"><Label>Role</Label>
                    <Select value={nRole} onValueChange={setNRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Mode</Label>
                    <Select value={nMode} onValueChange={(v) => setNMode(v as 'direct' | 'invite')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="invite">Invite by email</SelectItem><SelectItem value="direct">Direct (set password)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {nMode === 'direct' && <div className="space-y-1"><Label>Password</Label><Input type="password" value={nPw} onChange={(e) => setNPw(e.target.value)} required placeholder="min 8 chars" /></div>}
                  <div className="sm:col-span-2"><Button type="submit" disabled={loading}>{nMode === 'invite' ? 'Send invitation' : 'Create admin'}</Button></div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Administrators ({admins.length})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">Email</th><th className="pr-4">Role</th><th className="pr-4">Status</th><th className="pr-4">Created</th><th className="pr-4">Actions</th>
                  </tr></thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.email} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{a.email}</td>
                        <td className="pr-4">
                          <Select defaultValue={a.role} onValueChange={(v) => v !== a.role && call(`/api/admin/admins/${encodeURIComponent(a.email)}`, 'PATCH', { role: v })}>
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="pr-4">{statusBadge(a.status)}</td>
                        <td className="pr-4 text-muted-foreground">{ts(a.createdAt)}</td>
                        <td className="pr-4 space-x-1 whitespace-nowrap">
                          {a.status === 'active' && <Button size="sm" variant="outline" onClick={() => call(`/api/admin/admins/${encodeURIComponent(a.email)}/suspend`, 'POST')}>Suspend</Button>}
                          {a.status === 'suspended' && <Button size="sm" variant="outline" onClick={() => call(`/api/admin/admins/${encodeURIComponent(a.email)}/reactivate`, 'POST')}>Reactivate</Button>}
                          <Button size="sm" variant="outline" onClick={() => call(`/api/admin/admins/${encodeURIComponent(a.email)}/revoke-sessions`, 'POST')}>Revoke sessions</Button>
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No administrators.</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>Registered users ({users.length})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b"><th className="py-2 pr-4">Email</th><th className="pr-4">Status</th><th className="pr-4">Verified</th><th className="pr-4">Created</th><th className="pr-4">Last login</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.email} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{u.email}</td>
                        <td className="pr-4">{statusBadge(u.status)}</td>
                        <td className="pr-4">{u.emailVerified ? '✓' : '—'}</td>
                        <td className="pr-4 text-muted-foreground">{ts(u.createdAt)}</td>
                        <td className="pr-4 text-muted-foreground">{ts(u.lastLoginAt)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No registered users.</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit">
            <Card>
              <CardHeader><CardTitle>Security & admin audit log ({events.length})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b"><th className="py-2 pr-4">Time</th><th className="pr-4">Type</th><th className="pr-4">Email</th><th className="pr-4">Actor</th><th className="pr-4">Detail</th></tr></thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{ts(ev.timestamp)}</td>
                        <td className="pr-4 font-mono text-xs">{ev.type}</td>
                        <td className="pr-4">{ev.email ?? '—'}</td>
                        <td className="pr-4">{ev.actor ?? '—'}</td>
                        <td className="pr-4 text-muted-foreground">{ev.detail ?? ''}</td>
                      </tr>
                    ))}
                    {events.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No events.</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
