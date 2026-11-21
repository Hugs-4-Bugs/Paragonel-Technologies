/**
 * GET/PUT/PATCH/DELETE /api/admin/tech-ecosystem/[id]. Mirrors
 * /api/admin/testimonials/[id]. PATCH changes status (draft|published) +
 * re-derives isActive from status + existing publicDisplayPermission.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { techEcosystemSchema, buildTechEcosystemUpdatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  const { id } = await params;
  try {
    const snap = await db.collection('techEcosystem').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    return NextResponse.json({ techEcosystem: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/tech-ecosystem/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load entry' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const parsed = techEcosystemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  try {
    const ref = db.collection('techEcosystem').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    await ref.update(buildTechEcosystemUpdatePayload(parsed.data));
    await logActivityServer(auth.user, 'update', 'TechEcosystem', id);
    revalidatePublicContent('techEcosystem');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/tech-ecosystem/[id]] put failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const status = (body as { status?: string } | null)?.status;
  if (status !== 'draft' && status !== 'published') {
    return NextResponse.json({ error: 'Validation failed', issues: ['status (draft|published) is required'] }, { status: 400 });
  }
  try {
    const ref = db.collection('techEcosystem').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    const existing = snap.data() as { publicDisplayPermission?: boolean } | undefined;
    const isActive = status === 'published' && existing?.publicDisplayPermission === true;
    await ref.update({ status, isActive, updatedAt: Timestamp.now() });
    await logActivityServer(auth.user, `status → ${status}`, 'TechEcosystem', id);
    revalidatePublicContent('techEcosystem');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/tech-ecosystem/[id]] patch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminPermission(request, 'cms.delete');
  if (!auth.ok) return auth.response;
  const db = getAdminDb();
  if (!db) return serviceUnavailable();
  const { id } = await params;
  try {
    const ref = db.collection('techEcosystem').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    await ref.delete();
    await logActivityServer(auth.user, 'delete', 'TechEcosystem', id);
    revalidatePublicContent('techEcosystem');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/tech-ecosystem/[id]] delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
