-- 0006_migration_reconciliation.sql
--
-- Migration reconciliation infrastructure (Task 4). Adds a `migration_audit`
-- table that records, for every migrated Firestore doc, the source collection +
-- id, the target table + id, a deterministic checksum of the source doc, and
-- the migration-run timestamp. This enables:
--   - idempotency checks (re-running a migration upserts the same target id),
--   - drift detection (source checksum vs. last-migrated checksum),
--   - reconciliation reports (per-table source/target row-count parity, and
--     orphaned target rows whose source has since been deleted).
--
-- This migration is ADDITIVE: it does not alter any table created in
-- 0001..0005, so already-applied migrations are not rewritten destructively.
-- The table is written by the service role only (RLS denies anon/authenticated
-- writes); reads are super_admin-only.

CREATE TABLE IF NOT EXISTS public.migration_audit (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_collection text NOT NULL,
  source_id         text NOT NULL,
  target_table      text NOT NULL,
  target_id         text NOT NULL,
  -- SHA-256 of the stable JSON serialization of the source Firestore doc
  -- (see src/lib/migration/checksum.ts). Lets a re-run detect whether the
  -- source doc changed since the last migration.
  checksum          text NOT NULL,
  -- The deterministic fallback timestamp sentinel used for missing source
  -- timestamps (see mapper.ts MIGRATION_FALLBACK_TIMESTAMP). Recorded here so
  -- reconciliation can identify rows whose source had no timestamp.
  fallback_timestamp_used timestamptz,
  migrated_at       timestamptz NOT NULL DEFAULT now()
);

-- One audit row per (source_collection, source_id): a re-run UPSERTs the
-- checksum rather than appending a duplicate history. Full history, if needed,
-- can be added later as a separate append-only table.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_migration_audit_source
  ON public.migration_audit (source_collection, source_id);

-- Lookup by target for reconciliation (orphan detection, back-reference).
CREATE INDEX IF NOT EXISTS idx_migration_audit_target
  ON public.migration_audit (target_table, target_id);

ALTER TABLE public.migration_audit ENABLE ROW LEVEL SECURITY;

-- Service role writes (bypasses RLS). Super-admin-only reads.
DROP POLICY IF EXISTS migration_audit_select_super ON public.migration_audit;
CREATE POLICY migration_audit_select_super
  ON public.migration_audit
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- No anon/authenticated INSERT/UPDATE/DELETE: the migration orchestrator
-- writes via the service role (which bypasses RLS).
