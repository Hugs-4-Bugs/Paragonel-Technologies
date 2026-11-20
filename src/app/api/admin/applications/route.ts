/**
 * GET /api/admin/applications — list job applications (Phase 4, IU-0 slice 1).
 *
 * Server-side authorized read via Admin SDK. Replaces the old client-side
 * `useCollection(collection(db,'jobApplications'))`. `jobApplications` is now
 * locked (`allow read: if false`), so the ATS page fetches here.
 *
 * Order: appliedAt desc (matches previous client query). Limit 500.
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
    const snap = await db
      .collection('jobApplications')
      .orderBy('appliedAt', 'desc')
      .limit(500)
      .get();
    const applications = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ applications });
  } catch (err) {
    console.error('[admin/applications] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }
}
