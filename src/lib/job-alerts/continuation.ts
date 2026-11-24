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
import type { ProcessOutcome } from './process';

/** Loose bounds for a background continuation drain (full DEFAULTS, not the tight publish bounds). */
export const CONTINUE_DRAIN_OPTS = {
  candidateBatchSize: 50,
  maxAlertsPerRun: 20,
  maxEventsPerRun: 5,
};

/**
 * Pure: should a continuation be scheduled after these drain outcomes?
 *   - any partial event (send cap hit, cursor persisted) → yes.
 *   - any pending event → yes.
 *   - drained the maxEventsPerRun cap (more events likely pending) → yes.
 *   - empty or all processed + below cap → no.
 */
export function shouldContinueAfter(
  outcomes: ProcessOutcome[],
  maxEventsPerRun: number,
): boolean {
  if (outcomes.length === 0) return false;
  if (outcomes.some((o) => o.partial || o.status === 'pending')) return true;
  return outcomes.length >= maxEventsPerRun;
}

/**
 * Schedule a background continuation hop (POST /api/job-match/continue) via
 * Next.js after(). Requires APP_BASE_URL (a real https deployment URL). No-op
 * (returns silently) when APP_BASE_URL is unset/localhost, when the hop is at/over
 * the cap, or when no signing secret is configured — in all those cases the
 * admin manual-drain remains the backstop.
 */
export function scheduleContinuation(hop: number): void {
  if (hop >= MAX_CONTINUATION_HOPS) return;
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl || !/^https?:\/\//.test(baseUrl) || baseUrl.includes('localhost')) {
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
          '[job-alerts] continuation hop', hop, 'failed:',
          err instanceof Error ? err.message : err,
        );
      }
    });
  } catch {
    // after() not available in this context (e.g. tests / non-request scope) — non-fatal
  }
}
