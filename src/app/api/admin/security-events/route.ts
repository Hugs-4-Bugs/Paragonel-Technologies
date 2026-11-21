/**
 * GET /api/admin/security-events — security + admin audit log (Part C/F).
 *
 * Super-Admin-only (security.audit.read is SUPER_ADMIN_ONLY). Returns the most
 * recent events (desc, limit 100). Never returns OTP codes (only event types).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requirePermission } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requirePermission(request, 'security.audit.read');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const snaps = await db.collection('securityEvents').orderBy('timestamp', 'desc').limit(100).get();
  const events = snaps.docs.map((d) => {
    const data = d.data() as { type: string; email?: string | null; detail?: string | null; actor?: string | null; timestamp?: unknown };
    return {
      id: d.id,
      type: data.type,
      email: data.email ?? null,
      detail: data.detail ?? null,
      actor: data.actor ?? null,
      timestamp: data.timestamp ?? null,
    };
  });
  return NextResponse.json({ events });
}
