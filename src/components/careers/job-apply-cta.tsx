'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Job } from '@/types';
import { Send } from 'lucide-react';

/**
 * Apply CTA for the /careers/[id] detail page (Phase 3).
 *
 * Links to the full-page application experience at /careers/[id]/apply (replaces
 * the cramped ApplyJobModal). The apply page performs the auth check + redirects
 * to /auth/login?redirect=/careers/[id]/apply if no candidate session — preserving
 * the intended job so the candidate returns to THIS application page after auth.
 *
 * A disabled button is NOT the only enforcement — the server (/api/job-applications)
 * requires the session + rejects unauthenticated requests with 401.
 */
export function JobApplyCta({ job }: { job: Job }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      size="lg"
      className="rounded-full px-8"
      onClick={() => router.push(`/careers/${job.id}/apply`)}
    >
      <Send className="h-4 w-4 mr-2" />
      Apply for this role
    </Button>
  );
}
