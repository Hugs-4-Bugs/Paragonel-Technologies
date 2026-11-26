/**
 * audit-log.test.ts — unit tests for the enriched server-generated audit helper.
 *
 * Coverage:
 *   - `sanitizeChangeSummary`: redacts secret-named fields (password/token/key/
 *     hash/otp/code) + sensitive paths (resumeStoragePath/signedUrl) to their
 *     NAME only; samples safe scalars; records nested object/array fields as
 *     "changed" with no value; returns null when nothing changed; truncates.
 *   - `writeAuditLog`: writes legacy + enriched fields; eventId + timestamp are
 *     SERVER-generated; returns the eventId; never throws (returns null) when
 *     the Admin SDK is null OR the Firestore write fails.
 *   - `logActivityServer` delegates to `writeAuditLog` (actor tier 'admin').
 *
 * Type: UNIT (in-memory fake Admin SDK; no Firebase/Supabase project connected).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';

// Hoisted mutable state so the firebase-admin mock factory can return a
// per-test-swappable db (vi.hoisted runs before vi.mock, so `state` is defined
// at mock-factory creation time; getDb() is only CALLED later, during tests).
const state = vi.hoisted(() => {
  const auditStore = new Map<string, Record<string, unknown>>();
  const fakeDb = {
    collection: () => ({
      doc: (id: string) => ({
        set: async (data: Record<string, unknown>) => { auditStore.set(id, { id, ...data }); },
      }),
      add: async (data: Record<string, unknown>) => {
        const id = 'auto_' + Math.random().toString(36).slice(2);
        auditStore.set(id, { id, ...data });
        return { id };
      },
    }),
  };
  const failingDb = {
    collection: () => ({
      doc: () => ({ set: async () => { throw new Error('firestore down'); } }),
    }),
  };
  let db: unknown = fakeDb;
  return {
    auditStore,
    fakeDb,
    failingDb,
    getDb: () => db,
    setDb: (v: unknown) => { db = v; },
  };
});

vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: () => state.getDb() }));

import { sanitizeChangeSummary, writeAuditLog, newCorrelationId } from '@/lib/audit-log';
import { logActivityServer } from '@/lib/admin-auth';

const { auditStore, fakeDb, failingDb, setDb } = state;

beforeEach(() => {
  auditStore.clear();
  setDb(fakeDb);
});

describe('sanitizeChangeSummary', () => {
  it('redacts secret-named fields to their NAME only (never stores the value)', () => {
    const s = sanitizeChangeSummary(
      { password: 'old', token: 't1', apiKey: 'k1' },
      { password: 'new', token: 't2', apiKey: 'k2' },
    );
    expect(s).not.toBeNull();
    expect(s!.redactedFields).toEqual(expect.arrayContaining(['password', 'token', 'apiKey']));
    expect(s!.samples).toEqual({});
    expect(JSON.stringify(s)).not.toContain('old');
    expect(JSON.stringify(s)).not.toContain('t1');
    expect(JSON.stringify(s)).not.toContain('k2');
  });

  it('samples safe scalar diffs (string/number/boolean) for non-secret fields', () => {
    const s = sanitizeChangeSummary(
      { name: 'Jane', age: 30, active: true },
      { name: 'Jane2', age: 31, active: false },
    );
    expect(s!.changedFields).toEqual(expect.arrayContaining(['name', 'age', 'active']));
    expect(s!.samples.name).toEqual({ before: 'Jane', after: 'Jane2' });
    expect(s!.samples.age).toEqual({ before: 30, after: 31 });
    expect(s!.samples.active).toEqual({ before: true, after: false });
  });

  it('records nested object/array + sensitive-path fields as "changed" with NO value', () => {
    const s = sanitizeChangeSummary(
      { skills: ['a'], resumeStoragePath: 'candidates/x@y.com/resumes/1_a.pdf' },
      { skills: ['a', 'b'], resumeStoragePath: 'candidates/x@y.com/resumes/2_b.pdf' },
    );
    expect(s!.changedFields).toEqual(expect.arrayContaining(['skills', 'resumeStoragePath']));
    expect(s!.samples.resumeStoragePath).toBeUndefined();
    expect(JSON.stringify(s)).not.toContain('candidates/x@y.com/resumes/1_a.pdf');
  });

  it('returns null when nothing changed', () => {
    expect(sanitizeChangeSummary({ a: 1 }, { a: 1 })).toBeNull();
  });

  it('truncates long string samples to 120 chars + ellipsis', () => {
    const long = 'x'.repeat(500);
    const s = sanitizeChangeSummary({ bio: 'short' }, { bio: long });
    expect(typeof s!.samples.bio!.after).toBe('string');
    expect((s!.samples.bio!.after as string).length).toBeLessThanOrEqual(121);
    expect((s!.samples.bio!.after as string).endsWith('…')).toBe(true);
  });

  it('handles missing before / after gracefully', () => {
    const s = sanitizeChangeSummary(null, { name: 'New' });
    expect(s!.changedFields).toContain('name');
    expect(s!.samples.name).toEqual({ after: 'New' });
  });
});

describe('writeAuditLog', () => {
  it('writes a doc with legacy AND enriched fields, server-generated eventId + timestamp', async () => {
    const id = await writeAuditLog({
      actor: { id: 'admin@x.com', role: 'super_admin', tier: 'admin' },
      eventType: 'job_create',
      entityType: 'job',
      entityId: 'job123',
      outcome: 'success',
      correlationId: 'corr1',
      metadata: { title: 'Eng' },
      changeSummary: sanitizeChangeSummary({ title: 'old' }, { title: 'new' }),
    });
    expect(id).not.toBeNull();
    const doc = auditStore.get(id!);
    expect(doc).toBeDefined();
    expect(typeof doc!.eventId).toBe('string');
    expect(doc!.eventId).toBe(id);
    expect(doc!.timestamp).toBeInstanceOf(Timestamp);
    expect(doc!.actorId).toBe('admin@x.com');
    expect(doc!.actorRole).toBe('super_admin');
    expect(doc!.actorTier).toBe('admin');
    expect(doc!.eventType).toBe('job_create');
    expect(doc!.entityType).toBe('job');
    expect(doc!.entityId).toBe('job123');
    expect(doc!.outcome).toBe('success');
    expect(doc!.correlationId).toBe('corr1');
    expect(doc!.metadata).toEqual({ title: 'Eng' });
    // Legacy (backward compat with the Activity page / GET route).
    expect(doc!.adminEmail).toBe('admin@x.com');
    expect(doc!.action).toBe('job_create');
    expect(doc!.resourceType).toBe('job');
    expect(doc!.resourceId).toBe('job123');
  });

  it('defaults outcome to "success" + correlationId/metadata to null when omitted', async () => {
    const id = await writeAuditLog({
      actor: { id: 'cand@x.com', role: 'candidate', tier: 'user' },
      eventType: 'candidate_profile_update',
      entityType: 'candidate',
      entityId: 'cand@x.com',
    });
    const doc = auditStore.get(id!);
    expect(doc!.outcome).toBe('success');
    expect(doc!.correlationId).toBeNull();
    expect(doc!.metadata).toBeNull();
  });

  it('returns null (never throws) when the Admin SDK is unconfigured', async () => {
    setDb(null);
    const id = await writeAuditLog({
      actor: { id: 'a@x.com', role: 'admin', tier: 'admin' },
      eventType: 'job_update',
      entityType: 'job',
      entityId: 'j1',
    });
    expect(id).toBeNull();
    expect(auditStore.size).toBe(0);
  });

  it('returns null (never throws) when the Firestore write fails', async () => {
    setDb(failingDb);
    const id = await writeAuditLog({
      actor: { id: 'a@x.com', role: 'admin', tier: 'admin' },
      eventType: 'job_update',
      entityType: 'job',
      entityId: 'j1',
    });
    expect(id).toBeNull();
  });
});

describe('logActivityServer delegation', () => {
  it('writes an enriched record with actor tier "admin" + the legacy field mapping', async () => {
    await logActivityServer(
      { email: 'ops@x.com', role: 'admin' },
      'job_publish_toggle',
      'Job',
      'job9',
    );
    expect(auditStore.size).toBe(1);
    const doc = [...auditStore.values()][0];
    expect(doc.actorTier).toBe('admin');
    expect(doc.actorRole).toBe('admin');
    expect(doc.actorId).toBe('ops@x.com');
    expect(doc.eventType).toBe('job_publish_toggle');
    expect(doc.outcome).toBe('success');
    expect(doc.adminEmail).toBe('ops@x.com');
    expect(doc.action).toBe('job_publish_toggle');
    expect(doc.resourceType).toBe('Job');
    expect(doc.resourceId).toBe('job9');
  });
});

describe('newCorrelationId', () => {
  it('returns a non-empty hex string', () => {
    const c = newCorrelationId();
    expect(typeof c).toBe('string');
    expect(c.length).toBeGreaterThan(0);
    expect(/^[0-9a-f]+$/.test(c)).toBe(true);
  });
});
