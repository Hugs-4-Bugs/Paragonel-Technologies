/**
 * otp.ts — SMTP OTP issuance + verification (Part E security core).
 *
 * Security properties enforced here:
 *   - CSPRNG 6-digit code (crypto-utils.randomOtpCode).
 *   - Only a bcrypt HASH of the code is stored in `otpRequests/{id}`. The
 *     plaintext code is returned to the ROUTE (which emails it) and never
 *     persisted, logged, or returned to the client.
 *   - The `otpRequestId` handed to the client is an HMAC-signed token
 *     embedding {id, purpose, exp} (OTP_SECRET). The client cannot forge or
 *     tamper with an id; it can only pass the signed token back.
 *   - Short TTL (default 10 min), single-use (consumedAt), attempt budget
 *     (5 wrong → request voided), older unconsumed OTPs for the same
 *     email+purpose are superseded when a new one is issued.
 *   - Resend cooldown (default 60 s) enforced before a new code is issued.
 *   - Per-email + per-IP rate limiting + lockout via rate-limit.ts.
 *   - No account enumeration: identical responses whether or not the email
 *     exists (the route decides if a code is actually emailed).
 *
 * Env: OTP_SECRET (>= 32 chars). Missing/weak → fail closed.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { randomOtpCode, randomHex, signToken, verifySignedToken, hashIp } from './crypto-utils';
import { hashPassword } from './password';
import { POLICIES, checkRateLimit, checkBoth, recordFailure, clearFailures, rateKeys } from './rate-limit';
import { logSecurityEvent } from './security-events';

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // min 60s between codes for same email+purpose
const MAX_ATTEMPTS = 5;

export type OtpPurpose =
  | 'register'
  | 'password_reset'
  | 'admin_login'
  | 'bootstrap';

/** Read + validate the OTP secret. Null → callers fail closed. */
export function getOtpSecret(): string | null {
  const s = process.env.OTP_SECRET;
  if (!s || s.length < 32) return null;
  return s;
}

export interface OtpIssueInput {
  email: string;
  purpose: OtpPurpose;
  ip?: string;
}

export interface OtpIssueResult {
  ok: boolean;
  /** The signed token the client passes back to /verify. */
  otpRequestId?: string;
  /** The plaintext code — ONLY for the route to email. NEVER returned to client. */
  code?: string;
  /** Reason for failure (route maps to a uniform message). */
  reason?: 'rate_limited' | 'cooldown' | 'misconfigured' | 'unavailable';
  retryAfter?: number;
}

/**
 * Issue an OTP. The route is responsible for actually emailing `code` and for
 * deciding whether to email at all (e.g. if the account doesn't exist, the
 * route returns the SAME success shape WITHOUT emailing — no enumeration).
 */
export async function issueOtp(input: OtpIssueInput): Promise<OtpIssueResult> {
  const secret = getOtpSecret();
  if (!secret) return { ok: false, reason: 'misconfigured' };
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  const email = input.email.toLowerCase().trim();
  const { emailKey, ipKey } = rateKeys(`otpReq:${input.purpose}`, email, input.ip);

  // Rate limit (email + IP).
  const rl = await checkBoth(`otpReq:${input.purpose}`, POLICIES.otpRequest, email, input.ip);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'rate_limited', email, ip: input.ip, detail: `otp issue ${input.purpose}` });
    return { ok: false, reason: 'rate_limited', retryAfter: rl.retryAfter };
  }

  // Resend cooldown: query the most recent unconsumed OTP for email+purpose.
  try {
    const recent = await db
      .collection('otpRequests')
      .where('email', '==', email)
      .where('purpose', '==', input.purpose)
      .where('consumedAt', '==', null)
      .orderBy('issuedAt', 'desc')
      .limit(1)
      .get();
    if (!recent.empty) {
      const last = recent.docs[0].data() as { issuedAt: Timestamp };
      const lastSec = last.issuedAt?.toMillis?.() ? Math.floor(last.issuedAt.toMillis() / 1000) : 0;
      const elapsed = Math.floor(Date.now() / 1000) - lastSec;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        return { ok: false, reason: 'cooldown', retryAfter: RESEND_COOLDOWN_SECONDS - elapsed };
      }
    }
  } catch (e) {
    // Index missing or emulator quirk — fall through (cooldown is best-effort).
    console.warn('[otp] cooldown query failed:', e instanceof Error ? e.message : e);
  }

  // Supersede older unconsumed OTPs for this email+purpose (invalidate them).
  try {
    const old = await db
      .collection('otpRequests')
      .where('email', '==', email)
      .where('purpose', '==', input.purpose)
      .where('consumedAt', '==', null)
      .get();
    const batch = db.batch();
    old.docs.forEach((d) => batch.update(d.ref, { superseded: true }));
    await batch.commit();
  } catch (e) {
    console.warn('[otp] supersede failed:', e instanceof Error ? e.message : e);
  }

  // Generate + persist.
  const code = randomOtpCode(6);
  const codeHash = await hashPassword(code);
  const id = randomHex(16);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + OTP_TTL_SECONDS * 1000;

  await db.collection('otpRequests').doc(id).set({
    email,
    purpose: input.purpose,
    codeHash,
    ipHash: input.ip ? hashIp(input.ip) : null,
    issuedAt: Timestamp.fromMillis(issuedAt),
    expiresAt: Timestamp.fromMillis(expiresAt),
    consumedAt: null,
    attemptCount: 0,
    superseded: false,
  });

  await logSecurityEvent({ type: 'otp_issued', email, ip: input.ip, detail: input.purpose });

  // Signed request token (client-facing). Embeds id + purpose + exp.
  const payload = JSON.stringify({ id, purpose: input.purpose, exp: Math.floor(expiresAt / 1000) });
  const otpRequestId = signToken(payload, secret);
  return { ok: true, otpRequestId, code };
}

export interface OtpVerifyInput {
  otpRequestId: string;
  code: string;
  ip?: string;
}

export interface OtpVerifyResult {
  ok: boolean;
  email?: string;
  purpose?: OtpPurpose;
  reason?: 'invalid_token' | 'expired' | 'not_found' | 'consumed' | 'superseded' | 'wrong_code' | 'rate_limited' | 'misconfigured' | 'unavailable';
  /** A signed, short-lived token proving the email was verified for `purpose`.
   *  The next step (set password / issue session / complete bootstrap) consumes it. */
  verificationToken?: string;
  retryAfter?: number;
}

/** Verify an OTP. Single-use: on success the record is marked consumed. */
export async function verifyOtp(input: OtpVerifyInput): Promise<OtpVerifyResult> {
  const secret = getOtpSecret();
  if (!secret) return { ok: false, reason: 'misconfigured' };
  if (!input.otpRequestId || !input.code) return { ok: false, reason: 'invalid_token' };
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  const payload = verifySignedToken(input.otpRequestId, secret);
  if (!payload) return { ok: false, reason: 'invalid_token' };
  let parsed: { id: string; purpose: OtpPurpose; exp: number };
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }
  if (parsed.exp < Math.floor(Date.now() / 1000)) return { ok: false, reason: 'expired' };

  // Rate limit verify attempts per request id + IP.
  const rl = await checkBoth(`otpVer:${parsed.id}`, POLICIES.otpVerify, undefined, input.ip);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'rate_limited', ip: input.ip, detail: `otp verify ${parsed.purpose}` });
    return { ok: false, reason: 'rate_limited', retryAfter: rl.retryAfter };
  }

  let snap;
  try {
    snap = await db.collection('otpRequests').doc(parsed.id).get();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (!snap.exists) return { ok: false, reason: 'not_found' };

  const data = snap.data() as {
    email: string; purpose: OtpPurpose; codeHash: string;
    expiresAt: Timestamp; consumedAt: Timestamp | null; attemptCount: number; superseded: boolean;
  };

  if (data.consumedAt) return { ok: false, reason: 'consumed' };
  if (data.superseded) return { ok: false, reason: 'superseded' };
  if (data.expiresAt?.toMillis?.() ? data.expiresAt.toMillis() < Date.now() : false) {
    return { ok: false, reason: 'expired' };
  }
  if (data.purpose !== parsed.purpose) return { ok: false, reason: 'invalid_token' };

  // Verify code against the bcrypt hash (constant-time inside bcrypt).
  const { verifyPassword } = await import('./password');
  const matched = await verifyPassword(input.code, data.codeHash);
  if (!matched) {
    const attempts = (data.attemptCount || 0) + 1;
    const voided = attempts >= MAX_ATTEMPTS;
    try {
      await snap.ref.update({
        attemptCount: attempts,
        ...(voided ? { consumedAt: Timestamp.fromMillis(Date.now()), voidedByAttempts: true } : {}),
      });
    } catch { /* ignore */ }
    await recordFailure(`otpVer:${parsed.id}`, POLICIES.otpVerify, { ip: input.ip, event: 'otp_verify' });
    await logSecurityEvent({ type: 'otp_failed', email: data.email, ip: input.ip, detail: `${parsed.purpose} attempt=${attempts}` });
    return { ok: false, reason: voided ? 'consumed' : 'wrong_code' };
  }

  // Success: consume (single-use), clear failures.
  await snap.ref.update({ consumedAt: Timestamp.fromMillis(Date.now()), attemptCount: (data.attemptCount || 0) + 1 });
  clearFailures(`otpVer:${parsed.id}`, undefined, input.ip);
  clearFailures(`otpReq:${parsed.purpose}`, data.email, input.ip);
  await logSecurityEvent({ type: 'otp_verified', email: data.email, ip: input.ip, detail: parsed.purpose });

  // Issue a short-lived verification token (10 min) for the next step.
  const vexp = Math.floor(Date.now() / 1000) + 600;
  const vpayload = JSON.stringify({ email: data.email, purpose: parsed.purpose, exp: vexp });
  return {
    ok: true,
    email: data.email,
    purpose: parsed.purpose,
    verificationToken: signToken(vpayload, secret),
  };
}

/** Verify a `verificationToken` (from a successful verifyOtp) for a given purpose. */
export function consumeVerificationToken(
  token: string,
  expectedPurpose: OtpPurpose
): { email: string } | null {
  const secret = getOtpSecret();
  if (!secret) return null;
  const payload = verifySignedToken(token, secret);
  if (!payload) return null;
  try {
    const p = JSON.parse(payload) as { email: string; purpose: OtpPurpose; exp: number };
    if (p.purpose !== expectedPurpose) return null;
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: p.email };
  } catch {
    return null;
  }
}
