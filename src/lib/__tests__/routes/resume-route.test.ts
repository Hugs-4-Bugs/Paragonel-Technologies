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
const fakeBucket = {
  bucket: () => ({
    file: (path: string) => ({
      save: vi.fn(async (buf: Buffer) => { fileStore.set(path, buf); }),
      getSignedUrl: vi.fn(async () => [`https://signed.example/${path}`]),
      getMetadata: vi.fn(async () => [{ size: 1024 }]),
      download: vi.fn(async () => [fileStore.get(path) ?? Buffer.from('')]),
      delete: vi.fn(async () => { fileStore.delete(path); }),
    }),
  }),
};

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => fakeDb,
  getAdminBucket: () => fakeBucket,
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
