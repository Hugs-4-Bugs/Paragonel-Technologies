/**
 * POST /api/job-match/continue — event-driven continuation endpoint (Prompt §7).
 *
 * Invoked by the self-HTTP chain (scheduleContinuation via Next.js after()) to
 * drain the next batch of pending job-match events WITHOUT an admin clicking the
 * manual-drain button + WITHOUT cron. Authenticated by an HMAC-signed
 * continuation token (continue-token.ts) — NOT an admin cookie — because the
 * caller is the deployment itself (a post-response after() callback).
 *
 * Flow: verify token → drain next batch (CONTINUE_DRAIN_OPTS) → if more work
 * remains + under the hop cap, scheduleContinuation(hop+1) fires the next hop →
 * respond 200. Each hop is a separate function invocation; the chain is
 * idempotent (atomic claimEvent + claimSendSlot) + bounded (MAX_CONTINUATION_HOPS
 * + token TTL).
 *
 * Auth failure → 401. DB unconfigured → 503. Drain exception → 500. The admin
 * manual-drain (POST /api/admin/jobs/process-match-events) remains as the
 * operational backstop + is unaffected.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { drainPendingJobMatchEvents } from '@/lib/job-alerts/runtime';
import { verifyContinueToken, MAX_CONTINUATION_HOPS } from '@/lib/job-alerts/continue-token';
import { shouldContinueAfter, scheduleContinuation, CONTINUE_DRAIN_OPTS } from '@/lib/job-alerts/continuation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  // Token auth (Bearer <continue-token>). The caller is the deployment's own
  // after() callback — not a user — so a signed token (not a session) gates it.
  const authHeader = request.headers.get('authorization');
  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? verifyContinueToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: 'Service unavailable — database not configured.' },
      { status: 503 },
    );
  }

  let outcomes;
  try {
    outcomes = await drainPendingJobMatchEvents(db, CONTINUE_DRAIN_OPTS);
  } catch (err) {
    console.error(
      '[job-match/continue] drain failed:',
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: 'Drain failed.' }, { status: 500 });
  }

  // Schedule the next hop if more work remains + under the chain-depth cap.
  if (
    shouldContinueAfter(outcomes, CONTINUE_DRAIN_OPTS.maxEventsPerRun) &&
    payload.hop + 1 < MAX_CONTINUATION_HOPS
  ) {
    scheduleContinuation(payload.hop + 1);
  }

  return NextResponse.json({
    processed: outcomes.length,
    hop: payload.hop,
    moreRemain: shouldContinueAfter(outcomes, CONTINUE_DRAIN_OPTS.maxEventsPerRun),
  });
}
