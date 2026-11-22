/**
 * unsubscribe.ts — signed token for one-click job-alert unsubscribe
 * (Prompt 05R §9: "Provide an unsubscribe/manage-preferences route that verifies
 * candidate ownership and cannot be abused to modify another account").
 *
 * The token is an HMAC-SHA256 over the literal string `jobalert:unsub:<email>`,
 * signed with the app's OTP_SECRET (>=32 chars, already required by 05Q). The
 * email is carried alongside the signature. Because the signature is bound to
 * the specific email, a token issued for candidate A can ONLY disable alerts for
 * candidate A — it cannot be replayed against another account, and it cannot
 * modify any field other than `jobAlertPreference` (the route sets only that).
 *
 * Tokens do not expire (unsubscribe links must remain usable from archived
 * emails), but they are single-purpose: the verifying route only ever sets
 * `jobAlertPreference = false`. A compromised token's worst case is disabling
 * alerts for its own bound account — which is exactly the intended action.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'jobalert:unsub';

function getSecret(): string {
  const s = process.env.OTP_SECRET || process.env.JWT_SECRET || '';
  if (!s || s.length < 32) {
    // Fail closed: if no secret is configured, sign/verify return empty so the
    // route refuses to act. We never sign with a weak/empty secret.
    return '';
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}
function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

/** Sign an unsubscribe token for a candidate email. Returns "" if no secret. */
export function signUnsubscribeToken(email: string): string {
  const secret = getSecret();
  if (!secret) return '';
  const e = (email || '').trim().toLowerCase();
  if (!e) return '';
  const sig = createHmac('sha256', secret).update(`${PURPOSE}:${e}`).digest();
  return `${b64url(e)}.${b64url(sig)}`;
}

/**
 * Verify an unsubscribe token. Returns the bound email on success, null on any
 * failure (bad format, bad signature, no secret). Constant-time compare.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const [emailB64, sigB64] = parts;
  let email: string;
  let sig: Buffer;
  try {
    email = b64urlDecode(emailB64).toString('utf8').trim().toLowerCase();
    sig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (!email) return null;
  const expected = createHmac('sha256', secret).update(`${PURPOSE}:${email}`).digest();
  if (sig.length !== expected.length) return null;
  // timingSafeEqual requires equal lengths (checked above).
  if (!timingSafeEqual(sig, expected)) return null;
  return email;
}

/** Build the full one-click unsubscribe URL for an email. */
export function unsubscribeUrl(email: string, baseUrl: string): string {
  const t = signUnsubscribeToken(email);
  if (!t) return ''; // caller falls back to the login-gated manage page
  return `${baseUrl}/api/job-alerts/unsubscribe?token=${encodeURIComponent(t)}`;
}
