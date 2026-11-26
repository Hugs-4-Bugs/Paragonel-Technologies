/**
 * public-data-status.test.ts — verifies the status-aware verified-jobs fetcher
 * (chatbot honesty fix). This is the regression test for the defect where
 * `getVerifiedJobs` collapsed (a) Firestore index failure, (b) Firebase Admin
 * unconfigured, and (c) genuinely empty jobs into one indistinguishable empty
 * array — so the chatbot told users "no openings" when really the database was
 * unreachable.
 *
 * `getVerifiedJobsWithStatus` returns a discriminated result so callers can tell
 * the three cases apart, and falls back to an index-free query when the composite
 * index is missing/building (tagged `degraded: true`).
 */
import { describe, it, expect, vi } from 'vitest';

// Mutable holder so each test can install a different mock Admin Firestore.
const { adminDbHolder } = vi.hoisted(() => ({ adminDbHolder: { current: null as unknown } }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => adminDbHolder.current,
}));

import { getVerifiedJobsWithStatus, getVerifiedJobs } from '@/lib/public-data';

/** Build a mock Firestore db whose `.collection('jobs')...get()` returns `docs`,
 *  with optional first-get failure to simulate a composite-index error. */
function makeMockDb(docs: any[], opts?: { failFirstWith?: string; failAllWith?: string }) {
  let getCall = 0;
  const query: any = {
    where: () => query,
    orderBy: () => query,
    limit: () => query,
    get: async () => {
      getCall++;
      if (opts?.failAllWith) throw new Error(opts.failAllWith);
      if (opts?.failFirstWith && getCall === 1) throw new Error(opts.failFirstWith);
      return { docs: docs.map((d) => ({ id: d.id, data: () => d })) };
    },
  };
  return { collection: () => query };
}

const REAL_JOBS = [
  { id: 'a', title: 'Job A', isActive: true, deletedAt: null, createdAt: { seconds: 1000, nanoseconds: 0 } },
  { id: 'b', title: 'Job B', isActive: true, deletedAt: null, createdAt: { seconds: 2000, nanoseconds: 0 } }, // newer
  { id: 'c', title: 'Job C (soft-deleted)', isActive: true, deletedAt: { seconds: 5000, nanoseconds: 0 }, createdAt: { seconds: 3000, nanoseconds: 0 } },
];

describe('getVerifiedJobsWithStatus — status-aware fetch (chatbot honesty fix)', () => {
  it('returns admin_unconfigured when the Admin SDK is not initialized', async () => {
    adminDbHolder.current = null;
    const r = await getVerifiedJobsWithStatus(50);
    expect(r.status).toBe('admin_unconfigured');
    // No jobs array on this variant — callers must not treat it as "no openings".
  });

  it('returns ok + jobs when the composite-index query succeeds', async () => {
    adminDbHolder.current = makeMockDb(REAL_JOBS.slice(0, 2));
    const r = await getVerifiedJobsWithStatus(50);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.jobs).toHaveLength(2);
      expect(r.degraded).toBeUndefined(); // primary query worked — not degraded
    }
  });

  it('returns ok with empty jobs when the DB is up but no jobs published (NOT a failure)', async () => {
    adminDbHolder.current = makeMockDb([]);
    const r = await getVerifiedJobsWithStatus(50);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') expect(r.jobs).toEqual([]);
  });

  it('returns ok + degraded:true via the INDEX-FREE FALLBACK when the composite index is missing', async () => {
    // Primary composite query fails with FAILED_PRECONDITION (missing index);
    // the fallback single-equality query succeeds. Deleted jobs are filtered in
    // memory + results sorted by createdAt desc.
    adminDbHolder.current = makeMockDb(REAL_JOBS, {
      failFirstWith: 'FAILED_PRECONDITION: The query requires a composite index.',
    });
    const r = await getVerifiedJobsWithStatus(50);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.degraded).toBe(true); // index was unavailable — fallback used
      // Soft-deleted job C filtered out; sorted newest-first: B (2000) then A (1000).
      expect(r.jobs.map((j) => j.id)).toEqual(['b', 'a']);
    }
  });

  it('returns query_failed when a NON-index error occurs (no fallback attempted)', async () => {
    adminDbHolder.current = makeMockDb(REAL_JOBS, { failFirstWith: 'permission-denied' });
    const r = await getVerifiedJobsWithStatus(50);
    expect(r.status).toBe('query_failed');
    if (r.status === 'query_failed') expect(r.reason).toBe('query-error');
  });

  it('returns query_failed (index-fallback-failed) when both the primary + fallback queries fail', async () => {
    adminDbHolder.current = makeMockDb(REAL_JOBS, {
      failFirstWith: 'FAILED_PRECONDITION: needs an index',
      failAllWith: 'FAILED_PRECONDITION: needs an index',
    });
    const r = await getVerifiedJobsWithStatus(50);
    expect(r.status).toBe('query_failed');
    if (r.status === 'query_failed') expect(r.reason).toBe('index-fallback-failed');
  });

  it('getVerifiedJobs (backward-compat wrapper) returns just the jobs on ok, [] on failure', async () => {
    adminDbHolder.current = makeMockDb(REAL_JOBS.slice(0, 2));
    expect(await getVerifiedJobs(50)).toHaveLength(2);

    adminDbHolder.current = null;
    expect(await getVerifiedJobs(50)).toEqual([]); // admin unconfigured -> [] (no dummyJobs)

    adminDbHolder.current = makeMockDb([], { failFirstWith: 'FAILED_PRECONDITION: requires an index' });
    // index-free fallback succeeds with empty docs -> [] (still no dummyJobs)
    expect(await getVerifiedJobs(50)).toEqual([]);
  });
});
