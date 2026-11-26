/**
 * resume-delete-cleanup.test.ts — DELETE /api/candidate/resume hardening.
 *
 * Regression guards for the DB/realtime foundation batch:
 *   - SUCCESS: clears ALL resume fields on the profile (incl. resumeSizeBytes,
 *     which the upload route now persists) + writes a server-generated
 *     `candidate_resume_delete` audit record.
 *   - FIRESTORE-CLEAR FAILURE (G6): previously the Firestore metadata clear was
 *     UNGUARDED — a failure threw an unhandled 500 AFTER the storage object was
 *     already deleted (orphan-in-reverse). Now it is wrapped: on failure it
 *     returns a classified 500 (does NOT claim success) + writes a failure
 *     audit; the storage object delete still runs first (best-effort).
 *
 * External providers (Firebase Admin, Supabase Storage, the AI parser, the
 * audit writer) are mocked. This is a mocked-integration test (route wiring),
 * NOT a live Firebase/Supabase verification.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeFirestore } from '../../auth/__tests__/fake-firestore';

// Hoisted spies + swappable Admin SDK so vi.mock factories can reference them
// without a top-level-initialization TDZ (vi.hoisted runs before vi.mock).
const H = vi.hoisted(() => {
  const deleteSpy = vi.fn(async () => {});
  const writeAuditLogSpy = vi.fn(async () => 'ev1');
  let db: unknown = null;
  return {
    deleteSpy,
    writeAuditLogSpy,
    getDb: () => db,
    setDb: (v: unknown) => { db = v; },
  };
});

vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: () => H.getDb() }));
vi.mock('@/lib/resume-storage', () => ({
  deleteResumeObject: H.deleteSpy,
  ResumeStorageError: class ResumeStorageError extends Error {
    code: string;
    constructor(code: string, message: string) { super(message); this.code = code; }
  },
}));

let sessionOk = true;
vi.mock('@/lib/auth/sessions', () => ({
  verifySession: vi.fn(async () =>
    sessionOk
      ? { ok: true, user: { email: 'cand@example.com', tier: 'user' } }
      : { ok: false, response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) },
  ),
}));

vi.mock('@/ai/flows/analyze-resume-flow', () => ({ analyzeResume: vi.fn() }));

vi.mock('@/lib/resume-security', () => ({
  MAX_RESUME_BYTES: 5 * 1024 * 1024,
  ALLOWED_RESUME_TYPES: ['application/pdf'],
  detectResumeKind: () => 'pdf',
  sanitizeFileName: (s: string) => s,
  validateResumePath: (p: string) => typeof p === 'string' && p.startsWith('candidates/') && p.includes('/resumes/'),
}));

vi.mock('@/lib/audit-log', () => ({
  writeAuditLog: H.writeAuditLogSpy,
  newCorrelationId: () => 'corr1',
}));

import { DELETE } from '@/app/api/candidate/resume/route';

const { deleteSpy, writeAuditLogSpy, setDb } = H;

const EMAIL = 'cand@example.com';
const PATH = 'candidates/cand@example.com/resumes/1_jane.pdf';

beforeEach(() => {
  sessionOk = true;
  deleteSpy.mockClear();
  writeAuditLogSpy.mockClear();
});

describe('DELETE /api/candidate/resume — success', () => {
  it('clears ALL resume fields (incl. resumeSizeBytes) + writes a success audit', async () => {
    const fakeDb = new FakeFirestore();
    setDb(fakeDb);
    await fakeDb.collection('candidates').doc(EMAIL).set({
      email: EMAIL,
      resumeStoragePath: PATH,
      resumeFileName: 'jane.pdf',
      resumeContentType: 'application/pdf',
      resumeSizeBytes: 12345,
      resumeUploadedAt: { seconds: 1, nanoseconds: 0 },
    });

    const res = await DELETE(new Request('http://localhost/api/candidate/resume', { method: 'DELETE' }));
    expect(res.status).toBe(200);

    // Storage object deleted (best-effort, first).
    expect(deleteSpy).toHaveBeenCalledWith(PATH, { email: EMAIL });

    // All resume metadata cleared, incl. resumeSizeBytes (G7).
    const snap = await fakeDb.collection('candidates').doc(EMAIL).get();
    const d = snap.data() as Record<string, unknown>;
    expect(d.resumeStoragePath).toBeNull();
    expect(d.resumeFileName).toBeNull();
    expect(d.resumeContentType).toBeNull();
    expect(d.resumeSizeBytes).toBeNull();
    expect(d.resumeUploadedAt).toBeNull();

    // Server-generated success audit.
    expect(writeAuditLogSpy).toHaveBeenCalledTimes(1);
    const entry = writeAuditLogSpy.mock.calls[0][0];
    expect(entry.eventType).toBe('candidate_resume_delete');
    expect(entry.entityId).toBe(EMAIL);
    expect(entry.outcome).toBe('success');
    expect(entry.actor).toEqual({ id: EMAIL, role: 'candidate', tier: 'user' });
  });

  it('returns 404 when the candidate has no resume on file', async () => {
    const fakeDb = new FakeFirestore();
    setDb(fakeDb);
    const res = await DELETE(new Request('http://localhost/api/candidate/resume', { method: 'DELETE' }));
    expect(res.status).toBe(404);
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(writeAuditLogSpy).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/candidate/resume — Firestore-clear failure (G6)', () => {
  it('returns a classified 500 (NOT 200) + writes a failure audit; storage delete still ran', async () => {
    // get() returns the resume path; set() throws (Firestore clear fails AFTER
    // the storage object was already deleted).
    const profile = {
      email: EMAIL,
      resumeStoragePath: PATH,
      resumeFileName: 'jane.pdf',
      resumeSizeBytes: 12345,
    };
    const throwingDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: true, id: EMAIL, data: () => ({ ...profile }), ref: {} }),
          set: async () => { throw new Error('7 PERMISSION_DENIED: missing or insufficient permissions'); },
        }),
      }),
    };
    setDb(throwingDb as unknown as FakeFirestore);

    const res = await DELETE(new Request('http://localhost/api/candidate/resume', { method: 'DELETE' }));

    // 1. Classified 500 — does NOT falsely claim the resume was removed.
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toMatch(/could not clear your profile metadata/i);

    // 2. Storage object delete ran first (best-effort) — it is gone even though
    //    the metadata clear failed (the honest "metadata inconsistency" state).
    expect(deleteSpy).toHaveBeenCalledWith(PATH, { email: EMAIL });

    // 3. Failure audit written (server-generated actor).
    expect(writeAuditLogSpy).toHaveBeenCalledTimes(1);
    const entry = writeAuditLogSpy.mock.calls[0][0];
    expect(entry.eventType).toBe('candidate_resume_delete');
    expect(entry.outcome).toBe('failure');
    expect(entry.metadata?.reason).toBe('metadata_clear_failed');
  });
});
