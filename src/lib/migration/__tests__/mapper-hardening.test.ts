/**
 * mapper-hardening.test.ts — deterministic-mapping coverage for Task 4.
 *
 * Verifies:
 *   - missing source timestamps fall back to the deterministic
 *     MIGRATION_FALLBACK_TIMESTAMP sentinel (NOT a per-row new Date()), so two
 *     runs of the mapper produce identical output;
 *   - the resume Storage path is remapped from the Firebase email-scoped
 *     convention to the Supabase user-id-scoped convention so the bucket RLS
 *     holds.
 */
import { describe, it, expect } from 'vitest';
import {
  mapUser,
  mapCandidate,
  remapResumeStoragePath,
  MIGRATION_FALLBACK_TIMESTAMP,
  type FirestoreDoc,
} from '../mapper';

function doc(id: string, data: Record<string, unknown>): FirestoreDoc {
  return { id, data };
}

describe('MIGRATION_FALLBACK_TIMESTAMP', () => {
  it('is the Unix epoch sentinel (deterministic, identifiable)', () => {
    expect(MIGRATION_FALLBACK_TIMESTAMP).toBe('1970-01-01T00:00:00.000Z');
  });
});

describe('mapUser — missing source timestamps', () => {
  it('uses the deterministic sentinel when createdAt/updatedAt are absent', () => {
    const rows = mapUser(doc('a@b.com', { email: 'a@b.com' }));
    expect(rows[0].row.created_at).toBe(MIGRATION_FALLBACK_TIMESTAMP);
    expect(rows[0].row.updated_at).toBe(MIGRATION_FALLBACK_TIMESTAMP);
  });

  it('uses the real source timestamp when present', () => {
    const rows = mapUser(doc('a@b.com', {
      email: 'a@b.com',
      createdAt: '2024-05-01T10:00:00.000Z',
      updatedAt: '2024-05-02T10:00:00.000Z',
    }));
    expect(rows[0].row.created_at).toBe('2024-05-01T10:00:00.000Z');
    expect(rows[0].row.updated_at).toBe('2024-05-02T10:00:00.000Z');
  });

  it('is deterministic across runs (no per-row new Date())', () => {
    // Two independent calls with the same missing-timestamp input must produce
    // the SAME created_at. A per-row new Date() would make these differ.
    const a = mapUser(doc('a@b.com', { email: 'a@b.com' }))[0].row.created_at;
    const b = mapUser(doc('a@b.com', { email: 'a@b.com' }))[0].row.created_at;
    expect(a).toBe(b);
    expect(a).toBe(MIGRATION_FALLBACK_TIMESTAMP);
  });
});

describe('remapResumeStoragePath', () => {
  const userId = '11111111-2222-3333-4444-555555555555';

  it('remaps the Firebase email-scoped path to the Supabase user-id-scoped path', () => {
    expect(remapResumeStoragePath('candidates/a@b.com/resumes/1700000000_resume.pdf', userId))
      .toBe(`candidate-resumes/${userId}/1700000000_resume.pdf`);
  });

  it('preserves the sanitized filename segment verbatim', () => {
    expect(remapResumeStoragePath('candidates/x@y.com/resumes/999_my-resume_v2.pdf', userId))
      .toBe(`candidate-resumes/${userId}/999_my-resume_v2.pdf`);
  });

  it('leaves an unknown shape unchanged (reconciler will flag it)', () => {
    expect(remapResumeStoragePath('some/other/shape.pdf', userId)).toBe('some/other/shape.pdf');
    expect(remapResumeStoragePath('resumes/legacy.pdf', userId)).toBe('resumes/legacy.pdf');
  });
});

describe('mapCandidate — resume path remap', () => {
  it('stores the remapped (user-id-scoped) Storage path on the resumes row', () => {
    const rows = mapCandidate(doc('a@b.com', {
      email: 'a@b.com',
      uid: '11111111-2222-3333-4444-555555555555',
      resumeStoragePath: 'candidates/a@b.com/resumes/1700000000_resume.pdf',
      resumeFileName: 'resume.pdf',
    }));
    const resume = rows.find((r) => r.table === 'resumes');
    expect(resume).toBeDefined();
    expect(resume!.row.storage_path).toBe('candidate-resumes/11111111-2222-3333-4444-555555555555/1700000000_resume.pdf');
  });

  it('uses the deterministic fallback when resumeUploadedAt is missing', () => {
    const rows = mapCandidate(doc('a@b.com', {
      email: 'a@b.com',
      resumeStoragePath: 'candidates/a@b.com/resumes/1_x.pdf',
    }));
    const resume = rows.find((r) => r.table === 'resumes')!;
    expect(resume.row.uploaded_at).toBe(MIGRATION_FALLBACK_TIMESTAMP);
  });
});
