'use client';

/** /admin/client-projects — list + manage client projects (Prompt 05L §2). */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, FolderGit2 } from 'lucide-react';

interface P {
  id: string; companyName: string; projectTitle: string; status: string;
  scope?: string; permissionDisplayName?: boolean; permissionDisplayLogo?: boolean;
}

export default function AdminClientProjectsPage() {
  const [items, setItems] = useState<P[] | null>(null);
  const { toast } = useToast();
  useEffect(() => { void load(); }, []);
  const load = async () => {
    try { const r = await fetch('/api/admin/client-projects'); const d = await r.json(); setItems(d.clientProjects ?? []); }
    catch { setItems([]); }
  };
  const del = async (id: string) => {
    if (!confirm('Delete this client project permanently?')) return;
    const r = await fetch(`/api/admin/client-projects/${id}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Deleted' }); setItems((p) => p?.filter((x) => x.id !== id) ?? null); }
    else toast({ title: 'Delete failed', variant: 'destructive' });
  };
  const setStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/admin/client-projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (r.ok) { toast({ title: `Status → ${status}` }); void load(); }
    else toast({ title: 'Update failed', variant: 'destructive' });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderGit2 className="h-6 w-6 text-primary" /> Client Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Founder-confirmed client engagements. Keep scope/services/technologies empty until the founder supplies them — never invent.</p>
        </div>
        <Button asChild><Link href="/admin/client-projects/new"><Plus className="h-4 w-4 mr-2" /> New project</Link></Button>
      </div>
      {items === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">No client projects yet. Click <span className="font-semibold">New project</span> to create one.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground"><tr>
              <th className="text-left p-3 font-semibold">Company</th>
              <th className="text-left p-3 font-semibold hidden sm:table-cell">Title</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold hidden md:table-cell">Scope</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground align-top">{t.companyName}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell align-top">{t.projectTitle}</td>
                  <td className="p-3 align-top">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-zinc-400 text-white'}`}>{t.status}</span>
                  </td>
                  <td className="p-3 hidden md:table-cell align-top text-xs text-muted-foreground">{t.scope ? 'has scope' : 'empty (draft detail)'}</td>
                  <td className="p-3 align-top">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <select className="text-xs rounded-md border border-border bg-background px-2 py-1" value={t.status} onChange={(e) => void setStatus(t.id, e.target.value)} aria-label={`Status for ${t.companyName}`}>
                        <option value="draft">draft</option><option value="published">published</option>
                      </select>
                      <Button asChild size="icon" variant="ghost"><Link href={`/admin/client-projects/${t.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => void del(t.id)} aria-label={`Delete ${t.companyName}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
