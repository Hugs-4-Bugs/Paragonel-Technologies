'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ClientProjectForm, type ClientProjectFormValues } from '@/components/admin/client-project-form';

export default function EditClientProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<ClientProjectFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/admin/client-projects/${id}`);
        const d = await r.json();
        const t = d.clientProject;
        if (!t) { setNotFound(true); return; }
        const arr = (a: unknown) => Array.isArray(a) ? a.join(', ') : (typeof a === 'string' ? a : '');
        setInitial({
          companyName: t.companyName ?? '', projectTitle: t.projectTitle ?? '', slug: t.slug ?? '',
          description: t.description ?? '', scope: t.scope ?? '',
          servicesDelivered: arr(t.servicesDelivered), technologies: arr(t.technologies),
          websiteUrl: t.websiteUrl ?? '', mediaUrls: arr(t.mediaUrls), logoUrl: t.logoUrl ?? '',
          iconKey: t.iconKey ?? 'folder', permissionDisplayName: !!t.permissionDisplayName,
          permissionDisplayLogo: !!t.permissionDisplayLogo, status: t.status ?? 'draft',
          displayOrder: t.displayOrder ?? 0,
        });
      } catch { setNotFound(true); }
    })();
  }, [id]);
  const onSubmit = async (v: ClientProjectFormValues): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/admin/client-projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
    if (res.ok) { router.push('/admin/client-projects'); return { ok: true }; }
    const data: { error?: string; issues?: string[] } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || data.issues?.join(', ') || 'Save failed' };
  };
  if (notFound) return <div className="space-y-4"><Link href="/admin/client-projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link><p className="text-muted-foreground">Project not found.</p></div>;
  if (!initial) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/client-projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to client projects</Link>
        <h1 className="text-2xl font-bold">Edit — {initial.companyName}</h1>
      </div>
      <ClientProjectForm initial={initial} submitLabel="Save changes" onSubmit={onSubmit} />
    </div>
  );
}
