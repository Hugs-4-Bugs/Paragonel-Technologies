/**
 * GET  /api/admin/testimonials  — list ALL testimonials (admin CMS, all statuses).
 * POST /api/admin/testimonials  — create a testimonial.
 *
 * Server-side authorized via Admin SDK (bypasses firestore.rules where the
 * `testimonials` collection is `allow read, write: if false` — locked until a
 * testimonial is approved, so no unapproved/fabricated quote can be served).
 * Mirrors /api/admin/services.
 *
 * GET order: displayOrder asc, then createdAt desc. Limit 500.
 * POST body: TestimonialFormValues (Zod-validated server-side); returns { id }.
 *
 * Auth: GET uses `verifyAdmin` (any active admin may list — viewer has
 * `cms.read`). POST uses `verifyAdminPermission('cms.create')` so a read-only
 * `viewer` cannot write. On success POST purges the public testimonials cache
 * via `revalidatePublicContent('testimonials')` so a newly published
 * testimonial appears immediately.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { testimonialSchema, buildTestimonialCreatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db
      .collection('testimonials')
      .orderBy('displayOrder', 'asc')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    const testimonials = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error('[admin/testimonials] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load testimonials' }, { status: 500 });
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

  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const payload = buildTestimonialCreatePayload(parsed.data);
    const ref = await db.collection('testimonials').add(payload);
    await logActivityServer(auth.user, 'create', 'Testimonial', ref.id);
    revalidatePublicContent('testimonials');
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('[admin/testimonials] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
