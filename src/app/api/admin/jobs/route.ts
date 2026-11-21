/**
 * GET  /api/admin/jobs  — list all job openings (Phase 4, IU-0 slice 2).
 * POST /api/admin/jobs  — create a job opening.
 *
 * Server-side authorized via Admin SDK. Replaces the old client-side
 * `useCollection(collection(db,'jobs'))` + `addDoc(...)` on the admin jobs CMS.
 * With `jobs` now locked to public writes (`allow write: if false`), the admin
 * jobs pages fetch/create here instead. The Admin SDK bypasses the rules.
 *
 * GET order: createdAt desc (matches the previous client query). Limit 500.
 * POST body: JobFormValues (validated server-side); returns { id }.
 *
 * Auth: GET uses `verifyAdmin` (any active admin may list). POST uses
 * `verifyAdminPermission('jobs.manage')` — the dedicated jobs permission held
 * by `admin` + `super_admin` (NOT `editor`/`viewer`). On success POST purges
 * the public `/careers` cache so the new job appears immediately.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { jobFormSchema, buildJobCreatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db.collection('jobs').orderBy('createdAt', 'desc').limit(500).get();
    const jobs = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error('[admin/jobs] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'jobs.manage');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = jobFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const payload = buildJobCreatePayload(parsed.data);
    const ref = await db.collection('jobs').add(payload);
    await logActivityServer(auth.user, 'create', 'Job', ref.id);
    revalidatePublicContent('jobs');
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('[admin/jobs] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
