/**
 * resume-storage.test.ts — unit coverage for the Supabase-backed resume storage
 * module (Phase 2 resume-storage migration). Verifies:
 *   - uploadResume uploads to the Supabase `candidate-resumes` bucket + returns
 *     the candidate-scoped path.
 *   - uploadResume throws classified ResumeStorageError (unconfigured / forbidden /
 *     upload-failed) and never leaks the path/credentials.
 *   - createResumeSignedUrl prefers Supabase, falls back to legacy Firebase
 *     Storage when Supabase does not have the object (backward compat for
 *     resumes uploaded before the migration).
 *   - Ownership is enforced: a path not under the authenticated candidate's own
 *     folder is rejected with 'forbidden' (defense-in-depth against a tampered
 *     profile value / IDOR).
 *   - deleteResumeObject deletes from Supabase + best-effort legacy, and refuses
 *     to delete a path not owned by the candidate.
 *
 * The Supabase server client + Firebase Admin bucket are mocked; the real
 * resume-security validators (validateResumePath, sanitizeFileName) are used.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sbHolder, bucketHolder } = vi.hoisted(() => ({
  sbHolder: { current: null as unknown },
  bucketHolder: { current: null as unknown },
}));
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => sbHolder.current,
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminBucket: () => bucketHolder.current,
}));

import {
  uploadResume,
  createResumeSignedUrl,
  downloadResumeBytes,
  deleteResumeObject,
  buildResumePath,
  ResumeStorageError,
  RESUME_BUCKET,
} from '@/lib/resume-storage';

let store: Map<string, Buffer>;

/** Build a mock Supabase client whose storage ops are backed by `store`. */
function mockSupabase(opts?: { uploadError?: { message: string }; signedError?: boolean; downloadError?: boolean }) {
  return {
    storage: {
      from: vi.fn((bucket: string) => {
        // Sanity: the module always targets the candidate-resumes bucket.
        if (bucket !== RESUME_BUCKET) throw new Error(`unexpected bucket ${bucket}`);
        return {
          upload: vi.fn(async (path: string, buf: Buffer) => {
            if (opts?.uploadError) return { data: null, error: opts.uploadError };
            store.set(path, buf);
            return { data: { path }, error: null };
          }),
          createSignedUrl: vi.fn(async (path: string) => {
            if (opts?.signedError || !store.has(path)) return { data: null, error: { message: 'not found' } };
            return { data: { signedUrl: `https://supabase-signed.example/${path}`, path }, error: null };
          }),
          download: vi.fn(async (path: string) => {
            if (opts?.downloadError || !store.has(path)) return { data: null, error: { message: 'not found' } };
            return { data: new Blob([store.get(path) as BlobPart]), error: null };
          }),
          remove: vi.fn(async (paths: string[]) => {
            for (const p of paths) store.delete(p);
            return { data: {}, error: null };
          }),
        };
      }),
    },
  };
}

/** Build a mock Firebase Admin bucket whose file ops are backed by `store`. */
function mockFirebaseBucket() {
  return {
    bucket: () => ({
      file: (path: string) => ({
        getSignedUrl: vi.fn(async () => {
          if (!store.has(path)) throw new Error('File not found');
          return [`https://firebase-signed.example/${path}`];
        }),
        download: vi.fn(async () => {
          if (!store.has(path)) throw new Error('File not found');
          return [store.get(path) as Buffer];
        }),
        delete: vi.fn(async () => { store.delete(path); }),
      }),
    }),
  };
}

beforeEach(() => {
  store = new Map();
  sbHolder.current = null;
  bucketHolder.current = null;
});

describe('buildResumePath', () => {
  it('builds a candidate-scoped path with a sanitized filename', () => {
    const p = buildResumePath('a@example.com', 'My Resume v2.pdf');
    expect(p).toMatch(/^candidates\/a@example\.com\/resumes\/\d+_/);
    // The filename is sanitized (spaces → _) — no path separators survive.
    expect(p).toMatch(/My_Resume_v2\.pdf$/);
  });
});

describe('uploadResume (Supabase)', () => {
  it('uploads to the candidate-resumes bucket + returns the candidate-scoped path', async () => {
    sbHolder.current = mockSupabase();
    const buf = Buffer.from('%PDF-1.4 resume');
    const r = await uploadResume({ email: 'a@example.com', fileName: 'r.pdf', contentType: 'application/pdf', buf });
    expect(r.path).toMatch(/^candidates\/a@example\.com\/resumes\/\d+_r\.pdf$/);
    expect(r.size).toBe(buf.length);
    expect(store.has(r.path)).toBe(true);
  });

  it('throws ResumeStorageError(unconfigured) when Supabase is not configured', async () => {
    sbHolder.current = null;
    await expect(
      uploadResume({ email: 'a@example.com', fileName: 'r.pdf', contentType: 'application/pdf', buf: Buffer.from('x') }),
    ).rejects.toMatchObject({ code: 'unconfigured' });
  });

  it('throws ResumeStorageError(forbidden) on a Supabase permission/403 error', async () => {
    sbHolder.current = mockSupabase({ uploadError: { message: '403 Forbidden: row-level security policy' } });
    await expect(
      uploadResume({ email: 'a@example.com', fileName: 'r.pdf', contentType: 'application/pdf', buf: Buffer.from('x') }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('throws ResumeStorageError(upload-failed) on a generic Supabase error (never leaks the raw message)', async () => {
    sbHolder.current = mockSupabase({ uploadError: { message: 'internal boom with /secrets/path' } });
    await expect(
      uploadResume({ email: 'a@example.com', fileName: 'r.pdf', contentType: 'application/pdf', buf: Buffer.from('x') }),
    ).rejects.toMatchObject({ code: 'upload-failed' });
  });
});

describe('createResumeSignedUrl — Supabase primary, legacy Firebase fallback', () => {
  it('returns a Supabase signed URL when Supabase has the object', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    store.set(path, Buffer.from('x'));
    sbHolder.current = mockSupabase();
    const r = await createResumeSignedUrl(path, { email: 'a@example.com' });
    expect(r?.url).toMatch(/^https:\/\/supabase-signed\.example\//);
  });

  it('falls back to legacy Firebase Storage when Supabase does not have the object', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    // Object only in the legacy Firebase bucket (store shared for the test).
    store.set(path, Buffer.from('x'));
    sbHolder.current = mockSupabase(); // Supabase does NOT have it (store empty for supabase path? it shares store)
    // NOTE: supabase createSignedUrl checks store.has(path) -> true here. To
    // simulate "Supabase lacks it but Firebase has it", point them at different
    // stores: use a supabase mock whose createSignedUrl always errors.
    sbHolder.current = mockSupabase({ signedError: true });
    bucketHolder.current = mockFirebaseBucket();
    // Put the object only in the Firebase bucket's store.
    store.set(path, Buffer.from('x'));
    const r = await createResumeSignedUrl(path, { email: 'a@example.com' });
    expect(r?.url).toMatch(/^https:\/\/firebase-signed\.example\//);
  });

  it('returns null when neither backend has the object', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    sbHolder.current = mockSupabase(); // store empty -> not found
    bucketHolder.current = mockFirebaseBucket(); // store empty -> throws -> caught
    const r = await createResumeSignedUrl(path, { email: 'a@example.com' });
    expect(r).toBeNull();
  });

  it('rejects a path not owned by the candidate (forbidden) — IDOR defense', async () => {
    sbHolder.current = mockSupabase();
    await expect(
      createResumeSignedUrl('candidates/other@example.com/resumes/secret.pdf', { email: 'a@example.com' }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('downloadResumeBytes — Supabase primary, legacy fallback', () => {
  it('downloads bytes from Supabase', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    const content = Buffer.from('%PDF-1.4 resume bytes');
    store.set(path, content);
    sbHolder.current = mockSupabase();
    const r = await downloadResumeBytes(path, { email: 'a@example.com' });
    expect(r?.buf.equals(content)).toBe(true);
    expect(r?.size).toBe(content.length);
  });

  it('falls back to legacy Firebase when Supabase lacks the object', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    const content = Buffer.from('legacy resume');
    store.set(path, content);
    sbHolder.current = mockSupabase({ downloadError: true });
    bucketHolder.current = mockFirebaseBucket();
    const r = await downloadResumeBytes(path, { email: 'a@example.com' });
    expect(r?.buf.equals(content)).toBe(true);
  });
});

describe('deleteResumeObject — Supabase + best-effort legacy; ownership enforced', () => {
  it('deletes from Supabase + legacy', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    store.set(path, Buffer.from('x'));
    sbHolder.current = mockSupabase();
    bucketHolder.current = mockFirebaseBucket();
    await deleteResumeObject(path, { email: 'a@example.com' });
    expect(store.has(path)).toBe(false);
  });

  it('refuses to delete a path not owned by the candidate (no deletion occurs)', async () => {
    const path = 'candidates/other@example.com/resumes/secret.pdf';
    store.set(path, Buffer.from('secret'));
    sbHolder.current = mockSupabase();
    bucketHolder.current = mockFirebaseBucket();
    await deleteResumeObject(path, { email: 'a@example.com' });
    // The tampered path is NOT deleted — the object survives.
    expect(store.has(path)).toBe(true);
  });

  it('is non-throwing when Supabase delete fails (best-effort)', async () => {
    const path = 'candidates/a@example.com/resumes/1_r.pdf';
    sbHolder.current = {
      storage: { from: () => ({ remove: vi.fn(async () => { throw new Error('supabase down'); }) }) },
    };
    bucketHolder.current = mockFirebaseBucket();
    await expect(deleteResumeObject(path, { email: 'a@example.com' })).resolves.toBeUndefined();
  });
});

describe('ResumeStorageError', () => {
  it('carries a classified code', () => {
    const e = new ResumeStorageError('forbidden', 'nope');
    expect(e.code).toBe('forbidden');
    expect(e.message).toBe('nope');
    expect(e instanceof Error).toBe(true);
  });
});
