/**
 * GET  /api/admin/activity — list admin audit logs (Phase 4, IU-0 slice 1).
 * POST /api/admin/activity — record an audit entry (server-side write).
 *
 * `adminActivityLogs` is now locked (`allow read, write: if false` for
 * clients). The admin Activity page fetches the list here (GET), and the
 * client `logActivity` helper (src/lib/audit.ts) posts here (POST) so that
 * still-unconverted admin CMS pages (blog/jobs) keep producing audit trails
 * without client Firestore writes.
 *
 * POST body: { action, resourceType, resourceId } — adminEmail is taken from
 * the verified JWT (never trusted from the client).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, logActivityServer, serializeDoc, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Audit logs may contain admin emails + sensitive action records — restrict
  // to security.audit.read (super_admin only per RBAC). A viewer/editor/admin
  // reading all audit entries is a PII + audit-access gap.
  const auth = await verifyAdminPermission(request, 'security.audit.read');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db
      .collection('adminActivityLogs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    const logs = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ logs });
  } catch (err) {
    console.error('[admin/activity] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = typeof body?.action === 'string' ? body.action.slice(0, 200) : '';
  const resourceType = typeof body?.resourceType === 'string' ? body.resourceType.slice(0, 60) : '';
  const resourceId = typeof body?.resourceId === 'string' ? body.resourceId.slice(0, 120) : '';

  if (!action || !resourceType) {
    return NextResponse.json({ error: 'action and resourceType are required' }, { status: 400 });
  }

  await logActivityServer(auth.user, action, resourceType, resourceId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
