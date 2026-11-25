'use client';
/**
 * /candidate/applications/[id] — application detail (Phase 5).
 *
 * Auth-gated + ownership-enforced server-side (the API returns 403 if the
 * application does not belong to the authenticated candidate — changing the ID
 * in the URL does NOT bypass authorization). Shows the submitted application
 * snapshot, candidate-visible status, candidate-visible timeline, approved
 * interview details, + a withdraw button (only if the application is not in a
 * terminal state).
 *
 * Internal notes, internalStage, reviewer identities, scores, + confidential
 * interview feedback are NEVER shown — the API returns only the candidate-safe
 * view (toCandidateApplication).
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ExternalLink, Calendar, Clock, Globe, Video, Phone, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import type { CandidateApplicationView, CandidateInterviewView } from '@/lib/recruitment/candidate-view';
import { CANDIDATE_STATUS_BADGE, CANDIDATE_STATUS_LABELS } from '@/lib/recruitment/status';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<CandidateApplicationView | null>(null);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/candidate/applications/${params.id}`, { cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?redirect=/candidate/applications'); return; }
      if (res.status === 403) { setError('You do not have access to this application.'); setLoading(false); return; }
      if (res.status === 404) { setError('Application not found.'); setLoading(false); return; }
      const data = await res.json();
      if (res.ok) setApp(data.application);
      else setError(data.error || 'Could not load application.');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const canWithdraw = app && !['hired', 'rejected', 'withdrawn'].includes(app.candidateStatus);

  async function withdraw() {
    if (!app || !canWithdraw) return;
    if (!confirm('Withdraw this application? This cannot be undone.')) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/candidate/applications/${app.applicationId}/withdraw`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) { await load(); }
      else { setError(data.error || 'Could not withdraw.'); }
    } catch {
      setError('Network error.');
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!app && error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>{error}</CardTitle></CardHeader>
          <CardContent>
            <Button asChild className="w-full"><Link href="/candidate/applications">Back to applications</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link href="/candidate/applications" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> All applications
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{app.jobTitle || 'Application'}</h1>
            <p className="text-muted-foreground">{app.company}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium self-start ${CANDIDATE_STATUS_BADGE[app.candidateStatus]}`}>
            {app.candidateStatusLabel}
          </span>
        </div>

        <div className="grid gap-4">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Application summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{app.applicationId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Applied</span><span>{app.appliedAt ? new Date(app.appliedAt).toLocaleString() : '—'}</span></div>
              {app.updatedAt && app.updatedAt !== app.appliedAt && (
                <div className="flex justify-between"><span className="text-muted-foreground">Last updated</span><span>{new Date(app.updatedAt).toLocaleString()}</span></div>
              )}
              {app.withdrawnAt && (
                <div className="flex justify-between"><span className="text-muted-foreground">Withdrawn</span><span>{new Date(app.withdrawnAt).toLocaleString()}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Resume</span><span>{app.hasResume ? app.resumeFileName || 'Yes' : 'Not provided'}</span></div>
            </CardContent>
          </Card>

          {/* Submitted snapshot */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Your submitted details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SnapshotRow label="Full name" value={app.candidateName} />
              <SnapshotRow label="Email" value={app.candidateEmail} />
              <SnapshotRow label="Phone" value={app.candidatePhone} />
              <SnapshotRow label="Current location" value={app.currentLocation} />
              <SnapshotRow label="Preferred location" value={app.preferredJobLocation} />
              <SnapshotRow label="Current designation" value={app.currentDesignation} />
              <SnapshotRow label="Years of experience" value={app.yearsExperience} />
              <SnapshotRow label="LinkedIn" value={app.linkedin} link />
              <SnapshotRow label="Portfolio / GitHub" value={app.portfolio} link />
              <SnapshotRow label="Expected salary" value={app.expectedSalary} />
              <SnapshotRow label="Notice period" value={app.noticePeriod} />
              {app.skills.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.skills.map((s) => <span key={s} className="rounded-full border bg-secondary/40 px-2 py-0.5 text-xs">{s}</span>)}
                  </div>
                </div>
              )}
              {app.coverLetter && (
                <div>
                  <p className="text-muted-foreground mb-1">Cover letter</p>
                  <p className="whitespace-pre-line rounded-md border bg-muted/30 p-3">{app.coverLetter}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interviews (candidate-approved fields only) */}
          {app.interviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Interviews</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {app.interviews.map((iv) => <InterviewCard key={iv.id} iv={iv} />)}
              </CardContent>
            </Card>
          )}

          {/* Candidate-visible timeline */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Status timeline</CardTitle></CardHeader>
            <CardContent>
              {app.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status updates yet.</p>
              ) : (
                <ol className="relative border-l border-border pl-5 space-y-4">
                  {app.timeline.map((entry, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary" />
                      <p className="font-medium text-sm">{entry.label}</p>
                      {entry.at && <p className="text-xs text-muted-foreground">{new Date(entry.at).toLocaleString()}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {app.jobId && (
              <Button asChild variant="outline">
                <Link href={`/careers/${app.jobId}`}><ExternalLink className="h-4 w-4 mr-2" />View job posting</Link>
              </Button>
            )}
            {canWithdraw && (
              <Button variant="destructive" onClick={withdraw} disabled={withdrawing}>
                {withdrawing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Withdraw application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      {link && /^(https?:|www\.)/.test(value) ? (
        <a href={value.startsWith('www.') ? `https://${value}` : value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-right break-all">{value}</a>
      ) : (
        <span className="text-right break-words">{value}</span>
      )}
    </div>
  );
}

function InterviewCard({ iv }: { iv: CandidateInterviewView }) {
  const cancelled = iv.status === 'cancelled';
  const ModeIcon = iv.mode === 'video' ? Video : iv.mode === 'phone' ? Phone : MapPin;
  return (
    <div className={`rounded-md border p-3 ${cancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm">{iv.stage || 'Interview'}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${cancelled ? 'bg-red-100 text-red-800' : iv.status === 'rescheduled' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
          {iv.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {iv.date && <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{new Date(iv.date).toLocaleDateString()}</span>}
        {iv.startTime && <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{iv.startTime}</span>}
        {iv.timeZone && <span className="flex items-center"><Globe className="h-3 w-3 mr-1" />{iv.timeZone}</span>}
        {iv.mode && <span className="flex items-center"><ModeIcon className="h-3 w-3 mr-1" />{iv.mode}</span>}
      </div>
      {iv.meetingLink && !cancelled && (
        <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary hover:underline mt-2">
          <ExternalLink className="h-3 w-3 mr-1" />Join interview
        </a>
      )}
      {iv.instructions && <p className="text-xs mt-2 text-muted-foreground">{iv.instructions}</p>}
    </div>
  );
}
