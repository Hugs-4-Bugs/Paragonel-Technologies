/**
 * reconcile.test.ts — reconciliation utility coverage (Task 4): count parity,
 * duplicate-source detection, target-id collision detection, audit-row build.
 */
import { describe, it, expect } from 'vitest';
import {
  reconcileCounts,
  detectDuplicateSources,
  detectTargetIdCollisions,
  buildAuditRows,
} from '../reconcile';
import type { FirestoreDoc } from '../mapper';

const doc = (id: string, data: Record<string, unknown>): FirestoreDoc => ({ id, data });

describe('reconcileCounts', () => {
  it('reports matched tables (source === target)', () => {
    const docs = { jobs: [doc('j1', { jobId: 'j1', title: 'Eng' })] };
    const r = reconcileCounts(docs, { jobs: 1 });
    expect(r.matched.find((m) => m.table === 'jobs')).toBeDefined();
    expect(r.missingInTarget.length).toBe(0);
    expect(r.extraInTarget.length).toBe(0);
  });

  it('reports missing-in-target when source > target', () => {
    const docs = { jobs: [doc('j1', { title: 'A' }), doc('j2', { title: 'B' })] };
    const r = reconcileCounts(docs, { jobs: 1 });
    expect(r.missingInTarget.find((m) => m.table === 'jobs')?.source).toBe(2);
    expect(r.missingInTarget[0].target).toBe(1);
  });

  it('reports extra-in-target when target > source', () => {
    const docs = { jobs: [doc('j1', { title: 'A' })] };
    const r = reconcileCounts(docs, { jobs: 3 });
    expect(r.extraInTarget.find((m) => m.table === 'jobs')?.target).toBe(3);
  });

  it('ignores unmapped collections (e.g. otpRequests)', () => {
    const docs = { otpRequests: [doc('o1', {})] };
    const r = reconcileCounts(docs, {});
    expect(r.matched.length).toBe(0);
    expect(r.missingInTarget.length).toBe(0);
  });
});

describe('detectDuplicateSources', () => {
  it('flags the same (collection, id) appearing more than once', () => {
    const docs = { jobs: [doc('j1', { title: 'A' }), doc('j1', { title: 'A dup' })] };
    const dups = detectDuplicateSources(docs);
    expect(dups).toEqual([{ collection: 'jobs', id: 'j1', count: 2 }]);
  });
  it('returns empty when all source ids are unique', () => {
    const docs = { jobs: [doc('j1', {}), doc('j2', {})] };
    expect(detectDuplicateSources(docs)).toEqual([]);
  });
});

describe('detectTargetIdCollisions', () => {
  it('flags two users docs with the same email mapping to the same profile uuid', () => {
    // Both docs carry email 'dup@example.com' → both derive uuidV5('user:dup@example.com')
    // → one would silently win the profiles upsert.
    const docs = {
      users: [
        doc('dup1', { email: 'dup@example.com' }),
        doc('dup2', { email: 'dup@example.com' }),
      ],
    };
    const collisions = detectTargetIdCollisions(docs);
    expect(collisions.length).toBe(1);
    expect(collisions[0].targetTable).toBe('profiles');
    expect(collisions[0].sources.length).toBe(2);
  });

  it('does NOT flag a single doc (no collision)', () => {
    const docs = { users: [doc('u1', { email: 'a@b.com' })] };
    expect(detectTargetIdCollisions(docs)).toEqual([]);
  });

  it('does NOT flag child-table fan-out as a collision', () => {
    // One candidate with many skills → many candidate_skills rows share
    // candidate_id, but only ONE parent candidate_profiles row → not a collision.
    const docs = {
      candidates: [doc('c@b.com', { email: 'c@b.com', skills: ['a', 'b', 'c'] })],
    };
    expect(detectTargetIdCollisions(docs)).toEqual([]);
  });
});

describe('buildAuditRows', () => {
  it('produces one audit row per source doc parent with a deterministic checksum', () => {
    const docs = {
      jobs: [doc('j1', { jobId: 'j1', title: 'Eng' })],
      users: [doc('u1', { email: 'u1@example.com' })],
    };
    const rows = buildAuditRows(docs);
    expect(rows.length).toBe(2);
    const jobRow = rows.find((r) => r.source_collection === 'jobs');
    expect(jobRow).toBeDefined();
    expect(jobRow!.target_table).toBe('jobs');
    expect(jobRow!.checksum.length).toBe(64);
    expect(jobRow!.fallback_timestamp_used).toBe('1970-01-01T00:00:00.000Z');
  });

  it('is deterministic: same docs → same checksums', () => {
    const docs = { jobs: [doc('j1', { title: 'Eng' })] };
    const a = buildAuditRows(docs);
    const b = buildAuditRows(docs);
    expect(a[0].checksum).toBe(b[0].checksum);
  });

  it('ignores unmapped collections', () => {
    const docs = { otpRequests: [doc('o1', {})] };
    expect(buildAuditRows(docs)).toEqual([]);
  });
});
