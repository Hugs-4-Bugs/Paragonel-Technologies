"use client";

/**
 * /admin/alerts — Job-Match Alert Status (Batch 4 Task 1).
 *
 * The `/api/admin/jobs/alert-status` endpoint (RBAC-gated, `cms.read`) was built
 * in Batch 2 but had NO admin UI consumer. This page is that consumer: a
 * read-only snapshot of the job-match alert pipeline (event counts by status,
 * the stuck set, recent redacted failures, alert outcome counts) + a "Drain
 * pending events" action that POSTs the existing
 * `/api/admin/jobs/process-match-events` endpoint (RBAC `jobs.manage`).
 *
 * No candidate PII is shown — the API already redacts (no emails, no dedup keys,
 * no resume paths). Modelled on /admin/activity (the read-only logs template).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BellRing, AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Summary = {
  events: {
    byStatus: Record<string, number>;
    total: number;
    stuck: { eventId: string; jobId: string; claimedAt: string | null; attempts: number }[];
    recentFailures: { eventId: string; jobId: string; lastError: string; attempts: number }[];
  };
  alerts: { byStatus: Record<string, number>; total: number };
  generatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  processed: 'Processed',
  cancelled: 'Cancelled',
  sent: 'Sent',
  skipped: 'Skipped',
  failed: 'Failed',
};

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'processed' || status === 'sent'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : status === 'processing' || status === 'pending'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        : status === 'failed'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tone}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function JobAlertsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draining, setDraining] = useState(false);
  const { toast } = useToast();

  // Global matching-threshold floor (admin-configurable, super_admin-writable).
  const [thresholdSetting, setThresholdSetting] = useState<{
    minimum_matching_percentage: number;
    min: number;
    max: number;
    default: number;
    canEdit: boolean;
  } | null>(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  const loadThreshold = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/jobs/matching-threshold', { cache: 'no-store' });
      if (!res.ok) return;
      const d = (await res.json()) as {
        minimum_matching_percentage: number;
        min: number;
        max: number;
        default: number;
        canEdit: boolean;
      };
      setThresholdSetting(d);
      setThresholdInput(String(d.minimum_matching_percentage));
    } catch {
      // non-fatal — the rest of the page still loads
    }
  }, []);

  useEffect(() => {
    loadThreshold();
  }, [loadThreshold]);

  const saveThreshold = useCallback(async () => {
    const n = Math.round(Number(thresholdInput));
    if (!Number.isFinite(n)) return;
    setSavingThreshold(true);
    try {
      const res = await fetch('/api/admin/jobs/matching-threshold', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ minimum_matching_percentage: n }),
      });
      const d = await res.json().catch(() => ({} as { minimum_matching_percentage?: number; error?: string }));
      if (!res.ok) {
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const value = d.minimum_matching_percentage ?? n;
      setThresholdSetting((prev) =>
        prev ? { ...prev, minimum_matching_percentage: value } : prev,
      );
      setThresholdInput(String(value));
      toast({
        title: 'Threshold updated',
        description: `Global matching floor set to ${value}%.`,
      });
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Could not update the threshold.',
        variant: 'destructive',
      });
    } finally {
      setSavingThreshold(false);
    }
  }, [thresholdInput, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/jobs/alert-status', { cache: 'no-store' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as Summary;
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load alert status.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const drain = useCallback(async () => {
    setDraining(true);
    try {
      const res = await fetch('/api/admin/jobs/process-match-events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      toast({
        title: 'Drain complete',
        description: `Processed ${d.processed ?? 0} pending event(s).`,
      });
      load();
    } catch (e) {
      toast({
        title: 'Drain failed',
        description: e instanceof Error ? e.message : 'Could not drain pending events.',
        variant: 'destructive',
      });
    } finally {
      setDraining(false);
    }
  }, [load, toast]);

  const eventStatuses = summary ? Object.keys(summary.events.byStatus) : [];
  const alertStatuses = summary ? Object.keys(summary.alerts.byStatus) : [];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <BellRing className="h-8 w-8 text-primary" />
          Job-Match Alert Status
        </h1>
        <p className="text-zinc-500">
          Read-only snapshot of the job-match alert pipeline. Drain pending events with the action below.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={drain} disabled={draining || loading} variant="default">
          {draining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          {draining ? 'Draining…' : 'Drain pending events'}
        </Button>
        <Button onClick={load} disabled={loading || draining} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        {summary && (
          <span className="text-xs text-zinc-400 ml-auto">
            Generated {new Date(summary.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {thresholdSetting && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500 flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" /> Global matching threshold (floor)
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Candidates below this floor never receive automatic job-match alerts. Default {thresholdSetting.default}%; range {thresholdSetting.min}–{thresholdSetting.max}%.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={thresholdSetting.min}
                max={thresholdSetting.max}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                disabled={!thresholdSetting.canEdit || savingThreshold}
                className="w-20 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
              />
              <Button
                onClick={saveThreshold}
                disabled={!thresholdSetting.canEdit || savingThreshold}
                variant="default"
              >
                {savingThreshold ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6 flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Event counts by status */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Match events ({summary.events.total})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {eventStatuses.length > 0 ? (
                eventStatuses.map((s) => (
                  <Card key={s} className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        {s === 'processed' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : s === 'processing' ? <Loader2 className="h-5 w-5 text-amber-600" /> : s === 'failed' ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <div className="text-2xl font-black">{summary.events.byStatus[s]}</div>
                        <div className="text-xs text-zinc-500 font-medium">{STATUS_LABELS[s] ?? s}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-zinc-400 italic text-sm col-span-full">No match events recorded.</div>
              )}
            </div>
          </div>

          {/* Stuck events */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
            <CardContent className="p-0">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Stuck events ({summary.events.stuck.length})
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Events in &lsquo;processing&rsquo; past the stuck timeout.</p>
              </div>
              {summary.events.stuck.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {summary.events.stuck.map((e) => (
                    <div key={e.eventId} className="p-6 flex items-start gap-4 text-sm">
                      <StatusPill status="processing" />
                      <div className="flex-1 space-y-1">
                        <div className="font-mono text-xs text-zinc-500">event {e.eventId}</div>
                        <div className="font-mono text-xs text-zinc-500">job {e.jobId}</div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> claimed {e.claimedAt ? new Date(e.claimedAt).toLocaleString() : 'unknown'} · attempts {e.attempts}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-400 italic text-sm">No stuck events.</div>
              )}
            </CardContent>
          </Card>

          {/* Recent failures */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
            <CardContent className="p-0">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Recent failures ({summary.events.recentFailures.length})
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Redacted — no candidate PII is exposed.</p>
              </div>
              {summary.events.recentFailures.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {summary.events.recentFailures.map((f) => (
                    <div key={f.eventId} className="p-6 flex items-start gap-4 text-sm">
                      <StatusPill status="failed" />
                      <div className="flex-1 space-y-1">
                        <div className="font-mono text-xs text-zinc-500">event {f.eventId} · job {f.jobId} · attempts {f.attempts}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-300 font-mono break-all">{f.lastError}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-400 italic text-sm">No recent failures.</div>
              )}
            </CardContent>
          </Card>

          {/* Alert outcomes */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Alert outcomes ({summary.alerts.total})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {alertStatuses.length > 0 ? (
                alertStatuses.map((s) => (
                  <Card key={s} className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        {s === 'sent' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : s === 'failed' ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <div className="text-2xl font-black">{summary.alerts.byStatus[s]}</div>
                        <div className="text-xs text-zinc-500 font-medium">{STATUS_LABELS[s] ?? s}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-zinc-400 italic text-sm col-span-full">No alerts sent yet.</div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
