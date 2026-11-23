/**
 * cron-auth.ts — verification for Vercel Cron invocations (Batch 4 Task 4).
 *
 * Vercel Cron sends an `authorization: Bearer <CRON_SECRET>` header on every
 * invocation (CRON_SECRET is provisioned by Vercel for cron jobs). This module
 * verifies that header against process.env.CRON_SECRET using a constant-time
 * comparison, so the cron route (/api/cron/process-match-events) can be invoked
 * ONLY by Vercel Cron — not by an unauthenticated external caller.
 *
 * Extracted as a pure function so the auth logic is unit-testable without the
 * Firebase emulator (the route handler itself needs getAdminDb() for the drain).
 */
import { timingSafeEqual } from 'crypto';

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Verify a cron request's Authorization header against the configured secret.
 * Returns `{ ok: true }` when the header is `Bearer <secret>` (constant-time
 * match); `{ ok: false, status: 503 }` when CRON_SECRET is not configured
 * (honest "not configured" — the cron is a no-op until Vercel provisions it);
 * `{ ok: false, status: 401 }` when the header is missing or wrong.
 */
export function verifyCronSecret(
  authHeader: string | null | undefined,
  secret: string | null | undefined,
): CronAuthResult {
  if (!secret) {
    return { ok: false, status: 503, error: 'CRON_SECRET is not configured.' };
  }
  const expected = `Bearer ${secret}`;
  const provided = authHeader || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length mismatch → reject without timingSafeEqual (which requires equal
  // lengths). The length comparison itself is not timing-sensitive for a
  // random server-side secret.
  if (a.length !== b.length) {
    return { ok: false, status: 401, error: 'Unauthorized.' };
  }
  if (timingSafeEqual(a, b)) {
    return { ok: true };
  }
  return { ok: false, status: 401, error: 'Unauthorized.' };
}
