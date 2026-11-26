/**
 * GET /api/admin/realtime/[stream] — Server-Sent-Events realtime for the Admin Portal.
 *
 * This is the "justified server-backed realtime mechanism" for an app whose
 * Firestore collections are ALL locked to client access (`allow read, write:
 * if false`). The browser cannot open a client-side `onSnapshot` (rules would
 * deny it, and loosening rules for realtime is forbidden). Instead the server
 * holds an Admin-SDK `onSnapshot` (authorized, scoped) and streams change
 * events to the admin browser over SSE.
 *
 * Auth: `verifySession` re-reads the `sessions/{sid}` + `admins/{email}` docs on
 * connect (same as every protected route). The `activity` stream additionally
 * requires `security.audit.read` (super_admin) because audit logs are
 * sensitive. EventSource sends the httpOnly session cookie same-origin, so no
 * token is exposed to the page.
 *
 * Streams (scoped — where + orderBy + limit, never unbounded):
 *   - activity    -> adminActivityLogs (newest 100)        [super_admin]
 *   - applications-> jobApplications, deletedAt==null (200) [any admin]
 *   - jobs        -> jobs, deletedAt==null (500)            [any admin]
 *   - stats       -> 5 dashboard count/recent-app queries   [any admin]
 *
 * Cleanup: the Firestore `onSnapshot` is torn down when the request aborts
 * (`request.signal`) — when the admin closes the tab or the Vercel function
 * invocation ends — so listeners are never leaked. A 25s heartbeat keeps the
 * connection alive through proxies.
 *
 * Vercel: a connection is bounded by the function `maxDuration`; EventSource
 * auto-reconnects (re-running the initial snapshot) so the UI stays
 * near-realtime. See src/lib/realtime/admin-realtime.ts for the scaling note.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { serviceUnavailable } from '@/lib/admin-auth';
import {
  subscribeStream,
  isRealtimeStream,
  streamRequiredPermission,
} from '@/lib/realtime/admin-realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Vercel serverless SSE cap (Pro). Declared so the 15s heartbeat fires well
// within the invocation lifetime on every tier — Hobby's default 10s would kill
// the function before a 25s heartbeat ever fired, making the keep-alive dead
// code on that tier.
export const maxDuration = 60;

const HEARTBEAT_MS = 15_000;
// Re-verify the admin session this often while a stream is open, so a
// revoked/suspended/demoted admin is disconnected within ~60s instead of holding
// the stream open for the full session-cookie TTL (auth was previously checked
// only at connect time).
const AUTH_REVERIFY_MS = 60_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stream: string }> },
) {
  const { stream } = await params;
  if (!isRealtimeStream(stream)) {
    return new Response(JSON.stringify({ error: 'Unknown realtime stream.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Per-stream RBAC: activity (audit logs) requires security.audit.read.
  const requiredPerm = streamRequiredPermission(stream);
  const auth = await verifySession(request, requiredPerm, 'admin');
  if (!auth.ok) return auth.response; // 401/403 JSON — EventSource fires onerror

  const db = getAdminDb();
  if (!db) return serviceUnavailable(); // 503

  const encoder = new TextEncoder();

  // Teardown state is defined once at the GET scope and shared by the abort
  // handler and the ReadableStream `cancel` hook, so a disconnect via EITHER
  // path (request.signal abort OR consumer-cancel) tears down the Firestore
  // onSnapshot listener + clears both intervals. `controller` is assigned in
  // `start()` (the only place it is available) and referenced by the closures.
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let authReverify: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let controller!: ReadableStreamDefaultController<Uint8Array>;

  const enqueue = (chunk: string) => {
    if (closed) return;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      // controller already closed — swallow.
    }
  };
  const close = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    if (authReverify) clearInterval(authReverify);
    if (unsubscribe) {
      try { unsubscribe(); } catch { /* already closed */ }
      unsubscribe = null;
    }
    try { controller.close(); } catch { /* already closed */ }
  };
  const onAbort = () => close();

  const body = new ReadableStream<Uint8Array>({
    start(ctl) {
      controller = ctl;

      // Ask the browser to wait 5s before auto-reconnecting (scales reconnects
      // away from the browser default ~3s; the hook also caps attempts). Sent
      // once at connect — EventSource honors `retry:` for all reconnects.
      enqueue('retry: 5000\n\n');

      unsubscribe = subscribeStream(stream, db, {
        onData: (payload) => {
          // Backpressure: if the client is stalled (internal queue full), drop
          // this snapshot — the next change re-emits the FULL bounded list, so a
          // dropped stale snapshot loses no information and prevents unbounded
          // queue growth (OOM risk on a slow/stalled client over a long host).
          // Control frames (retry/error/heartbeat) always enqueue.
          if ((controller.desiredSize ?? 1) <= 0) return;
          enqueue(`data: ${JSON.stringify(payload)}\n\n`);
        },
        onError: (err) => {
          // Terminal error payload the client hook recognizes (it closes the
          // EventSource so it does NOT reconnect-loop on a permanent error such
          // as a missing index), then close the stream.
          enqueue(`data: ${JSON.stringify({ __error: err.message || 'realtime error' })}\n\n`);
          close();
        },
      });

      // Heartbeat keeps the connection alive through buffering proxies.
      heartbeat = setInterval(() => enqueue(': ping\n\n'), HEARTBEAT_MS);

      // Re-verify the admin session periodically (not only at connect): a
      // revoked/suspended/demoted admin stops receiving data within
      // AUTH_REVERIFY_MS. On failure, tear the stream down (the client's
      // EventSource will then reconnect and be refused at connect → 401 → CLOSED).
      authReverify = setInterval(async () => {
        const recheck = await verifySession(request, requiredPerm, 'admin').catch(
          () => ({ ok: false as const }),
        );
        if (!recheck.ok) onAbort();
      }, AUTH_REVERIFY_MS);

      // If the signal is ALREADY aborted by the time start() runs,
      // addEventListener('abort') would never fire — guard it so the Firestore
      // listener is torn down immediately instead of leaking.
      if (request.signal.aborted) onAbort();
      else request.signal.addEventListener('abort', onAbort, { once: true });
    },
    // Second line of defense: if the consumer cancels the stream without an
    // abort signal (e.g. the Response body is dropped), tear down too.
    cancel() { onAbort(); },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering (nginx) so changes push immediately.
      'X-Accel-Buffering': 'no',
    },
  });
}
