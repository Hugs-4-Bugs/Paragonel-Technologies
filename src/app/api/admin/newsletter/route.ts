/**
 * GET /api/admin/newsletter — list newsletter subscribers (Phase 4, IU-0 slice 1).
 *
 * Server-side authorized read via Admin SDK. `newsletterSubscribers` is now
 * locked (`allow read: if false`), so the admin newsletter page fetches here.
 *
 * RBAC: `cms.read` (held by viewer+editor+admin+super_admin) — was a bare
 * `verifyAdmin` (any active admin). The list exposes subscriber emails (PII), so
 * the read is audited via `logActivityServer`.
 *
 * Order: subscribedAt desc (matches previous client query). Limit 1000
 * (subscriber lists can grow; CSV export is generated client-side from this).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminPermission, serializeDoc, serviceUnavailable, logActivityServer } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await verifyAdminPermission(request, 'cms.read');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db
      .collection('newsletterSubscribers')
      .orderBy('subscribedAt', 'desc')
      .limit(1000)
      .get();
    const subscribers = snap.docs.map((d) => serializeDoc(d));
    await logActivityServer(auth.user, 'list', 'NewsletterSubscriber', 'all');
    return NextResponse.json({ subscribers });
  } catch (err) {
    console.error('[admin/newsletter] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load subscribers' }, { status: 500 });
  }
}
