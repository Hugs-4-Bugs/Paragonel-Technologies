/**
 * admin-realtime.ts — server-backed realtime for the Admin Portal.
 *
 * WHY SSE (not client onSnapshot):
 *   Every Firestore collection is locked to client access
 *   (`firestore.rules: allow read, write: if false`). The app's security model
 *   requires ALL Firestore access to go through the Admin SDK on the server, so
 *   a browser cannot open a client-side `onSnapshot` (it would be denied by
 *   rules, and loosening the rules to make realtime work is explicitly
 *   forbidden — "do not weaken authentication or authorization to make realtime
 *   subscriptions work"). The justified server-backed realtime mechanism is
 *   therefore SSE: the server holds an Admin-SDK `onSnapshot` (authorized,
 *   scoped) and streams change events to the admin browser over a
 *   Server-Sent-Events connection.
 *
 * WHAT THIS MODULE DOES:
 *   - `subscribeStream(stream, db, { onData, onError })` opens a scoped
 *     Admin-SDK `onSnapshot` for one named admin stream and returns an
 *     `unsubscribe` function. List streams (activity / applications / jobs) use
 *     a single bounded query (where + orderBy + limit). The `stats` stream
 *     fans out to the 5 dashboard count/recent-app queries and emits a combined,
 *     debounced stats payload on any change (mirroring /api/admin/stats).
 *   - Streams are SCOPED (where deletedAt==null / limit / orderBy) so a listener
 *     never subscribes to an entire collection unbounded.
 *   - `streamRequiredPermission(stream)` lets the SSE route enforce per-stream
 *     RBAC: `activity` (audit logs) requires `security.audit.read`
 *     (super_admin); the list/stats streams require only an active admin
 *     session (`verifyAdmin`), matching the existing list-page auth.
 *
 * CLEANUP: the returned `unsubscribe` tears down every `onSnapshot` + clears the
 * stats debounce timer. The SSE route calls it on connection abort
 *   (`request.signal`) so listeners are never leaked when the admin closes the
 *   tab / the Vercel function invocation ends.
 *
 * VERCEL CAVEAT: on Vercel serverless, a single SSE connection is bounded by the
 *   function `maxDuration` (10s free / 60s pro / longer on Fluid Compute). The
 *   browser `EventSource` auto-reconnects when the connection closes, so the UI
 *   stays near-realtime; each reconnect re-runs the initial snapshot. This is a
 *   genuine push mechanism (not polling), but on the free tier the effective
 *   cadence is bounded by `maxDuration`. For higher traffic, a long-running
 *   Node host or a managed realtime gateway would be the next step — documented,
 *   not implemented here.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { serializeDoc } from '@/lib/admin-auth';
import type { Permission } from '@/lib/auth/rbac';

export type RealtimeStream = 'activity' | 'applications' | 'jobs' | 'stats';

export const REALTIME_STREAMS: readonly RealtimeStream[] = ['activity', 'applications', 'jobs', 'stats'];

/** Per-stream RBAC. `undefined` means an active admin session is enough (verifyAdmin). */
export function streamRequiredPermission(stream: string): Permission | undefined {
  if (stream === 'activity') return 'security.audit.read'; // audit logs — super_admin only
  return undefined; // applications / jobs / stats — any active admin (matches list pages)
}

export function isRealtimeStream(stream: string): stream is RealtimeStream {
  return (REALTIME_STREAMS as readonly string[]).includes(stream);
}

export interface SubscribeOptions {
  /** Called with the full stream payload (array for list streams, object for stats). */
  onData: (payload: unknown) => void;
  /** Called once if the Firestore listener errors (permissions / unavailable). */
  onError: (err: Error) => void;
}

type Unsubscribe = () => void;

/** Bounded list queries that EXACTLY mirror the one-shot GET list routes
 * (orderBy + limit, NO deletedAt filter) so the realtime list matches what the
 * page rendered before. Never an unbounded collection listen. */
function buildListQuery(stream: RealtimeStream, db: Firestore) {
  switch (stream) {
    case 'activity':
      // Audit logs — newest first, capped at 100 (matches GET /api/admin/activity).
      return db.collection('adminActivityLogs').orderBy('timestamp', 'desc').limit(100);
    case 'applications':
      // All applications (incl. soft-deleted, which the ATS page shows with a
      // restore control), newest first, limit 500 — mirrors GET /api/admin/applications.
      return db.collection('jobApplications').orderBy('appliedAt', 'desc').limit(500);
    case 'jobs':
      // All jobs (jobs are hard-deleted via DELETE; soft-delete field exists),
      // newest first, limit 500 — mirrors GET /api/admin/jobs.
      return db.collection('jobs').orderBy('createdAt', 'desc').limit(500);
    default:
      return null;
  }
}

/**
 * Open a scoped realtime subscription. Returns an `unsubscribe` that tears down
 * every underlying listener. For list streams the payload is the serialized
 * docs array; for `stats` it is `{ stats, recentApplications }` (debounced).
 *
 * The caller (SSE route) is responsible for closing the subscription when the
 * HTTP connection ends (`request.signal`).
 */
export function subscribeStream(
  stream: RealtimeStream,
  db: Firestore,
  opts: SubscribeOptions,
): Unsubscribe {
  if (stream === 'stats') return subscribeStats(db, opts);

  const query = buildListQuery(stream, db);
  if (!query) {
    opts.onError(new Error(`Unknown realtime stream: ${stream}`));
    return () => {};
  }
  // Emit the full serialized docs array on every snapshot (initial + changes).
  // The client hook replaces its list + dedups by id, so re-emitting the full
  // bounded list is simpler + correct (lists are capped at 100-500 docs).
  const unsub = query.onSnapshot(
    (snap) => opts.onData(snap.docs.map((d) => serializeDoc(d))),
    (err) => opts.onError(new Error(err.message || 'realtime listener error')),
  );
  return () => {
    try { unsub(); } catch { /* already closed */ }
  };
}

/** Stats payload shape (mirrors GET /api/admin/stats). */
export interface StatsPayload {
  stats: { jobs: number; blogs: number; leads: number; subscribers: number };
  recentApplications: Record<string, unknown>[];
}

interface StatsParts {
  jobs: number | null;
  posts: number | null;
  leads: number | null;
  subs: number | null;
  recentApps: { id: string; data: () => unknown }[] | null;
}

/**
 * Subscribe to the 5 dashboard count/recent-app queries and emit a combined
 * stats payload (debounced ~120ms) whenever any one changes. Mirrors the
 * computation in GET /api/admin/stats exactly.
 */
function subscribeStats(db: Firestore, opts: SubscribeOptions): Unsubscribe {
  const parts: StatsParts = { jobs: null, posts: null, leads: null, subs: null, recentApps: null };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const emit = () => {
    timer = null;
    if (closed) return;
    if (
      parts.jobs === null ||
      parts.posts === null ||
      parts.leads === null ||
      parts.subs === null ||
      parts.recentApps === null
    ) {
      return; // wait until every listener has reported at least its initial snapshot
    }
    const payload: StatsPayload = {
      stats: {
        jobs: parts.jobs,
        blogs: parts.posts,
        leads: parts.leads,
        subscribers: parts.subs,
      },
      recentApplications: parts.recentApps.map((d) => serializeDoc(d)),
    };
    opts.onData(payload);
  };
  const scheduleEmit = () => {
    if (closed || timer) return;
    timer = setTimeout(emit, 120);
  };
  const onErr = (e: { message?: string }) =>
    opts.onError(new Error(e?.message || 'stats listener error'));

  const unsubs: Unsubscribe[] = [];
  // Count queries (mirror /api/admin/stats: jobs/blogPosts/leads non-deleted;
  // newsletterSubscribers unfiltered — matches the one-shot route). Each emits
  // the count via snap.size; the recent-app query emits the docs array.
  unsubs.push(
    db.collection('jobs').where('deletedAt', '==', null).onSnapshot(
      (s) => { parts.jobs = s.size; scheduleEmit(); },
      onErr,
    ),
  );
  unsubs.push(
    db.collection('blogPosts').where('deletedAt', '==', null).onSnapshot(
      (s) => { parts.posts = s.size; scheduleEmit(); },
      onErr,
    ),
  );
  unsubs.push(
    db.collection('leads').where('deletedAt', '==', null).onSnapshot(
      (s) => { parts.leads = s.size; scheduleEmit(); },
      onErr,
    ),
  );
  unsubs.push(
    db.collection('newsletterSubscribers').onSnapshot(
      (s) => { parts.subs = s.size; scheduleEmit(); },
      onErr,
    ),
  );
  unsubs.push(
    db.collection('jobApplications').orderBy('appliedAt', 'desc').limit(6).onSnapshot(
      (s) => { parts.recentApps = s.docs; scheduleEmit(); },
      onErr,
    ),
  );

  return () => {
    closed = true;
    if (timer) { clearTimeout(timer); timer = null; }
    for (const u of unsubs) {
      try { u(); } catch { /* already closed */ }
    }
  };
}
