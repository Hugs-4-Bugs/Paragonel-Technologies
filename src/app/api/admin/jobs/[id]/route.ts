/**
 * GET   /api/admin/jobs/[id]  — single job (admin edit form).
 * PUT   /api/admin/jobs/[id]  — replace editable fields (edit form save).
 * PATCH /api/admin/jobs/[id]  — toggle active/archived: body { isActive: boolean }.
 * DELETE /api/admin/jobs/[id] — permanent delete (matches prior deleteDoc UX).
 *
 * Server-side authorized via Admin SDK. With `jobs` public read now restricted
 * to `isActive==true && deletedAt==null`, the admin edit page (which must read
 * drafts/archived jobs) fetches here instead of getDoc().
 *
 * Auth: GET uses `verifyAdmin` (any active admin may read for editing). PUT /
 * PATCH / DELETE use `verifyAdminPermission('jobs.manage')` — held by `admin`
 * + `super_admin` only (NOT `editor`/`viewer`). Every successful mutation
 * purges the public `/careers` cache via `revalidatePublicContent` so the
 * listing reflects the change immediately.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { jobFormSchema, buildJobUpdatePayload, buildJobTogglePayload } from '@/lib/cms-schemas';
import { computeJobVersion, shouldEnqueueOnUpdate, shouldEnqueueOnToggle } from '@/lib/job-alerts/trigger';
import { enqueueAndProcessJobEvent } from '@/lib/job-alerts/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Batch 15: the inline publish drain + first after() hop need headroom (Hobby 10s default is insufficient)

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
    const snap = await db.collection('jobs').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ job: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/jobs/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'jobs.manage');
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

  const parsed = jobFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const ref = db.collection('jobs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const prev = (snap.data() || {}) as Record<string, unknown>;
    // 05R §7: bump the job version ONLY on a material change or a publish
    // transition. An unrelated edit (salary/deadline/description-only) keeps the
    // same version -> same event id -> no re-notify (idempotent).
    const newVersion = computeJobVersion(
      typeof prev.version === 'number' ? prev.version : 1,
      prev,
      parsed.data as unknown as Record<string, unknown>
    );
    const trigger = shouldEnqueueOnUpdate(prev, parsed.data as unknown as Record<string, unknown>);
    await ref.update({ ...buildJobUpdatePayload(parsed.data), version: newVersion });
    await logActivityServer(auth.user, 'update', 'Job', id);
    revalidatePublicContent('jobs');
    // 05R §7: enqueue + bounded-drain only on a publish transition or material
    // change. Non-fatal: a drain failure must not turn a successful edit into a
    // 500; the event stays pending and is re-processed by the drain endpoint.
    if (trigger) {
      try {
        await enqueueAndProcessJobEvent(db, { jobId: id, jobVersion: newVersion, trigger });
      } catch (err2) {
        console.error('[admin/jobs/[id]] 05R update drain failed (non-fatal):', err2 instanceof Error ? err2.message : err2);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/jobs/[id]] put failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'jobs.manage');
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

  // Accept { isActive: boolean } (activate/archive).
  if (typeof body !== 'object' || body === null || typeof (body as { isActive?: unknown }).isActive !== 'boolean') {
    return NextResponse.json(
      { error: 'Validation failed', issues: ['isActive (boolean) is required'] },
      { status: 400 }
    );
  }
  const isActive = (body as { isActive: boolean }).isActive;

  try {
    const ref = db.collection('jobs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const prev = (snap.data() || {}) as Record<string, unknown>;
    const prevIsActive = prev.isActive === true;
    await ref.update(buildJobTogglePayload(isActive));
    await logActivityServer(auth.user, isActive ? 'activate' : 'archive', 'Job', id);
    revalidatePublicContent('jobs');
    // 05R §7: enqueue + bounded-drain ONLY on a Draft->Active transition.
    // Archiving (Active->Draft) never notifies. Re-activating the SAME version
    // is idempotent: the event for that version is already 'processed', so no
    // duplicate alerts are sent. Non-fatal on drain failure.
    const trigger = shouldEnqueueOnToggle(prevIsActive, isActive);
    if (trigger) {
      const version = typeof prev.version === 'number' ? prev.version : 1;
      try {
        await enqueueAndProcessJobEvent(db, { jobId: id, jobVersion: version, trigger });
      } catch (err2) {
        console.error('[admin/jobs/[id]] 05R toggle drain failed (non-fatal):', err2 instanceof Error ? err2.message : err2);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/jobs/[id]] patch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'jobs.manage');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  try {
    const ref = db.collection('jobs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    await ref.delete();
    await logActivityServer(auth.user, 'delete', 'Job', id);
    revalidatePublicContent('jobs');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/jobs/[id]] delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
