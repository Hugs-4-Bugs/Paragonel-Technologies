/**
 * migrate.ts — write mapped Supabase rows into a Postgres target (PGlite for
 * local tests, or the Supabase server client for production).
 *
 * Idempotency strategy:
 *   - Parent tables (profiles, candidate_profiles, jobs, job_applications,
 *     newsletter_subscribers, contact_enquiries, CMS tables) use
 *     INSERT ... ON CONFLICT (pk) DO UPDATE — re-runs upsert the same row.
 *   - Child tables owned by a candidate (candidate_skills, _experience,
 *     _education, _projects, _certifications, resumes) are replaced per
 *     candidate: DELETE WHERE candidate_id = $1 then INSERT. Re-running the
 *     migration for a candidate produces the same final state.
 *   - Append-only tables (audit_logs, email_delivery_events) are INSERT only
 *     (ON CONFLICT DO NOTHING) — they accumulate, which is correct for an audit
 *     trail; a re-run of the migration would re-insert only rows that aren't
 *     already present (matched by id).
 *
 * The Firestore READ side (collection.get() → docs) is trivial + lives in the
 * orchestration script (scripts/migrate-firebase-to-supabase.js). This module
 * is the tested write core: pass it {collection, docs} + a PGlite (or any
 * pg-compatible) client, it maps + writes + reports counts.
 */
import { COLLECTION_MAPPERS, type FirestoreDoc, type MappedRow } from './mapper';

/** Primary key per table (for ON CONFLICT targeting). */
const TABLE_PK: Record<string, string> = {
  profiles: 'id',
  admin_roles: 'user_id',
  candidate_profiles: 'user_id',
  candidate_skills: 'id',
  candidate_experience: 'id',
  candidate_education: 'id',
  candidate_projects: 'id',
  candidate_certifications: 'id',
  resumes: 'id',
  jobs: 'id',
  job_applications: 'id',
  job_match_results: 'id',
  job_alert_preferences: 'candidate_id',
  job_alert_events: 'id',
  newsletter_subscribers: 'id',
  contact_enquiries: 'id',
  email_delivery_events: 'id',
  audit_logs: 'id',
  services: 'id',
  blog_posts: 'id',
  tech_ecosystem: 'id',
  testimonials: 'id',
  client_projects: 'id',
  app_settings: 'key',
};

/** Child tables replaced per-candidate on each run (idempotent fan-out). */
const CHILD_TABLES_BY_CANDIDATE = new Set([
  'candidate_skills',
  'candidate_experience',
  'candidate_education',
  'candidate_projects',
  'candidate_certifications',
  'resumes',
]);

export interface MigrationCounts {
  [collection: string]: { docs: number; rowsWritten: number };
}

/** Minimal pg-compatible client interface (PGlite + node-pg both satisfy it). */
interface PgClient {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
}

/** Escape a JS value for inline SQL (used for arrays + jsonb; scalars use params). */
function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return 'ARRAY[]::text[]';
    return `ARRAY[${v.map((x) => sqlLiteral(x)).join(',')}]::text[]`;
  }
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  // string
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Build + execute an upsert for one row. */
async function upsertRow(pg: PgClient, table: string, row: Record<string, unknown>): Promise<void> {
  const cols = Object.keys(row);
  if (cols.length === 0) return;
  const pk = TABLE_PK[table] || 'id';
  const colList = cols.join(', ');
  const valList = cols.map((c) => sqlLiteral(row[c])).join(', ');
  const updateList = cols
    .filter((c) => c !== pk)
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');
  const onConflict = updateList
    ? `ON CONFLICT (${pk}) DO UPDATE SET ${updateList}`
    : `ON CONFLICT (${pk}) DO NOTHING`;
  await pg.query(
    `INSERT INTO ${table} (${colList}) VALUES (${valList}) ${onConflict}`,
  );
}

/** Insert a child row (no upsert — the parent caller already deleted old rows). */
async function insertRow(pg: PgClient, table: string, row: Record<string, unknown>): Promise<void> {
  const cols = Object.keys(row);
  if (cols.length === 0) return;
  await pg.query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => sqlLiteral(row[c])).join(', ')}) ON CONFLICT DO NOTHING`,
  );
}

/**
 * Migrate one collection's docs into the Postgres target.
 * Returns the count of docs + rows written.
 */
export async function migrateCollectionToPg(
  pg: PgClient,
  collection: string,
  docs: FirestoreDoc[],
): Promise<{ docs: number; rowsWritten: number }> {
  const mapper = COLLECTION_MAPPERS[collection];
  if (!mapper) {
    return { docs: 0, rowsWritten: 0 }; // unmapped collection (e.g. otpRequests, sessions — Supabase Auth handles)
  }

  // Group rows by table so child-table delete-then-insert can happen once per
  // candidate before the inserts.
  const rowsByTable = new Map<string, MappedRow[]>();
  for (const doc of docs) {
    const rows = mapper(doc);
    for (const r of rows) {
      const arr = rowsByTable.get(r.table) ?? [];
      arr.push(r);
      rowsByTable.set(r.table, arr);
    }
  }

  let rowsWritten = 0;

  // For child tables, delete existing rows per candidate first (idempotent
  // fan-out: re-running replaces the child set rather than appending).
  const childCandidates = new Map<string, Set<string>>(); // table -> set(candidate_id)
  for (const [table, rows] of rowsByTable) {
    if (CHILD_TABLES_BY_CANDIDATE.has(table)) {
      const ids = new Set<string>();
      for (const r of rows) if (typeof r.row.candidate_id === 'string') ids.add(r.row.candidate_id as string);
      childCandidates.set(table, ids);
    }
  }
  for (const [table, ids] of childCandidates) {
    for (const cid of ids) {
      await pg.query(`DELETE FROM ${table} WHERE candidate_id = $1`, [cid]);
    }
  }

  // Write each row.
  for (const [table, rows] of rowsByTable) {
    for (const r of rows) {
      if (CHILD_TABLES_BY_CANDIDATE.has(table)) {
        await insertRow(pg, table, r.row);
      } else {
        await upsertRow(pg, table, r.row);
      }
      rowsWritten++;
    }
  }

  return { docs: docs.length, rowsWritten };
}

/**
 * Migrate a full set of collections. `readCollection` is an async function that
 * returns the Firestore docs for a collection name — supplied by the
 * orchestration script (which knows how to talk to the Firestore emulator or
 * production). This keeps the tested core free of Firebase coupling.
 */
export async function migrateAllToPg(
  pg: PgClient,
  collections: string[],
  readCollection: (name: string) => Promise<FirestoreDoc[]>,
): Promise<MigrationCounts> {
  const counts: MigrationCounts = {};
  for (const name of collections) {
    const docs = await readCollection(name);
    const c = await migrateCollectionToPg(pg, name, docs);
    counts[name] = c;
  }
  return counts;
}
