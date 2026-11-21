/**
 * admin-step1.ts — short-lived token issued AFTER password verification but
 * BEFORE OTP verification. It authorizes ONLY the OTP step-2 endpoints
 * (/api/admin/auth/otp/request, /api/admin/auth/otp/verify). It is NOT a
 * session: it has no `sid`, creates no `sessions/{sid}` doc, and
 * `verifySession` rejects it (no session doc). So a step-1 token alone grants
 * no access to any protected `/api/admin/**` route.
 *
 * Signed with OTP_SECRET (HMAC), 5-minute TTL.
 */
import { signToken, verifySignedToken } from './crypto-utils';
import { getOtpSecret } from './otp';

const STEP1_TTL = 5 * 60; // 5 minutes

export function issueAdminStep1Token(email: string): string | null {
  const secret = getOtpSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + STEP1_TTL;
  return signToken(JSON.stringify({ email: email.toLowerCase().trim(), purpose: 'admin_step1', exp }), secret);
}

export function verifyAdminStep1Token(token: string): { email: string } | null {
  const secret = getOtpSecret();
  if (!secret) return null;
  const payload = verifySignedToken(token, secret);
  if (!payload) return null;
  try {
    const p = JSON.parse(payload) as { email: string; purpose: string; exp: number };
    if (p.purpose !== 'admin_step1') return null;
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: p.email.toLowerCase().trim() };
  } catch {
    return null;
  }
}
