/**
 * POST /api/admin/jobs/process-match-events — drain pending job-match events
 * (Prompt 05R §7).
 *
 * A genuine publish already enqueues + bounded-drains its own event inline; this
 * endpoint drains any REMAINING pending events (e.g. a publish-time drain that
 * hit the per-run alert cap, or a failed drain that left an event pending). It
 * is idempotent + bounded (maxEventsPerRun default 5), so an admin can call it
 * repeatedly without duplicate deliveries (jobAlertsSent dedup guards each
 * candidate/job/version).
 *
 * Auth: `jobs.manage` (admin + super_admin only).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, serviceUnavailable } from '@/lib/admin-auth';
import { drainPendingJobMatchEvents } from '@/lib/job-alerts/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'jobs.manage');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const opts: { candidateBatchSize?: number; maxAlertsPerRun?: number; maxEventsPerRun?: number } = {};
  if (body.candidateBatchSize && typeof body.candidateBatchSize === 'number') opts.candidateBatchSize = body.candidateBatchSize;
  if (body.maxAlertsPerRun && typeof body.maxAlertsPerRun === 'number') opts.maxAlertsPerRun = body.maxAlertsPerRun;
  if (body.maxEventsPerRun && typeof body.maxEventsPerRun === 'number') opts.maxEventsPerRun = body.maxEventsPerRun;

  try {
    const outcomes = await drainPendingJobMatchEvents(db, opts);
    return NextResponse.json({ processed: outcomes.length, outcomes });
  } catch (err) {
    console.error('[admin/jobs/process-match-events] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to drain match events' }, { status: 500 });
  }
}
