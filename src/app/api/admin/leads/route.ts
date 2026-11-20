/**
 * GET /api/admin/leads — list CRM leads (Phase 4, IU-0 slice 1).
 *
 * Server-side authorized read via Admin SDK. Replaces the old client-side
 * `useCollection(collection(db,'leads'))` which relied on Firestore rules
 * allowing public read. With `leads` now locked (`allow read: if false`),
 * the admin CRM page fetches here instead.
 *
 * Order: createdAt desc (matches the previous client query). Limit 500 to
 * bound payload size; admin CRM is paginated/filtered client-side today.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, serializeDoc, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db.collection('leads').orderBy('createdAt', 'desc').limit(500).get();
    const leads = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ leads });
  } catch (err) {
    console.error('[admin/leads] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
