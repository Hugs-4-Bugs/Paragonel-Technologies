/**
 * GET   /api/admin/testimonials/[id]  — single testimonial (admin edit form).
 * PUT   /api/admin/testimonials/[id]  — replace editable fields (edit form save).
 * PATCH /api/admin/testimonials/[id]  — change status: body { status }.
 * DELETE /api/admin/testimonials/[id] — permanent delete.
 *
 * Server-side authorized via Admin SDK. Mirrors /api/admin/services/[id].
 *
 * Auth: GET uses `verifyAdmin` (any active admin may read for editing). PUT /
 * PATCH use `verifyAdminPermission('cms.update')`; DELETE uses
 * `verifyAdminPermission('cms.delete')` — so a read-only `viewer` cannot
 * mutate. PATCH re-derives `isActive` from the new status + the existing
 * `permissionDisplayFeedback`. Every successful mutation purges the public
 * testimonials cache via `revalidatePublicContent('testimonials')`.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { testimonialSchema, buildTestimonialUpdatePayload, type TestimonialFormValues } from '@/lib/cms-schemas';

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
    const snap = await db.collection('testimonials').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    return NextResponse.json({ testimonial: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/testimonials/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load testimonial' }, { status: 500 });
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

  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const ref = db.collection('testimonials').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    await ref.update(buildTestimonialUpdatePayload(parsed.data));
    await logActivityServer(auth.user, 'update', 'Testimonial', id);
    revalidatePublicContent('testimonials');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/testimonials/[id]] put failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
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

  const status = (body as { status?: string } | null)?.status;
  if (status !== 'draft' && status !== 'pending' && status !== 'published') {
    return NextResponse.json(
      { error: 'Validation failed', issues: ['status (draft|pending|published) is required'] },
      { status: 400 }
    );
  }

  try {
    const ref = db.collection('testimonials').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    const existing = snap.data() as { permissionDisplayFeedback?: boolean } | undefined;
    const isActive = status === 'published' && existing?.permissionDisplayFeedback === true;
    await ref.update({ status, isActive, updatedAt: Timestamp.now() });
    await logActivityServer(auth.user, `status → ${status}`, 'Testimonial', id);
    revalidatePublicContent('testimonials');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/testimonials/[id]] patch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update testimonial status' }, { status: 500 });
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
    const ref = db.collection('testimonials').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    await ref.delete();
    await logActivityServer(auth.user, 'delete', 'Testimonial', id);
    revalidatePublicContent('testimonials');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/testimonials/[id]] delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}

// Type re-export keeps the unused import meaningful for tooling.
export type { TestimonialFormValues };
