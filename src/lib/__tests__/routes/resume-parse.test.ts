/**
 * resume-parse.test.ts — resume parsing validation + provider failure handling
 * (Batch 8 route-handler test #2).
 *
 * Verifies the route's honest parse-failure contract (Prompt 05Q §8):
 *   - When analyzeResume returns valid structured output, the response carries
 *     parsed.data with confirmed:false (extracted, never auto-saved).
 *   - When the provider fails (missing_key / quota / timeout / invalid output),
 *     the route returns parsed:null + an honest parseError, AND the resume is
 *     still stored (resumeStoragePath set) so the candidate can fill the profile
 *     manually. The route never fabricates an extraction.
 *
 * The provider (Gemini) is mocked; this test does NOT claim real AI delivery.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeFirestore } from '../../auth/__tests__/fake-firestore';
import { ResumeAnalysisError } from '@/lib/ai/resume-analysis-error';

let fakeDb: FakeFirestore;
const fileStore = new Map<string, Buffer>();
const fakeBucket = {
  bucket: () => ({
    file: (path: string) => ({
      save: vi.fn(async (buf: Buffer) => { fileStore.set(path, buf); }),
      getSignedUrl: vi.fn(async () => ['https://signed.example/' + path]),
      getMetadata: vi.fn(async () => [{ size: 1024 }]),
      download: vi.fn(async () => [Buffer.from('')]),
      delete: vi.fn(async () => {}),
    }),
  }),
};

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => fakeDb,
  getAdminBucket: () => fakeBucket,
}));

vi.mock('@/lib/auth/sessions', () => ({
  verifySession: vi.fn(async () => ({ ok: true, user: { email: 'cand@example.com', tier: 'user' } })),
}));

// Controlled parse outcome: success by default, overridable per-test.
let parseFn: () => Promise<unknown> = async () => ({
  name: 'Jane Doe', email: 'cand@example.com', phone: '555-0100',
  location: 'Bangalore', experienceYears: 5, skills: ['React'],
  techStack: [], employmentHistory: [], education: 'B.Tech',
  educationEntries: [], projects: [], certifications: [], domain: 'Frontend',
  seniority: 'Mid', summary: 'Frontend engineer.',
});
vi.mock('@/ai/flows/analyze-resume-flow', () => ({
  analyzeResume: vi.fn(async () => parseFn()),
}));

vi.mock('@/lib/auth/security-events', () => ({ logSecurityEvent: vi.fn(async () => {}) }));

vi.mock('@/lib/resume-security', () => ({
  MAX_RESUME_BYTES: 5 * 1024 * 1024,
  ALLOWED_RESUME_TYPES: ['application/pdf'],
  detectResumeKind: vi.fn(() => 'pdf'),
  sanitizeFileName: vi.fn((name: string) => name),
  validateResumePath: vi.fn((p: string) => typeof p === 'string' && p.startsWith('candidates/') && p.includes('/resumes/')),
}));

import { POST as resumePost } from '@/app/api/candidate/resume/route';

function pdfFile(): File {
  return new File([Buffer.from('%PDF-1.4 content')], 'resume.pdf', { type: 'application/pdf' });
}

beforeEach(() => {
  fakeDb = new FakeFirestore();
  fileStore.clear();
  parseFn = async () => ({
    name: 'Jane Doe', email: 'cand@example.com', phone: '555-0100',
    location: 'Bangalore', experienceYears: 5, skills: ['React'],
    techStack: [], employmentHistory: [], education: 'B.Tech',
    educationEntries: [], projects: [], certifications: [], domain: 'Frontend',
    seniority: 'Mid', summary: 'Frontend engineer.',
  });
});

async function postResume() {
  const fd = new FormData();
  fd.append('resume', pdfFile());
  return resumePost(new Request('http://localhost/api/candidate/resume', { method: 'POST', body: fd }));
}

describe('POST /api/candidate/resume — parse success', () => {
  it('returns parsed.data marked confirmed:false (extracted, not auto-saved)', async () => {
    const res = await postResume();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.parsed).not.toBeNull();
    expect(data.parsed.confirmed).toBe(false);
    expect(data.parsed.data.name).toBe('Jane Doe');
    expect(data.parsed.data.skills).toContain('React');
    expect(data.parseError).toBeUndefined();
  });
});

describe('POST /api/candidate/resume — provider failure (honest, non-fatal)', () => {
  it('returns parsed:null + an honest parseError when the provider is missing its key, AND still stores the resume', async () => {
    parseFn = async () => { throw new ResumeAnalysisError('missing_key', 'AI resume parsing is not configured.'); };
    const res = await postResume();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.parsed).toBeNull();
    expect(typeof data.parseError).toBe('string');
    expect(data.parseError.length).toBeGreaterThan(0);
    // The resume is still stored + the profile carries the path.
    expect(data.resumeStoragePath).toMatch(/^candidates\/cand@example\.com\/resumes\//);
    const snap = await fakeDb.collection('candidates').doc('cand@example.com').get();
    expect(snap.exists).toBe(true);
    expect((snap.data() as { resumeStoragePath: string }).resumeStoragePath).toMatch(/^candidates\/cand@example\.com\/resumes\//);
  });

  it('returns an honest parseError on invalid_output (never fabricates an extraction)', async () => {
    parseFn = async () => { throw new ResumeAnalysisError('invalid_output', 'AI extraction returned no structured output.'); };
    const res = await postResume();
    const data = await res.json();
    expect(data.parsed).toBeNull();
    expect(data.parseError).toMatch(/parse|manually/i);
  });

  it('returns an honest parseError on a generic (non-classified) provider failure', async () => {
    parseFn = async () => { throw new Error('connect ECONNREFUSED'); };
    const res = await postResume();
    const data = await res.json();
    expect(data.parsed).toBeNull();
    expect(typeof data.parseError).toBe('string');
    // Resume still stored despite the parse failure.
    expect(data.resumeStoragePath).toMatch(/^candidates\/cand@example\.com\/resumes\//);
  });
});
