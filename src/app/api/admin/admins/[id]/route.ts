/**
 * /api/admin/admins/[id] — view + update an administrator (Part C/G).
 *
 * GET   (admins.read)   — sanitized admin doc.
 * PATCH (roles.manage)  — change role. Super-Admin-only. Refuses to demote the
 *   LAST super_admin (prevents a lockout where no super_admin remains). The
 *   actor cannot grant SUPER_ADMIN unless they are super_admin — enforced by
 *   the permission gate (roles.manage is SUPER_ADMIN_ONLY).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requirePermission } from '@/lib/auth/sessions';
import { ROLES, type Role } from '@/lib/auth/rbac';
import { revokeAllSessionsForAccount } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function idFrom(params: Promise<{ id: string }>) {
  const { id } = await params;
  return decodeURIComponent(id).toLowerCase().trim();
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'admins.read');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const email = await idFrom(params);
  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return jsonError(404, 'Admin not found.');
  const d = snap.data() as { email: string; role: Role; status: string; emailVerified?: boolean; createdAt?: Timestamp; suspendedAt?: Timestamp | null; createdBy?: string };
  return NextResponse.json({ admin: { email: d.email, role: d.role, status: d.status, emailVerified: !!d.emailVerified, createdAt: d.createdAt ?? null, suspendedAt: d.suspendedAt ?? null, createdBy: d.createdBy ?? null } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const auth = await requirePermission(request, 'roles.manage');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const email = await idFrom(params);

  let body: { role?: string; status?: string };
  try { body = await request.json(); } catch { return jsonError(400, 'Invalid request body.'); }

  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return jsonError(404, 'Admin not found.');
  const current = snap.data() as { role: Role; status: string };

  // Role change.
  if (body.role && body.role !== current.role) {
    if (!ROLES.includes(body.role as Role)) return jsonError(400, `Role must be one of: ${ROLES.join(', ')}.`);
    // Prevent demoting the last super_admin.
    if (current.role === 'super_admin' && body.role !== 'super_admin') {
      const sa = await db.collection('admins').where('role', '==', 'super_admin').where('status', '==', 'active').get();
      if (sa.size <= 1) return jsonError(409, 'Refused: this is the last Super Admin. Promote another first.');
    }
    await snap.ref.update({ role: body.role as Role });
    // Revoke sessions so the role change takes effect immediately (re-login with new role).
    await revokeAllSessionsForAccount(email, 'admin');
    await logSecurityEvent({ type: 'role_changed', email, ip, actor: auth.user.email, detail: `${current.role}->${body.role}` });
  }

  // Status change via PATCH (alternative to suspend/reactivate endpoints).
  if (body.status && body.status !== current.status) {
    if (!['active', 'suspended', 'invited'].includes(body.status)) return jsonError(400, 'Invalid status.');
    await snap.ref.update({
      status: body.status,
      suspendedAt: body.status === 'suspended' ? Timestamp.fromMillis(Date.now()) : null,
      suspendedBy: body.status === 'suspended' ? auth.user.email : null,
    });
    if (body.status === 'suspended') await revokeAllSessionsForAccount(email, 'admin');
    await logSecurityEvent({ type: body.status === 'suspended' ? 'admin_suspended' : 'admin_reactivated', email, ip, actor: auth.user.email });
  }

  return NextResponse.json({ message: 'Admin updated.', email });
}
