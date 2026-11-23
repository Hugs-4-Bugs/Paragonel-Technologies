/**
 * GET /api/admin/jobs/alert-status — admin visibility into job-match alert
 * processing (Batch 2 Task 3).
 *
 * Returns a sanitized snapshot of the `jobMatchEvents` + `jobAlertsSent`
 * collections: event counts by status, the stuck set (events in 'processing'
 * past the stuck timeout), the most-recent failures (redacted), and alert
 * outcome counts. NO candidate PII is exposed — no emails, no dedup keys, no
 * per-candidate scores or resume paths (see src/lib/job-alerts/status.ts).
 *
 * Read-only + RBAC-gated (`cms.read`); does not trigger a drain (the existing
 * POST /api/admin/jobs/process-match-events route does that).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, serviceUnavailable } from '@/lib/admin-auth';
import { JOB_MATCH_EVENTS_COLLECTION, JOB_ALERTS_SENT_COLLECTION } from '@/lib/job-alerts/dedup';
import { summarizeAlertStatus } from '@/lib/job-alerts/status';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_EVENTS = 200;
const MAX_ALERTS = 500;

export async function GET(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.read');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const [eventSnap, alertSnap] = await Promise.all([
      db.collection(JOB_MATCH_EVENTS_COLLECTION).limit(MAX_EVENTS).get(),
      db.collection(JOB_ALERTS_SENT_COLLECTION).limit(MAX_ALERTS).get(),
    ]);

    const events = eventSnap.docs.map((d) => ({
      id: d.id,
      data: () => d.data() as Record<string, unknown>,
    }));
    const alerts = alertSnap.docs.map((d) => ({
      data: () => d.data() as Record<string, unknown>,
    }));

    const summary = summarizeAlertStatus(events, alerts);
    return NextResponse.json(summary);
  } catch (err) {
    console.error(
      '[alert-status] load failed:',
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: 'Could not load alert status.' }, { status: 500 });
  }
}
