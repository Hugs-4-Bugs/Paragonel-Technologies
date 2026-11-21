/**
 * crypto-utils.ts — cryptographic primitives for the auth subsystem.
 *
 * All randomness uses Node's `crypto.randomBytes` (CSPRNG). Comparisons use
 * `timingSafeEqual` to avoid timing side channels. Nothing here invents a
 * custom cipher; it composes standard primitives.
 */
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

/** Random hex string (default 32 bytes / 64 hex chars). */
export function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Random numeric OTP code of `digits` length (default 6). Left-pads with zeros
 * so a code like 000123 is valid and uniformly distributed. Uses CSPRNG and
 * reduces modulo 10^digits (negligible bias for 6 digits).
 */
export function randomOtpCode(digits = 6): string {
  const max = 10 ** digits;
  // Rejection sampling would be ideal, but for 6 digits the modulo bias is
  // < 2^-52 and immaterial. randomBytes gives a uniform uint32; combine two
  // for a uniform uint53 to support up to 9 digits without bias.
  const buf = randomBytes(8);
  const n = buf.readBigUInt64BE(0) % BigInt(max);
  return n.toString().padStart(digits, '0');
}

/**
 * HMAC-SHA256 of `data` keyed with `secret`. Used to sign OTP request ids so
 * the verify step can confirm a code was server-issued (the client only ever
 * sees the signed id + the code that was emailed; it cannot forge an id).
 */
export function hmacSign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

/** Constant-time string equality. Returns false if lengths differ. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * HMAC-sign a payload into an opaque, self-contained token: base64url(payload).signature.
 * The payload is NOT encrypted — it must not contain secrets. The signature
 * guarantees integrity + server origin. Verify with `verifySignedToken`.
 */
export function signToken(payload: string, secret: string): string {
  const sig = hmacSign(payload, secret);
  const b64 = Buffer.from(payload).toString('base64url');
  return `${b64}.${sig}`;
}

/** Verify a `signToken` output and return the payload, or null if invalid. */
export function verifySignedToken(token: string, secret: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(b64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = hmacSign(payload, secret);
  if (!safeEqual(sig, expected)) return null;
  return payload;
}

/**
 * Hash an IP for rate-limit keys / audit storage. SHA-256 (no salt — this is
 * for keyed lookup/PII reduction, not password storage). Returns hex.
 */
export function hashIp(ip: string): string {
  return createHmac('sha256', 'paragonel-ip-v1').update(ip).digest('hex').slice(0, 32);
}
