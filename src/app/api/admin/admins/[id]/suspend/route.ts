/**
 * POST /api/admin/admins/[id]/suspend — suspend an administrator (Part C).
 *
 * Super-Admin-only (admins.suspend). Revokes all the admin's sessions
 * immediately (tokenVersion bump). Refuses to suspend the last super_admin.
 * A suspended admin cannot authenticate (verifySession rejects status!=='active').
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requirePermission, revokeAllSessionsForAccount } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const auth = await requirePermission(request, 'admins.suspend');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const { id } = await params;
  const email = decodeURIComponent(id).toLowerCase().trim();

  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return jsonError(404, 'Admin not found.');
  const data = snap.data() as { role: string; status: string };
  if (data.role === 'super_admin') {
    const sa = await db.collection('admins').where('role', '==', 'super_admin').where('status', '==', 'active').get();
    if (sa.size <= 1) return jsonError(409, 'Refused: cannot suspend the last Super Admin.');
  }

  await snap.ref.update({
    status: 'suspended',
    suspendedAt: Timestamp.fromMillis(Date.now()),
    suspendedBy: auth.user.email,
  });
  await revokeAllSessionsForAccount(email, 'admin');
  await logSecurityEvent({ type: 'admin_suspended', email, ip, actor: auth.user.email });
  return NextResponse.json({ message: 'Admin suspended. All sessions revoked.', email });
}
