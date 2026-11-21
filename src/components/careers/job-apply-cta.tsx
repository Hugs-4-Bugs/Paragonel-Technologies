'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApplyJobModal } from '@/components/apply-job-modal';
import type { Job } from '@/types';

/**
 * Apply CTA for the /careers/[id] detail page (Prompt 05J §4). Reuses the
 * existing ApplyJobModal — the same modal /careers uses — so there is ONE
 * authoritative application flow (POST /api/job-applications with resume
 * upload, honeypot, rate-limit, duplicate check). The server-rendered detail
 * page hydrates this small client island only for the modal trigger; no
 * duplicate form logic, no second application endpoint.
 */
export function JobApplyCta({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="lg"
        className="rounded-full px-8"
        onClick={() => setOpen(true)}
      >
        Apply for this role
      </Button>
      <ApplyJobModal isOpen={open} onOpenChange={setOpen} job={job} />
    </>
  );
}
