'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApplyJobModal } from '@/components/apply-job-modal';
import type { Job } from '@/types';
import { Loader2 } from 'lucide-react';

/**
 * Apply CTA for the /careers/[id] detail page (Prompt 05Q §9).
 *
 * HARD BUSINESS RULE: a visitor MUST have an authenticated candidate account to
 * apply. On click, this checks the real session via /api/auth/me. If not
 * authenticated, it redirects to /auth/login?redirect=/careers/{id} — preserving
 * the intended job reference so the candidate returns to THIS job after auth.
 * If authenticated, it opens the ApplyJobModal (which uses the candidate's
 * profile data + requires explicit confirmation).
 *
 * A disabled button is NOT the only enforcement — the server (/api/job-applications)
 * also requires the session + rejects unauthenticated requests with 401.
 */
export function JobApplyCta({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  const handleClick = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        setOpen(true); // authenticated → open the apply modal
      } else {
        // Unauthenticated → redirect to login, preserving the job path.
        const redirect = `/careers/${job.id}`;
        router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      }
    } catch {
      // Network error — fall back to opening the modal (server will 401 if needed).
      setOpen(true);
    } finally {
      setChecking(false);
    }
  }, [job.id, router]);

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="rounded-full px-8"
        onClick={handleClick}
        disabled={checking}
      >
        {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Apply for this role
      </Button>
      <ApplyJobModal isOpen={open} onOpenChange={setOpen} job={job} />
    </>
  );
}
