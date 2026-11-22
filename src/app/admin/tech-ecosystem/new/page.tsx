'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TechEcosystemForm, type TechEcosystemFormValues } from '@/components/admin/tech-ecosystem-form';

export default function NewTechEcosystemPage() {
  const router = useRouter();
  const onSubmit = async (v: TechEcosystemFormValues): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/admin/tech-ecosystem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
    if (res.ok) { router.push('/admin/tech-ecosystem'); return { ok: true }; }
    const data: { error?: string; issues?: string[] } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || data.issues?.join(', ') || 'Create failed' };
  };
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/tech-ecosystem" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to tech ecosystem</Link>
        <h1 className="text-2xl font-bold">New ecosystem entry</h1>
        <p className="text-sm text-muted-foreground mt-1">Add an integration with its real status. Exploratory vendor discussions are NOT confirmed partners.</p>
      </div>
      <TechEcosystemForm submitLabel="Create entry" onSubmit={onSubmit} />
    </div>
  );
}
