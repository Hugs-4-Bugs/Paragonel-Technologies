/**
 * GET  /api/admin/client-projects  — list ALL client projects (all statuses).
 * POST /api/admin/client-projects  — create a client project.
 *
 * Server-side authorized via Admin SDK (bypasses firestore.rules). Mirrors
 * /api/admin/testimonials. GET order: displayOrder asc, createdAt desc.
 * Auth: GET verifyAdmin; POST verifyAdminPermission('cms.create'). On success
 * POST purges the public cache via revalidatePublicContent('clientProjects').
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { clientProjectSchema, buildClientProjectCreatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  try {
    const snap = await db.collection('clientProjects').orderBy('displayOrder', 'asc').orderBy('createdAt', 'desc').limit(500).get();
    return NextResponse.json({ clientProjects: snap.docs.map((d) => serializeDoc(d)) });
  } catch (err) {
    console.error('[admin/client-projects] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load client projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.create');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const parsed = clientProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  try {
    const ref = await db.collection('clientProjects').add(buildClientProjectCreatePayload(parsed.data));
    await logActivityServer(auth.user, 'create', 'ClientProject', ref.id);
    revalidatePublicContent('clientProjects');
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('[admin/client-projects] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create client project' }, { status: 500 });
  }
}
