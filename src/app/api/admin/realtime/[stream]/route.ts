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

const HEARTBEAT_MS = 25_000;

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

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
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
        try { controller.close(); } catch { /* already closed */ }
      };

      // The first `data:` event clears the client's loading state. We do NOT
      // send a named `event: open` (it would shadow EventSource's built-in
      // `onopen`); the built-in open event + first data event are enough.

      const unsubscribe = subscribeStream(stream, db, {
        onData: (payload) => enqueue(`data: ${JSON.stringify(payload)}\n\n`),
        onError: (err) => {
          // Send a terminal error payload the client hook recognizes (it closes
          // the EventSource so it does NOT reconnect-loop on a permanent error
          // such as a missing index), then close the stream.
          enqueue(`data: ${JSON.stringify({ __error: err.message || 'realtime error' })}\n\n`);
          close();
        },
      });

      // Heartbeat keeps the connection alive through buffering proxies.
      const heartbeat = setInterval(() => enqueue(': ping\n\n'), HEARTBEAT_MS);

      // Tear down on disconnect (tab close / function invocation end).
      const onAbort = () => {
        clearInterval(heartbeat);
        try { unsubscribe(); } catch { /* already closed */ }
        close();
      };
      request.signal.addEventListener('abort', onAbort, { once: true });
    },
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
