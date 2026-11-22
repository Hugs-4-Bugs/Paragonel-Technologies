/**
 * PATCH /api/admin/leads/[id] — update lead status / soft-delete / restore.
 *
 * Server-side authorized mutation via Admin SDK. Replaces the old client-side
 * `updateDoc(doc(db,'leads',id))`. Body (validated by leadPatchSchema):
 *   { status?: string, deletedAt?: 'soft' | 'restore' }
 *
 * Auth: PATCH uses `verifyAdminPermission('cms.update')` so a read-only
 * `viewer` cannot mutate leads (closes the same privilege-escalation gap fixed
 * for blog/jobs/services in 05I). Audit entry written server-side via
 * logActivityServer. No GET/POST/DELETE here by design — leads are created by
 * the public /api/contact endpoint and use reversible soft-delete via PATCH.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { leadPatchSchema } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

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

  const parsed = leadPatchSchema.safeParse(body);
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
    audit.push(`Updated lead status to ${data.status}`);
  }

  if (data.deletedAt === 'soft') {
    update.deletedAt = Timestamp.now();
    audit.push('Archived lead');
  } else if (data.deletedAt === 'restore') {
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
