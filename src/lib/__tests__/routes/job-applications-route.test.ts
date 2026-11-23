/**
 * job-applications-route.test.ts — POST /api/job-applications submission,
 * authenticated identity, persistence + duplicate prevention (Batch 8 test #5).
 *
 * Verifies meaningful behavior:
 *   - Unauthenticated POST is rejected (401) — no application doc written.
 *   - Authenticated POST with a published job + complete profile creates the
 *     application with candidateEmail = the SESSION email (never a client-
 *     supplied identity), status 'New', + a 201 with a reference + notification.
 *   - A second POST for the same (candidate, job) is rejected (409) by the
 *     transactional duplicate check — no second doc written.
 *   - A POST against a non-published job (isActive:false) is rejected (404).
 *   - A POST against a non-existent job is rejected (404).
 *   - A POST with an incomplete profile is rejected (422).
 *
 * Firebase Admin + the email transport are mocked. The Firestore fake
 * serializes the transaction so the dup check + insert are atomic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeFirestore } from '../../auth/__tests__/fake-firestore';

let fakeDb: FakeFirestore;
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => fakeDb,
  getAdminBucket: () => null, // route skips the resume attachment when null
}));

let sessionOk = true;
let sessionEmail = 'cand@example.com';
vi.mock('@/lib/auth/sessions', () => ({
  verifySession: vi.fn(async () =>
    sessionOk
      ? { ok: true, user: { email: sessionEmail, tier: 'user' } }
      : { ok: false, response: new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401 }) },
  ),
}));

vi.mock('@/lib/email', () => ({
  sendApplicationConfirmation: vi.fn(async () => ({ status: 'sent', detail: 'via:smtp', messageId: '<test>' })),
  SAFE_ATTACHMENT_BYTES: 3 * 1024 * 1024,
}));

vi.mock('@/lib/auth/security-events', () => ({ logSecurityEvent: vi.fn(async () => {}) }));

vi.mock('@/lib/submission-security', async (importOriginal) => {
  const orig = await importOriginal();
  return {
    ...orig,
    checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })),
    getClientId: vi.fn(() => 'test-client'),
  };
});

import { POST } from '@/app/api/job-applications/route';

const JOB_ID = 'job-react';
const EMAIL = 'cand@example.com';

function seedPublishedJob(): Promise<void> {
  return fakeDb.collection('jobs').doc(JOB_ID).set({
    title: 'Senior React Engineer', isActive: true, deletedAt: null,
  });
}
function seedCompleteProfile(email = EMAIL): Promise<void> {
  return fakeDb.collection('candidates').doc(email).set({
    email, fullName: 'Jane Doe', phone: '555-0100',
    currentLocation: 'Bangalore', skills: ['React', 'Node.js'],
    resumeStoragePath: 'candidates/' + email + '/resumes/1.pdf',
  });
}

function applyReq(jobId = JOB_ID): Request {
  return new Request('http://localhost/api/job-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, confirmSubmission: true }),
  });
}

beforeEach(() => {
  fakeDb = new FakeFirestore();
  sessionOk = true;
  sessionEmail = EMAIL;
});

describe('POST /api/job-applications — authenticated submission', () => {
  it('rejects an unauthenticated request (401) + writes no application', async () => {
    sessionOk = false;
    await seedPublishedJob();
    await seedCompleteProfile();
    const res = await POST(applyReq());
    expect(res.status).toBe(401);
    const apps = await fakeDb.collection('jobApplications').get();
    expect(apps.size).toBe(0);
  });

  it('creates the application with candidateEmail = the session email (never client-supplied) + returns 201', async () => {
    await seedPublishedJob();
    await seedCompleteProfile();
    const res = await POST(applyReq());
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.reference).toBe('string');
    expect(data.reference).toMatch(/^APP_/);
    expect(data.notification).toBe('sent');
    // Exactly one application doc, owned by the session email.
    const apps = await fakeDb.collection('jobApplications').get();
    expect(apps.size).toBe(1);
    const doc = apps.docs[0].data() as { candidateEmail: string; candidateId: string; jobId: string; status: string; deletedAt: unknown };
    expect(doc.candidateEmail).toBe(EMAIL);
    expect(doc.candidateId).toBe(EMAIL);
    expect(doc.jobId).toBe(JOB_ID);
    expect(doc.status).toBe('New');
    expect(doc.deletedAt).toBeNull();
  });

  it('rejects a duplicate application (same candidate + job) with 409 + writes no second doc', async () => {
    await seedPublishedJob();
    await seedCompleteProfile();
    const first = await POST(applyReq());
    expect(first.status).toBe(201);
    const second = await POST(applyReq());
    expect(second.status).toBe(409);
    const apps = await fakeDb.collection('jobApplications').get();
    expect(apps.size).toBe(1); // still only one
  });

  it('rejects a non-published job (isActive:false) with 404', async () => {
    await fakeDb.collection('jobs').doc(JOB_ID).set({ title: 'Old role', isActive: false, deletedAt: null });
    await seedCompleteProfile();
    const res = await POST(applyReq());
    expect(res.status).toBe(404);
  });

  it('rejects a deleted job (deletedAt set) with 404', async () => {
    await fakeDb.collection('jobs').doc(JOB_ID).set({ title: 'Gone', isActive: true, deletedAt: '2026-01-01' });
    await seedCompleteProfile();
    const res = await POST(applyReq());
    expect(res.status).toBe(404);
  });

  it('rejects a non-existent job with 404', async () => {
    await seedCompleteProfile();
    const res = await POST(applyReq('does-not-exist'));
    expect(res.status).toBe(404);
  });

  it('rejects an incomplete profile with 422 (meetsApplicationMinimum gate)', async () => {
    await seedPublishedJob();
    // No skills, no headline, no designation → fails the minimum.
    await fakeDb.collection('candidates').doc(EMAIL).set({ email: EMAIL, fullName: 'Jane Doe' });
    const res = await POST(applyReq());
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.incomplete).toBe(true);
  });

  it('rejects when confirmSubmission is not true (validation)', async () => {
    await seedPublishedJob();
    await seedCompleteProfile();
    const res = await POST(new Request('http://localhost/api/job-applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: JOB_ID, confirmSubmission: false }),
    }));
    expect(res.status).toBe(400);
  });
});
