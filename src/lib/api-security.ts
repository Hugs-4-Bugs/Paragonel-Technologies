/**
 * api-security.ts — pure, edge-runtime-safe helpers for API request security.
 *
 * Imported by `src/middleware.ts` (which runs on the Edge runtime) so every
 * function here MUST stay free of Node-only APIs (no `fs`, `crypto`, no
 * `firebase-admin`, no `zod`). They take a `method` + `Headers` and return a
 * plain result; the caller builds the HTTP response.
 *
 * Coverage:
 *   - `checkSameOrigin` — CSRF / cross-origin protection for state-changing
 *     requests. Allows same-origin / same-site / none (Sec-Fetch-Site) OR an
 *     Origin/Referer whose host equals the request Host. Blocks cross-site,
 *     mismatched, and origin-less state-changing requests. Read-only GET/HEAD/
 *     OPTIONS requests are not checked (public GET endpoints like /api/health
 *     and the token-unsubscribe links are unaffected).
 *   - `checkBodySize` — coarse Content-Length guard so an obviously-huge
 *     payload is rejected before the route handler parses it. Routes still
 *     enforce their own per-field limits (e.g. resume upload 5 MB).
 *
 * LIMITATION: this is request-level hygiene, not a distributed rate limiter.
 * The in-memory rate limiter in `src/lib/auth/rate-limit.ts` is per-process
 * only — on Vercel serverless each invocation may be a fresh instance, so it
 * does not provide cross-request protection at production scale. A Firestore-
 * or Upstash-backed limiter is the documented follow-up.
 */
export interface SecurityCheckResult {
  ok: boolean;
  reason?:
    | 'cross-site'
    | 'origin-mismatch'
    | 'referer-mismatch'
    | 'missing-origin'
    | 'missing-host'
    | 'too-large'
    | 'invalid-content-length';
}

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Is this an HTTP method that can mutate server state? */
export function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}

/** Coarse upper bound on any single API request body (10 MB). */
export const MAX_API_BODY_BYTES = 10 * 1024 * 1024;

function hostEquals(url: string, host: string): boolean {
  try {
    return new URL(url).host === host;
  } catch {
    return false;
  }
}

/**
 * CSRF / cross-origin protection for state-changing requests.
 *
 * Decision order:
 *   1. Non-state-changing method → allow (no CSRF surface).
 *   2. `Sec-Fetch-Site` present → allow `same-origin`/`same-site`/`none`,
 *      block `cross-site`. (Modern browsers always send this on fetch/XHR.)
 *   3. `Origin` present → allow iff its host equals the request `Host`.
 *   4. `Referer` present → allow iff its host equals the request `Host`.
 *   5. None of the above on a state-changing request → block (no origin signal
 *      to attest same-origin intent).
 *
 * Same-origin legitimate app requests always carry one of these signals. This
 * deliberately does NOT introduce a blanket bypass; every branch either
 * attests same-origin or rejects.
 */
export function checkSameOrigin(method: string, headers: Headers): SecurityCheckResult {
  if (!isStateChangingMethod(method)) return { ok: true };

  const secFetchSite = (headers.get('sec-fetch-site') || '').toLowerCase();
  if (secFetchSite) {
    if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
      return { ok: true };
    }
    return { ok: false, reason: 'cross-site' };
  }

  const host = headers.get('host');
  if (!host) return { ok: false, reason: 'missing-host' };

  const origin = headers.get('origin');
  if (origin) {
    return hostEquals(origin, host) ? { ok: true } : { ok: false, reason: 'origin-mismatch' };
  }

  const referer = headers.get('referer');
  if (referer) {
    return hostEquals(referer, host) ? { ok: true } : { ok: false, reason: 'referer-mismatch' };
  }

  return { ok: false, reason: 'missing-origin' };
}

/**
 * Coarse body-size guard via the Content-Length header. A missing
 * Content-Length (chunked transfer-encoding) is allowed through so the route
 * handler + Next.js body parsing still handle it; routes enforce their own
 * per-field limits (e.g. resume upload 5 MB) regardless.
 */
export function checkBodySize(headers: Headers): SecurityCheckResult {
  const cl = headers.get('content-length');
  if (!cl) return { ok: true };
  const n = Number(cl);
  if (!Number.isFinite(n) || n < 0) return { ok: false, reason: 'invalid-content-length' };
  if (n > MAX_API_BODY_BYTES) return { ok: false, reason: 'too-large' };
  return { ok: true };
}
