/**
 * PATCH /api/admin/leads/[id] — update lead status / soft-delete / restore.
 *
 * Server-side authorized mutation via Admin SDK. Replaces the old client-side
 * `updateDoc(doc(db,'leads',id))`. Body (JSON):
 *   { status?: string, deletedAt?: 'soft' | 'restore' }
 *
 * Audit entry is written server-side via logActivityServer.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['New', 'Contacted', 'Qualified', 'Closed'];

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
    audit.push(`Updated lead status to ${body.status}`);
  }

  if (body.deletedAt === 'soft') {
    update.deletedAt = Timestamp.now();
    audit.push('Archived lead');
  } else if (body.deletedAt === 'restore') {
    update.deletedAt = null;
    audit.push('Restored lead');
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    await db.collection('leads').doc(id).update(update);
  } catch (err) {
    console.error('[admin/leads] update failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  for (const action of audit) {
    await logActivityServer(auth.user, action, 'Lead', id);
  }

  return NextResponse.json({ ok: true });
}
