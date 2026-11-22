/**
 * GET  /api/admin/applications/[id] — single application (ATS detail).
 * PATCH /api/admin/applications/[id] — status / soft-delete / restore / internalNotes.
 *
 * Server-side authorized via Admin SDK. `jobApplications` is locked
 * (`allow read: if false`), so the detail page fetches here instead of useDoc.
 *
 * PATCH body (validated by applicationPatchSchema):
 *   { status?, deletedAt?: 'soft'|'restore', internalNotes?: string }
 *
 * Auth: GET uses `verifyAdmin` (any active admin may read — viewer has
 * `cms.read`). PATCH uses `verifyAdminPermission('cms.update')` so a read-only
 * `viewer` cannot mutate applications (closes the same privilege-escalation gap
 * fixed for blog/jobs/services in 05I). Resume signed-URL generation is a
 * documented follow-up — the `resumeUrl` field holds a Storage object path, not
 * a signed URL, and is intentionally not exposed here yet.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, logActivityServer, serializeDoc, serviceUnavailable } from '@/lib/admin-auth';
import { applicationPatchSchema } from '@/lib/cms-schemas';

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
    const snap = await db.collection('jobApplications').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/applications/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load application' }, { status: 500 });
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

  const parsed = applicationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const update: Record<string, unknown> = {};
  const audit: string[] = [];

  if (data.status) {
    update.status = data.status;
    audit.push(`Updated application status to ${data.status}`);
  }

  if (data.deletedAt === 'soft') {
    update.deletedAt = Timestamp.now();
    audit.push('Archived application');
  } else if (data.deletedAt === 'restore') {
    update.deletedAt = null;
    audit.push('Restored application');
  }

  if (typeof data.internalNotes === 'string') {
    update.internalNotes = data.internalNotes;
    update.updatedAt = Timestamp.now();
    audit.push('Updated internal notes on application');
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    await db.collection('jobApplications').doc(id).update(update);
  } catch (err) {
    console.error('[admin/applications/[id]] update failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  for (const action of audit) {
    await logActivityServer(auth.user, action, 'JobApplication', id);
  }

  return NextResponse.json({ ok: true });
}
