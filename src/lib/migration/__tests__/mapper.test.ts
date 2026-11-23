/**
 * mapper.test.ts — unit tests for the Firestore→Supabase mapping logic.
 *
 * Verifies the pure mapping functions produce correct Supabase rows from
 * synthetic Firestore docs, including:
 *   - deterministic UUIDv5 (idempotency — same email → same uuid across runs)
 *   - the embedded `candidates` doc fans out to candidate_profiles + child
 *     tables (skills/experience/education/projects/certifications) + resume + alert prefs
 *   - email normalization + FK resolution (application → candidate via email)
 *   - timestamp normalization (Firestore {_seconds,_nanoseconds} → ISO)
 *   - threshold clamping (25–100)
 */
import { describe, it, expect } from 'vitest';
import {
  uuidV5,
  mapUser,
  mapCandidate,
  mapJob,
  mapApplication,
  mapNewsletter,
  mapLead,
  COLLECTION_MAPPERS,
} from '../mapper';

describe('uuidV5 — deterministic id derivation', () => {
  it('is deterministic (same input → same uuid)', () => {
    expect(uuidV5('user:alice@example.com')).toBe(uuidV5('user:alice@example.com'));
  });
  it('differs for different inputs', () => {
    expect(uuidV5('user:alice@example.com')).not.toBe(uuidV5('user:bob@example.com'));
  });
  it('produces a valid lowercase uuid', () => {
    expect(uuidV5('x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('mapUser — email-keyed doc → profiles', () => {
  it('uses the email (doc id) when no uid, lowercased', () => {
    const rows = mapUser({ id: 'Alice@Example.com', data: { email: 'Alice@Example.com' } });
    expect(rows.length).toBe(1);
    expect(rows[0].table).toBe('profiles');
    expect(rows[0].row.email).toBe('alice@example.com');
    expect(rows[0].row.id).toBe(uuidV5('user:alice@example.com'));
  });
  it('prefers a provided uid', () => {
    const rows = mapUser({ id: 'x@y.com', data: { email: 'x@y.com', uid: 'firebase-uid-123' } });
    expect(rows[0].row.id).toBe('firebase-uid-123');
  });
  it('normalizes Firestore timestamp fields to ISO', () => {
    const rows = mapUser({ id: 'a@b.com', data: { email: 'a@b.com', consentAt: { _seconds: 1700000000, _nanoseconds: 0 } } });
    expect(rows[0].row.consent_at).toBe(new Date(1700000000 * 1000).toISOString());
  });
  it('skips docs with no resolvable email', () => {
    expect(mapUser({ id: '', data: {} })).toEqual([]);
  });
});

describe('mapCandidate — embedded doc fans out to normalized tables', () => {
  const doc = {
    id: 'carol@example.com',
    data: {
      email: 'carol@example.com',
      fullName: 'Carol Engineer',
      headline: 'Senior Backend Engineer',
      skills: ['TypeScript', 'Node.js', 'Postgres'],
      techStack: ['React'], // dedup not required; both mapped
      totalExperienceYears: 7,
      currentDesignation: 'Staff Engineer',
      currentLocation: 'Bengaluru',
      preferredJobLocation: 'Remote',
      workModePreference: 'Remote',
      employmentHistory: [
        { company: 'Paragonel', designation: 'Engineer', startDate: '2020-01-01', current: true },
      ],
      education: [{ institution: 'IIT', degree: 'B.Tech', field: 'CS', startYear: 2012, endYear: 2016 }],
      projects: [{ name: 'AcquisitionOS', techStack: ['Next.js'] }],
      certifications: [{ name: 'AWS SA', issuer: 'Amazon' }],
      resumeStoragePath: 'candidates/carol@example.com/resumes/123_cv.pdf',
      resumeFileName: 'cv.pdf',
      jobAlertPreference: true,
      matchingThreshold: 85,
    },
  };
  const rows = mapCandidate(doc);
  const tables = rows.map((r) => r.table);

  it('produces candidate_profiles + child tables + resume + alert prefs', () => {
    expect(tables).toContain('candidate_profiles');
    expect(tables).toContain('candidate_skills');
    expect(tables).toContain('candidate_experience');
    expect(tables).toContain('candidate_education');
    expect(tables).toContain('candidate_projects');
    expect(tables).toContain('candidate_certifications');
    expect(tables).toContain('resumes');
    expect(tables).toContain('job_alert_preferences');
  });
  it('candidate_profiles.user_id matches the email-derived uuid (FK consistency)', () => {
    const cp = rows.find((r) => r.table === 'candidate_profiles')!;
    expect(cp.row.user_id).toBe(uuidV5('user:carol@example.com'));
  });
  it('all child rows reference the same candidate_id', () => {
    const uid = uuidV5('user:carol@example.com');
    for (const r of rows) {
      if (r.table !== 'candidate_profiles' && r.table !== 'job_alert_preferences') {
        expect(r.row.candidate_id).toBe(uid);
      }
    }
  });
  it('splits skills into one row each (4 total: 3 skills + 1 techStack)', () => {
    expect(rows.filter((r) => r.table === 'candidate_skills').length).toBe(4);
  });
  it('clamps matching_threshold to 25–100', () => {
    const over = mapCandidate({ id: 'd@e.com', data: { email: 'd@e.com', matchingThreshold: 150 } });
    expect(over.find((r) => r.table === 'candidate_profiles')!.row.matching_threshold).toBe(100);
    const under = mapCandidate({ id: 'f@g.com', data: { email: 'f@g.com', matchingThreshold: 10 } });
    expect(under.find((r) => r.table === 'candidate_profiles')!.row.matching_threshold).toBe(25);
  });
  it('resume row carries the remapped storage path (Supabase user-id-scoped, private)', () => {
    const r = rows.find((x) => x.table === 'resumes')!;
    // The Firebase email-scoped path is remapped to the Supabase user-id-scoped
    // convention so the candidate-resumes bucket RLS holds (Task 4).
    expect(r.row.storage_path).toBe(
      `candidate-resumes/${uuidV5('user:carol@example.com')}/123_cv.pdf`,
    );
  });
});

describe('mapJob', () => {
  it('maps core fields + uses a deterministic uuid derived from the Firestore id', () => {
    const rows = mapJob({ id: 'job-001', data: { title: 'Engineer', location: 'Remote', skills: ['TS'], isActive: true } });
    expect(rows[0].row.id).toBe(uuidV5('job:job-001'));
    expect(rows[0].row.title).toBe('Engineer');
    expect(rows[0].row.skills).toEqual(['TS']);
    expect(rows[0].row.is_active).toBe(true);
  });
});

describe('mapApplication — resolves candidate_id from email', () => {
  it('derives candidate_id via uuidV5(email) when no candidateId field', () => {
    const rows = mapApplication({ id: 'app-1', data: { candidateEmail: 'Dan@Example.com', jobId: 'job-001' } });
    expect(rows[0].row.candidate_id).toBe(uuidV5('user:dan@example.com'));
    expect(rows[0].row.candidate_email).toBe('dan@example.com');
  });
  it('skips orphaned applications without a resolvable candidate', () => {
    expect(mapApplication({ id: 'app-2', data: { jobId: 'job-001' } })).toEqual([]);
  });
});

describe('mapNewsletter + mapLead', () => {
  it('normalizes email + carries soft-delete', () => {
    const rows = mapNewsletter({ id: 'n1', data: { email: 'Sub@Example.com', deletedAt: '2025-01-01' } });
    expect(rows[0].row.email).toBe('sub@example.com');
    expect(rows[0].row.deleted_at).toBe(new Date('2025-01-01').toISOString());
  });
  it('maps lead fields', () => {
    const rows = mapLead({ id: 'l1', data: { name: 'Lead', email: 'l@x.com', businessProblem: 'need help' } });
    expect(rows[0].row.name).toBe('Lead');
    expect(rows[0].row.business_problem).toBe('need help');
  });
});

describe('COLLECTION_MAPPERS dispatch', () => {
  it('resolves a mapper for each known collection', () => {
    for (const c of ['users', 'admins', 'candidates', 'jobs', 'jobApplications', 'newsletterSubscribers', 'leads', 'services', 'blogPosts', 'techEcosystem', 'testimonials', 'clientProjects']) {
      expect(COLLECTION_MAPPERS[c]).toBeDefined();
    }
  });
});
