/**
 * rate-limit.ts — in-memory windowed rate limiter + temporary lockout.
 *
 * Used for OTP request, OTP verify, and login (per email AND per IP). On a
 * lockout threshold being hit, a `lockout` security event is logged.
 *
 * IN-MEMORY ONLY. This is correct for a single-instance deployment (Vercel
 * serverless functions are stateless per-invocation, so for true production
 * scale a Firestore- or Upstash-backed limiter is the documented follow-up;
 * see docs/AUTH_IMPLEMENTATION_PLAN.md §7). The primitive here is the
 * contract the routes depend on.
 *
 * The limiter is intentionally simple and conservative. It returns a structured
 * result so callers can return precise HTTP 429 + Retry-After headers and avoid
 * account enumeration (identical responses for existing/non-existing emails).
 */
import { logSecurityEvent } from './security-events';

export interface RateLimitConfig {
  /** max events allowed within the window before the counter trips. */
  max: number;
  /** window length in seconds. */
  windowSeconds: number;
  /** failed-attempt threshold that triggers a temporary lockout. */
  lockoutThreshold: number;
  /** lockout duration in seconds once the threshold is hit. */
  lockoutSeconds: number;
}

type Bucket = { count: number; windowStart: number; failures: number; lockedUntil: number };

const store = new Map<string, Bucket>();

/** Default policies (tuned for human use; strong against brute force). */
export const POLICIES = {
  otpRequest: { max: 5, windowSeconds: 300, lockoutThreshold: 10, lockoutSeconds: 900 },
  otpVerify: { max: 10, windowSeconds: 300, lockoutThreshold: 5, lockoutSeconds: 900 },
  login: { max: 10, windowSeconds: 300, lockoutThreshold: 10, lockoutSeconds: 900 },
  bootstrap: { max: 3, windowSeconds: 3600, lockoutThreshold: 5, lockoutSeconds: 3600 },
  // Account / invitation mutations: admin create+invite, invite acceptance,
  // suspend/reactivate/revoke-sessions. Tight per-IP + per-actor budget so a
  // compromised admin account or a public invite-flooder cannot mass-create or
  // mass-replay invitations. See docs/AUTH_IMPLEMENTATION_PLAN.md §7 for the
  // documented distributed-limiter follow-up (this is in-memory only).
  accountMutation: { max: 10, windowSeconds: 600, lockoutThreshold: 15, lockoutSeconds: 1800 },
} satisfies Record<string, RateLimitConfig>;

export interface RateLimitResult {
  ok: boolean;
  /** seconds until the caller may retry (when locked / over limit). */
  retryAfter: number;
  reason: 'allowed' | 'rate_limited' | 'locked';
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check a key against a policy. Call on every attempt. Does NOT increment
 * failures automatically for `ok` results (only the window counter); callers
 * record a *failure* explicitly via `recordFailure` so successful verifications
 * don't burn the budget.
 */
export async function checkRateLimit(
  key: string,
  cfg: RateLimitConfig,
  opts?: { email?: string; ip?: string }
): Promise<RateLimitResult> {
  const t = now();
  let b = store.get(key);
  if (!b) {
    b = { count: 0, windowStart: t, failures: 0, lockedUntil: 0 };
    store.set(key, b);
  }
  // Lockout active?
  if (b.lockedUntil > t) {
    return { ok: false, retryAfter: b.lockedUntil - t, reason: 'locked' };
  }
  // Reset window if expired.
  if (t - b.windowStart > cfg.windowSeconds) {
    b.count = 0;
    b.windowStart = t;
    b.failures = 0;
  }
  if (b.count >= cfg.max) {
    return { ok: false, retryAfter: b.windowStart + cfg.windowSeconds - t, reason: 'rate_limited' };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0, reason: 'allowed' };
}

/** Record a failed attempt; trips the lockout when the threshold is reached. */
export async function recordFailure(
  key: string,
  cfg: RateLimitConfig,
  opts?: { email?: string; ip?: string; event?: string }
): Promise<void> {
  const t = now();
  let b = store.get(key);
  if (!b) {
    // Create the bucket if a failure is recorded before any checkRateLimit call.
    b = { count: 0, windowStart: t, failures: 0, lockedUntil: 0 };
    store.set(key, b);
  }
  b.failures += 1;
  if (b.failures >= cfg.lockoutThreshold) {
    b.lockedUntil = t + cfg.lockoutSeconds;
    await logSecurityEvent({
      type: 'lockout',
      email: opts?.email,
      ip: opts?.ip,
      detail: `key=${key} failures=${b.failures} event=${opts?.event ?? 'auth'}`,
    });
  }
}

/** Compose a per-email and per-IP key pair for an action. */
export function rateKeys(prefix: string, email: string | undefined, ip: string | undefined) {
  const e = email ? `${prefix}:email:${email.toLowerCase()}` : null;
  const i = ip ? `${prefix}:ip:${ip}` : null;
  return { emailKey: e, ipKey: i };
}

/** Require BOTH the email and IP checks to pass; return the first failure. */
export async function checkBoth(
  prefix: string,
  cfg: RateLimitConfig,
  email: string | undefined,
  ip: string | undefined
): Promise<RateLimitResult> {
  const { emailKey, ipKey } = rateKeys(prefix, email, ip);
  if (emailKey) {
    const r = await checkRateLimit(emailKey, cfg, { email, ip });
    if (!r.ok) return r;
  }
  if (ipKey) {
    const r = await checkRateLimit(ipKey, cfg, { email, ip });
    if (!r.ok) return r;
  }
  return { ok: true, retryAfter: 0, reason: 'allowed' };
}

/** Clear a key's failure budget after a SUCCESS (so a genuine user isn't punished). */
export function clearFailures(prefix: string, email?: string, ip?: string): void {
  const { emailKey, ipKey } = rateKeys(prefix, email, ip);
  if (emailKey) {
    const b = store.get(emailKey);
    if (b) { b.failures = 0; b.count = 0; b.lockedUntil = 0; }
  }
  if (ipKey) {
    const b = store.get(ipKey);
    if (b) { b.failures = 0; b.count = 0; b.lockedUntil = 0; }
  }
}

/** Test helper: reset all state. */
export function _resetRateLimiterForTests(): void {
  store.clear();
}
