'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TestimonialForm, type TestimonialFormValues } from '@/components/admin/testimonial-form';

export default function NewTestimonialPage() {
  const router = useRouter();

  const onSubmit = async (v: TestimonialFormValues): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    if (res.ok) {
      router.push('/admin/testimonials');
      return { ok: true };
    }
    const data: { error?: string; issues?: string[] } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || data.issues?.join(', ') || 'Create failed' };
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/testimonials" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to testimonials
        </Link>
        <h1 className="text-2xl font-bold">New testimonial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a draft for a founder-confirmed client. Leave the feedback empty until the client supplies
          it — never invent a quote.
        </p>
      </div>
      <TestimonialForm submitLabel="Create testimonial" onSubmit={onSubmit} />
    </div>
  );
}
