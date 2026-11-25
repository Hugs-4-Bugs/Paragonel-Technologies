'use client';
/**
 * /candidate/applications — My Applications dashboard (Phase 5).
 *
 * Auth-gated: redirects to /auth/login?redirect=/candidate/applications if no
 * candidate session. Lists every application belonging to the authenticated
 * candidate (server-scoped to candidateEmail == email — a candidate can ONLY see
 * their own applications). Each row shows job title, company, reference, applied
 * date, candidate-visible status, last updated, + a link to the detail page.
 *
 * Real-time: re-fetches on mount + on window focus so admin-approved status
 * changes reflect without a manual refresh. The authoritative record is the
 * server-side application doc (never frontend-only state).
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import type { CandidateApplicationView } from '@/lib/recruitment/candidate-view';
import { CANDIDATE_STATUS_BADGE } from '@/lib/recruitment/status';

export default function MyApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [applications, setApplications] = useState<CandidateApplicationView[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/candidate/applications', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/auth/login?redirect=/candidate/applications');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications || []);
      } else {
        setError(data.error || 'Could not load applications.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Auth check + load.
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => { setAuthed(r.ok); return r.ok; })
      .then((ok) => { if (ok) load(); else setLoading(false); })
      .catch(() => { setAuthed(false); setLoading(false); });
    // Real-time: re-fetch on window focus (admin changes reflect without refresh).
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (authed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Sign in required</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Please sign in to view your applications.</p>
            <Button onClick={() => router.push('/auth/login?redirect=/candidate/applications')} className="w-full">Sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <Link href="/candidate/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to profile
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">My Applications</h1>
        <p className="text-muted-foreground mb-8">Track the status of every role you've applied for.</p>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No applications yet</p>
              <p className="text-sm text-muted-foreground mb-4">Browse open roles and apply to get started.</p>
              <Button asChild><Link href="/careers">View open roles</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Link
                key={app.applicationId}
                href={`/candidate/applications/${app.applicationId}`}
                className="block"
              >
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-semibold truncate">{app.jobTitle || 'Untitled role'}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{app.company}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Ref: {app.applicationId}</span>
                          <span>Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</span>
                          {app.updatedAt && app.updatedAt !== app.appliedAt && (
                            <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CANDIDATE_STATUS_BADGE[app.candidateStatus]}`}>
                          {app.candidateStatusLabel}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
