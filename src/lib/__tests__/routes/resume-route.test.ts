/**
 * resume-route.test.ts — POST/GET /api/candidate/resume authorization +
 * candidate ownership (Batch 8 route-handler test #1).
 *
 * Verifies meaningful behavior, not just status codes:
 *   - Unauthenticated POST is rejected (401) — no Storage write, no profile write.
 *   - Authenticated POST stores the resume under candidates/{email}/resumes/ +
 *     records resumeStoragePath on the profile, and returns parsed data marked
 *     confirmed:false (never auto-saved as verified).
 *   - Authenticated GET returns a short-lived signed URL for the candidate's OWN
 *     resume (the session email determines the path; a client cannot read another
 *     candidate's resume).
 *   - A tampered resumeStoragePath (not under the candidate's own folder) is
 *     rejected with 403 on GET (defense-in-depth ownership guard).
 *
 * External providers (Firebase Admin, SMTP) are mocked. File byte-level
 * validation is mocked (it has its own 23-case suite in resume-security.test.ts);
 * this test exercises the route's wiring, ownership, and persistence.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeFirestore } from '../../auth/__tests__/fake-firestore';

let fakeDb: FakeFirestore;
const fileStore = new Map<string, Buffer>();

// Resume storage is mocked as an in-memory backend (the route talks to
// @/lib/resume-storage, not Firebase Admin Storage directly). fileStore backs
// the upload/download/delete/signed-url mocks so the route's ownership,
// persistence, and orphan-cleanup behavior can be asserted without a real
// Supabase or Firebase Storage backend.
vi.mock('@/lib/resume-storage', () => ({
  uploadResume: vi.fn(async ({ email, fileName, buf }: { email: string; fileName: string; buf: Buffer }) => {
    const path = `candidates/${email}/resumes/${Date.now()}_${fileName}`;
    fileStore.set(path, buf);
    return { path, size: buf.length };
  }),
  createResumeSignedUrl: vi.fn(async (path: string) => ({ url: `https://signed.example/${path}`, expiresIn: 300 })),
  downloadResumeBytes: vi.fn(async (path: string) => ({ buf: fileStore.get(path) ?? Buffer.from(''), size: fileStore.get(path)?.length ?? 0 })),
  deleteResumeObject: vi.fn(async (path: string) => { fileStore.delete(path); }),
  ResumeStorageError: class ResumeStorageError extends Error {
    code: string;
    constructor(code: string, message: string) { super(message); this.code = code; }
  },
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => fakeDb,
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

vi.mock('@/ai/flows/analyze-resume-flow', () => ({
  analyzeResume: vi.fn(async () => ({
    name: 'Jane Doe', email: 'cand@example.com', phone: '555-0100',
    location: 'Bangalore', experienceYears: 5, skills: ['React', 'Node.js'],
    techStack: [], employmentHistory: [], education: 'B.Tech',
    educationEntries: [], projects: [], certifications: [], domain: 'Frontend',
    seniority: 'Mid', summary: 'Frontend engineer.',
  })),
}));

vi.mock('@/lib/auth/security-events', () => ({ logSecurityEvent: vi.fn(async () => {}) }));

// File byte-level validation is unit-tested elsewhere; mock to a controlled
// happy path so this test focuses on route wiring + ownership.
vi.mock('@/lib/resume-security', () => ({
  MAX_RESUME_BYTES: 5 * 1024 * 1024,
  ALLOWED_RESUME_TYPES: ['application/pdf'],
  detectResumeKind: vi.fn(() => 'pdf'),
  sanitizeFileName: vi.fn((name: string) => name),
  validateResumePath: vi.fn((p: string) =>
    typeof p === 'string' && p.startsWith('candidates/') && p.includes('/resumes/')),
}));

import { POST as resumePost, GET as resumeGet } from '@/app/api/candidate/resume/route';

function pdfFile(): File {
  const buf = Buffer.from('%PDF-1.4 test resume content');
  return new File([buf], 'jane-resume.pdf', { type: 'application/pdf' });
}

beforeEach(() => {
  fakeDb = new FakeFirestore();
  fileStore.clear();
  sessionOk = true;
  sessionEmail = 'cand@example.com';
});

describe('POST /api/candidate/resume — authorization + ownership', () => {
  it('rejects an unauthenticated request with 401 (no Storage write, no profile write)', async () => {
    sessionOk = false;
    const fd = new FormData();
    fd.append('resume', pdfFile());
    const res = await resumePost(new Request('http://localhost/api/candidate/resume', { method: 'POST', body: fd }));
    expect(res.status).toBe(401);
    expect(fileStore.size).toBe(0);
    const snap = await fakeDb.collection('candidates').doc('cand@example.com').get();
    expect(snap.exists).toBe(false);
  });

  it('stores the resume under the authenticated candidate\'s folder + returns parsed data marked confirmed:false', async () => {
    const fd = new FormData();
    fd.append('resume', pdfFile());
    const res = await resumePost(new Request('http://localhost/api/candidate/resume', { method: 'POST', body: fd }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resumeStoragePath).toMatch(/^candidates\/cand@example\.com\/resumes\//);
    expect(data.parsed).not.toBeNull();
    expect(data.parsed.confirmed).toBe(false);
    expect(data.parsed.data.name).toBe('Jane Doe');
    // The profile doc carries the storage PATH (not a public URL).
    const snap = await fakeDb.collection('candidates').doc('cand@example.com').get();
    expect(snap.exists).toBe(true);
    expect((snap.data() as { resumeStoragePath: string }).resumeStoragePath).toMatch(/^candidates\/cand@example\.com\/resumes\//);
    // The object was actually written to Storage under the candidate-scoped path.
    expect([...fileStore.keys()].some((k) => k.startsWith('candidates/cand@example.com/resumes/'))).toBe(true);
  });

  it('returns 400 when no resume file is provided', async () => {
    const fd = new FormData();
    const res = await resumePost(new Request('http://localhost/api/candidate/resume', { method: 'POST', body: fd }));
    expect(res.status).toBe(400);
  });

  it('regression: Firestore profile-write failure returns a classified 500 (not an unhandled crash) + cleans up the orphaned Storage object (PHASE B4)', async () => {
    // Previously the Firestore write at route.ts:177 was UNGUARDED — if it threw
    // (Firestore unavailable / permissions / transient), the route crashed with
    // an unhandled 500 AFTER the resume was already stored, orphaning the resume
    // in Storage + showing the candidate a generic error with no recovery path.
    // Now the write is wrapped: on failure it returns a classified 500 + deletes
    // the just-uploaded object so it does not orphan.
    //
    // Use a fake whose .set() throws (simulating a Firestore write failure) but
    // whose .get() still works (the route reads the previous resume path first).
    const throwingDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false, id: 'cand@example.com', data: () => undefined, ref: {} }),
          set: async () => { throw new Error('7 PERMISSION_DENIED: missing or insufficient permissions'); },
        }),
      }),
    };
    fakeDb = throwingDb as unknown as FakeFirestore;

    const fd = new FormData();
    fd.append('resume', pdfFile());
    const res = await resumePost(new Request('http://localhost/api/candidate/resume', { method: 'POST', body: fd }));

    // 1. Classified 500 (NOT an unhandled crash / generic Next.js error page).
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.message).toMatch(/permission denied/i);
    expect(data.message).toMatch(/Firestore write access/);

    // 2. The just-uploaded Storage object was cleaned up (no orphan).
    expect([...fileStore.keys()].some((k) => k.startsWith('candidates/cand@example.com/resumes/'))).toBe(false);
  });
});

describe('GET /api/candidate/resume — ownership', () => {
  it('returns a signed URL for the authenticated candidate\'s own resume', async () => {
    // Seed a profile with a resume path owned by the candidate.
    await fakeDb.collection('candidates').doc('cand@example.com').set({
      email: 'cand@example.com',
      resumeStoragePath: 'candidates/cand@example.com/resumes/123_jane.pdf',
      resumeFileName: 'jane.pdf',
    });
    const res = await resumeGet(new Request('http://localhost/api/candidate/resume'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toMatch(/^https:\/\/signed\.example\//);
    expect(data.fileName).toBe('jane.pdf');
  });

  it('returns 404 when the candidate has no resume on file', async () => {
    // No profile doc seeded.
    const res = await resumeGet(new Request('http://localhost/api/candidate/resume'));
    expect(res.status).toBe(404);
  });

  it('rejects a tampered resumeStoragePath that is not under the candidate\'s own folder (403)', async () => {
    // An attacker should not be able to read another candidate's resume even if
    // the profile value were tampered. The route enforces the path prefix.
    await fakeDb.collection('candidates').doc('cand@example.com').set({
      email: 'cand@example.com',
      resumeStoragePath: 'candidates/other@example.com/resumes/secret.pdf',
      resumeFileName: 'secret.pdf',
    });
    const res = await resumeGet(new Request('http://localhost/api/candidate/resume'));
    expect(res.status).toBe(403);
  });
});
