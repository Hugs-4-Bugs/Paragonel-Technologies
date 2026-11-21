'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ClientProjectForm, type ClientProjectFormValues } from '@/components/admin/client-project-form';

export default function NewClientProjectPage() {
  const router = useRouter();
  const onSubmit = async (v: ClientProjectFormValues): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/admin/client-projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
    if (res.ok) { router.push('/admin/client-projects'); return { ok: true }; }
    const data: { error?: string; issues?: string[] } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || data.issues?.join(', ') || 'Create failed' };
  };
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/client-projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to client projects</Link>
        <h1 className="text-2xl font-bold">New client project</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a project for a founder-confirmed client. Leave scope/services/technologies empty until supplied — never invent.</p>
      </div>
      <ClientProjectForm submitLabel="Create project" onSubmit={onSubmit} />
    </div>
  );
}
