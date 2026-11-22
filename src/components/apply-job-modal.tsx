'use client';
/**
 * ApplyJobModal — authenticated job application (Prompt 05Q §9).
 *
 * Replaces the legacy anonymous 30-field modal. The candidate must be
 * authenticated (the JobApplyCta checks /api/auth/me + redirects to login if
 * not, preserving the job ID via ?redirect=/careers/{id}).
 *
 * The modal shows the candidate's profile summary (name, email, completeness,
 * resume status) + the job title, requires explicit confirmation, then POSTs
 * { jobId, confirmSubmission: true } to /api/job-applications. The server uses
 * the authenticated session email + the candidate's profile data (name, phone,
 * resume) — never client-supplied identity.
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Job } from '@/types';

interface ApplyJobModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

interface CandidateSummary {
  fullName: string;
  email: string;
  completeness: number;
  hasResume: boolean;
}

export function ApplyJobModal({ isOpen, onOpenChange, job }: ApplyJobModalProps) {
  const [profile, setProfile] = useState<CandidateSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [incomplete, setIncomplete] = useState(false);

  useEffect(() => {
    if (!isOpen || !job) return;
    setConfirm(false); setError(''); setSuccess(false); setIncomplete(false);
    setLoadingProfile(true);
    fetch('/api/candidate/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({
            fullName: d.profile.fullName || '',
            email: d.profile.email || '',
            completeness: d.completeness ?? 0,
            hasResume: !!d.profile.resumeStoragePath,
          });
        }
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoadingProfile(false));
  }, [isOpen, job]);

  const submit = useCallback(async () => {
    if (!job || !confirm) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, confirmSubmission: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else if (res.status === 422) {
        setIncomplete(true);
        setError(data.error || 'Your profile is incomplete.');
      } else if (res.status === 409) {
        setError(data.error || 'You have already applied for this role.');
      } else {
        setError(data.error || 'Could not submit application.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }, [job, confirm]);

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>Review your application details before submitting.</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <p className="font-medium">Application submitted!</p>
            <p className="text-sm text-muted-foreground">The Paragonel team will review your application. You can track its status from your profile.</p>
          </div>
        ) : incomplete ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
            <Button className="w-full" onClick={() => (window.location.href = '/candidate/profile')}>
              Complete your profile
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingProfile ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{profile?.fullName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate ml-2">{profile?.email || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Profile completeness</span><span>{profile?.completeness ?? 0}%</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Resume</span>
                  {profile?.hasResume ? <span className="flex items-center gap-1 text-green-600"><FileText className="h-3 w-3" /> On file</span> : <span className="text-amber-600">Not uploaded</span>}
                </div>
                {!profile?.hasResume && (
                  <p className="text-xs text-amber-600">Upload a resume from your profile to strengthen your application.</p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <label className="flex items-start gap-2 text-sm pt-2">
                  <Checkbox checked={confirm} onCheckedChange={(v) => setConfirm(v === true)} />
                  <span>I confirm the application details above + want to submit my application for {job.title}.</span>
                </label>
              </div>
            )}
          </div>
        )}

        {!success && !incomplete && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !confirm || loadingProfile}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Submit application
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
