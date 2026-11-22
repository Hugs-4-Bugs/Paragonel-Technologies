'use client';
/**
 * /candidate/profile — candidate profile management (Prompt 05Q §7, §8, §11).
 *
 * Auth-gated: redirects to /auth/login?redirect=/candidate/profile if no session.
 *
 * Features:
 *   - Editable profile fields (identity, professional, experience, education,
 *     projects, certifications, achievements, preferences) — every field in the
 *     candidateProfileSchema is editable here.
 *   - Honest completeness display (never inflates).
 *   - Resume upload (PDF/DOC/DOCX) → parsed fields shown for review + correction
 *     before saving (clearly marked "parsed, unconfirmed"). The candidate edits
 *     + saves → the values become user-confirmed.
 *   - Resume download (short-lived signed URL) + delete.
 *   - Job matching preferences (jobAlertPreference, matchingThreshold,
 *     preferred roles/locations/employment type/work mode). 05R wires these to
 *     the explainable matching engine + automated job-match email alerts. The
 *     threshold is clamped to 25-100 (default 80); alerts are opt-in and
 *     separate from marketing emails.
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Upload, Download, Trash2, LogOut, FileText, AlertCircle, Plus } from 'lucide-react';

interface EmploymentEntry {
  company: string;
  designation: string;
  startDate: string;
  endDate: string;
  description: string;
}
interface EducationEntry {
  qualification: string;
  institution: string;
  year: string;
}
interface ProjectEntry {
  name: string;
  description: string;
  technologies: string;
  url: string;
}

const emptyEmployment = (): EmploymentEntry => ({ company: '', designation: '', startDate: '', endDate: '', description: '' });
const emptyEducation = (): EducationEntry => ({ qualification: '', institution: '', year: '' });
const emptyProject = (): ProjectEntry => ({ name: '', description: '', technologies: '', url: '' });

/** Normalize a partially-typed server row into a fully-typed client entry. */
const normEmployment = (e: Partial<EmploymentEntry> | undefined): EmploymentEntry => ({
  company: e?.company ?? '', designation: e?.designation ?? '', startDate: e?.startDate ?? '',
  endDate: e?.endDate ?? '', description: e?.description ?? '',
});
const normEducation = (e: Partial<EducationEntry> | undefined): EducationEntry => ({
  qualification: e?.qualification ?? '', institution: e?.institution ?? '', year: e?.year ?? '',
});
const normProject = (e: Partial<ProjectEntry> | undefined): ProjectEntry => ({
  name: e?.name ?? '', description: e?.description ?? '', technologies: e?.technologies ?? '', url: e?.url ?? '',
});

interface ProfileData {
  email: string;
  fullName: string;
  phone?: string;
  currentLocation?: string;
  preferredJobLocation?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  headline?: string;
  summary?: string;
  totalExperienceYears?: number;
  currentDesignation?: string;
  skills?: string[];
  techStack?: string[];
  employmentHistory?: EmploymentEntry[];
  education?: EducationEntry[];
  projects?: ProjectEntry[];
  certifications?: string[];
  achievements?: string[];
  preferredRoles?: string[];
  preferredLocations?: string[];
  preferredEmploymentType?: string;
  workModePreference?: string;
  jobAlertPreference?: boolean;
  matchingThreshold?: number;
  resumeStoragePath?: string | null;
  resumeFileName?: string | null;
}

/** Split comma/newline text into a trimmed, non-empty string array. */
const toList = (text: string, sep: string | RegExp = ','): string[] =>
  text.split(sep).map((s) => s.trim()).filter(Boolean);

export default function CandidateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [completeness, setCompleteness] = useState(0);
  // Comma-separated text mirrors for simple string-array fields.
  const [skillsText, setSkillsText] = useState('');
  const [rolesText, setRolesText] = useState('');
  const [techStackText, setTechStackText] = useState('');
  const [preferredLocationsText, setPreferredLocationsText] = useState('');
  const [certsText, setCertsText] = useState('');
  const [achievementsText, setAchievementsText] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [parsedNote, setParsedNote] = useState('');

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/candidate/profile');
    if (res.status === 401) {
      router.push('/auth/login?redirect=' + encodeURIComponent('/candidate/profile'));
      return;
    }
    const data = await res.json();
    if (data.profile) {
      const p = data.profile;
      setProfile({
        ...p,
        employmentHistory: (p.employmentHistory || []).map(normEmployment),
        education: (p.education || []).map(normEducation),
        projects: (p.projects || []).map(normProject),
      });
      setCompleteness(data.completeness ?? 0);
      setSkillsText((p.skills || []).join(', '));
      setRolesText((p.preferredRoles || []).join(', '));
      setTechStackText((p.techStack || []).join(', '));
      setPreferredLocationsText((p.preferredLocations || []).join(', '));
      setCertsText((p.certifications || []).join(', '));
      setAchievementsText((p.achievements || []).join('\n'));
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const update = (field: keyof ProfileData, value: string | number | boolean) => {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
  };

  /* ----------------------- repeatable array editors ----------------------- */
  const updateEmployment = (i: number, k: keyof EmploymentEntry, v: string) =>
    setProfile((p) => {
      if (!p) return p;
      const arr = [...(p.employmentHistory ?? [])];
      while (arr.length <= i) arr.push(emptyEmployment());
      arr[i] = { ...arr[i], [k]: v };
      return { ...p, employmentHistory: arr };
    });
  const addEmployment = () =>
    setProfile((p) => (p ? { ...p, employmentHistory: [...(p.employmentHistory ?? []), emptyEmployment()] } : p));
  const removeEmployment = (i: number) =>
    setProfile((p) => {
      if (!p) return p;
      const arr = [...(p.employmentHistory ?? [])];
      arr.splice(i, 1);
      return { ...p, employmentHistory: arr };
    });

  const updateEducation = (i: number, k: keyof EducationEntry, v: string) =>
    setProfile((p) => {
      if (!p) return p;
      const arr = [...(p.education ?? [])];
      while (arr.length <= i) arr.push(emptyEducation());
      arr[i] = { ...arr[i], [k]: v };
      return { ...p, education: arr };
    });
  const addEducation = () =>
    setProfile((p) => (p ? { ...p, education: [...(p.education ?? []), emptyEducation()] } : p));
  const removeEducation = (i: number) =>
    setProfile((p) => {
      if (!p) return p;
      const arr = [...(p.education ?? [])];
      arr.splice(i, 1);
      return { ...p, education: arr };
    });

  const updateProject = (i: number, k: keyof ProjectEntry, v: string) =>
    setProfile((p) => {
      if (!p) return p;
      const arr = [...(p.projects ?? [])];
      while (arr.length <= i) arr.push(emptyProject());
      arr[i] = { ...arr[i], [k]: v };
      return { ...p, projects: arr };
    });
  const addProject = () =>
    setProfile((p) => (p ? { ...p, projects: [...(p.projects ?? []), emptyProject()] } : p));
  const removeProject = (i: number) =>
    setProfile((p) => {
      if (!p) return p;
      const arr = [...(p.projects ?? [])];
      arr.splice(i, 1);
      return { ...p, projects: arr };
    });

  const save = useCallback(async () => {
    if (!profile) return;
    setSaving(true); setError(''); setNote('');
    try {
      const body = {
        ...profile,
        skills: toList(skillsText),
        techStack: toList(techStackText),
        preferredRoles: toList(rolesText),
        preferredLocations: toList(preferredLocationsText),
        certifications: toList(certsText),
        achievements: toList(achievementsText, '\n'),
        employmentHistory: profile.employmentHistory ?? [],
        education: profile.education ?? [],
        projects: profile.projects ?? [],
      };
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({
          ...data.profile,
          employmentHistory: (data.profile.employmentHistory || []).map(normEmployment),
          education: (data.profile.education || []).map(normEducation),
          projects: (data.profile.projects || []).map(normProject),
        });
        setCompleteness(data.completeness ?? 0);
        setNote('Profile saved.');
      } else {
        setError(data.error || 'Could not save.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }, [profile, skillsText, techStackText, rolesText, preferredLocationsText, certsText, achievementsText]);

  const uploadResume = useCallback(async (file: File) => {
    if (!file) return;
    setSaving(true); setError(''); setParsedNote('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch('/api/candidate/resume', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        // Reload the profile to pick up the resume ref.
        await loadProfile();
        if (data.parsed?.data) {
          // Show parsed fields for review. The candidate edits + saves to confirm.
          // Values are only pre-filled where the candidate has not already set one.
          const p = data.parsed.data;
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  fullName: prev.fullName || p.name || '',
                  phone: prev.phone || p.phone || '',
                  currentLocation: prev.currentLocation || p.location || '',
                  headline: prev.headline || p.domain || '',
                  summary: prev.summary || p.summary || '',
                  totalExperienceYears: prev.totalExperienceYears ?? p.experienceYears ?? undefined,
                  currentDesignation: prev.currentDesignation || p.seniority || '',
                  skills: prev.skills?.length ? prev.skills : (p.skills || []),
                  techStack: prev.techStack?.length ? prev.techStack : (p.techStack || []),
                  employmentHistory: prev.employmentHistory?.length ? prev.employmentHistory : (p.employmentHistory || []).map(normEmployment),
                  education: prev.education?.length ? prev.education : (p.educationEntries || []).map(normEducation),
                  projects: prev.projects?.length ? prev.projects : (p.projects || []).map(normProject),
                  certifications: prev.certifications?.length ? prev.certifications : (p.certifications || []),
                }
              : prev,
          );
          setSkillsText((prev) => prev || (p.skills || []).join(', '));
          setTechStackText((prev) => prev || (p.techStack || []).join(', '));
          setCertsText((prev) => prev || (p.certifications || []).join(', '));
          setParsedNote('Resume parsed. Review the pre-filled fields above + edit as needed, then Save to confirm.');
        } else if (data.parseError) {
          setParsedNote('Resume uploaded but could not be parsed. Fill in your details manually.');
        }
      } else {
        setError(data.error || 'Upload failed.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }, [loadProfile]);

  const downloadResume = useCallback(async () => {
    try {
      const res = await fetch('/api/candidate/resume');
      const data = await res.json();
      if (res.ok && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setError(data.error || 'No resume on file.');
      }
    } catch {
      setError('Network error.');
    }
  }, []);

  const deleteResume = useCallback(async () => {
    if (!confirm('Remove your resume?')) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/candidate/resume', { method: 'DELETE' });
      if (res.ok) {
        await loadProfile();
      } else {
        const data = await res.json();
        setError(data.error || 'Could not remove.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><p>Could not load profile.</p></div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your candidate profile</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <Button variant="ghost" onClick={logout} size="sm"><LogOut className="h-4 w-4 mr-1" /> Log out</Button>
        </div>

        {/* Completeness */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile completeness</span>
              <span className="text-sm text-muted-foreground">{completeness}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completeness}%` }} />
            </div>
            {completeness < 100 && <p className="text-xs text-muted-foreground mt-2">Complete your profile to strengthen job applications.</p>}
          </CardContent>
        </Card>

        {error && <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"><AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
        {note && <p className="text-sm text-green-600">{note}</p>}
        {parsedNote && <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"><FileText className="h-4 w-4 mt-0.5 shrink-0" /><span>{parsedNote}</span></div>}

        {/* Resume */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Resume</CardTitle><CardDescription>PDF, DOC, or DOCX (max 5 MB). Stored privately.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {profile.resumeStoragePath ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-green-600"><FileText className="h-4 w-4" /> {profile.resumeFileName || 'resume'}</span>
                <Button onClick={downloadResume} variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> Download</Button>
                <Button onClick={deleteResume} variant="outline" size="sm"><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No resume on file.</p>
            )}
            <Label htmlFor="resume-upload" className="inline-flex items-center gap-1 cursor-pointer text-sm px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-primary">
              <Upload className="h-3 w-3" /> Upload / replace resume
              <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} />
            </Label>
          </CardContent>
        </Card>

        {/* Identity + contact */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Identity + contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="fullName">Full name *</Label><Input id="fullName" value={profile.fullName} onChange={(e) => update('fullName', e.target.value)} maxLength={200} /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} maxLength={32} /></div>
            <div className="space-y-1.5"><Label htmlFor="loc">Current location</Label><Input id="loc" value={profile.currentLocation || ''} onChange={(e) => update('currentLocation', e.target.value)} maxLength={200} /></div>
            <div className="space-y-1.5"><Label htmlFor="ploc">Preferred job location</Label><Input id="ploc" value={profile.preferredJobLocation || ''} onChange={(e) => update('preferredJobLocation', e.target.value)} maxLength={200} /></div>
            <div className="space-y-1.5"><Label htmlFor="li">LinkedIn URL</Label><Input id="li" value={profile.linkedinUrl || ''} onChange={(e) => update('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/…" maxLength={300} /></div>
            <div className="space-y-1.5"><Label htmlFor="po">Portfolio URL</Label><Input id="po" value={profile.portfolioUrl || ''} onChange={(e) => update('portfolioUrl', e.target.value)} maxLength={300} /></div>
            <div className="space-y-1.5"><Label htmlFor="gh">GitHub URL</Label><Input id="gh" value={profile.githubUrl || ''} onChange={(e) => update('githubUrl', e.target.value)} maxLength={300} /></div>
          </CardContent>
        </Card>

        {/* Professional */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Professional details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="headline">Headline</Label><Input id="headline" value={profile.headline || ''} onChange={(e) => update('headline', e.target.value)} maxLength={200} /></div>
            <div className="space-y-1.5"><Label htmlFor="summary">Summary</Label><Textarea id="summary" value={profile.summary || ''} onChange={(e) => update('summary', e.target.value)} maxLength={5000} rows={4} /></div>
            <div className="space-y-1.5"><Label htmlFor="exp">Total experience (years)</Label><Input id="exp" type="number" value={profile.totalExperienceYears ?? ''} onChange={(e) => update('totalExperienceYears', Number(e.target.value) || 0)} min={0} max={80} /></div>
            <div className="space-y-1.5"><Label htmlFor="desig">Current / previous designation</Label><Input id="desig" value={profile.currentDesignation || ''} onChange={(e) => update('currentDesignation', e.target.value)} maxLength={200} /></div>
            <div className="space-y-1.5"><Label htmlFor="skills">Skills (comma-separated)</Label><Input id="skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} maxLength={500} /></div>
            <div className="space-y-1.5"><Label htmlFor="tech">Technology stack (comma-separated)</Label><Input id="tech" value={techStackText} onChange={(e) => setTechStackText(e.target.value)} maxLength={500} /></div>
            <div className="space-y-1.5"><Label htmlFor="certs">Certifications (comma-separated)</Label><Input id="certs" value={certsText} onChange={(e) => setCertsText(e.target.value)} maxLength={1000} /></div>
            <div className="space-y-1.5"><Label htmlFor="ach">Achievements (one per line)</Label><Textarea id="ach" value={achievementsText} onChange={(e) => setAchievementsText(e.target.value)} maxLength={3000} rows={3} /></div>
          </CardContent>
        </Card>

        {/* Employment history */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Employment history</CardTitle><CardDescription>One entry per role. Pre-filled from your resume where available.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(profile.employmentHistory ?? []).map((job, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input aria-label={`Company ${i + 1}`} placeholder="Company" value={job.company} onChange={(e) => updateEmployment(i, 'company', e.target.value)} maxLength={200} />
                  <Input aria-label={`Designation ${i + 1}`} placeholder="Designation" value={job.designation} onChange={(e) => updateEmployment(i, 'designation', e.target.value)} maxLength={200} />
                  <Input aria-label={`Start ${i + 1}`} placeholder="Start (e.g. Jan 2021)" value={job.startDate} onChange={(e) => updateEmployment(i, 'startDate', e.target.value)} maxLength={50} />
                  <Input aria-label={`End ${i + 1}`} placeholder="End (or Present)" value={job.endDate} onChange={(e) => updateEmployment(i, 'endDate', e.target.value)} maxLength={50} />
                </div>
                <Textarea aria-label={`Description ${i + 1}`} placeholder="Responsibilities / impact" value={job.description} onChange={(e) => updateEmployment(i, 'description', e.target.value)} maxLength={2000} rows={2} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeEmployment(i)} className="text-destructive"><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addEmployment}><Plus className="h-3 w-3 mr-1" /> Add role</Button>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Education</CardTitle><CardDescription>One entry per degree.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(profile.education ?? []).map((edu, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input aria-label={`Qualification ${i + 1}`} placeholder="Qualification" value={edu.qualification} onChange={(e) => updateEducation(i, 'qualification', e.target.value)} maxLength={200} />
                  <Input aria-label={`Institution ${i + 1}`} placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} maxLength={200} />
                  <Input aria-label={`Year ${i + 1}`} placeholder="Year" value={edu.year} onChange={(e) => updateEducation(i, 'year', e.target.value)} maxLength={20} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(i)} className="text-destructive"><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addEducation}><Plus className="h-3 w-3 mr-1" /> Add education</Button>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Projects</CardTitle><CardDescription>Notable projects.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(profile.projects ?? []).map((prj, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <Input aria-label={`Project name ${i + 1}`} placeholder="Project name" value={prj.name} onChange={(e) => updateProject(i, 'name', e.target.value)} maxLength={200} />
                  <Textarea aria-label={`Project description ${i + 1}`} placeholder="Short description" value={prj.description} onChange={(e) => updateProject(i, 'description', e.target.value)} maxLength={2000} rows={2} />
                  <Input aria-label={`Project technologies ${i + 1}`} placeholder="Technologies (comma-separated)" value={prj.technologies} onChange={(e) => updateProject(i, 'technologies', e.target.value)} maxLength={500} />
                  <Input aria-label={`Project URL ${i + 1}`} placeholder="URL (optional)" value={prj.url} onChange={(e) => updateProject(i, 'url', e.target.value)} maxLength={300} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(i)} className="text-destructive"><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addProject}><Plus className="h-3 w-3 mr-1" /> Add project</Button>
          </CardContent>
        </Card>

        {/* Preferences (05R) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job matching preferences</CardTitle>
            <CardDescription>
              Used to match you with new openings. Job alerts are based on how well a role fits your saved profile and are separate from marketing emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="roles">Preferred roles (comma-separated)</Label><Input id="roles" value={rolesText} onChange={(e) => setRolesText(e.target.value)} maxLength={500} /></div>
            <div className="space-y-1.5"><Label htmlFor="plocs">Preferred locations (comma-separated)</Label><Input id="plocs" value={preferredLocationsText} onChange={(e) => setPreferredLocationsText(e.target.value)} maxLength={500} /></div>
            <div className="space-y-1.5"><Label htmlFor="emptype">Preferred employment type</Label>
              <select id="emptype" value={profile.preferredEmploymentType || ''} onChange={(e) => update('preferredEmploymentType', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1.5 text-sm">
                <option value="">—</option>
                <option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="any">Any</option>
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="wm">Work mode</Label>
              <select id="wm" value={profile.workModePreference || ''} onChange={(e) => update('workModePreference', e.target.value)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1.5 text-sm">
                <option value="">—</option>
                <option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on-site">On-site</option><option value="any">Any</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt">Matching threshold (%)</Label>
              <Input
                id="mt"
                type="number"
                value={profile.matchingThreshold ?? ''}
                onChange={(e) => {
                  if (e.target.value === '') { update('matchingThreshold', 80); return; }
                  const n = Math.floor(Number(e.target.value) || 80);
                  update('matchingThreshold', Math.max(25, Math.min(100, n)));
                }}
                min={25}
                max={100}
                placeholder="80"
                aria-describedby="mt-help"
              />
              <p id="mt-help" className="text-xs text-muted-foreground">Minimum 25%, maximum 100%. Default is 80% — we only email you when a role matches at or above this score.</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={profile.jobAlertPreference === true}
                  onChange={(e) => update('jobAlertPreference', e.target.checked)}
                  aria-describedby="alert-help"
                />
                <span>Send me job alerts when a matching role is published</span>
              </label>
              <p id="alert-help" className="text-xs text-muted-foreground ml-6">
                We will email your verified account address when a genuinely published role matches your profile at or above your threshold. This is opt-in and separate from marketing emails. Every alert includes a one-click unsubscribe link.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 sticky bottom-4">
          <Button onClick={save} disabled={saving} className="flex-1 shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save profile
          </Button>
          <Link href="/"><Button variant="outline">Back to site</Button></Link>
        </div>
      </div>
    </div>
  );
}
