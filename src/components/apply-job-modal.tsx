'use client';
/**
 * ApplyJobModal — authenticated job application form (Prompt 05Q §9).
 *
 * The candidate must be authenticated (JobApplyCta checks /api/auth/me +
 * redirects to /auth/login?redirect=/careers/{id} if not, preserving the job).
 *
 * The modal:
 *   - Prefills identity (name, phone, preferred location) from
 *     /api/candidate/profile when it exists — every prefilled field is EDITABLE.
 *   - Accepts application-specific fields (cover letter, expected salary,
 *     notice period, preferred location).
 *   - Optional resume upload inline (POST /api/candidate/resume → stores under
 *     candidates/{email}/resumes/ → returns the path). If the job has
 *     resumeRequired:true, the resume is required + clearly communicated.
 *   - Requires explicit confirmation, then POSTs the full form to
 *     /api/job-applications. The server validates resume OWNERSHIP (the path
 *     MUST be under the authenticated candidate's prefix) + uses the verified
 *     session email — never trusts client-supplied identity.
 *
 * Profile completeness is NEVER required to apply. A candidate with an
 * incomplete (or non-existent) profile can submit a valid application; the
 * form fields are the source of truth, the profile is only a prefill fallback.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, FileText, AlertCircle, CheckCircle2, Upload, Trash2 } from 'lucide-react';
import type { Job } from '@/types';

interface ApplyJobModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

interface CandidateSummary {
  fullName: string;
  email: string;
  phone?: string;
  preferredJobLocation?: string;
  hasResume: boolean;
  resumeStoragePath?: string;
}

export function ApplyJobModal({ isOpen, onOpenChange, job }: ApplyJobModalProps) {
  const [profile, setProfile] = useState<CandidateSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  // Form fields (prefilled from profile, editable).
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [preferredJobLocation, setPreferredJobLocation] = useState('');
  const [resumePath, setResumePath] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resumeRequired = !!((job as { resumeRequired?: boolean })?.resumeRequired);

  // Load profile for prefill on open.
  useEffect(() => {
    if (!isOpen || !job) return;
    setConfirm(false); setError(''); setSuccess(false); setResumeError('');
    setCoverLetter(''); setExpectedSalary(''); setNoticePeriod('');
    setLoadingProfile(true);
    fetch('/api/candidate/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile;
          setProfile({
            fullName: p.fullName || '',
            email: p.email || '',
            phone: p.phone || '',
            preferredJobLocation: p.preferredJobLocation || '',
            hasResume: !!p.resumeStoragePath,
            resumeStoragePath: p.resumeStoragePath || '',
          });
          setFullName(p.fullName || '');
          setPhone(p.phone || '');
          setPreferredJobLocation(p.preferredJobLocation || '');
          setResumePath(p.resumeStoragePath || '');
          setResumeName(p.resumeStoragePath ? (p.resumeStoragePath.split('/').pop() || 'resume') : '');
        }
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoadingProfile(false));
  }, [isOpen, job]);

  const uploadResume = useCallback(async (file: File) => {
    setUploadingResume(true); setResumeError('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch('/api/candidate/resume', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.resumeStoragePath) {
        setResumePath(data.resumeStoragePath);
        setResumeName(file.name);
      } else {
        setResumeError(data.error || 'Could not upload resume.');
      }
    } catch {
      setResumeError('Network error during upload.');
    } finally {
      setUploadingResume(false);
    }
  }, []);

  const removeResume = useCallback(() => {
    setResumePath(''); setResumeName(''); setResumeError('');
  }, []);

  const submit = useCallback(async () => {
    if (!job || !confirm) return;
    if (resumeRequired && !resumePath) {
      setError('A resume is required for this role. Please upload your resume.');
      return;
    }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          fullName,
          phone,
          resumeStoragePath: resumePath,
          coverLetter,
          expectedSalary,
          noticePeriod,
          preferredJobLocation,
          confirmSubmission: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else if (res.status === 422) {
        setError(data.error || 'Your application is missing required information.');
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
  }, [job, confirm, fullName, phone, resumePath, coverLetter, expectedSalary, noticePeriod, preferredJobLocation, resumeRequired]);

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Review and complete your application. Profile completeness is not required — fill in what&rsquo;s relevant.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <p className="font-medium">Application submitted!</p>
            <p className="text-sm text-muted-foreground">We&rsquo;ve sent a confirmation to your email. You can track this application from your profile.</p>
          </div>
        ) : loadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            {error && <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="apply-name">Full name</Label>
              <Input id="apply-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-email">Email</Label>
              <Input id="apply-email" value={profile?.email || ''} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Verified from your account.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-phone">Phone</Label>
              <Input id="apply-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-loc">Preferred location</Label>
              <Input id="apply-loc" value={preferredJobLocation} onChange={(e) => setPreferredJobLocation(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-cover">Cover letter / message</Label>
              <Textarea id="apply-cover" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Optional — why are you a good fit?" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="apply-salary">Expected salary</Label>
                <Input id="apply-salary" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-notice">Notice period</Label>
                <Input id="apply-notice" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} placeholder="Optional" />
              </div>
            </div>

            {/* Resume — optional by default; required only if the job sets resumeRequired. */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apply-resume" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Resume{' '}
                  {resumeRequired ? <span className="text-destructive">*</span> : <span className="text-xs text-muted-foreground">(optional)</span>}
                </Label>
                {resumePath && (
                  <Button type="button" variant="ghost" size="sm" onClick={removeResume} className="h-7 text-xs">
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
              </div>
              {resumePath ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="truncate">{resumeName}</span>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    id="apply-resume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadResume(f); e.target.value = ''; }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingResume}>
                    {uploadingResume ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploadingResume ? 'Uploading…' : 'Upload resume (PDF/DOC/DOCX, ≤5MB)'}
                  </Button>
                </>
              )}
              {resumeError && <p className="text-xs text-destructive">{resumeError}</p>}
              {resumeRequired && !resumePath && <p className="text-xs text-muted-foreground">This role requires a resume.</p>}
            </div>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox id="apply-confirm" checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} className="mt-1" />
              <Label htmlFor="apply-confirm" className="text-sm font-normal leading-snug">
                I confirm the information above is accurate and I consent to Paragonel processing my application.
              </Label>
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !confirm}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Submit application
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
