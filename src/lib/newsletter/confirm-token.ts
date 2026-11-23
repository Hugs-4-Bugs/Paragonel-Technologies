/**
 * newsletter confirm-token.ts — signed token for double-opt-in subscription
 * confirmation (Batch 2 Task 5).
 *
 * Mirrors the unsubscribe token design (src/lib/newsletter/unsubscribe.ts) but
 * uses a DIFFERENT purpose string (`newsletter:confirm`) so a token issued for
 * confirmation cannot be replayed against the unsubscribe endpoint (or vice
 * versa). HMAC-SHA256 over `newsletter:confirm:<email>`, signed with the app's
 * OTP_SECRET (≥32 chars). The email is carried alongside the signature; the
 * signature is bound to that specific email, so a confirm token can only
 * activate the subscriber it was issued for.
 *
 * Tokens do not expire (a confirmation link in an inbox should remain usable
 * for a reasonable window). A compromised token's worst case is activating its
 * own bound address — which is the intended action.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'newsletter:confirm';

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

/** Sign a newsletter confirmation token for a subscriber email. Returns "" if no secret. */
export function signNewsletterConfirmToken(email: string): string {
  const secret = getSecret();
  if (!secret) return '';
  const e = (email || '').trim().toLowerCase();
  if (!e) return '';
  const sig = createHmac('sha256', secret).update(`${PURPOSE}:${e}`).digest();
  return `${b64url(e)}.${b64url(sig)}`;
}

/**
 * Verify a newsletter confirmation token. Returns the bound email on success,
 * null on any failure (bad format, bad signature, no secret). Constant-time compare.
 */
export function verifyNewsletterConfirmToken(token: string): string | null {
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

/** Build the full confirmation URL for a subscriber email. */
export function newsletterConfirmUrl(email: string, baseUrl: string): string {
  const t = signNewsletterConfirmToken(email);
  if (!t) return ''; // caller omits the link if signing is unavailable
  return `${baseUrl}/api/newsletter/confirm?token=${encodeURIComponent(t)}`;
}
