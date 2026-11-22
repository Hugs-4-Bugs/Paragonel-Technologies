/**
 * GET  /api/admin/tech-ecosystem  — list ALL tech-ecosystem entries.
 * POST /api/admin/tech-ecosystem  — create an entry.
 * Mirrors /api/admin/testimonials. Auth: GET verifyAdmin; POST cms.create.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { techEcosystemSchema, buildTechEcosystemCreatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  try {
    const snap = await db.collection('techEcosystem').orderBy('displayOrder', 'asc').orderBy('createdAt', 'desc').limit(500).get();
    return NextResponse.json({ techEcosystem: snap.docs.map((d) => serializeDoc(d)) });
  } catch (err) {
    console.error('[admin/tech-ecosystem] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load tech ecosystem entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.create');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const parsed = techEcosystemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  try {
    const ref = await db.collection('techEcosystem').add(buildTechEcosystemCreatePayload(parsed.data));
    await logActivityServer(auth.user, 'create', 'TechEcosystem', ref.id);
    revalidatePublicContent('techEcosystem');
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('[admin/tech-ecosystem] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
