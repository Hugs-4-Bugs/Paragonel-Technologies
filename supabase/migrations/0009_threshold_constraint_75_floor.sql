-- =============================================================================
-- 0009_threshold_constraint_75_floor.sql
-- Tighten the candidate-side matching-threshold CHECK constraints from
-- BETWEEN 25 AND 100 to BETWEEN 75 AND 100 (Prompt §5.2: the threshold must
-- never be configurable below 75%), and upsert the global-threshold
-- app_settings row to the default (80).
-- -----------------------------------------------------------------------------
-- STATUS: PREPARED, NOT YET APPLIED.
--   The live Supabase project is NOT reachable from the build sandbox. The
--   running application already enforces the 75% floor in code
--   (src/lib/matching/preferences.ts, MIN_THRESHOLD=75) regardless of these
--   constraints. Apply this migration in the Supabase SQL Editor ONLY after
--   reviewing the reconciliation SELECT (Part A) and with explicit approval.
--
-- EXECUTION ORDER (run each part in order in the Supabase SQL Editor):
--   Part A  — IDENTIFY non-conforming rows (read-only; always safe).
--   Part B  — (OPTIONAL) reconcile: clamp <75 values UP to 75. Commented out
--             by default — enable ONLY after reviewing Part A's output and
--             accepting that legacy <75 candidate thresholds are raised to 75
--             (opt-ins are preserved; nothing is deleted).
--   Part C  — Tighten the CHECK constraints (atomic BEGIN/COMMIT). If Part B
--             was NOT run and rows <75 still exist, the ADD CONSTRAINT fails
--             AND the DROP rolls back → the original 25-100 CHECK remains.
--             That failure is the SAFETY SIGNAL: do not proceed until Part B
--             has reconciled the rows.
--   Part D  — Post-execution verification.
--   Part E  — Global threshold app_settings row (default 80).
--
-- SAFETY:
--   - Idempotent: the DO blocks drop any existing CHECK on the column before
--     adding the new one; re-running is safe.
--   - Non-destructive to schema: ALTER only (no DROP TABLE / no data DELETE).
--   - DATA: Part B's UPDATE is COMMENTED OUT by default — this migration only
--     IDENTIFIES non-conforming rows unless the user explicitly enables Part B.
-- =============================================================================

-- PART A — IDENTIFY non-conforming rows (read-only; always safe to run)

-- Candidate profiles with matching_threshold < 75 (would violate the new CHECK):
SELECT id, matching_threshold
  FROM public.candidate_profiles
  WHERE matching_threshold < 75
  ORDER BY matching_threshold;

-- Job-alert preferences with threshold < 75:
SELECT candidate_id, threshold
  FROM public.job_alert_preferences
  WHERE threshold < 75
  ORDER BY threshold;

-- PART B — OPTIONAL reconciliation UPDATE (DISABLED by default)
-- Review Part A's output first. If you accept clamping legacy <75 values UP to
-- the 75 floor (preserving every candidate's alert opt-in; only RAISING their
-- threshold so it complies with policy — nothing is deleted, no opt-in is
-- disabled), uncomment and run the two statements below. Run Part B BEFORE
-- Part C so the new CHECK does not reject the existing rows.
--
-- UPDATE public.candidate_profiles
--   SET matching_threshold = 75, updated_at = now()
--   WHERE matching_threshold < 75;
-- UPDATE public.job_alert_preferences
--   SET threshold = 75
--   WHERE threshold < 75;

-- PART C — tighten CHECK constraints (atomic: DROP old + ADD new together)
-- If any row still violates the new 75-100 bound (Part B not run), the ADD
-- fails and the COMMIT rolls back the DROP — the original 25-100 CHECK remains.
BEGIN;
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'candidate_profiles'
      AND con.contype = 'c'
      AND con.conkey @> ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = rel.oid AND attname = 'matching_threshold')::int
      ];
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.candidate_profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;
ALTER TABLE public.candidate_profiles
  ADD CONSTRAINT candidate_profiles_matching_threshold_check
  CHECK (matching_threshold BETWEEN 75 AND 100);

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'job_alert_preferences'
      AND con.contype = 'c'
      AND con.conkey @> ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = rel.oid AND attname = 'threshold')::int
      ];
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.job_alert_preferences DROP CONSTRAINT %I', cname);
  END IF;
END $$;
ALTER TABLE public.job_alert_preferences
  ADD CONSTRAINT job_alert_preferences_threshold_check
  CHECK (threshold BETWEEN 75 AND 100);
COMMIT;

-- PART D — post-execution verification
-- After Part C (+ optional Part B), both counts should be 0. If Part B was NOT
-- run and rows <75 remain, Part C would have failed (rolled back) — these
-- counts then reflect the still-present legacy rows and the original CHECK.
SELECT
  (SELECT count(*) FROM public.candidate_profiles WHERE matching_threshold < 75) AS profiles_below_75,
  (SELECT count(*) FROM public.job_alert_preferences WHERE threshold < 75) AS prefs_below_75;

-- Confirm the constraints are in place with the correct 75-100 bound:
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname IN ('candidate_profiles', 'job_alert_preferences')
    AND con.contype = 'c'
  ORDER BY rel.relname, con.conname;

-- PART E — global threshold app_settings row (default 80; admin-configurable 75-100)
-- Overrides the 0008 placeholder (which seeded 75 as the floor marker). The
-- DEFAULT global threshold is 80 (DEFAULT_MATCHING_THRESHOLD); an admin may
-- raise it to 100 or lower it to 75 (never below). The running app reads this
-- via getGlobalMatchingThreshold() (Firestore now; Supabase post-cutover).
INSERT INTO public.app_settings (key, value)
VALUES ('matching_threshold_floor', '{"minimum_matching_percentage": 80}'::jsonb)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();

-- Verification: the row exists with the default value.
SELECT key, value FROM public.app_settings WHERE key = 'matching_threshold_floor';

-- =============================================================================
-- SAFE RECOVERY (if Part C failed and you want to roll back to the original):
--   The original constraints were:
--     candidate_profiles.matching_threshold CHECK (matching_threshold BETWEEN 25 AND 100)
--     job_alert_preferences.threshold       CHECK (threshold BETWEEN 25 AND 100)
--   To restore them, run the same DO-block + ADD pattern with BETWEEN 25 AND 100:
--     BEGIN;
--     DO $$ ... DROP CHECK on candidate_profiles.matching_threshold ... $$;
--     ALTER TABLE public.candidate_profiles
--       ADD CONSTRAINT candidate_profiles_matching_threshold_check
--       CHECK (matching_threshold BETWEEN 25 AND 100);
--     ... same for job_alert_preferences.threshold ...
--     COMMIT;
--   (Only do this if you intentionally want to revert to the 25-100 policy.)
--
--   Part E (threshold row) rollback — restore the 0008 seed value of 75:
--     UPDATE public.app_settings
--       SET value = '{"minimum_matching_percentage": 75}'::jsonb,
--           updated_at = now()
--       WHERE key = 'matching_threshold_floor';
--   (The updated_by column is nullable; set it explicitly to your profile uuid
--    if audit attribution is desired.)
-- =============================================================================
