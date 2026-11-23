/**
 * reconcile.ts — deterministic migration reconciliation utilities (Task 4).
 *
 * Pure functions (no I/O) for:
 *   - `reconcileCounts` — per-table source-vs-target row-count parity report
 *     (matched / missing-in-target / extra-in-target).
 *   - `detectDuplicateSources` — flag the same (collection, id) appearing more
 *     than once in a migration input (a common ingest bug).
 *   - `detectTargetIdCollisions` — flag different source docs that map to the
 *     same target table + primary key (e.g. two `users` docs with the same
 *     email both derive the same UUIDv5 → one would silently win the upsert).
 *   - `buildAuditRows` — produce `migration_audit` rows (source/target/checksum)
 *     from a set of migrated docs, suitable for writing via the service role.
 *
 * These run locally against synthetic fixtures or a real migration input; they
 * do NOT touch production data.
 */
import { createHash } from 'node:crypto';
import {
  COLLECTION_MAPPERS,
  uuidV5,
  MIGRATION_FALLBACK_TIMESTAMP,
  type FirestoreDoc,
  type MappedRow,
} from './mapper';
import { checksumDoc } from './checksum';

/** The primary-key column for a target table (used for collision detection). */
const TARGET_PK: Record<string, string> = {
  profiles: 'id',
  admin_roles: 'user_id',
  candidate_profiles: 'user_id',
  candidate_skills: 'candidate_id',
  candidate_experience: 'candidate_id',
  candidate_education: 'candidate_id',
  candidate_projects: 'candidate_id',
  candidate_certifications: 'candidate_id',
  resumes: 'candidate_id',
  jobs: 'id',
  job_applications: 'id',
  job_alert_preferences: 'candidate_id',
  newsletter_subscribers: 'id',
  contact_enquiries: 'id',
  services: 'id',
  blog_posts: 'id',
  tech_ecosystem: 'id',
  testimonials: 'id',
  client_projects: 'id',
};

function targetPkOf(row: Record<string, unknown>, table: string): string | null {
  const pk = TARGET_PK[table] ?? 'id';
  const v = row[pk];
  return typeof v === 'string' ? v : null;
}

export interface CountReconcileReport {
  matched: { table: string; source: number; target: number }[];
  missingInTarget: { table: string; source: number; target: number }[];
  extraInTarget: { table: string; source: number; target: number }[];
}

/**
 * Compare per-table source row counts (the rows the mapper would produce from
 * `docsByCollection`) against target row counts (read from the target DB).
 * A table is `matched` when source === target; `missingInTarget` when source >
 * target; `extraInTarget` when target > source.
 */
export function reconcileCounts(
  docsByCollection: Record<string, FirestoreDoc[]>,
  targetCounts: Record<string, number>,
): CountReconcileReport {
  const sourceByTable = new Map<string, number>();
  for (const [collection, docs] of Object.entries(docsByCollection)) {
    const mapper = COLLECTION_MAPPERS[collection];
    if (!mapper) continue;
    for (const doc of docs) {
      for (const r of mapper(doc)) {
        sourceByTable.set(r.table, (sourceByTable.get(r.table) ?? 0) + 1);
      }
    }
  }

  const report: CountReconcileReport = { matched: [], missingInTarget: [], extraInTarget: [] };
  const tables = new Set<string>([...sourceByTable.keys(), ...Object.keys(targetCounts)]);
  for (const table of tables) {
    const source = sourceByTable.get(table) ?? 0;
    const target = targetCounts[table] ?? 0;
    const entry = { table, source, target };
    if (source === target) report.matched.push(entry);
    else if (source > target) report.missingInTarget.push(entry);
    else report.extraInTarget.push(entry);
  }
  return report;
}

export interface DuplicateSource {
  collection: string;
  id: string;
  count: number;
}

/** Flag the same (collection, id) appearing more than once in the migration input. */
export function detectDuplicateSources(
  docsByCollection: Record<string, FirestoreDoc[]>,
): DuplicateSource[] {
  const out: DuplicateSource[] = [];
  for (const [collection, docs] of Object.entries(docsByCollection)) {
    const seen = new Map<string, number>();
    for (const doc of docs) {
      seen.set(doc.id, (seen.get(doc.id) ?? 0) + 1);
    }
    for (const [id, count] of seen) {
      if (count > 1) out.push({ collection, id, count });
    }
  }
  return out;
}

export interface TargetIdCollision {
  targetTable: string;
  targetId: string;
  sources: { collection: string; sourceId: string }[];
}

/**
 * Flag different source docs that map to the same (target table, primary key).
 * Example: two `users` docs with the same email both derive `uuidV5('user:email')`
 * → only one would survive the upsert. Child-table fan-out (e.g. many
 * candidate_skills rows sharing `candidate_id`) is NOT a collision; only
 * parent-level PK clashes are flagged (one row per source doc per parent table).
 */
export function detectTargetIdCollisions(
  docsByCollection: Record<string, FirestoreDoc[]>,
): TargetIdCollision[] {
  // For each source doc, record the (table, pk) of its PARENT row only (the
  // first row the mapper emits for the parent table), so child fan-out does
  // not register as collisions.
  const owners = new Map<string, { collection: string; sourceId: string }[]>();
  for (const [collection, docs] of Object.entries(docsByCollection)) {
    const mapper = COLLECTION_MAPPERS[collection];
    if (!mapper) continue;
    for (const doc of docs) {
      const rows = mapper(doc);
      // The parent row is the one whose pk matches the doc-level identity.
      // Take the first row whose pk is derivable; that is the parent.
      const parent = rows.find((r) => targetPkOf(r.row, r.table) !== null);
      if (!parent) continue;
      const pk = targetPkOf(parent.row, parent.table)!;
      const key = `${parent.table}::${pk}`;
      const arr = owners.get(key) ?? [];
      arr.push({ collection, sourceId: doc.id });
      owners.set(key, arr);
    }
  }

  const out: TargetIdCollision[] = [];
  for (const [key, sources] of owners) {
    // Distinct source docs (collection + id) mapping to the same target.
    const distinct = new Map<string, { collection: string; sourceId: string }>();
    for (const s of sources) distinct.set(`${s.collection}::${s.sourceId}`, s);
    if (distinct.size > 1) {
      const [table, targetId] = key.split('::');
      out.push({ targetTable: table, targetId, sources: [...distinct.values()] });
    }
  }
  return out;
}

export interface AuditRow {
  source_collection: string;
  source_id: string;
  target_table: string;
  target_id: string;
  checksum: string;
  fallback_timestamp_used: string;
}

/**
 * Build `migration_audit` rows (one per source doc's parent target row) with a
 * deterministic checksum of the source doc. Suitable for writing via the
 * service role into `migration_audit`. Idempotent: the table's
 * `uniq_migration_audit_source` index upserts on (source_collection, source_id).
 */
export function buildAuditRows(
  docsByCollection: Record<string, FirestoreDoc[]>,
): AuditRow[] {
  const out: AuditRow[] = [];
  for (const [collection, docs] of Object.entries(docsByCollection)) {
    const mapper = COLLECTION_MAPPERS[collection];
    if (!mapper) continue;
    for (const doc of docs) {
      const rows = mapper(doc);
      const parent = rows.find((r) => targetPkOf(r.row, r.table) !== null);
      if (!parent) continue;
      const pk = targetPkOf(parent.row, parent.table)!;
      out.push({
        source_collection: collection,
        source_id: doc.id,
        target_table: parent.table,
        target_id: pk,
        checksum: checksumDoc(doc),
        fallback_timestamp_used: MIGRATION_FALLBACK_TIMESTAMP,
      });
    }
  }
  return out;
}

/** Convenience: deterministic short fingerprint of a checksum (first 12 hex chars). */
export function shortChecksum(checksum: string): string {
  // No security implication; just a readable id for logs/reports.
  return createHash('sha256').update(checksum).digest('hex').slice(0, 12);
}

// Re-export so callers can resolve a Firestore job id → target uuid without
// importing mapper.ts directly.
export { uuidV5 };
export type { MappedRow };
