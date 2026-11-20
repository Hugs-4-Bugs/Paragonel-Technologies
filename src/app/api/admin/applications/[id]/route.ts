/**
 * GET  /api/admin/applications/[id] — single application (ATS detail).
 * PATCH /api/admin/applications/[id] — status / soft-delete / restore / internalNotes.
 *
 * Server-side authorized via Admin SDK. `jobApplications` is locked
 * (`allow read: if false`), so the detail page fetches here instead of useDoc.
 *
 * PATCH body: { status?, deletedAt?: 'soft'|'restore', internalNotes?: string }
 *
 * NOTE (deferred): the `resumeUrl` field currently holds a Storage object path,
 * not a signed URL — downloading resumes in production is broken (Storage rules
 * deny all public reads). Signed-URL generation is a documented follow-up
 * (next IU-0 slice) and is intentionally NOT exposed here yet.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, logActivityServer, serializeDoc, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = [
  'New',
  'Reviewing',
  'Shortlisted',
  'Interview Scheduled',
  'Rejected',
  'Hired',
];

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
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  const audit: string[] = [];

  if (typeof body.status === 'string') {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;
    audit.push(`Updated application status to ${body.status}`);
  }

  if (body.deletedAt === 'soft') {
    update.deletedAt = Timestamp.now();
    audit.push('Archived application');
  } else if (body.deletedAt === 'restore') {
    update.deletedAt = null;
    audit.push('Restored application');
  }

  if (typeof body.internalNotes === 'string') {
    update.internalNotes = body.internalNotes;
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
