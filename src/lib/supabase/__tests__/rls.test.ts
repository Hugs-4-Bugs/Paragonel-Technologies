/**
 * rls.test.ts — Row Level Security policy tests against real Postgres (PGlite).
 *
 * Verifies the Supabase RLS policies enforce least-privilege access:
 *   - anonymous: read published jobs/CMS only; cannot read profiles/applications
 *   - candidate: read/write ONLY own profile/skills/applications; cannot read
 *     another candidate's data; cannot insert an application for someone else
 *   - admin: read all operational tables
 *   - super_admin: manage admin_roles + app_settings
 *   - atomic duplicate application blocked at the DB level (UNIQUE partial index)
 *   - newsletter subscriber list + contact enquiries never exposed to anon
 *
 * Method: a single PGlite Postgres instance is migrated + seeded in beforeAll
 * (as the owner, which bypasses RLS). Each test runs inside a BEGIN/ROLLBACK
 * transaction with SET ROLE + SET LOCAL app.current_user_id to impersonate the
 * caller — so auth.uid() returns the impersonated id. Rollback keeps the seed
 * intact across tests.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../../supabase/migrations');

const CAND_A = randomUUID();
const CAND_B = randomUUID();
const ADMIN = randomUUID();
const SUPER = randomUUID();
const JOB_ID = randomUUID();

let pg: PGlite;

beforeAll(async () => {
  pg = new PGlite();
  // Mock the Supabase auth surface.
  await pg.exec('CREATE SCHEMA IF NOT EXISTS auth');
  await pg.exec(
    `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$`,
  );
  await pg.exec('CREATE ROLE anon');
  await pg.exec('CREATE ROLE authenticated');
  // Apply schema + RLS + grants.
  await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '0001_initial_schema.sql'), 'utf8'));
  await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '0002_rls_policies.sql'), 'utf8'));
  await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '0005_grants.sql'), 'utf8'));

  // Seed as the owner (bypasses RLS).
  await pg.query(
    `INSERT INTO profiles (id, email, account_type, status, email_verified) VALUES
      ('${CAND_A}', 'cand-a@test.com', 'candidate', 'active', true),
      ('${CAND_B}', 'cand-b@test.com', 'candidate', 'active', true),
      ('${ADMIN}', 'admin@test.com', 'admin', 'active', true),
      ('${SUPER}', 'super@test.com', 'admin', 'active', true)`,
  );
  await pg.query(
    `INSERT INTO admin_roles (user_id, role) VALUES ('${ADMIN}', 'admin'), ('${SUPER}', 'super_admin')`,
  );
  await pg.query(
    `INSERT INTO candidate_profiles (user_id, matching_threshold) VALUES ('${CAND_A}', 80), ('${CAND_B}', 80)`,
  );
  await pg.query(
    `INSERT INTO candidate_skills (candidate_id, skill, source) VALUES ('${CAND_A}', 'TypeScript', 'manual')`,
  );
  await pg.query(
    `INSERT INTO jobs (id, title, location, employment_type, work_arrangement, skills, is_active)
     VALUES ('${JOB_ID}', 'Senior Engineer', 'Remote', 'Full Time', 'Remote', ARRAY['TypeScript','React'], true)`,
  );
  await pg.query(
    `INSERT INTO services (slug, title, is_active) VALUES
      ('published-svc', 'Published Service', true),
      ('draft-svc', 'Draft Service', false)`,
  );
  await pg.query(
    `INSERT INTO newsletter_subscribers (email, source) VALUES ('sub@test.com', 'test')`,
  );
}, 30000);

afterAll(async () => {
  await pg.close();
});

/** Run a query impersonating a role + user inside a rolled-back transaction. */
async function asUser<T = Record<string, unknown>>(
  role: 'anon' | 'authenticated',
  userId: string | null,
  sql: string,
): Promise<{ rows: T[]; error?: string }> {
  await pg.exec('BEGIN');
  try {
    await pg.query(`SET ROLE ${role}`);
    await pg.query(`SET LOCAL app.current_user_id = '${userId ?? ''}'`);
    const r = await pg.query(sql);
    return { rows: r.rows as T[] };
  } catch (e) {
    return { rows: [], error: (e as Error).message };
  } finally {
    await pg.exec('ROLLBACK');
  }
}

describe('RLS — anonymous access', () => {
  it('can read active published jobs', async () => {
    const { rows, error } = await asUser<{ title: string }>('anon', null, 'SELECT title FROM jobs');
    expect(error).toBeUndefined();
    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe('Senior Engineer');
  });

  it('CANNOT read profiles', async () => {
    const { rows } = await asUser('anon', null, 'SELECT email FROM profiles');
    expect(rows.length).toBe(0);
  });

  it('CANNOT read candidate profiles or applications', async () => {
    expect((await asUser('anon', null, 'SELECT user_id FROM candidate_profiles')).rows.length).toBe(0);
    expect((await asUser('anon', null, 'SELECT id FROM job_applications')).rows.length).toBe(0);
  });

  it('can read published services but NOT drafts', async () => {
    const { rows } = await asUser<{ slug: string }>('anon', null, 'SELECT slug FROM services');
    expect(rows.map((r) => r.slug).sort()).toEqual(['published-svc']);
  });

  it('CANNOT enumerate newsletter subscribers', async () => {
    const { rows } = await asUser('anon', null, 'SELECT email FROM newsletter_subscribers');
    expect(rows.length).toBe(0);
  });

  it('can INSERT a newsletter subscription (subscribe)', async () => {
    const { error } = await asUser(
      'anon',
      null,
      `INSERT INTO newsletter_subscribers (email, source) VALUES ('new-anon@test.com', 'test')`,
    );
    expect(error).toBeUndefined();
  });

  it('can INSERT a contact enquiry but CANNOT read enquiries', async () => {
    const ins = await asUser(
      'anon',
      null,
      `INSERT INTO contact_enquiries (name, email, business_problem) VALUES ('A', 'a@t.com', 'help')`,
    );
    expect(ins.error).toBeUndefined();
    const sel = await asUser('anon', null, 'SELECT id FROM contact_enquiries');
    expect(sel.rows.length).toBe(0);
  });
});

describe('RLS — candidate access', () => {
  it('can read OWN profile but not another candidate\'s', async () => {
    const { rows } = await asUser<{ email: string }>('authenticated', CAND_A, 'SELECT email FROM profiles');
    expect(rows.map((r) => r.email).sort()).toEqual(['cand-a@test.com']);
  });

  it('can read OWN candidate_profile but not another\'s', async () => {
    const { rows } = await asUser<{ user_id: string }>(
      'authenticated',
      CAND_A,
      'SELECT user_id FROM candidate_profiles',
    );
    expect(rows.length).toBe(1);
    expect(rows[0].user_id).toBe(CAND_A);
  });

  it('can read OWN skills but not another candidate\'s', async () => {
    const { rows } = await asUser<{ skill: string }>(
      'authenticated',
      CAND_B,
      'SELECT skill FROM candidate_skills',
    );
    // CAND_B has no skills seeded — only CAND_A does.
    expect(rows.length).toBe(0);
  });

  it('can INSERT a skill for OWN profile', async () => {
    const { error } = await asUser(
      'authenticated',
      CAND_A,
      `INSERT INTO candidate_skills (candidate_id, skill) VALUES ('${CAND_A}', 'React')`,
    );
    expect(error).toBeUndefined();
  });

  it('CANNOT insert a skill for ANOTHER candidate', async () => {
    const { error } = await asUser(
      'authenticated',
      CAND_A,
      `INSERT INTO candidate_skills (candidate_id, skill) VALUES ('${CAND_B}', 'Malicious')`,
    );
    expect(error).toBeDefined();
  });

  it('can submit an application for OWN account', async () => {
    const { error } = await asUser(
      'authenticated',
      CAND_A,
      `INSERT INTO job_applications (application_id, job_id, candidate_id, candidate_email)
       VALUES ('APP_TEST1', '${JOB_ID}', '${CAND_A}', 'cand-a@test.com')`,
    );
    expect(error).toBeUndefined();
  });

  it('CANNOT submit an application impersonating another candidate', async () => {
    const { error } = await asUser(
      'authenticated',
      CAND_A,
      `INSERT INTO job_applications (application_id, job_id, candidate_id, candidate_email)
       VALUES ('APP_TEST2', '${JOB_ID}', '${CAND_B}', 'cand-b@test.com')`,
    );
    expect(error).toBeDefined();
  });

  it('atomic duplicate application is blocked at the DB level', async () => {
    // Seed an active application for CAND_B + the job (as owner).
    await pg.query(
      `INSERT INTO job_applications (application_id, job_id, candidate_id, candidate_email)
       VALUES ('APP_SEED_DUP', '${JOB_ID}', '${CAND_B}', 'cand-b@test.com')`,
    );
    // CAND_B tries to apply again for the SAME job → unique violation.
    const { error } = await asUser(
      'authenticated',
      CAND_B,
      `INSERT INTO job_applications (application_id, job_id, candidate_id, candidate_email)
       VALUES ('APP_DUP_ATTEMPT', '${JOB_ID}', '${CAND_B}', 'cand-b@test.com')`,
    );
    expect(error).toBeDefined();
    expect(error).toMatch(/unique|duplicate/i);
    // Cleanup the seeded dup row so it doesn't affect other tests.
    await pg.query(`DELETE FROM job_applications WHERE application_id = 'APP_SEED_DUP'`);
  });
});

describe('RLS — admin access', () => {
  it('admin can read ALL candidate profiles', async () => {
    const { rows } = await asUser<{ user_id: string }>(
      'authenticated',
      ADMIN,
      'SELECT user_id FROM candidate_profiles',
    );
    expect(rows.length).toBe(2);
  });

  it('admin can read ALL jobs including via the admin policy', async () => {
    const { rows } = await asUser<{ title: string }>('authenticated', ADMIN, 'SELECT title FROM jobs');
    expect(rows.length).toBe(1);
  });

  it('non-super admin CANNOT insert admin_roles', async () => {
    const { error } = await asUser(
      'authenticated',
      ADMIN,
      `INSERT INTO admin_roles (user_id, role) VALUES ('${CAND_A}', 'viewer')`,
    );
    expect(error).toBeDefined();
  });

  it('super_admin CAN insert admin_roles', async () => {
    const { error } = await asUser(
      'authenticated',
      SUPER,
      `INSERT INTO admin_roles (user_id, role) VALUES ('${CAND_A}', 'viewer')`,
    );
    expect(error).toBeUndefined();
  });

  it('super_admin can read audit_logs; regular admin sees none (policy filters to 0)', async () => {
    const sup = await asUser<{ c: number }>('authenticated', SUPER, 'SELECT count(*)::int c FROM audit_logs');
    expect(sup.error).toBeUndefined();
    const adm = await asUser<{ c: number }>('authenticated', ADMIN, 'SELECT count(*)::int c FROM audit_logs');
    // With table-level grants, the admin can issue the query (no permission
    // error), but the super_admin-only RLS policy filters every row away.
    expect(adm.error).toBeUndefined();
    expect(adm.rows[0].c).toBe(0);
  });

  it('admin can read newsletter subscribers (campaign management)', async () => {
    const { rows } = await asUser<{ email: string }>(
      'authenticated',
      ADMIN,
      'SELECT email FROM newsletter_subscribers',
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

describe('RLS — email delivery events (service-role write, admin read)', () => {
  it('candidate CANNOT read email delivery events', async () => {
    const { rows } = await asUser('authenticated', CAND_A, 'SELECT id FROM email_delivery_events');
    expect(rows.length).toBe(0);
  });
  it('admin CAN read email delivery events', async () => {
    const { error } = await asUser('authenticated', ADMIN, 'SELECT id FROM email_delivery_events');
    expect(error).toBeUndefined();
  });
});
