/**
 * GET /api/admin/activity — list admin audit logs.
 *
 * Audit records are SERVER-GENERATED ONLY. There is NO public POST route: the
 * previous client-writable POST let any active admin (incl. a read-only
 * `viewer`) append entries with client-supplied `action`/`resourceType`/
 * `resourceId`, which violated "audit records must be server-generated" and
 * "ordinary users must not edit privileged audit records". Audit entries are now
 * written exclusively by server code via `writeAuditLog` / `logActivityServer`
 * (src/lib/audit-log.ts, src/lib/admin-auth.ts), with the actor taken from the
 * verified session — never from the request body.
 *
 * `adminActivityLogs` is locked (`allow read, write: if false` for clients).
 * Reads happen here via the Admin SDK. GET requires `security.audit.read`
 * (super_admin only) so audit entries (which contain admin emails + action
 * records) are not exposed to viewer/editor/admin roles.
 *
 * Each record carries the legacy fields (`adminEmail`/`action`/`resourceType`/
 * `resourceId`/`timestamp`) the Activity page reads, PLUS the enriched fields
 * (`eventId`/`actorRole`/`actorTier`/`eventType`/`outcome`/`changeSummary`/
 * `correlationId`/`metadata`) for future, richer audit tooling.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, serializeDoc, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Audit logs contain admin emails + sensitive action records — restrict to
  // security.audit.read (super_admin only per RBAC). A viewer/editor/admin
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
