/**
 * GET /api/cron/process-match-events — automated drain of pending job-match
 * events (Batch 4 Task 4).
 *
 * The existing POST /api/admin/jobs/process-match-events drains pending events
 * but is RBAC-gated (admin cookie) — so it can only be invoked manually by an
 * admin. Without an automated trigger, candidate job-match alerts are never sent
 * unless an admin manually POSTs. This cron route is the automated trigger:
 * Vercel Cron invokes it on a schedule (see vercel.json `crons`) with an
 * `authorization: Bearer <CRON_SECRET>` header.
 *
 * Auth: CRON_SECRET (NOT an admin cookie) — verified by verifyCronSecret. This
 * is a GET (Vercel Cron default) so the middleware CSRF/origin check (which
 * only applies to state-changing methods) exempts it. The drain itself reuses
 * the SAME idempotent drainPendingJobMatchEvents() the admin route uses, so
 * retries are safe (jobAlertsSent dedup guards each candidate/job/version).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { drainPendingJobMatchEvents } from '@/lib/job-alerts/runtime';
import { verifyCronSecret } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = verifyCronSecret(
    request.headers.get('authorization'),
    process.env.CRON_SECRET,
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: 'Service unavailable — Firebase Admin not configured.' },
      { status: 503 },
    );
  }

  try {
    const outcomes = await drainPendingJobMatchEvents(db, {});
    return NextResponse.json({ processed: outcomes.length, outcomes });
  } catch (err) {
    console.error(
      '[cron/process-match-events] failed:',
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: 'Failed to drain match events.' },
      { status: 500 },
    );
  }
}
