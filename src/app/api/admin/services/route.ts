/**
 * GET  /api/admin/services  — list ALL services (admin CMS, incl. inactive).
 * POST /api/admin/services  — create a service.
 *
 * Server-side authorized via Admin SDK. The admin Services CMS was previously
 * client-only (`useCollection(collection(db,'services'))` + `deleteDoc(...)`),
 * which is blocked by `firestore.rules` (`allow write: if false` on `services`)
 * and — after the G16 read rule — could only see `isActive==true` records, so
 * the admin could never see hidden services or create/edit/delete any. These
 * routes move all admin services writes server-side (Admin SDK bypasses the
 * rules), mirroring `/api/admin/jobs`.
 *
 * GET order: `order` asc, then `createdAt` desc. Limit 500.
 * POST body: ServiceFormValues (validated server-side); returns { id }.
 *
 * Auth: GET uses `verifyAdmin` (any active admin may list — viewer has
 * `cms.read`). POST uses `verifyAdminPermission('cms.create')` so a read-only
 * `viewer` cannot write. On success POST purges the public `/services` cache
 * via `revalidatePublicContent` so the new service appears immediately.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { serviceFormSchema, buildServiceCreatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db
      .collection('services')
      .orderBy('order', 'asc')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    const services = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ services });
  } catch (err) {
    console.error('[admin/services] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load services' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.create');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = serviceFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const payload = buildServiceCreatePayload(parsed.data);
    const ref = await db.collection('services').add(payload);
    await logActivityServer(auth.user, 'create', 'Service', ref.id);
    revalidatePublicContent('services');
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('[admin/services] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
