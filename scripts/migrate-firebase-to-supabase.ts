/**
 * migrate-firebase-to-supabase.ts — Phase 3 orchestration script.
 *
 * Reads Firestore collections (from the local emulator or production Firebase
 * if creds are configured) + writes the mapped rows into a real Postgres
 * target (PGlite, in-process, for local verification). Reports per-collection
 * doc counts + rows written + a reconciliation summary.
 *
 * Usage:
 *   # Local: Firestore emulator → PGlite (verified, no external creds needed)
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npx tsx scripts/migrate-firebase-to-supabase.ts
 *
 *   # Dump the mapped rows as SQL for application to a real Supabase project:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npx tsx scripts/migrate-firebase-to-supabase.ts --sql > migration.sql
 *
 * Production cutover (BLOCKED until the founder provisions a Supabase project):
 *   1. Apply supabase/migrations/0001..0005 to the Supabase project
 *      (`supabase db push` or the SQL editor).
 *   2. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *   3. Run this script with `--sql` against production Firebase + apply the SQL
 *      to Supabase, OR adapt the writer to call supabase-js directly (the
 *      mapping logic in src/lib/migration/mapper.ts is reusable).
 *
 * The script NEVER copies Firebase credentials into Supabase or client code.
 * Firebase data remains intact — this is a read + map + write, not a delete.
 */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { getAdminDb } from '../src/lib/firebase-admin';
import { migrateCollectionToPg } from '../src/lib/migration/migrate';
import type { FirestoreDoc } from '../src/lib/migration/mapper';

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');

const COLLECTIONS = [
  'users',
  'admins',
  'candidates',
  'jobs',
  'jobApplications',
  'newsletterSubscribers',
  'leads',
  'services',
  'blogPosts',
  'techEcosystem',
  'testimonials',
  'clientProjects',
];

async function readCollection(name: string): Promise<FirestoreDoc[]> {
  const db = getAdminDb();
  if (!db) throw new Error('Firebase Admin SDK not initialized (set FIRESTORE_EMULATOR_HOST or prod creds).');
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
}

async function main() {
  const sqlMode = process.argv.includes('--sql');

  if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.NODE_ENV !== 'production') {
    console.warn('[migrate] WARNING: FIRESTORE_EMULATOR_HOST not set. If production Firebase creds are absent, getAdminDb() returns null + reads will fail.');
  }

  // Target: PGlite (real in-process Postgres). Apply schema + grants first.
  const pg = new PGlite();
  await pg.exec('CREATE SCHEMA IF NOT EXISTS auth');
  await pg.exec(
    `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$`,
  );
  await pg.exec('CREATE ROLE anon');
  await pg.exec('CREATE ROLE authenticated');
  for (const f of ['0001_initial_schema.sql', '0002_rls_policies.sql', '0005_grants.sql']) {
    await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'));
  }
  console.log('[migrate] PGlite target ready (schema + RLS + grants applied)');

  const summary: Array<{ collection: string; docs: number; rowsWritten: number; error?: string }> = [];
  let totalDocs = 0;
  let totalRows = 0;

  for (const name of COLLECTIONS) {
    try {
      const docs = await readCollection(name);
      const { docs: d, rowsWritten } = await migrateCollectionToPg(pg, name, docs);
      summary.push({ collection: name, docs: d, rowsWritten });
      totalDocs += d;
      totalRows += rowsWritten;
      console.log(`[migrate] ${name}: ${d} docs → ${rowsWritten} rows`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      summary.push({ collection: name, docs: 0, rowsWritten: 0, error: msg });
      console.error(`[migrate] ${name}: FAILED — ${msg}`);
    }
  }

  console.log('\n=== migration summary ===');
  console.log(`collections: ${summary.length}`);
  console.log(`total docs read: ${totalDocs}`);
  console.log(`total rows written: ${totalRows}`);
  const errors = summary.filter((s) => s.error);
  if (errors.length) {
    console.log(`errors: ${errors.length} collections`);
    for (const e of errors) console.log(`  - ${e.collection}: ${e.error}`);
  }

  // Reconciliation: count rows actually present in the target per table.
  console.log('\n=== target reconciliation (row counts) ===');
  const tables = [
    'profiles', 'admin_roles', 'candidate_profiles', 'candidate_skills',
    'candidate_experience', 'candidate_education', 'candidate_projects',
    'candidate_certifications', 'resumes', 'jobs', 'job_applications',
    'newsletter_subscribers', 'contact_enquiries', 'services', 'blog_posts',
    'tech_ecosystem', 'testimonials', 'client_projects',
  ];
  for (const t of tables) {
    try {
      const r = await pg.query<{ c: number }>(`SELECT count(*)::int c FROM ${t}`);
      console.log(`  ${t}: ${r.rows[0].c}`);
    } catch {
      // table may not exist if schema not applied
    }
  }

  if (sqlMode) {
    // Dump the migrated rows as INSERT statements for application to a real
    // Supabase project. This is the portable production handoff format.
    console.log('\n-- SQL dump (apply to Supabase via SQL editor or psql) --');
    for (const t of tables) {
      const r = await pg.query(`SELECT * FROM ${t}`);
      for (const row of r.rows) {
        const cols = Object.keys(row as Record<string, unknown>);
        const vals = cols.map((c) => {
          const v = (row as Record<string, unknown>)[c];
          if (v === null) return 'NULL';
          if (Array.isArray(v)) return `ARRAY[${v.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(',')}]::text[]`;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
          if (typeof v === 'number' || typeof v === 'boolean') return String(v);
          return `'${String(v).replace(/'/g, "''")}'`;
        }).join(', ');
        console.log(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${vals}) ON CONFLICT DO NOTHING;`);
      }
    }
  }

  await pg.close();
  console.log('\n[migrate] done. Firebase data is intact (read-only).');
}

main().catch((e) => {
  console.error('[migrate] fatal:', e);
  process.exit(1);
});
