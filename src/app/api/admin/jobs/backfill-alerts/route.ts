/**
 * POST /api/admin/jobs/backfill-alerts — bounded backfill for ONE candidate
 * (Prompt 05R §10).
 *
 * Policy (documented): backfill is OFF by default. A newly opted-in candidate is
 * NOT automatically flooded with historical alerts. An admin may explicitly
 * trigger a backfill for a single candidate, which evaluates that candidate
 * against CURRENTLY PUBLISHED jobs only (bounded, deduped — never re-sends an
 * already-delivered alert). Respects the candidate's opt-in: an opted-out
 * candidate is not backfilled.
 *
 * Body: { candidateEmail: string }
 * Auth: `jobs.manage` (admin + super_admin only).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, serviceUnavailable } from '@/lib/admin-auth';
import { backfillCandidateAlerts } from '@/lib/job-alerts/runtime';

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
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const email = typeof body.candidateEmail === 'string' ? body.candidateEmail.trim().toLowerCase() : '';
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid candidateEmail is required' }, { status: 400 });
  }

  try {
    const outcome = await backfillCandidateAlerts(db, email);
    return NextResponse.json({ outcome });
  } catch (err) {
    console.error('[admin/jobs/backfill-alerts] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 });
  }
}
