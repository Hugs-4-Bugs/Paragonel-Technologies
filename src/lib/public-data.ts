/**
 * public-data.ts — server-side public content fetchers (Phase 1A perf + reliability).
 *
 * Root cause being fixed: the public list/detail pages (/services, /careers, /blog,
 * /blog/[slug]) were Client Components using `useCollection` against Firestore
 * collections whose `allow read: if resource.data.X == ...` rules deny ALL reads
 * in production (resource.data is undefined for `list`; the get comparison throws
 * a null-value error). Result: skeletons that never resolve, "Post Not Found",
 * and blank Services/Careers/Blog pages on the live site.
 *
 * This module moves every public read to the SERVER via the Admin SDK, which
 * bypasses firestore.rules entirely, filters to the public subset (active /
 * published / non-deleted) server-side, paginated/limited, and serializes
 * Firestore Timestamps to ISO strings so the client never has to interpret
 * `{seconds, nanoseconds}`. Public pages are now Server Components (SSR with
 * data — no client SDK bundle, no onSnapshot realtime subscription, no blank
 * page). Inactive / draft / soft-deleted records can never leak because the
 * server controls the query.
 *
 * Fallback: if the Admin SDK is not configured (e.g. missing env at build time),
 * these return the static base data from `@/lib/data` so pages still render
 * real content instead of crashing — never an empty page presented as "loaded".
 */
import type { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { baseServices, dummyJobs, blogPosts as staticBlogPosts } from '@/lib/data';

/** Convert a Firestore Timestamp / Date / unknown into an ISO string (or null). */
function toISO(value: unknown): string | null {
  if (!value) return null;
  // Admin SDK Timestamp shape
  if (typeof value === 'object' && value !== null && 'seconds' in value && 'nanoseconds' in value) {
    const ts = value as Timestamp;
    return new Date(ts.seconds * 1000 + ts.nanoseconds / 1e6).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  try {
    const d = new Date(value as any);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/** Normalize a Firestore doc into a plain JSON-safe object with ISO dates. */
function serializeDoc<T extends Record<string, any>>(snap: { id: string; data: () => T }): T & { id: string } {
  const data = snap.data();
  const out: Record<string, any> = { ...data, id: snap.id };
  for (const key of ['createdAt', 'updatedAt', 'postedDate', 'publishedAt', 'publishAt', 'date'] as const) {
    if (out[key] !== undefined) {
      const iso = toISO(out[key]);
      if (iso) out[key] = iso;
    }
  }
  // deletedAt may be null or a Timestamp — normalize to null | ISO so client
  // equality checks (`deletedAt == null`) work after JSON serialization.
  out.deletedAt = out.deletedAt ? toISO(out.deletedAt) : null;
  return out as T & { id: string };
}

/** Public services: active, non-deleted, ordered. Merged with static base. */
export async function getPublicServices(limit = 50): Promise<any[]> {
  const db = getAdminDb();
  if (!db) {
    // Static fallback so the page is never blank when Firestore isn't configured.
    return baseServices.filter((s) => s.isActive).slice(0, limit);
  }
  try {
    const snap = await db
      .collection('services')
      .where('isActive', '==', true)
      .where('deletedAt', '==', null)
      .orderBy('order', 'asc')
      .limit(limit)
      .get();
    const dynamic = snap.docs.map((d) => serializeDoc(d as any));
    // Merge static base (guaranteed core catalogue) with dynamic CMS records,
    // de-duplicated by slug so admin edits to a base service show through.
    const slugs = new Set(dynamic.map((s) => s.slug));
    const base = baseServices.filter((s) => s.isActive && !slugs.has(s.slug));
    return [...base, ...dynamic].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  } catch (err) {
    console.error('[public-data] getPublicServices failed:', err instanceof Error ? err.message : err);
    return baseServices.filter((s) => s.isActive);
  }
}

/** Public jobs: active, non-deleted, newest first. */
export async function getPublicJobs(limit = 50): Promise<any[]> {
  const db = getAdminDb();
  if (!db) {
    return dummyJobs.filter((j) => j.isActive).slice(0, limit);
  }
  try {
    const snap = await db
      .collection('jobs')
      .where('isActive', '==', true)
      .where('deletedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => serializeDoc(d as any));
  } catch (err) {
    console.error('[public-data] getPublicJobs failed:', err instanceof Error ? err.message : err);
    return dummyJobs.filter((j) => j.isActive);
  }
}

/**
 * Single public job by Firestore id (for /careers/[id]). Returns null if the
 * doc is missing, inactive, or soft-deleted — so draft/closed/archived jobs
 * can never be rendered publicly (the route calls notFound() on null). Falls
 * back to dummyJobs when the Admin SDK is not configured.
 */
export async function getPublicJobById(id: string): Promise<any | null> {
  if (!id) return null;
  const db = getAdminDb();
  if (!db) {
    return dummyJobs.find((j) => j.id === id && j.isActive) ?? null;
  }
  try {
    const snap = await db.collection('jobs').doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as any;
    if (!data.isActive || data.deletedAt) return null;
    return serializeDoc(snap as any);
  } catch (err) {
    console.error('[public-data] getPublicJobById failed:', err instanceof Error ? err.message : err);
    return dummyJobs.find((j) => j.id === id && j.isActive) ?? null;
  }
}

/** Public blog posts: published, non-deleted, newest first. */
export async function getPublishedPosts(limit = 50): Promise<any[]> {
  const db = getAdminDb();
  if (!db) {
    return staticBlogPosts.filter((p) => p.status === 'Published').slice(0, limit);
  }
  try {
    const snap = await db
      .collection('blogPosts')
      .where('status', '==', 'Published')
      .where('deletedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => serializeDoc(d as any));
  } catch (err) {
    console.error('[public-data] getPublishedPosts failed:', err instanceof Error ? err.message : err);
    return staticBlogPosts.filter((p) => p.status === 'Published');
  }
}

/** Single published post by slug (for /blog/[slug]). null if not found / not public. */
export async function getPublishedPostBySlug(slug: string): Promise<any | null> {
  if (!slug) return null;
  const db = getAdminDb();
  if (!db) {
    return staticBlogPosts.find((p) => p.slug === slug && p.status === 'Published') ?? null;
  }
  try {
    const snap = await db
      .collection('blogPosts')
      .where('slug', '==', slug)
      .where('status', '==', 'Published')
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return serializeDoc(snap.docs[0] as any);
  } catch (err) {
    console.error('[public-data] getPublishedPostBySlug failed:', err instanceof Error ? err.message : err);
    return staticBlogPosts.find((p) => p.slug === slug && p.status === 'Published') ?? null;
  }
}

/** Slugs of all published posts (for generateStaticParams). */
export async function getPublishedSlugs(): Promise<{ slug: string }[]> {
  const posts = await getPublishedPosts(100);
  return posts.map((p) => ({ slug: p.slug })).filter((s) => s.slug);
}
