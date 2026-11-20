/**
 * DELETE /api/admin/newsletter/[id] — remove a subscriber (Phase 4, IU-0 slice 1).
 *
 * Server-side authorized hard-delete via Admin SDK. Replaces the old client-side
 * `deleteDoc(doc(db,'newsletterSubscribers',id))`. `newsletterSubscribers` is
 * locked (`allow delete: if false`), so deletion must go through here.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  try {
    await db.collection('newsletterSubscribers').doc(id).delete();
  } catch (err) {
    console.error('[admin/newsletter/[id]] delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  await logActivityServer(auth.user, 'Deleted newsletter subscriber', 'NewsletterSubscriber', id);
  return NextResponse.json({ ok: true });
}
