'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TechEcosystemForm, type TechEcosystemFormValues } from '@/components/admin/tech-ecosystem-form';

export default function EditTechEcosystemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<TechEcosystemFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/admin/tech-ecosystem/${id}`);
        const d = await r.json();
        const t = d.techEcosystem;
        if (!t) { setNotFound(true); return; }
        setInitial({
          organizationName: t.organizationName ?? '', category: t.category ?? 'planned',
          relationshipStatus: t.relationshipStatus ?? '', description: t.description ?? '',
          evidenceReference: t.evidenceReference ?? '', logoUrl: t.logoUrl ?? '', linkUrl: t.linkUrl ?? '',
          publicDisplayPermission: !!t.publicDisplayPermission, logoPermission: !!t.logoPermission,
          displayOrder: t.displayOrder ?? 0, status: t.status ?? 'draft',
        });
      } catch { setNotFound(true); }
    })();
  }, [id]);
  const onSubmit = async (v: TechEcosystemFormValues): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/admin/tech-ecosystem/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
    if (res.ok) { router.push('/admin/tech-ecosystem'); return { ok: true }; }
    const data: { error?: string; issues?: string[] } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || data.issues?.join(', ') || 'Save failed' };
  };
  if (notFound) return <div className="space-y-4"><Link href="/admin/tech-ecosystem" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link><p className="text-muted-foreground">Entry not found.</p></div>;
  if (!initial) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/tech-ecosystem" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to tech ecosystem</Link>
        <h1 className="text-2xl font-bold">Edit — {initial.organizationName}</h1>
      </div>
      <TechEcosystemForm initial={initial} submitLabel="Save changes" onSubmit={onSubmit} />
    </div>
  );
}
