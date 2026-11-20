/**
 * POST /api/admin/seed — dev-only foundation data seeding (Phase 4, IU-0 slice 2).
 *
 * Replaces the client-side `writeBatch` that the admin dashboard "Seed Database"
 * button used to fire directly against Firestore. Once `jobs` and `blogPosts`
 * writes were locked (`allow write: if false`), that client batch could no
 * longer run. This route performs the same seed via the Admin SDK, which
 * bypasses the rules — so local (emulator) seeding keeps working.
 *
 * Hard guard: REFUSED (403) outside of development. The client button also
 * guards on NODE_ENV, but the server re-checks so the route cannot be used to
 * seed production even if called directly.
 *
 * Seeds: jobs, blogPosts, services (matches the prior client batch exactly —
 * item.id is preserved as the doc id, deletedAt/createdAt/updatedAt are set).
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { dummyJobs, blogPosts, baseServices } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seeding disabled in production' },
      { status: 403 }
    );
  }

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const now = Timestamp.now();
  const batch = db.batch();

  for (const job of dummyJobs) {
    const ref = db.collection('jobs').doc(job.id);
    batch.set(ref, { ...job, deletedAt: null, createdAt: now, updatedAt: now });
  }

  for (const post of blogPosts) {
    const ref = db.collection('blogPosts').doc(post.id);
    batch.set(ref, { ...post, deletedAt: null, createdAt: now, updatedAt: now });
  }

  for (const service of baseServices) {
    const ref = db.collection('services').doc(service.id);
    batch.set(ref, { ...service, createdAt: now });
  }

  try {
    await batch.commit();
    await logActivityServer(auth.user, 'seed', 'Database', 'foundation');
    return NextResponse.json({
      ok: true,
      seeded: {
        jobs: dummyJobs.length,
        blogPosts: blogPosts.length,
        services: baseServices.length,
      },
    });
  } catch (err) {
    console.error('[admin/seed] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}
