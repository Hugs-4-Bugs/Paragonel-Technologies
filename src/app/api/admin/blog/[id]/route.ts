/**
 * GET   /api/admin/blog/[id]  — single blog post (admin edit form).
 * PUT   /api/admin/blog/[id]  — replace editable fields (edit form save).
 * PATCH /api/admin/blog/[id]  — publish/unpublish: body { status: 'Published'|'Draft' }.
 * DELETE /api/admin/blog/[id] — permanent delete (matches prior deleteDoc UX).
 *
 * Server-side authorized via Admin SDK. With `blogPosts` public read now
 * restricted to `status=='Published' && deletedAt==null`, the admin edit page
 * (which must read drafts) fetches here instead of getDoc().
 *
 * Auth: GET uses `verifyAdmin` (any active admin may read a draft for editing —
 * viewer has `cms.read`). PUT/PATCH use `verifyAdminPermission('cms.update')`;
 * DELETE uses `verifyAdminPermission('cms.delete')` — so a read-only `viewer`
 * cannot mutate. Every successful mutation purges the public blog cache
 * (`/blog`, `/blog/[slug]`, `/`) via `revalidatePublicContent` so edits appear
 * immediately on the public listing, article page, and homepage section.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, verifyAdminPermission, revalidatePublicContent, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import {
  blogEditSchema,
  buildBlogEditPayload,
  buildBlogTogglePayload,
} from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

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
    const snap = await db.collection('blogPosts').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post: serializeDoc(snap) });
  } catch (err) {
    console.error('[admin/blog/[id]] get failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
}

export async function PUT(
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

  const parsed = blogEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const ref = db.collection('blogPosts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const prevStatus = (snap.data()?.status as string | undefined);
    await ref.update(buildBlogEditPayload(parsed.data, prevStatus));
    await logActivityServer(auth.user, 'update', 'BlogPost', id);
    revalidatePublicContent('blog');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/blog/[id]] put failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

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

  if (
    typeof body !== 'object' ||
    body === null ||
    (body as any).status !== 'Published' && (body as any).status !== 'Draft'
  ) {
    return NextResponse.json(
      { error: 'Validation failed', issues: ["status must be 'Published' or 'Draft'"] },
      { status: 400 }
    );
  }
  const status = (body as { status: 'Published' | 'Draft' }).status;

  try {
    const ref = db.collection('blogPosts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const prevStatus = (snap.data()?.status as string | undefined);
    await ref.update(buildBlogTogglePayload(status, prevStatus));
    await logActivityServer(auth.user, status === 'Published' ? 'publish' : 'unpublish', 'BlogPost', id);
    revalidatePublicContent('blog');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/blog/[id]] patch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update post status' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminPermission(request, 'cms.delete');
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  const { id } = await params;
  try {
    const ref = db.collection('blogPosts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    await ref.delete();
    await logActivityServer(auth.user, 'delete', 'BlogPost', id);
    revalidatePublicContent('blog');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/blog/[id]] delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
