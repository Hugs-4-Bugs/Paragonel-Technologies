import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPublicJobById } from '@/lib/public-data';
import { ApplyForm } from '@/components/careers/apply-form';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) return { title: 'Apply — Paragonel', robots: { index: false, follow: false } };
  return {
    title: `Apply: ${job.title} — Paragonel`,
    description: `Submit your application for ${job.title} at Paragonel Technologies.`,
    robots: { index: false, follow: true },
  };
}

/**
 * /careers/[id]/apply — full-page application experience (Phase 3).
 *
 * Replaces the cramped ApplyJobModal. The candidate lands on a dedicated,
 * spacious application page with the full job context + a complete application
 * form (all fields, prefill from profile, optional resume upload, explicit
 * consent). Profile completeness is NEVER a prerequisite — the form fields are
 * the source of truth, the profile is only a prefill fallback.
 */
export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link href={`/careers/${job.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to job description
        </Link>
        <ApplyForm job={job} />
      </div>
    </div>
  );
}
