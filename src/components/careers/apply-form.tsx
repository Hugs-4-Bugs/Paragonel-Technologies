'use client';
/**
 * ApplyForm — full-page job application form (Phase 3).
 *
 * A spacious, accessible full-screen application experience (replaces the cramped
 * ApplyJobModal). Auth-gated: redirects to /auth/login?redirect=/careers/[id]/apply
 * if no candidate session. Prefills identity from /api/candidate/profile (every
 * field editable); profile completeness is NEVER a prerequisite. The submitted
 * values become the application SNAPSHOT (independent of future profile changes).
 *
 * Resume: optional by default; required only if the job sets resumeRequired.
 * Inline upload via /api/candidate/resume (stores under candidates/{email}/resumes/,
 * ownership-validated server-side). On success, redirects to the application
 * detail in My Applications.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, FileText, AlertCircle, CheckCircle2, Upload, Trash2, Briefcase, MapPin } from 'lucide-react';

interface ApplyFormJob {
  id: string;
  title: string;
  company?: string;
  location?: string;
  department?: string;
  employmentType?: string;
  workArrangement?: string;
  resumeRequired?: boolean;
}

export function ApplyForm({ job }: { job: ApplyFormJob }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [preferredJobLocation, setPreferredJobLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [resumePath, setResumePath] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resumeRequired = !!job.resumeRequired;

  useEffect(() => {
    // Auth check + prefill.
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) {
          router.replace(`/auth/login?redirect=/careers/${job.id}/apply`);
          setAuthed(false);
          return null;
        }
        setAuthed(true);
        return r.json();
      })
      .then((me) => {
        if (!me) { setLoadingProfile(false); return; }
        setProfileEmail(me.user?.email || '');
        // Prefill from the profile (best-effort — profile completeness is NOT required).
        return fetch('/api/candidate/profile', { cache: 'no-store' })
          .then((r) => r.json())
          .then((d) => {
            if (d.profile) {
              const p = d.profile;
              setFullName(p.fullName || '');
              setPhone(p.phone || '');
              setCurrentLocation(p.currentLocation || '');
              setPreferredJobLocation(p.preferredJobLocation || p.preferredLocation || '');
              setLinkedin(p.linkedin || '');
              setPortfolio(p.portfolio || p.github || '');
              setCurrentDesignation(p.currentDesignation || p.headline || '');
              setYearsExperience(p.yearsExperience || p.totalExperience || '');
              setSkills(Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''));
              if (p.resumeStoragePath) {
                setResumePath(p.resumeStoragePath);
                setResumeName(p.resumeStoragePath.split('/').pop() || 'resume');
              }
            }
          })
          .catch(() => {});
      })
      .catch(() => { setAuthed(false); })
      .finally(() => setLoadingProfile(false));
  }, [job.id, router]);

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

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm) return;
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
          currentLocation,
          preferredJobLocation,
          linkedin,
          portfolio,
          currentDesignation,
          yearsExperience,
          skills,
          coverLetter,
          expectedSalary,
          noticePeriod,
          resumeStoragePath: resumePath,
          confirmSubmission: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reference) {
        router.push(`/candidate/applications/${data.reference}`);
      } else if (res.status === 409) {
        setError('You have already applied for this role.');
      } else if (res.status === 422) {
        setError(data.error || 'Your application is missing required information.');
      } else {
        setError(data.error || 'Could not submit application.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }, [job.id, confirm, fullName, phone, currentLocation, preferredJobLocation, linkedin, portfolio, currentDesignation, yearsExperience, skills, coverLetter, expectedSalary, noticePeriod, resumePath, resumeRequired, router]);

  if (authed === false) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Job context header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{job.company || 'Paragonel Technologies'}</p>
              {(job.location || job.employmentType || job.workArrangement) && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  {job.location && <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{job.location}</span>}
                  {job.employmentType && <span>· {job.employmentType}</span>}
                  {job.workArrangement && <span>· {job.workArrangement}</span>}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
          <CardDescription>Prefilled from your profile where available — edit as needed.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" id="f-name" value={fullName} onChange={setFullName} placeholder="Your name" />
          <Field label="Email" id="f-email" value={profileEmail} disabled placeholder="Verified from your account" />
          <Field label="Phone" id="f-phone" value={phone} onChange={setPhone} placeholder="Optional" />
          <Field label="Current location" id="f-loc" value={currentLocation} onChange={setCurrentLocation} placeholder="City, Country" />
          <Field label="Preferred location" id="f-ploc" value={preferredJobLocation} onChange={setPreferredJobLocation} placeholder="Optional" />
          <Field label="Current designation" id="f-desig" value={currentDesignation} onChange={setCurrentDesignation} placeholder="e.g. Senior Engineer" />
          <Field label="Years of experience" id="f-yoe" value={yearsExperience} onChange={setYearsExperience} placeholder="e.g. 5" />
          <Field label="LinkedIn" id="f-li" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/…" />
          <Field label="Portfolio / GitHub" id="f-port" value={portfolio} onChange={setPortfolio} placeholder="https://…" />
          <Field label="Skills (comma-separated)" id="f-skills" value={skills} onChange={setSkills} placeholder="React, Node.js, …" />
        </CardContent>
      </Card>

      {/* Application-specific */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="f-cover">Cover letter / message</Label>
            <Textarea id="f-cover" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Why are you a good fit for this role?" rows={5} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Expected salary" id="f-sal" value={expectedSalary} onChange={setExpectedSalary} placeholder="e.g. ₹12 LPA" />
            <Field label="Notice period" id="f-not" value={noticePeriod} onChange={setNoticePeriod} placeholder="e.g. 30 days" />
          </div>
        </CardContent>
      </Card>

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" /> Resume{' '}
            {resumeRequired ? <span className="text-destructive text-sm">*</span> : <span className="text-xs text-muted-foreground font-normal">(optional)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resumePath ? (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="truncate">{resumeName}</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={removeResume} className="h-7 text-xs shrink-0">
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                id="f-resume"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadResume(f); e.target.value = ''; }}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingResume}>
                {uploadingResume ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploadingResume ? 'Uploading…' : 'Upload resume (PDF/DOC/DOCX, ≤5MB)'}
              </Button>
              {resumeRequired && <p className="text-xs text-muted-foreground">This role requires a resume.</p>}
            </>
          )}
          {resumeError && <p className="text-xs text-destructive">{resumeError}</p>}
        </CardContent>
      </Card>

      {/* Consent */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Checkbox id="f-consent" checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} className="mt-1" />
            <Label htmlFor="f-consent" className="text-sm font-normal leading-snug cursor-pointer">
              I confirm the information above is accurate and I consent to Paragonel processing my application for this role.
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(`/careers/${job.id}`)}>Cancel</Button>
        <Button type="submit" disabled={busy || !confirm}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Submit application
        </Button>
      </div>
    </form>
  );
}

function Field({
  label, id, value, onChange, placeholder, disabled,
}: {
  label: string; id: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={disabled ? 'bg-muted/50' : ''}
      />
    </div>
  );
}
