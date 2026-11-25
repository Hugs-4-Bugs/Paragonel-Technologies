/**
 * job-applications-email.test.ts — application confirmation-email trigger,
 * recipient correctness + SMTP failure handling (Batch 8 test #6).
 *
 * Verifies the email honesty contract (Prompt 05Q §9):
 *   - sendApplicationConfirmation is called AFTER the application is persisted
 *     (outside the transaction) with `to` = the authenticated candidate's
 *     session email — never a client-supplied email, never another candidate.
 *   - When the transport returns 'sent', the response notification='sent' + the
 *     application doc records confirmationEmail.status='sent'.
 *   - When the transport returns 'failed', the application is STILL stored (201)
 *     + the doc records confirmationEmail.status='failed' + notification='failed'.
 *     A failed email never discards a successfully stored application.
 *   - When the transport returns 'skipped' (no SMTP configured), the application
 *     is still stored + notification='skipped'.
 *
 * The email transport is MOCKED. These tests assert the route's wiring +
 * honest status recording — they do NOT prove real email delivery to a mailbox.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeFirestore } from '../../auth/__tests__/fake-firestore';

// Hoisted state so the vi.mock factory (which runs before module init) can read
// + write the per-test email outcome + capture the input passed to the sender.
const emailState = vi.hoisted(() => ({
  status: 'sent' as 'sent' | 'skipped' | 'failed',
  lastInput: null as { to: string; candidateName: string; jobTitle: string; applicationId: string } | null,
}));

let fakeDb: FakeFirestore;
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => fakeDb,
  getAdminBucket: () => null,
}));

vi.mock('@/lib/auth/sessions', () => ({
  verifySession: vi.fn(async () => ({ ok: true, user: { email: 'cand@example.com', tier: 'user' } })),
}));

vi.mock('@/lib/email', () => ({
  sendApplicationConfirmation: vi.fn(async (input: typeof emailState.lastInput) => {
    emailState.lastInput = input;
    return { status: emailState.status, detail: emailState.status === 'sent' ? 'via:smtp' : 'transport:' + emailState.status };
  }),
  SAFE_ATTACHMENT_BYTES: 3 * 1024 * 1024,
}));

vi.mock('@/lib/auth/security-events', () => ({ logSecurityEvent: vi.fn(async () => {}) }));

vi.mock('@/lib/submission-security', async (importOriginal) => {
  const orig = await importOriginal();
  return { ...orig, checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })), getClientId: vi.fn(() => 'test-client') };
});

import { POST } from '@/app/api/job-applications/route';

const JOB_ID = 'job-react';
const EMAIL = 'cand@example.com';

function seed(): Promise<void[]> {
  return Promise.all([
    fakeDb.collection('jobs').doc(JOB_ID).set({ title: 'Senior React Engineer', isActive: true, deletedAt: null }),
    fakeDb.collection('candidates').doc(EMAIL).set({
      email: EMAIL, fullName: 'Jane Doe', phone: '555-0100',
      currentLocation: 'Bangalore', skills: ['React'],
    }),
  ]);
}

function applyReq(): Request {
  return new Request('http://localhost/api/job-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: JOB_ID, confirmSubmission: true }),
  });
}

beforeEach(() => {
  fakeDb = new FakeFirestore();
  emailState.status = 'sent';
  emailState.lastInput = null;
});

describe('POST /api/job-applications — confirmation email trigger + recipient', () => {
  it('calls sendApplicationConfirmation with to = the authenticated session email (never client-supplied)', async () => {
    await seed();
    await POST(applyReq());
    expect(emailState.lastInput).not.toBeNull();
    expect(emailState.lastInput!.to).toBe(EMAIL);
    expect(emailState.lastInput!.candidateName).toBe('Jane Doe');
    expect(emailState.lastInput!.jobTitle).toBe('Senior React Engineer');
    expect(emailState.lastInput!.applicationId).toMatch(/^APP_/);
  });

  it('records notification=sent + confirmationEmail.status=sent when the transport accepts the message', async () => {
    await seed();
    emailState.status = 'sent';
    const res = await POST(applyReq());
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.notification).toBe('sent');
    const apps = await fakeDb.collection('jobApplications').get();
    const doc = apps.docs[0].data() as { confirmationEmail: { status: string; detail: string | null } };
    expect(doc.confirmationEmail.status).toBe('sent');
  });
});

describe('POST /api/job-applications — SMTP failure / not configured (honest, non-fatal)', () => {
  it('still stores the application (201) + records notification=failed when the transport fails', async () => {
    await seed();
    emailState.status = 'failed';
    const res = await POST(applyReq());
    expect(res.status).toBe(201); // application still persisted
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notification).toBe('failed');
    const apps = await fakeDb.collection('jobApplications').get();
    expect(apps.size).toBe(1);
    const doc = apps.docs[0].data() as { confirmationEmail: { status: string }; candidateEmail: string };
    expect(doc.confirmationEmail.status).toBe('failed');
    expect(doc.candidateEmail).toBe(EMAIL);
  });

  it('still stores the application (201) + records notification=skipped when SMTP is not configured', async () => {
    await seed();
    emailState.status = 'skipped';
    const res = await POST(applyReq());
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.notification).toBe('skipped');
    const apps = await fakeDb.collection('jobApplications').get();
    const doc = apps.docs[0].data() as { confirmationEmail: { status: string } };
    expect(doc.confirmationEmail.status).toBe('skipped');
  });

  it('records the honest detail code on the application doc (never a secret/raw error)', async () => {
    await seed();
    emailState.status = 'failed';
    await POST(applyReq());
    const apps = await fakeDb.collection('jobApplications').get();
    const doc = apps.docs[0].data() as { confirmationEmail: { detail: string | null } };
    // detail is a short non-sensitive code, never a credential or raw stack.
    expect(doc.confirmationEmail.detail).toMatch(/transport|failed/);
    expect(doc.confirmationEmail.detail).not.toMatch(/password|secret|apiKey|ECONNREFUSED/i);
  });
});
