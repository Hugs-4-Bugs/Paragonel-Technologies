/**
 * continue-token.ts — HMAC-signed token for the event-driven job-match
 * continuation chain (Prompt §7: fully event-driven processing without cron).
 *
 * Mirrors the unsubscribe.ts token pattern (HMAC-SHA256, base64url, constant-time
 * compare, secret = OTP_SECRET || JWT_SECRET, fail-closed if <32 chars). The
 * token carries { iat, hop } so the /api/job-match/continue endpoint can:
 *   - authenticate the self-HTTP call (only a signed token can trigger a drain),
 *   - reject stale/replayed tokens (iat TTL),
 *   - bound the chain depth (hop < MAX_CONTINUATION_HOPS) — no infinite loops.
 *
 * The chain is idempotent regardless of the token: claimEvent (atomic) +
 * claimSendSlot (atomic) make a redundant/duplicated continuation a no-op, so a
 * replayed token cannot cause duplicate emails — it can only waste a drained
 * (no-op) batch. The hop cap + TTL bound even that waste.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'jobmatch:continue';
const MAX_HOPS = 20;
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 min — a hop older than this is rejected

export const MAX_CONTINUATION_HOPS = MAX_HOPS;

export interface ContinueTokenPayload {
  iat: number;
  hop: number;
}

function getSecret(): string {
  const s = process.env.OTP_SECRET || process.env.JWT_SECRET || '';
  if (!s || s.length < 32) return ''; // fail closed
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}
function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

/** Sign a continuation token. Returns "" if no secret is configured. */
export function signContinueToken(payload: ContinueTokenPayload): string {
  const secret = getSecret();
  if (!secret) return '';
  const body = JSON.stringify({ iat: payload.iat, hop: payload.hop });
  const sig = createHmac('sha256', secret).update(`${PURPOSE}:${body}`).digest();
  return `${b64url(body)}.${b64url(sig)}`;
}

/**
 * Verify a continuation token. Returns the payload on success, null on any
 * failure (bad format, bad signature, expired, hop at/over MAX, no secret).
 * Constant-time signature compare.
 */
export function verifyContinueToken(token: string): ContinueTokenPayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const [bodyB64, sigB64] = parts;
  let body: string;
  let sig: Buffer;
  try {
    body = b64urlDecode(bodyB64).toString('utf8');
    sig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expected = createHmac('sha256', secret).update(`${PURPOSE}:${body}`).digest();
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(sig, expected)) return null;
  let parsed: { iat?: unknown; hop?: unknown };
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  const iat = Number(parsed.iat);
  const hop = Number(parsed.hop);
  if (!Number.isFinite(iat) || !Number.isFinite(hop)) return null;
  if (Date.now() - iat > TOKEN_TTL_MS) return null; // expired
  if (hop < 0 || hop >= MAX_HOPS) return null; // chain-depth bound
  return { iat, hop };
}
