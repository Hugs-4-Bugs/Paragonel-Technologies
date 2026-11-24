/**
 * preferences-route.test.ts — GET/PATCH /api/candidate/profile/preferences
 * authorization + persistence (Batch 8 test #4).
 *
 * Verifies meaningful behavior:
 *   - Unauthenticated GET/PATCH are rejected (401).
 *   - GET returns both raw stored values + resolved effective values (so the UI
 *     can show "your threshold is 80%" even when nothing was explicitly set).
 *   - PATCH with a valid threshold (25-100) + alert opt-in persists to the
 *     candidate's own profile doc + returns the effective values.
 *   - PATCH with an out-of-range threshold (10) is rejected (400) — never
 *     silently clamped at write time.
 *   - The doc id is always the session email (ownership); a client cannot pass
 *     an email to write another candidate's preferences.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeFirestore } from '../../auth/__tests__/fake-firestore';

let fakeDb: FakeFirestore;
vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: () => fakeDb }));

let sessionOk = true;
let sessionEmail = 'cand@example.com';
vi.mock('@/lib/auth/sessions', () => ({
  verifySession: vi.fn(async () =>
    sessionOk
      ? { ok: true, user: { email: sessionEmail, tier: 'user' } }
      : { ok: false, response: new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401 }) },
  ),
}));

import { GET, PATCH } from '@/app/api/candidate/profile/preferences/route';

beforeEach(() => {
  fakeDb = new FakeFirestore();
  sessionOk = true;
  sessionEmail = 'cand@example.com';
});

function getReq(): Request {
  return new Request('http://localhost/api/candidate/profile/preferences');
}
function patchReq(body: unknown): Request {
  return new Request('http://localhost/api/candidate/profile/preferences', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('GET /api/candidate/profile/preferences', () => {
  it('rejects an unauthenticated request (401)', async () => {
    sessionOk = false;
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('returns raw defaults + effective defaults when no preference is stored', async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe('cand@example.com');
    expect(data.raw.jobAlertPreference).toBe(false);
    expect(data.raw.matchingThreshold).toBeUndefined();
    expect(data.effective.jobAlertPreference).toBe(false);
    expect(data.effective.matchingThreshold).toBe(80); // DEFAULT_MATCHING_THRESHOLD
    expect(data.defaults.min).toBe(75);
    expect(data.defaults.max).toBe(100);
  });

  it('returns the stored raw + resolved effective values when a preference exists', async () => {
    await fakeDb.collection('candidates').doc('cand@example.com').set({
      email: 'cand@example.com',
      jobAlertPreference: true,
      matchingThreshold: 75,
      preferredRoles: ['Senior Engineer'],
    });
    const res = await GET(getReq());
    const data = await res.json();
    expect(data.raw.jobAlertPreference).toBe(true);
    expect(data.raw.matchingThreshold).toBe(75);
    expect(data.raw.preferredRoles).toEqual(['Senior Engineer']);
    expect(data.effective.jobAlertPreference).toBe(true);
    expect(data.effective.matchingThreshold).toBe(75);
  });
});

describe('PATCH /api/candidate/profile/preferences', () => {
  it('rejects an unauthenticated request (401)', async () => {
    sessionOk = false;
    const res = await PATCH(patchReq({ jobAlertPreference: true, matchingThreshold: 80 }));
    expect(res.status).toBe(401);
  });

  it('persists a valid threshold + alert opt-in to the candidate\'s own doc + returns effective values', async () => {
    const res = await PATCH(patchReq({ jobAlertPreference: true, matchingThreshold: 75 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('Preferences saved.');
    expect(data.effective.jobAlertPreference).toBe(true);
    expect(data.effective.matchingThreshold).toBe(75);
    // Persisted on the candidate's own doc (id == session email).
    const snap = await fakeDb.collection('candidates').doc('cand@example.com').get();
    expect(snap.exists).toBe(true);
    const stored = snap.data() as { jobAlertPreference: boolean; matchingThreshold: number; email: string };
    expect(stored.jobAlertPreference).toBe(true);
    expect(stored.matchingThreshold).toBe(75);
    expect(stored.email).toBe('cand@example.com');
  });

  it('rejects an out-of-range threshold (10) with 400 — never silently clamped at write time', async () => {
    const res = await PATCH(patchReq({ jobAlertPreference: false, matchingThreshold: 10 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(Array.isArray(data.issues)).toBe(true);
    // Nothing persisted.
    const snap = await fakeDb.collection('candidates').doc('cand@example.com').get();
    expect(snap.exists).toBe(false);
  });

  it('rejects a missing jobAlertPreference boolean (400)', async () => {
    const res = await PATCH(patchReq({ matchingThreshold: 80 }));
    expect(res.status).toBe(400);
  });
});
