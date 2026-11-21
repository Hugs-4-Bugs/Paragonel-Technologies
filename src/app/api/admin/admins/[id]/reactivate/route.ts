/**
 * POST /api/admin/admins/[id]/reactivate — re-activate a suspended administrator (Part C).
 *
 * Super-Admin-only (admins.update). Does NOT auto-restore old sessions; the
 * admin must log in again (password + OTP).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requirePermission } from '@/lib/auth/sessions';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const auth = await requirePermission(request, 'admins.update');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const { id } = await params;
  const email = decodeURIComponent(id).toLowerCase().trim();

  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return jsonError(404, 'Admin not found.');

  await snap.ref.update({ status: 'active', suspendedAt: null, suspendedBy: null, reactivatedAt: Timestamp.fromMillis(Date.now()) });
  await logSecurityEvent({ type: 'admin_reactivated', email, ip, actor: auth.user.email });
  return NextResponse.json({ message: 'Admin reactivated. The admin must log in again.', email });
}
