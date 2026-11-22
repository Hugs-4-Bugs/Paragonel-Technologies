/**
 * newsletter-unsubscribe.ts — signed token for one-click newsletter unsubscribe
 * (Phase 7).
 *
 * Mirrors the job-alerts unsubscribe token design (src/lib/job-alerts/unsubscribe.ts)
 * but uses a DIFFERENT purpose string (`newsletter:unsub`) so a token issued for
 * one endpoint cannot be replayed against the other. The token is an HMAC-SHA256
 * over `newsletter:unsub:<email>`, signed with the app's OTP_SECRET (≥32 chars).
 *
 * The email is carried alongside the signature. Because the signature is bound
 * to the specific email, a token issued for subscriber A can ONLY unsubscribe
 * subscriber A — it cannot modify any other subscriber or any other collection.
 *
 * Tokens do not expire (unsubscribe links must remain usable from archived
 * emails). A compromised token's worst case is unsubscribing its own bound
 * address — which is exactly the intended action.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'newsletter:unsub';

function getSecret(): string {
  const s = process.env.OTP_SECRET || process.env.JWT_SECRET || '';
  if (!s || s.length < 32) {
    // Fail closed: never sign/verify with a weak or empty secret.
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

/** Sign a newsletter unsubscribe token for a subscriber email. Returns "" if no secret. */
export function signNewsletterUnsubscribeToken(email: string): string {
  const secret = getSecret();
  if (!secret) return '';
  const e = (email || '').trim().toLowerCase();
  if (!e) return '';
  const sig = createHmac('sha256', secret).update(`${PURPOSE}:${e}`).digest();
  return `${b64url(e)}.${b64url(sig)}`;
}

/**
 * Verify a newsletter unsubscribe token. Returns the bound email on success,
 * null on any failure (bad format, bad signature, no secret). Constant-time compare.
 */
export function verifyNewsletterUnsubscribeToken(token: string): string | null {
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
  if (!timingSafeEqual(sig, expected)) return null;
  return email;
}

/** Build the full one-click unsubscribe URL for a subscriber email. */
export function newsletterUnsubscribeUrl(email: string, baseUrl: string): string {
  const t = signNewsletterUnsubscribeToken(email);
  if (!t) return ''; // caller omits the link if signing is unavailable
  return `${baseUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(t)}`;
}
