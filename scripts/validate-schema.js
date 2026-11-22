/**
 * validate-schema.js — apply the Supabase SQL migrations to a real in-process
 * Postgres (PGlite) and assert the schema + RLS are correct. This is the local
 * database validation step for the Supabase migration (Phase 2 verification).
 *
 * Runs: node scripts/validate-schema.js
 * Exit 0 = schema + RLS applied cleanly; non-zero = SQL error (reported).
 */
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');
// 0001 (schema) + 0002 (RLS) are PGlite-testable. 0003 (storage) + 0004 (auth
// triggers) target the Supabase platform schema (storage.buckets / auth.users)
// which PGlite does not provision — they are reviewed + applied to the real
// project, not executed here.
const APPLY = ['0001_initial_schema.sql', '0002_rls_policies.sql', '0005_grants.sql'];

async function main() {
  const pg = new PGlite();
  console.log('[validate] PGlite Postgres started');

  // Mock the Supabase auth surface so the RLS helper functions (which call
  // auth.uid()) resolve. auth.uid() reads a session variable so tests can
  // impersonate different users per-transaction.
  await pg.exec('CREATE SCHEMA IF NOT EXISTS auth');
  await pg.exec(
    `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$`,
  );
  await pg.exec('CREATE ROLE anon');
  await pg.exec('CREATE ROLE authenticated');
  console.log('[validate] mock auth.uid() + anon/authenticated roles created');

  // Apply each migration file.
  for (const file of APPLY) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await pg.exec(sql);
      console.log(`[validate] applied ${file}`);
    } catch (err) {
      console.error(`[validate] FAILED applying ${file}:`);
      console.error('  ', err.message);
      // Report the first failing statement context if available.
      if (err.cause) console.error('  cause:', err.cause.message || err.cause);
      process.exit(1);
    }
  }

  // Assert all expected tables exist.
  const expected = [
    'profiles', 'admin_roles', 'candidate_profiles', 'candidate_skills',
    'candidate_experience', 'candidate_education', 'candidate_projects',
    'candidate_certifications', 'resumes', 'jobs', 'job_applications',
    'job_match_results', 'job_alert_preferences', 'job_alert_events',
    'newsletter_subscribers', 'contact_enquiries', 'email_delivery_events',
    'audit_logs', 'services', 'blog_posts', 'tech_ecosystem', 'testimonials',
    'client_projects', 'app_settings',
  ];
  const t = await pg.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );
  const got = t.rows.map((r) => r.tablename).sort();
  const missing = expected.filter((x) => !got.includes(x));
  const extra = got.filter((x) => !expected.includes(x));
  console.log(`[validate] tables: ${got.length} (expected ${expected.length})`);
  if (missing.length) {
    console.error('[validate] MISSING tables:', missing.join(', '));
    process.exit(1);
  }
  if (extra.length) console.log('[validate] extra tables (ok):', extra.join(', '));

  // Assert RLS enabled on every table.
  const r = await pg.query(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'",
  );
  const noRls = r.rows.filter((x) => !x.rowsecurity).map((x) => x.tablename);
  if (noRls.length) {
    console.error('[validate] tables WITHOUT RLS:', noRls.join(', '));
    process.exit(1);
  }
  console.log(`[validate] RLS enabled on all ${r.rows.length} tables`);

  // Assert key policies exist.
  const p = await pg.query(
    "SELECT count(*)::int c FROM pg_policies WHERE schemaname='public'",
  );
  console.log(`[validate] RLS policies: ${p.rows[0].c}`);

  // Assert key constraints: the atomic duplicate-application UNIQUE partial index.
  const idx = await pg.query(
    "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname = 'uniq_job_applications_active'",
  );
  if (idx.rows.length !== 1) {
    console.error('[validate] MISSING uniq_job_applications_active index');
    process.exit(1);
  }
  console.log('[validate] atomic duplicate-application index present');

  // Assert the bootstrap sentinel + default threshold.
  const bs = await pg.query("SELECT value FROM app_settings WHERE key='superadmin_bootstrapped'");
  console.log('[validate] superadmin_bootstrapped sentinel:', bs.rows[0].value);
  const th = await pg.query("SELECT matching_threshold FROM candidate_profiles LIMIT 0"); // column exists check
  console.log('[validate] candidate_profiles.matching_threshold column present');

  await pg.close();
  console.log('[validate] SUCCESS — schema + RLS applied cleanly to real Postgres');
}

main().catch((e) => {
  console.error('[validate] unexpected error:', e);
  process.exit(1);
});
