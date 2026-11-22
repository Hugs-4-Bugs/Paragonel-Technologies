/**
 * GET /api/admin/stats — dashboard counts (Phase 4, IU-0 slice 1).
 *
 * Replaces the four client-side `useCollection` count queries on the admin
 * dashboard (jobs, blogPosts, leads, newsletterSubscribers) plus the
 * recent-applications preview. Those collections (leads, jobApplications,
 * newsletterSubscribers) are now read-locked, so the dashboard must fetch
 * counts server-side.
 *
 * jobs / blogPosts counts read the live collections via Admin SDK too (they
 * remain publicly readable, but using one server call avoids 5 separate
 * client subscriptions and keeps the dashboard uniform).
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
    // Count non-deleted jobs / blogPosts; count leads / subscribers (inbound).
    const [jobsSnap, postsSnap, leadsSnap, subsSnap, recentAppsSnap] = await Promise.all([
      db.collection('jobs').where('deletedAt', '==', null).get(),
      db.collection('blogPosts').where('deletedAt', '==', null).get(),
      db.collection('leads').where('deletedAt', '==', null).get(),
      db.collection('newsletterSubscribers').get(),
      db.collection('jobApplications').orderBy('appliedAt', 'desc').limit(6).get(),
    ]);

    return NextResponse.json({
      stats: {
        jobs: jobsSnap.size,
        blogs: postsSnap.size,
        leads: leadsSnap.size,
        subscribers: subsSnap.size,
      },
      recentApplications: recentAppsSnap.docs.map((d) => serializeDoc(d)),
    });
  } catch (err) {
    console.error('[admin/stats] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
