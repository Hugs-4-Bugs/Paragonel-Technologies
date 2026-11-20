/**
 * GET  /api/admin/blog  — list all blog posts (Phase 4, IU-0 slice 2).
 * POST /api/admin/blog  — create a blog post (+ initial revision + audit).
 *
 * Server-side authorized via Admin SDK. Replaces the client-side
 * `useCollection(collection(db,'blogPosts'))` + `addDoc(...)` on the admin blog
 * CMS, and the client `logActivity` call (which silently failed once
 * `adminActivityLogs` was locked in slice 1). The Admin SDK bypasses rules, so
 * the create + revision write + audit log all succeed post-lockdown.
 *
 * GET order: createdAt desc (matches the previous client query). Limit 500.
 * POST body: BlogCreateValues (validated); returns { id }.
 */
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdmin, serializeDoc, logActivityServer, serviceUnavailable } from '@/lib/admin-auth';
import { blogCreateSchema, buildBlogCreatePayload } from '@/lib/cms-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  try {
    const snap = await db.collection('blogPosts').orderBy('createdAt', 'desc').limit(500).get();
    const posts = snap.docs.map((d) => serializeDoc(d));
    return NextResponse.json({ posts });
  } catch (err) {
    console.error('[admin/blog] list failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getAdminDb();
  if (!db) return serviceUnavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = blogCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const payload = buildBlogCreatePayload(parsed.data);
    const ref = await db.collection('blogPosts').add(payload);

    // Store the initial revision (Admin SDK bypasses the locked revisions rule).
    await db
      .collection('blogPosts')
      .doc(ref.id)
      .collection('revisions')
      .add({ ...payload, timestamp: Timestamp.now() });

    await logActivityServer(auth.user, 'create', 'BlogPost', ref.id);
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('[admin/blog] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
