'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TestimonialForm, type TestimonialFormValues } from '@/components/admin/testimonial-form';

export default function EditTestimonialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<TestimonialFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/testimonials/${id}`);
        const data = await res.json();
        const t = data.testimonial;
        if (!t) {
          setNotFound(true);
          return;
        }
        setInitial({
          companyName: t.companyName ?? '',
          originalQuote: t.originalQuote ?? '',
          approvedQuote: t.approvedQuote ?? '',
          clientName: t.clientName ?? '',
          designation: t.designation ?? '',
          logoUrl: t.logoUrl ?? '',
          projectRef: t.projectRef ?? '',
          permissionDisplayFeedback: !!t.permissionDisplayFeedback,
          permissionDisplayName: !!t.permissionDisplayName,
          permissionDisplayLogo: !!t.permissionDisplayLogo,
          status: t.status ?? 'draft',
          displayOrder: t.displayOrder ?? 0,
        });
      } catch {
        setNotFound(true);
      }
    })();
  }, [id]);

  const onSubmit = async (v: TestimonialFormValues): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    if (res.ok) {
      router.push('/admin/testimonials');
      return { ok: true };
    }
    const data: { error?: string; issues?: string[] } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || data.issues?.join(', ') || 'Save failed' };
  };

  if (notFound) {
    return (
      <div className="space-y-4">
        <Link href="/admin/testimonials" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to testimonials
        </Link>
        <p className="text-muted-foreground">Testimonial not found.</p>
      </div>
    );
  }

  if (!initial) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/testimonials" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to testimonials
        </Link>
        <h1 className="text-2xl font-bold">Edit testimonial — {initial.companyName}</h1>
      </div>
      <TestimonialForm initial={initial} submitLabel="Save changes" onSubmit={onSubmit} />
    </div>
  );
}
