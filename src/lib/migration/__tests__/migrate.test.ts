/**
 * migrate.test.ts — end-to-end migration write test against real Postgres (PGlite).
 *
 * Verifies the migration write core: synthetic Firestore-shaped docs (the shape
 * the Firestore emulator read produces) are mapped + written into PGlite with
 * correct rows, referential integrity (candidate FKs), + idempotency (re-run
 * produces the same counts, no duplicate child rows).
 *
 * The Firestore READ side is a standard collection.get() — tested separately by
 * the orchestration script against the emulator. This test focuses on the
 * mapping→write core, which is where the real complexity lives.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { migrateCollectionToPg } from '../migrate';
import { uuidV5, remapResumeStoragePath } from '../mapper';
import type { FirestoreDoc } from '../mapper';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../../supabase/migrations');

let pg: PGlite;

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec('CREATE SCHEMA IF NOT EXISTS auth');
  await pg.exec(
    `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$`,
  );
  await pg.exec('CREATE ROLE anon');
  await pg.exec('CREATE ROLE authenticated');
  await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '0001_initial_schema.sql'), 'utf8'));
  await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '0002_rls_policies.sql'), 'utf8'));
  await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '0005_grants.sql'), 'utf8'));
}, 30000);

afterAll(async () => {
  await pg.close();
});

// Synthetic Firestore docs (as owner — bypasses RLS for the write).
const USERS: FirestoreDoc[] = [
  { id: 'alice@example.com', data: { email: 'alice@example.com', fullName: 'Alice', emailVerified: true, accountType: 'candidate' } },
  { id: 'bob@example.com', data: { email: 'bob@example.com', fullName: 'Bob', accountType: 'candidate' } },
];
const CANDIDATES: FirestoreDoc[] = [
  {
    id: 'alice@example.com',
    data: {
      email: 'alice@example.com',
      headline: 'Engineer',
      skills: ['TypeScript', 'React'],
      techStack: ['Node.js'],
      totalExperienceYears: 5,
      currentLocation: 'Remote',
      preferredJobLocation: 'Remote',
      workModePreference: 'Remote',
      employmentHistory: [{ company: 'Paragonel', designation: 'Eng', current: true }],
      matchingThreshold: 80,
      resumeStoragePath: 'candidates/alice/resumes/1.pdf',
      resumeFileName: '1.pdf',
    },
  },
];
const JOBS: FirestoreDoc[] = [
  { id: 'job-a', data: { title: 'Senior Engineer', location: 'Remote', skills: ['TypeScript', 'React'], isActive: true } },
  { id: 'job-b', data: { title: 'Draft Role', location: 'Onsite', isActive: false } },
];
const NEWSLETTER: FirestoreDoc[] = [
  { id: 'sub1', data: { email: 'Sub@Example.com', source: 'Footer' } },
];

describe('migration write core (Firestore docs → PGlite)', () => {
  it('writes users → profiles (2 rows, deterministic ids)', async () => {
    const c = await migrateCollectionToPg(pg, 'users', USERS);
    expect(c.docs).toBe(2);
    const r = await pg.query<{ email: string }>('SELECT email FROM profiles ORDER BY email');
    expect(r.rows.map((x) => x.email)).toEqual(['alice@example.com', 'bob@example.com']);
  });

  it('writes candidates → candidate_profiles + child tables + resume + alert prefs', async () => {
    const c = await migrateCollectionToPg(pg, 'candidates', CANDIDATES);
    expect(c.docs).toBe(1);
    expect(c.rowsWritten).toBeGreaterThan(1); // fan-out

    const cp = await pg.query<{ headline: string }>('SELECT headline FROM candidate_profiles');
    expect(cp.rows.length).toBe(1);
    expect(cp.rows[0].headline).toBe('Engineer');

    const skills = await pg.query<{ skill: string }>('SELECT skill FROM candidate_skills ORDER BY skill');
    expect(skills.rows.map((x) => x.skill).sort()).toEqual(['Node.js', 'React', 'TypeScript']);

    const exp = await pg.query<{ company: string }>('SELECT company FROM candidate_experience');
    expect(exp.rows.length).toBe(1);
    expect(exp.rows[0].company).toBe('Paragonel');

    const resumes = await pg.query<{ storage_path: string }>('SELECT storage_path FROM resumes');
    expect(resumes.rows.length).toBe(1);
    // The Firebase email-scoped path is remapped to the Supabase user-id-scoped
    // convention so the candidate-resumes bucket RLS holds (Task 4).
    expect(resumes.rows[0].storage_path).toBe(
      remapResumeStoragePath('candidates/alice/resumes/1.pdf', uuidV5('user:alice@example.com')),
    );
  });

  it('candidate FK consistency: child rows reference the same user_id', async () => {
    const uid = await pg.query<{ user_id: string }>('SELECT user_id FROM candidate_profiles');
    const skillCid = await pg.query<{ candidate_id: string }>('SELECT candidate_id FROM candidate_skills LIMIT 1');
    expect(skillCid.rows[0].candidate_id).toBe(uid.rows[0].user_id);
  });

  it('writes jobs (2, active + draft)', async () => {
    await migrateCollectionToPg(pg, 'jobs', JOBS);
    const r = await pg.query<{ title: string }>('SELECT title FROM jobs ORDER BY title');
    expect(r.rows.map((x) => x.title).sort()).toEqual(['Draft Role', 'Senior Engineer']);
  });

  it('writes newsletter subscribers with normalized email', async () => {
    await migrateCollectionToPg(pg, 'newsletterSubscribers', NEWSLETTER);
    const r = await pg.query<{ email: string }>('SELECT email FROM newsletter_subscribers');
    expect(r.rows[0].email).toBe('sub@example.com');
  });

  it('is idempotent — re-running produces no duplicate child rows', async () => {
    // Snapshot skill count before re-run.
    const before = await pg.query<{ c: number }>('SELECT count(*)::int c FROM candidate_skills');
    // Re-run candidates migration (would append if not idempotent).
    await migrateCollectionToPg(pg, 'candidates', CANDIDATES);
    const after = await pg.query<{ c: number }>('SELECT count(*)::int c FROM candidate_skills');
    expect(after.rows[0].c).toBe(before.rows[0].c); // unchanged — child rows replaced, not duplicated
  });

  it('is idempotent — re-running users upserts (no duplicate profiles)', async () => {
    await migrateCollectionToPg(pg, 'users', USERS);
    const r = await pg.query<{ c: number }>('SELECT count(*)::int c FROM profiles');
    expect(r.rows[0].c).toBe(2);
  });
});
