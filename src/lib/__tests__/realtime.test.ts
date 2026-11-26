/**
 * realtime.test.ts — unit tests for the admin realtime SSE helper.
 *
 * Coverage:
 *   - `isRealtimeStream` / `streamRequiredPermission`: the 4 streams are
 *     recognized; `activity` requires `security.audit.read` (super_admin), the
 *     list/stats streams require only an active admin session.
 *   - `subscribeStream` (list): registers an Admin-SDK `onSnapshot`, emits the
 *     serialized docs array on the first snapshot, and the returned
 *     `unsubscribe` tears the listener down (no leak).
 *   - `subscribeStream` (error): a Firestore listener error is forwarded to
 *     `onError` (the SSE route then closes the stream).
 *   - `subscribeStream` (stats): fans out to 5 listeners, emits a combined
 *     debounced `{ stats, recentApplications }` payload only after ALL 5 have
 *     reported their initial snapshot (mirrors GET /api/admin/stats), and the
 *     `unsubscribe` tears all 5 down.
 *
 * Type: UNIT (in-memory fake db with a controllable onSnapshot; no Firebase
 * project connected, no live SSE socket).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Avoid loading the real admin-auth (next/cache / sessions chain) — serializeDoc
// is a pure snapshot→JSON helper.
vi.mock('@/lib/admin-auth', () => ({
  serializeDoc: (snap: { id: string; data: () => unknown }) => {
    const d = snap.data();
    return { id: snap.id, ...((d && typeof d === 'object') ? d as Record<string, unknown> : {}) };
  },
}));

import {
  subscribeStream,
  isRealtimeStream,
  streamRequiredPermission,
} from '@/lib/realtime/admin-realtime';

/** Minimal fake Firestore supporting the onSnapshot chain subscribeStream uses. */
function makeFakeDb() {
  type L = { onNext: (snap: unknown) => void; onErr: (e: { message?: string }) => void; unsubbed: boolean };
  const listeners: L[] = [];
  const chain = () => ({
    where: () => chain(),
    orderBy: () => chain(),
    limit: () => chain(),
    onSnapshot: (onNext: (snap: unknown) => void, onErr: (e: { message?: string }) => void) => {
      const l: L = { onNext, onErr, unsubbed: false };
      listeners.push(l);
      return () => { l.unsubbed = true; };
    },
  });
  return { db: { collection: () => chain() } as unknown as Parameters<typeof subscribeStream>[1], listeners };
}

beforeEach(() => { vi.restoreAllMocks(); });

describe('stream registry + RBAC', () => {
  it('recognizes the 4 admin streams', () => {
    expect(isRealtimeStream('activity')).toBe(true);
    expect(isRealtimeStream('applications')).toBe(true);
    expect(isRealtimeStream('jobs')).toBe(true);
    expect(isRealtimeStream('stats')).toBe(true);
    expect(isRealtimeStream('foo')).toBe(false);
  });

  it('requires security.audit.read (super_admin) for the activity stream only', () => {
    expect(streamRequiredPermission('activity')).toBe('security.audit.read');
    expect(streamRequiredPermission('applications')).toBeUndefined();
    expect(streamRequiredPermission('jobs')).toBeUndefined();
    expect(streamRequiredPermission('stats')).toBeUndefined();
  });
});

describe('subscribeStream — list stream (activity)', () => {
  it('emits the serialized docs array on snapshot + the unsubscribe tears the listener down', () => {
    const { db, listeners } = makeFakeDb();
    const onData = vi.fn();
    const onError = vi.fn();
    const unsub = subscribeStream('activity', db, { onData, onError });

    expect(listeners.length).toBe(1);
    // Fire a snapshot with two docs.
    listeners[0].onNext({
      docs: [
        { id: 'a1', data: () => ({ action: 'job_create', adminEmail: 'x@y.com' }) },
        { id: 'a2', data: () => ({ action: 'resume_download', adminEmail: 'z@y.com' }) },
      ],
    });
    expect(onData).toHaveBeenCalledTimes(1);
    const payload = onData.mock.calls[0][0] as unknown[];
    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({ id: 'a1', action: 'job_create' });
    expect(payload[1]).toMatchObject({ id: 'a2', action: 'resume_download' });

    // Cleanup: no leak.
    expect(listeners[0].unsubbed).toBe(false);
    unsub();
    expect(listeners[0].unsubbed).toBe(true);
  });

  it('forwards a Firestore listener error to onError', () => {
    const { db, listeners } = makeFakeDb();
    const onData = vi.fn();
    const onError = vi.fn();
    subscribeStream('jobs', db, { onData, onError });
    listeners[0].onErr({ message: 'permission-denied' });
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toContain('permission-denied');
  });
});

describe('subscribeStream — stats stream', () => {
  it('emits a combined debounced payload only after all 5 listeners report, then unsub all', async () => {
    const { db, listeners } = makeFakeDb();
    const onData = vi.fn();
    const onError = vi.fn();
    const unsub = subscribeStream('stats', db, { onData, onError });

    // 5 listeners: 4 counts + 1 recent-apps.
    expect(listeners).toHaveLength(5);

    // Fire only 4 — no emit yet (waits for the 5th).
    listeners[0].onNext({ size: 10 }); // jobs
    listeners[1].onNext({ size: 3 });  // blogPosts
    listeners[2].onNext({ size: 7 });  // leads
    listeners[3].onNext({ size: 42 }); // subscribers
    await new Promise((r) => setTimeout(r, 60)); // before debounce window elapses
    expect(onData).not.toHaveBeenCalled();

    // Fire the 5th (recent applications docs).
    listeners[4].onNext({
      docs: [
        { id: 'app1', data: () => ({ candidateName: 'Jane', jobTitle: 'Eng' }) },
      ],
    });

    // Debounce is ~120ms; wait for it to flush.
    await new Promise((r) => setTimeout(r, 160));
    expect(onData).toHaveBeenCalledTimes(1);
    const payload = onData.mock.calls[0][0] as {
      stats: { jobs: number; blogs: number; leads: number; subscribers: number };
      recentApplications: { id: string; candidateName?: string }[];
    };
    expect(payload.stats).toEqual({ jobs: 10, blogs: 3, leads: 7, subscribers: 42 });
    expect(payload.recentApplications).toHaveLength(1);
    expect(payload.recentApplications[0]).toMatchObject({ id: 'app1', candidateName: 'Jane' });

    // Cleanup tears down ALL 5 listeners.
    expect(listeners.some((l) => l.unsubbed)).toBe(false);
    unsub();
    expect(listeners.every((l) => l.unsubbed)).toBe(true);
  });

  it('does not emit if the db is unconfigured-like (onError forwarded, no throw)', () => {
    const { db, listeners } = makeFakeDb();
    const onData = vi.fn();
    const onError = vi.fn();
    subscribeStream('stats', db, { onData, onError });
    listeners[0].onErr({ message: 'unavailable' });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onData).not.toHaveBeenCalled();
  });
});
