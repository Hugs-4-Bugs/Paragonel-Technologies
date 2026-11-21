/**
 * POST /api/admin/admins/[id]/revoke-sessions — revoke all sessions for an admin (Part C/F).
 *
 * Super-Admin-only (security.sessions.revoke). Bumps the admin's tokenVersion
 * (invalidates every existing JWT for the account) + marks session docs revoked.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requirePermission, revokeAllSessionsForAccount } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const auth = await requirePermission(request, 'security.sessions.revoke');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const { id } = await params;
  const email = decodeURIComponent(id).toLowerCase().trim();

  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return jsonError(404, 'Admin not found.');

  await revokeAllSessionsForAccount(email, 'admin');
  await logSecurityEvent({ type: 'session_revoked', email, ip, actor: auth.user.email, detail: 'all-sessions' });
  return NextResponse.json({ message: 'All sessions revoked for this admin.', email });
}
