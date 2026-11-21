'use client';

/**
 * /admin/testimonials — list + manage testimonials (Prompt 05K §11.1).
 * Client component; the admin layout handles auth redirect. Fetches
 * GET /api/admin/testimonials (all statuses) + supports quick status change
 * (PATCH), edit link, + delete (DELETE with confirm).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, MessageSquareQuote } from 'lucide-react';

interface T {
  id: string;
  companyName: string;
  status: string;
  originalQuote?: string;
  approvedQuote?: string;
  permissionDisplayFeedback?: boolean;
  permissionDisplayName?: boolean;
  permissionDisplayLogo?: boolean;
  displayOrder?: number;
}

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-zinc-400 text-white',
  pending: 'bg-amber-500 text-white',
  published: 'bg-emerald-500 text-white',
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<T[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/testimonials');
      const data = await res.json();
      setItems(data.testimonials ?? []);
    } catch {
      setItems([]);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this testimonial permanently?')) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: 'Deleted' });
      setItems((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } else {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: `Status → ${status}` });
      void load();
    } else {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const quotePreview = (t: T) =>
    (t.approvedQuote?.trim() || t.originalQuote?.trim() || '').slice(0, 80);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareQuote className="h-6 w-6 text-primary" /> Testimonials
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Founder-confirmed client feedback. Drafts are never shown publicly. Publish only real,
            approved client feedback — never invent a quote.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/testimonials/new"><Plus className="h-4 w-4 mr-2" /> New testimonial</Link>
        </Button>
      </div>

      {items === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          No testimonials yet. Click <span className="font-semibold">New testimonial</span> to create a draft for a confirmed client.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-semibold">Company</th>
                <th className="text-left p-3 font-semibold hidden sm:table-cell">Feedback</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Perms</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground align-top">{t.companyName}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell align-top max-w-xs">
                    {quotePreview(t) ? <span>{quotePreview(t)}…</span> : <span className="italic">No feedback yet (draft)</span>}
                  </td>
                  <td className="p-3 align-top">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[t.status] ?? 'bg-zinc-400 text-white'}`}>{t.status}</span>
                  </td>
                  <td className="p-3 hidden md:table-cell align-top text-xs text-muted-foreground">
                    F:{t.permissionDisplayFeedback ? '✓' : '—'} N:{t.permissionDisplayName ? '✓' : '—'} L:{t.permissionDisplayLogo ? '✓' : '—'}
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <select
                        className="text-xs rounded-md border border-border bg-background px-2 py-1"
                        value={t.status}
                        onChange={(e) => void setStatus(t.id, e.target.value)}
                        aria-label={`Status for ${t.companyName}`}
                      >
                        <option value="draft">draft</option>
                        <option value="pending">pending</option>
                        <option value="published">published</option>
                      </select>
                      <Button asChild size="icon" variant="ghost"><Link href={`/admin/testimonials/${t.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
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
