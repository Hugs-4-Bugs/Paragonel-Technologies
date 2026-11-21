/**
 * /api/admin/admins — list + create administrators (Part C/G).
 *
 * GET  (admins.read)  — list all admins (sanitized; no passwordHash).
 * POST (admins.create) — create an admin. Super-Admin-only (both perms are in
 *   SUPER_ADMIN_ONLY). Two modes:
 *     - {mode:'direct', email, role, password}  → active admin, password set now.
 *     - {mode:'invite',  email, role}           → 'invited' admin + emailed
 *       setup link (password set by the invitee through verified email).
 *
 * An ordinary ADMIN cannot reach these routes (perms are super-admin-only), so
 * self-promotion is impossible. Role must be one of ROLES; SUPER_ADMIN can be
 * granted here only because the actor is already super_admin.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requirePermission } from '@/lib/auth/sessions';
import { ROLES, type Role } from '@/lib/auth/rbac';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { signToken } from '@/lib/auth/crypto-utils';
import { getOtpSecret } from '@/lib/auth/otp';
import { sendNotificationEmail } from '@/lib/auth/email';
import { getClientIp, jsonError, passwordPolicyResponse } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitize(d: { email?: string; role?: Role; status?: string; emailVerified?: boolean; createdAt?: Timestamp; suspendedAt?: Timestamp | null; createdBy?: string }) {
  return {
    email: d.email,
    role: d.role,
    status: d.status,
    emailVerified: !!d.emailVerified,
    createdAt: d.createdAt ?? null,
    suspendedAt: d.suspendedAt ?? null,
    createdBy: d.createdBy ?? null,
  };
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, 'admins.read');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const snaps = await db.collection('admins').get();
  const admins = snaps.docs.map((d) => sanitize(d.data() as Parameters<typeof sanitize>[0]));
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const auth = await requirePermission(request, 'admins.create');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  let body: { mode?: string; email?: string; role?: string; password?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }
  const mode = body.mode === 'invite' ? 'invite' : 'direct';
  const email = (body.email ?? '').toLowerCase().trim();
  const role = body.role as Role;
  if (!email || !email.includes('@')) return jsonError(400, 'A valid email is required.');
  if (!ROLES.includes(role)) return jsonError(400, `Role must be one of: ${ROLES.join(', ')}.`);

  const existing = await db.collection('admins').doc(email).get();
  if (existing.exists) return jsonError(409, 'An admin with this email already exists.');

  if (mode === 'direct') {
    if (!body.password) return jsonError(400, 'Password is required for direct creation.');
    const pwErr = validatePassword(body.password);
    if (pwErr) return passwordPolicyResponse(pwErr);
    const passwordHash = await hashPassword(body.password);
    await db.collection('admins').doc(email).set({
      email,
      role,
      status: 'active',
      passwordHash,
      emailVerified: true,
      tokenVersion: Date.now(),
      createdAt: Timestamp.fromMillis(Date.now()),
      createdBy: auth.user.email,
    });
    await logSecurityEvent({ type: 'admin_created', email, ip, actor: auth.user.email, detail: `direct role=${role}` });
    return NextResponse.json({ message: 'Admin created.', admin: { email, role, status: 'active' } }, { status: 201 });
  }

  // invite mode: create 'invited' admin + email a signed setup link.
  const secret = getOtpSecret();
  if (!secret) return jsonError(500, 'Server auth misconfigured (OTP_SECRET).');
  const exp = Math.floor(Date.now() / 1000) + 24 * 3600; // 24h
  const inviteToken = signToken(JSON.stringify({ email, role, purpose: 'admin_invite', exp }), secret);
  await db.collection('admins').doc(email).set({
    email,
    role,
    status: 'invited',
    emailVerified: false,
    tokenVersion: Date.now(),
    createdAt: Timestamp.fromMillis(Date.now()),
    createdBy: auth.user.email,
    inviteExpiresAt: Timestamp.fromMillis(exp * 1000),
  });
  const base = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const link = `${base}/admin/accept-invite?token=${encodeURIComponent(inviteToken)}`;
  await sendNotificationEmail(email, 'You are invited as a Paragonel administrator',
    `You have been invited as a Paragonel administrator (role: ${role}).\nSet up your password here:\n${link}\nThis link expires in 24 hours.`);
  await logSecurityEvent({ type: 'admin_invited', email, ip, actor: auth.user.email, detail: `role=${role}` });
  return NextResponse.json({ message: 'Invitation sent.', admin: { email, role, status: 'invited' } }, { status: 201 });
}
