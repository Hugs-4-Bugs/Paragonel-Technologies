/**
 * continuation.ts — event-driven job-match continuation (Prompt §7).
 *
 * Replaces the removed Vercel Cron with a self-HTTP continuation chain using
 * Next.js `after()` (next/server, free, no @vercel/functions, no paid scheduler).
 *
 * Mechanism:
 *   1. The inline publish drain (enqueueAndProcessJobEvent) processes the first
 *      batch. If the event is partial (send cap hit) or pending, scheduleContinuation(0)
 *      fires a POST /api/job-match/continue via after() — AFTER the publish
 *      response is flushed, so the admin is not blocked.
 *   2. /api/job-match/continue drains the next batch (CONTINUE_DRAIN_OPTS) +,
 *      if more work remains, calls scheduleContinuation(hop+1) — firing the next
 *      hop. Each hop is a SEPARATE function invocation with its own maxDuration;
 *      the chain progresses across functions.
 *   3. Bounded by MAX_CONTINUATION_HOPS (20) + the token TTL (10 min) — no
 *      infinite loops. Idempotent: claimEvent + claimSendSlot make redundant
 *      hops safe (no duplicate emails).
 *
 * Batch-15 stabilization:
 *   - CONTINUE_DRAIN_OPTS shrunk (maxAlertsPerRun 20→10, maxEventsPerRun 5→2) so
 *     the worst-case per-hop send count (2×10 = 20 sequential SMTP sends ≈ 20s)
 *     fits inside the continue route's maxDuration=60 (Pro). The original 5×20 =
 *     100 sends/hop could exceed even 60s on a slow transport + sever the chain
 *     mid-drain, stranding the in-flight event in 'processing' with no auto-recover.
 *   - shouldContinueAfter now requires `didRealWork` on the cap-hit branch, so a
 *     batch of all-in-flight ('processing') events does not spin uselessly.
 *   - scheduleContinuation warns once when APP_BASE_URL is unset (the chain was
 *     silently disabled otherwise) + redacts fetch-error reasons.
 *
 * Limitation (Prompt §7.3, reported honestly): reliable continuation requires
 * APP_BASE_URL (the deployment URL) to be configured, because after() runs
 * post-response without access to the request object. If APP_BASE_URL is unset
 * or localhost, scheduleContinuation is a no-op — the admin manual-drain
 * (/admin/alerts → Drain pending events) remains the documented backstop. This
 * is the safest supported solution that does not introduce cron or paid infra;
 * it is NOT a fire-and-forget promise (after() guarantees the callback runs
 * within the function's extended lifetime on Vercel, not a detached process).
 */
import { after } from 'next/server';
import { signContinueToken, MAX_CONTINUATION_HOPS } from './continue-token';
import { redactReason } from './dedup';
import type { ProcessOutcome } from './process';

/**
 * Loose bounds for a background continuation drain. Shrunk in Batch 15 so the
 * worst-case per-hop send count (maxEventsPerRun × maxAlertsPerRun = 2 × 10 =
 * 20 sequential SMTP sends ≈ 20s) fits inside the continue route's maxDuration=60
 * (Pro). The original 5 × 20 = 100 sends/hop could exceed even 60s on a slow
 * transport, severing the chain mid-drain + stranding the in-flight event.
 */
export const CONTINUE_DRAIN_OPTS = {
  candidateBatchSize: 25,
  maxAlertsPerRun: 10,
  maxEventsPerRun: 2,
};

/**
 * Pure: should a continuation be scheduled after these drain outcomes?
 *   - any partial event (send cap hit, cursor persisted) → yes.
 *   - any pending event → yes.
 *   - drained the maxEventsPerRun cap AND real work was done (avoids a bounded-
 *     but-wasteful spin when every drained event is already in-flight under a
 *     parallel/replayed token — all 'processing', no sends/evals) → yes.
 *   - empty or all processed + below cap → no.
 */
export function shouldContinueAfter(
  outcomes: ProcessOutcome[],
  maxEventsPerRun: number,
): boolean {
  if (outcomes.length === 0) return false;
  if (outcomes.some((o) => o.partial || o.status === 'pending')) return true;
  const didRealWork = outcomes.some(
    (o) => o.alertsSent > 0 || o.candidatesEvaluated > 0,
  );
  return didRealWork && outcomes.length >= maxEventsPerRun;
}

let warnedNoBaseUrl = false;

/**
 * Schedule a background continuation hop (POST /api/job-match/continue) via
 * Next.js after(). Requires APP_BASE_URL (a real https deployment URL). No-op
 * (returns silently) when APP_BASE_URL is unset/localhost, when the hop is at/over
 * the cap, or when no signing secret is configured — in all those cases the
 * admin manual-drain remains the backstop. Warns once on the no-APP_BASE_URL
 * branch so operators can tell the chain is disabled.
 */
export function scheduleContinuation(hop: number): void {
  if (hop >= MAX_CONTINUATION_HOPS) return;
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl || !/^https?:\/\//.test(baseUrl) || baseUrl.includes('localhost')) {
    if (!warnedNoBaseUrl) {
      warnedNoBaseUrl = true;
      console.warn(
        '[job-alerts] continuation chain disabled: APP_BASE_URL is not configured (or is localhost). ' +
          'Pending job-match events will require the admin manual-drain (/admin/alerts) until it is set.',
      );
    }
    return; // no deployment URL — admin manual-drain is the backstop
  }
  const token = signContinueToken({ iat: Date.now(), hop });
  if (!token) return; // no secret configured — admin manual-drain is the backstop
  try {
    if (typeof after !== 'function') return;
    after(async () => {
      try {
        await fetch(`${baseUrl}/api/job-match/continue`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(
          '[job-alerts] continuation hop',
          hop,
          'failed:',
          redactReason(err),
        );
      }
    });
  } catch {
    // after() not available in this context (e.g. tests / non-request scope) — non-fatal
  }
}
