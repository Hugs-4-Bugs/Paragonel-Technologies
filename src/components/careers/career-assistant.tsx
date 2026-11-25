'use client';
/**
 * CareerAssistant — AI career assistant integrated into /careers (Batch 8).
 *
 * Connects the existing deterministic matching engine + resume parser to the
 * real candidate journey through /careers. Reuses ONLY existing secure APIs:
 *   - /api/auth/me                                    (auth check)
 *   - /api/candidate/profile        (GET/PUT)         (profile read/save)
 *   - /api/candidate/resume         (GET/POST)        (resume upload + parse)
 *   - /api/candidate/profile/preferences (GET/PATCH)  (preferences)
 *   - /api/chat/career-assist       (POST)            (deterministic matching)
 *   - /api/job-applications         (POST)            (application submission)
 *
 * No new parser, matcher, preference store, or application endpoint. The match
 * score is ALWAYS computed by the server-side scoreJobCandidate engine via
 * /api/chat/career-assist — never an LLM, never fabricated (Prompt 05Q §8).
 *
 * Email honesty (Prompt 05Q §9): the apply result surfaces the server's honest
 * `notification` status (sent | skipped | failed). "sent" means the SMTP
 * transport accepted the message — NOT that it reached the candidate's inbox.
 * The UI never claims inbox delivery.
 *
 * Extracted-vs-confirmed (Prompt 05Q §8): parsed resume fields are shown with a
 * clear "Extracted" badge + confirmed:false; they become "confirmed" only after
 * the candidate reviews + saves via PUT /api/candidate/profile. Unreviewed AI
 * data is never silently saved as verified.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, FileText, Upload, Sparkles, CheckCircle2, AlertCircle, RefreshCw,
  MailCheck, MailWarning, MailX, Briefcase, MapPin, Award, Target, LogIn,
} from 'lucide-react';

/* ------------------------------- types ----------------------------------- */

interface ParsedResume {
  name?: string; email?: string; phone?: string; location?: string;
  experienceYears?: number; skills?: string[]; techStack?: string[];
  employmentHistory?: { company?: string; designation?: string; startDate?: string; endDate?: string; description?: string }[];
  education?: string; educationEntries?: { qualification?: string; institution?: string; year?: string }[];
  projects?: { name?: string; description?: string; technologies?: string; url?: string }[];
  certifications?: string[]; domain?: string; seniority?: string; summary?: string;
}

interface SavedProfile {
  fullName?: string; phone?: string; currentLocation?: string; preferredJobLocation?: string;
  headline?: string; summary?: string; totalExperienceYears?: number; currentDesignation?: string;
  employmentHistory?: unknown[]; skills?: string[]; techStack?: string[];
  education?: unknown[]; projects?: unknown[]; certifications?: string[];
  preferredRoles?: string[]; preferredEmploymentType?: string; preferredLocations?: string[];
  workModePreference?: string; matchingThreshold?: number; jobAlertPreference?: boolean;
  resumeStoragePath?: string | null;
}

interface Match {
  id: string; jobId?: string; title: string; department?: string;
  location: string; employmentType: string; workArrangement: string;
  score: number; reasons: string[];
}

type ApplyOutcome =
  | { kind: 'success'; notification: 'sent' | 'skipped' | 'failed' }
  | { kind: 'duplicate' }
  | { kind: 'incomplete' }
  | { kind: 'error'; message: string };

/* ------------------------------- helpers --------------------------------- */

/** Map parsed-resume output → the editable review form fields (candidateProfileSchema). */
function parsedToForm(p: ParsedResume) {
  const headline = [p.seniority, p.domain].filter(Boolean).join(' ').trim();
  return {
    fullName: p.name || '',
    phone: p.phone || '',
    currentLocation: p.location || '',
    totalExperienceYears: typeof p.experienceYears === 'number' ? p.experienceYears : undefined,
    currentDesignation: p.employmentHistory?.[0]?.designation || '',
    skills: Array.isArray(p.skills) ? p.skills : [],
    techStack: Array.isArray(p.techStack) ? p.techStack : [],
    employmentHistory: Array.isArray(p.employmentHistory) ? p.employmentHistory : [],
    education: Array.isArray(p.educationEntries) ? p.educationEntries : [],
    projects: Array.isArray(p.projects) ? p.projects : [],
    certifications: Array.isArray(p.certifications) ? p.certifications : [],
    headline,
    summary: p.summary || '',
  };
}

/** Map the saved profile → the career-assist ProfileForMatching subset. */
function profileToAssistProfile(p: SavedProfile) {
  return {
    skills: Array.isArray(p.skills) ? p.skills : [],
    techStack: Array.isArray(p.techStack) ? p.techStack : [],
    totalExperienceYears: typeof p.totalExperienceYears === 'number' ? p.totalExperienceYears : undefined,
    currentDesignation: p.currentDesignation || undefined,
    employmentHistory: Array.isArray(p.employmentHistory) ? p.employmentHistory : [],
    education: Array.isArray(p.education) ? p.education : [],
    projects: Array.isArray(p.projects) ? p.projects : [],
    certifications: Array.isArray(p.certifications) ? p.certifications : [],
    currentLocation: p.currentLocation || undefined,
    preferredJobLocation: p.preferredJobLocation || undefined,
    preferredLocations: Array.isArray(p.preferredLocations) ? p.preferredLocations : [],
    preferredEmploymentType: p.preferredEmploymentType || undefined,
    workModePreference: p.workModePreference || undefined,
    headline: p.headline || undefined,
    summary: p.summary || undefined,
  };
}

function emailStatusCopy(notification: 'sent' | 'skipped' | 'failed') {
  if (notification === 'sent') {
    return {
      icon: MailCheck,
      tone: 'text-green-400',
      title: 'Application submitted.',
      body: 'A confirmation email was accepted by our email provider for delivery to your registered address.',
      note: 'Delivery to your inbox may take a few minutes. Acceptance by the provider is not a guarantee of inbox delivery.',
    };
  }
  if (notification === 'skipped') {
    return {
      icon: MailWarning,
      tone: 'text-amber-400',
      title: 'Application submitted.',
      body: 'A confirmation email could not be sent because email delivery is not configured on the server.',
      note: 'Your application is saved and will be reviewed. No action is needed from you.',
    };
  }
  return {
    icon: MailX,
    tone: 'text-red-400',
    title: 'Application submitted.',
    body: 'The confirmation email could not be sent at this time.',
    note: 'Your application is saved and will be reviewed. You can track its status from your profile.',
  };
}

/* ------------------------------- component ------------------------------- */

export function CareerAssistant() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [parseError, setParseError] = useState('');
  const [prefs, setPrefs] = useState<{
    jobAlertPreference: boolean; matchingThreshold: number;
    preferredRoles: string[]; preferredLocations: string[];
    preferredEmploymentType: string | null; workModePreference: string | null;
  } | null>(null);

  // Review form (extracted → confirmed).
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [skillsText, setSkillsText] = useState('');
  const [techText, setTechText] = useState('');
  const [rolesText, setRolesText] = useState('');
  const [locsText, setLocsText] = useState('');
  const [isExtracted, setIsExtracted] = useState(false); // true when form holds unreviewed parse data

  // Preferences form.
  const [prefThreshold, setPrefThreshold] = useState(80);
  const [prefAlerts, setPrefAlerts] = useState(false);

  // Matches + apply.
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [applyOutcomes, setApplyOutcomes] = useState<Record<string, ApplyOutcome>>({});

  // Loading + error flags.
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [findingMatches, setFindingMatches] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [noMatchesReason, setNoMatchesReason] = useState('');

  const fileInput = useRef<HTMLInputElement>(null);

  /* --- initial load: auth → profile + resume + prefs --- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) { if (!cancelled) setAuthed(false); return; }
        const me = await meRes.json();
        if (cancelled) return;
        setAuthed(true);
        setUserEmail(me.user?.email || '');
        await loadProfile();
        // Resume status (404 = none).
        try {
          const r = await fetch('/api/candidate/resume');
          if (!cancelled) setHasResume(r.ok);
        } catch { /* non-fatal */ }
        await loadPrefs();
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const r = await fetch('/api/candidate/profile');
      const d = await r.json();
      if (d.profile) {
        setProfile(d.profile);
        setHasResume(!!d.profile.resumeStoragePath);
        // Seed the review form from the saved profile.
        setForm({
          fullName: d.profile.fullName || '',
          phone: d.profile.phone || '',
          currentLocation: d.profile.currentLocation || '',
          totalExperienceYears: d.profile.totalExperienceYears,
          currentDesignation: d.profile.currentDesignation || '',
          headline: d.profile.headline || '',
          summary: d.profile.summary || '',
        });
        setSkillsText(Array.isArray(d.profile.skills) ? d.profile.skills.join(', ') : '');
        setTechText(Array.isArray(d.profile.techStack) ? d.profile.techStack.join(', ') : '');
        setRolesText(Array.isArray(d.profile.preferredRoles) ? d.profile.preferredRoles.join(', ') : '');
        setLocsText(Array.isArray(d.profile.preferredLocations) ? d.profile.preferredLocations.join(', ') : '');
        setIsExtracted(false);
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadPrefs = useCallback(async () => {
    try {
      const r = await fetch('/api/candidate/profile/preferences');
      if (!r.ok) return;
      const d = await r.json();
      const raw = d.raw || {};
      setPrefs({
        jobAlertPreference: !!raw.jobAlertPreference,
        matchingThreshold: typeof raw.matchingThreshold === 'number' ? raw.matchingThreshold : (d.effective?.matchingThreshold ?? 80),
        preferredRoles: raw.preferredRoles || [],
        preferredLocations: raw.preferredLocations || [],
        preferredEmploymentType: raw.preferredEmploymentType || null,
        workModePreference: raw.workModePreference || null,
      });
      setPrefThreshold(typeof raw.matchingThreshold === 'number' ? raw.matchingThreshold : (d.effective?.matchingThreshold ?? 80));
      setPrefAlerts(!!raw.jobAlertPreference);
    } catch { /* non-fatal */ }
  }, []);

  /* --- resume upload + parse --- */
  const onUploadResume = useCallback(async (file: File) => {
    setUploading(true); setError(''); setParseError(''); setParsed(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const r = await fetch('/api/candidate/resume', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Could not upload resume.');
        return;
      }
      setHasResume(true);
      if (d.parsed?.data) {
        const p = d.parsed.data as ParsedResume;
        setParsed(p);
        setIsExtracted(true); // mark form as holding unreviewed extracted data
        const mapped = parsedToForm(p);
        setForm(mapped);
        setSkillsText(mapped.skills.join(', '));
        setTechText(mapped.techStack.join(', '));
      } else if (d.parseError) {
        setParseError(d.parseError);
      }
      // Refresh the saved profile (resume path now recorded).
      await loadProfile();
    } catch {
      setError('Network error while uploading resume.');
    } finally {
      setUploading(false);
    }
  }, [loadProfile]);

  /* --- save reviewed profile --- */
  const onSaveProfile = useCallback(async () => {
    setSavingProfile(true); setError(''); setProfileSaved(false);
    const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    const techStack = techText.split(',').map((s) => s.trim()).filter(Boolean);
    const preferredRoles = rolesText.split(',').map((s) => s.trim()).filter(Boolean);
    const preferredLocations = locsText.split(',').map((s) => s.trim()).filter(Boolean);
    const body: Record<string, unknown> = {
      fullName: (form.fullName as string) || '',
      phone: (form.phone as string) || '',
      currentLocation: (form.currentLocation as string) || '',
      currentDesignation: (form.currentDesignation as string) || '',
      headline: (form.headline as string) || '',
      summary: (form.summary as string) || '',
      skills,
      techStack,
      preferredRoles,
      preferredLocations,
    };
    if (typeof form.totalExperienceYears === 'number') body.totalExperienceYears = form.totalExperienceYears;
    try {
      const r = await fetch('/api/candidate/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || (Array.isArray(d.issues) ? d.issues.join(' ') : 'Could not save profile.'));
        return;
      }
      setProfile(d.profile);
      setIsExtracted(false); // confirmed now
      setProfileSaved(true);
    } catch {
      setError('Network error while saving profile.');
    } finally {
      setSavingProfile(false);
    }
  }, [form, skillsText, techText, rolesText, locsText]);

  /* --- save preferences --- */
  const onSavePrefs = useCallback(async () => {
    setSavingPrefs(true); setError(''); setPrefsSaved(false);
    const body: Record<string, unknown> = {
      jobAlertPreference: prefAlerts,
      matchingThreshold: prefThreshold,
    };
    const roles = rolesText.split(',').map((s) => s.trim()).filter(Boolean);
    const locs = locsText.split(',').map((s) => s.trim()).filter(Boolean);
    if (roles.length) body.preferredRoles = roles;
    if (locs.length) body.preferredLocations = locs;
    try {
      const r = await fetch('/api/candidate/profile/preferences', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || (Array.isArray(d.issues) ? d.issues.join(' ') : 'Could not save preferences.'));
        return;
      }
      setPrefsSaved(true);
      await loadPrefs();
    } catch {
      setError('Network error while saving preferences.');
    } finally {
      setSavingPrefs(false);
    }
  }, [prefAlerts, prefThreshold, rolesText, locsText, loadPrefs]);

  /* --- find matches (deterministic server-side engine) --- */
  const onFindMatches = useCallback(async () => {
    if (!profile) return;
    setFindingMatches(true); setMatchError(''); setNoMatchesReason(''); setMatches(null);
    const assistProfile = profileToAssistProfile(profile);
    const threshold = typeof profile.matchingThreshold === 'number' ? profile.matchingThreshold : prefThreshold;
    try {
      const r = await fetch('/api/chat/career-assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: assistProfile, threshold }),
      });
      const d = await r.json();
      if (r.status === 429) {
        setMatchError('Too many requests. Please try again shortly.');
        return;
      }
      if (!r.ok) {
        setMatchError(d.error || 'Could not fetch recommendations right now.');
        return;
      }
      setMatches(Array.isArray(d.matches) ? d.matches : []);
      if ((!d.matches || d.matches.length === 0) && d.reason) setNoMatchesReason(d.reason);
    } catch {
      setMatchError('Network error while fetching recommendations.');
    } finally {
      setFindingMatches(false);
    }
  }, [profile, prefThreshold]);

  /* --- apply to a recommended job --- */
  const onApply = useCallback(async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      const r = await fetch('/api/job-applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, confirmSubmission: true }),
      });
      const d = await r.json();
      if (r.ok) {
        setApplyOutcomes((prev) => ({ ...prev, [jobId]: { kind: 'success', notification: d.notification || 'skipped' } }));
      } else if (r.status === 409) {
        setApplyOutcomes((prev) => ({ ...prev, [jobId]: { kind: 'duplicate' } }));
      } else if (r.status === 422) {
        setApplyOutcomes((prev) => ({ ...prev, [jobId]: { kind: 'incomplete' } }));
      } else {
        setApplyOutcomes((prev) => ({ ...prev, [jobId]: { kind: 'error', message: d.error || 'Could not submit application.' } }));
      }
    } catch {
      setApplyOutcomes((prev) => ({ ...prev, [jobId]: { kind: 'error', message: 'Network error.' } }));
    } finally {
      setApplyingJobId(null);
    }
  }, []);

  /* --- not authenticated: CTA --- */
  if (authed === false) {
    return (
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto rounded-[2rem] bg-[#2a2b5a] border border-[#4da3ff]/20 p-8 md:p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#4da3ff]/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-7 w-7 text-[#4da3ff]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-3">AI Career Assistant</h2>
          <p className="text-zinc-300 mb-6 max-w-xl mx-auto">
            Upload your resume, review the extracted details, and get personalized job recommendations
            ranked by our deterministic matching engine — then apply in one click.
          </p>
          <Button asChild className="rounded-full bg-[#8e44ad] hover:bg-[#7d3c98] px-8 h-12 gap-2">
            <a href="/auth/login?redirect=/careers"><LogIn className="h-4 w-4" /> Sign in to get started</a>
          </Button>
        </div>
      </section>
    );
  }

  if (authed === null) {
    // Loading auth state.
    return (
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto rounded-[2rem] bg-[#2a2b5a]/50 border border-white/5 p-8 flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your career assistant…
        </div>
      </section>
    );
  }

  /* --- authenticated: the assistant panel --- */
  return (
    <section className="container mx-auto px-4 md:px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-[#4da3ff]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-[#4da3ff]" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black mb-2">AI Career Assistant</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Upload your resume, review the extracted details, and get personalized recommendations
            from our deterministic matching engine. Signed in as <span className="text-[#4da3ff]">{userEmail}</span>.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* 1. Resume + parse */}
        <div className="rounded-[2rem] bg-[#2a2b5a] border border-white/5 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#4da3ff]" />
            <h3 className="text-lg font-bold">1. Your resume</h3>
          </div>
          {hasResume ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Resume on file.
              </div>
              <input
                ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadResume(f); e.target.value = ''; }}
              />
              <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}
                className="rounded-full border-[#4da3ff]/50 text-[#4da3ff] hover:bg-[#4da3ff]/10 gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading + parsing…' : 'Replace resume'}
              </Button>
              {parseError && (
                <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2 mt-2">{parseError}</p>
              )}
              {parsed && (
                <p className="text-xs text-green-400 bg-green-500/10 rounded-lg p-2 mt-2">
                  Resume parsed. Review the extracted details below before saving.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Upload your resume (PDF, DOC, or DOCX, max 5&nbsp;MB). We&apos;ll parse it with AI so you can review the
                extracted details before anything is saved to your profile.
              </p>
              <input
                ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadResume(f); e.target.value = ''; }}
              />
              <Button onClick={() => fileInput.current?.click()} disabled={uploading}
                className="rounded-full bg-[#8e44ad] hover:bg-[#7d3c98] gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading + parsing…' : 'Upload resume'}
              </Button>
            </div>
          )}
        </div>

        {/* 2. Review extracted / confirmed profile */}
        <div className="rounded-[2rem] bg-[#2a2b5a] border border-white/5 p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#4da3ff]" />
              <h3 className="text-lg font-bold">2. Review your profile</h3>
            </div>
            {isExtracted ? (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                Extracted — please review
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                Confirmed
              </span>
            )}
          </div>
          {loadingProfile ? (
            <div className="flex items-center gap-2 text-zinc-400 py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading profile…</div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                {isExtracted
                  ? 'These fields were extracted from your resume by AI. Edit anything that looks wrong, then save to confirm them as your profile.'
                  : 'These are your confirmed profile fields. Edit them anytime.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Full name *</Label>
                  <Input value={(form.fullName as string) || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="bg-[#1a1b3a] border-none text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Phone</Label>
                  <Input value={(form.phone as string) || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-[#1a1b3a] border-none text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Current location</Label>
                  <Input value={(form.currentLocation as string) || ''} onChange={(e) => setForm({ ...form, currentLocation: e.target.value })}
                    className="bg-[#1a1b3a] border-none text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Total experience (years)</Label>
                  <Input type="number" min={0} max={80} value={typeof form.totalExperienceYears === 'number' ? form.totalExperienceYears : ''}
                    onChange={(e) => setForm({ ...form, totalExperienceYears: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="bg-[#1a1b3a] border-none text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Current designation</Label>
                  <Input value={(form.currentDesignation as string) || ''} onChange={(e) => setForm({ ...form, currentDesignation: e.target.value })}
                    className="bg-[#1a1b3a] border-none text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Headline</Label>
                  <Input value={(form.headline as string) || ''} onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    className="bg-[#1a1b3a] border-none text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Skills (comma-separated)</Label>
                <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, Node.js, Python…"
                  className="bg-[#1a1b3a] border-none text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Tech stack (comma-separated)</Label>
                <Input value={techText} onChange={(e) => setTechText(e.target.value)} placeholder="PostgreSQL, AWS, Docker…"
                  className="bg-[#1a1b3a] border-none text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Summary</Label>
                <textarea value={(form.summary as string) || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={3} className="w-full rounded-xl bg-[#1a1b3a] border-none text-white p-3 text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={onSaveProfile} disabled={savingProfile}
                  className="rounded-full bg-[#8e44ad] hover:bg-[#7d3c98] gap-2">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save reviewed profile
                </Button>
                {profileSaved && <span className="text-sm text-green-400">Saved.</span>}
              </div>
            </div>
          )}
        </div>

        {/* 3. Preferences */}
        <div className="rounded-[2rem] bg-[#2a2b5a] border border-white/5 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-[#4da3ff]" />
            <h3 className="text-lg font-bold">3. Matching preferences</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">Match threshold</Label>
                <span className="text-sm font-bold text-[#4da3ff]">{prefThreshold}%</span>
              </div>
              <input type="range" min={75} max={100} value={prefThreshold} onChange={(e) => setPrefThreshold(Number(e.target.value))}
                className="w-full accent-[#4da3ff]" />
              <p className="text-xs text-zinc-500">Only jobs scoring at or above this threshold are shown.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <Checkbox checked={prefAlerts} onCheckedChange={(v) => setPrefAlerts(v === true)} />
              Email me when a new job matches my profile at this threshold.
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Preferred roles (comma-separated)</Label>
                <Input value={rolesText} onChange={(e) => setRolesText(e.target.value)} placeholder="Senior Engineer, Tech Lead…"
                  className="bg-[#1a1b3a] border-none text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Preferred locations (comma-separated)</Label>
                <Input value={locsText} onChange={(e) => setLocsText(e.target.value)} placeholder="Bangalore, Remote…"
                  className="bg-[#1a1b3a] border-none text-white" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={onSavePrefs} disabled={savingPrefs} variant="outline"
                className="rounded-full border-[#4da3ff]/50 text-[#4da3ff] hover:bg-[#4da3ff]/10 gap-2">
                {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save preferences
              </Button>
              {prefsSaved && <span className="text-sm text-green-400">Saved.</span>}
            </div>
          </div>
        </div>

        {/* 4. Recommendations */}
        <div className="rounded-[2rem] bg-[#2a2b5a] border border-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#4da3ff]" />
              <h3 className="text-lg font-bold">4. Your recommendations</h3>
            </div>
            <Button onClick={onFindMatches} disabled={findingMatches}
              className="rounded-full bg-[#4da3ff] hover:bg-[#3a8fdd] text-[#1a1b3a] font-bold gap-2">
              {findingMatches ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {findingMatches ? 'Matching…' : 'Find my matches'}
            </Button>
          </div>

          {matchError && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl p-3 mb-4">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{matchError}</span>
            </div>
          )}

          {matches !== null && matches.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-1">No jobs match your profile at the {prefThreshold}% threshold right now.</p>
              {noMatchesReason && <p className="text-xs text-zinc-500">{noMatchesReason}</p>}
              <p className="text-xs text-zinc-500 mt-2">Try lowering your threshold, adding more skills to your profile, or check back when new roles are posted.</p>
            </div>
          )}

          {matches && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((m) => {
                const outcome = applyOutcomes[m.id];
                const es = outcome?.kind === 'success' ? emailStatusCopy(outcome.notification) : null;
                return (
                  <div key={m.id} className="rounded-2xl bg-[#1a1b3a] border border-white/5 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h4 className="font-bold text-white">{m.title}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                          {m.department && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{m.department}</span>}
                          {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
                          {m.employmentType && <span>{m.employmentType}</span>}
                          {m.workArrangement && <span>{m.workArrangement}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#4da3ff]">{m.score}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">match</div>
                      </div>
                    </div>
                    {m.reasons.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-zinc-300">
                        {m.reasons.map((r, i) => <li key={i} className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />{r}</li>)}
                      </ul>
                    )}

                    {outcome?.kind === 'success' && es && (
                      <div className={`mt-3 flex items-start gap-2 text-xs ${es.tone} bg-white/5 rounded-lg p-2`}>
                        <es.icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold">{es.title}</p>
                          <p>{es.body}</p>
                          <p className="text-zinc-500 mt-1">{es.note}</p>
                        </div>
                      </div>
                    )}
                    {outcome?.kind === 'duplicate' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#4da3ff] bg-[#4da3ff]/10 rounded-lg p-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> You have already applied for this role.{' '}
                        <a href="/candidate/profile" className="underline">Track your applications</a>.
                      </div>
                    )}
                    {outcome?.kind === 'incomplete' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
                        <AlertCircle className="h-4 w-4 shrink-0" /> Your profile is incomplete.{' '}
                        <a href="#review" className="underline">Complete it above</a> before applying.
                      </div>
                    )}
                    {outcome?.kind === 'error' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {outcome.message}
                      </div>
                    )}

                    {!outcome && (
                      <Button onClick={() => onApply(m.id)} disabled={applyingJobId === m.id}
                        className="mt-3 rounded-full bg-[#8e44ad] hover:bg-[#7d3c98] gap-2">
                        {applyingJobId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Apply now
                      </Button>
                    )}
                    {outcome?.kind === 'error' && (
                      <Button onClick={() => onApply(m.id)} disabled={applyingJobId === m.id}
                        className="mt-3 rounded-full bg-[#8e44ad] hover:bg-[#7d3c98] gap-2">
                        {applyingJobId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Retry
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {matches === null && !findingMatches && !matchError && (
            <p className="text-sm text-zinc-500 text-center py-4">
              Save your reviewed profile, then click <span className="text-[#4da3ff]">Find my matches</span> to see roles
              ranked by our deterministic matching engine.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
