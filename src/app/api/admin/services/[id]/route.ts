/**
 * GET   /api/admin/services/[id]  — single service (admin edit form).
 * PUT   /api/admin/services/[id]  — replace editable fields (edit form save).
 * PATCH /api/admin/services/[id]  — toggle visibility: body { isActive: boolean }.
 * DELETE /api/admin/services/[id] — permanent delete.
 *
 * Server-side authorized via Admin SDK. Mirrors `/api/admin/jobs/[id]`.
 *
 * Auth: GET uses `verifyAdmin` (any active admin may read for editing). PUT /
 * PATCH use `verifyAdminPermission('cms.update')`; DELETE uses
 * `verifyAdminPermission('cms.delete')` — so a read-only `viewer` cannot
 * mutate. Every successful mutation purges the public `/services` cache via
 * `revalidatePublicContent` so the landing reflects the change immediately.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { serviceFormSchema, buildServiceUpdatePayload, buildServiceTogglePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  try {
    const snap = await db.collection('services').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ service: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/services/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load service' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
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
    const ref = db.collection('services').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    await ref.update(buildServiceUpdatePayload(parsed.data));
    await logActivityServer(auth.user, 'update', 'Service', id);
    revalidatePublicContent('services');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/services/[id]] put failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'cms.update');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || typeof (body as { isActive?: unknown }).isActive !== 'boolean') {
    return NextResponse.json(
      { error: 'Validation failed', issues: ['isActive (boolean) is required'] },
      { status: 400 }
    );
  }
  const isActive = (body as { isActive: boolean }).isActive;

  try {
    const ref = db.collection('services').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    await ref.update(buildServiceTogglePayload(isActive));
    await logActivityServer(auth.user, isActive ? 'activate' : 'hide', 'Service', id);
    revalidatePublicContent('services');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/services/[id]] patch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update service visibility' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'cms.delete');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  try {
    const ref = db.collection('services').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    await ref.delete();
    await logActivityServer(auth.user, 'delete', 'Service', id);
    revalidatePublicContent('services');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/services/[id]] delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
