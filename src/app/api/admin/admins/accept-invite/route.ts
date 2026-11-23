/**
 * POST /api/admin/admins/accept-invite — invitee completes account setup (Part C).
 *
 * PUBLIC (no session) — the signed invite token authorizes. The invitee sets
 * their own password here, AFTER receiving the invite link by email (verified
 * email). On success the admin becomes status 'active', emailVerified true.
 * The token is single-use-ish (24h TTL, tied to the doc's status==='invited').
 *
 * Rate-limited per IP (public + abuse-prone: invite replay / flooding).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifySignedToken } from '@/lib/auth/crypto-utils';
import { getOtpSecret } from '@/lib/auth/otp';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { logSecurityEvent } from '@/lib/auth/security-events';
import {
  getClientIp,
  jsonError,
  passwordPolicyResponse,
  validateRequestBody,
} from '@/lib/auth/route-helpers';
import { POLICIES, checkBoth } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Missing invite token.'),
  newPassword: z.string().min(1, 'Missing new password.'),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate-limit per IP BEFORE any token work (public endpoint; invite replay
  // / flooding is the abuse vector).
  const rl = await checkBoth('acctMut', POLICIES.accountMutation, undefined, ip);
  if (!rl.ok) {
    await logSecurityEvent({ type: 'rate_limited', ip, detail: 'accept-invite' });
    return jsonError(429, 'Too many attempts. Try again later.', { retryAfter: rl.retryAfter });
  }

  const secret = getOtpSecret();
  if (!secret) return jsonError(500, 'Server auth misconfigured.');

  const parsed = await validateRequestBody(request, acceptInviteSchema);
  if (!parsed.ok) return parsed.response;
  const { token, newPassword } = parsed.data;

  const payload = verifySignedToken(token, secret);
  if (!payload) return jsonError(400, 'Invalid or expired invitation link.');
  let p: { email: string; role: string; purpose: string; exp: number };
  try { p = JSON.parse(payload); } catch { return jsonError(400, 'Invalid invitation link.'); }
  if (p.purpose !== 'admin_invite' || p.exp < Math.floor(Date.now() / 1000)) {
    return jsonError(400, 'Invalid or expired invitation link.');
  }

  const pwErr = validatePassword(newPassword);
  if (pwErr) return passwordPolicyResponse(pwErr);

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const email = p.email.toLowerCase().trim();
  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return jsonError(404, 'Invitation not found.');
  const data = snap.data() as { status?: string };
  if (data.status !== 'invited') return jsonError(409, 'This invitation has already been used or revoked.');

  const passwordHash = await hashPassword(newPassword);
  await snap.ref.update({
    passwordHash,
    status: 'active',
    emailVerified: true,
    tokenVersion: Date.now(),
    setupAt: Timestamp.fromMillis(Date.now()),
  });
  await logSecurityEvent({ type: 'admin_created', email, ip, detail: 'invite-accepted' });
  return NextResponse.json({ message: 'Password set. You can now log in.', email });
}
