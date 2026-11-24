# Supabase Migration Execution Guide — Paragonel Technologies

This guide consolidates the ordered SQL migration package, the execution order, pre/post checks, recovery, and a status checklist. The founder executes these manually in the Supabase SQL Editor (the build sandbox has no live DB access). **Do not treat a migration file's presence as proof it is applied** — verify against the actual project.

## 1. Ordered migration inventory

| # | File | Purpose | Status |
|---|------|---------|--------|
| 0001 | `0001_initial_schema.sql` | Initial schema — 24 tables, PKs/FKs, check constraints, indexes, timestamps | Apply first (foundation) |
| 0002 | `0002_rls_policies.sql` | Per-table RLS enable + least-privilege policies (anon/authenticated/service-role); `app_settings` write = super_admin only | Apply after 0001 |
| 0003 | `0003_storage_buckets.sql` | Private `candidate-resumes` Storage bucket + RLS (`foldername(name)[1] = auth.uid()`) | Apply after 0001 |
| 0004 | `0004_auth_triggers.sql` | Production-only triggers on `auth.users` (Supabase Auth) — NOT in emulator/staging | Apply when Supabase Auth is cut over (deferred) |
| 0005 | `0005_grants.sql` | Supabase-convention role grants (anon + authenticated; RLS still gates) | Apply after 0002 |
| 0006 | `0006_migration_reconciliation.sql` | `migration_audit` table (source collection/id → target table/id/checksum) | Apply before the data migration |
| 0007 | `0007_newsletter_double_optin.sql` | Additive double-opt-in columns on `newsletter_subscribers` | Apply after 0001 |
| 0008 | `0008_seed_sample_jobs_and_blogs.sql` | Seed data for cutover (sample jobs, blog posts, services) + `app_settings` threshold seed at 75 | Apply after 0001-0007 |
| 0009 | `0009_threshold_constraint_75_floor.sql` | **Tighten candidate threshold CHECK from 25-100 to 75-100** + upsert global threshold to 80 | **PREPARED, NOT YET APPLIED — execute now (this batch)** |

## 2. Execution order

1. **First-time setup (if the project is new):** run `0001` → `0002` → `0003` → `0005` → `0006` → `0007` → `0008` in order. Skip `0004` until Supabase Auth is cut over (deferred — auth stays on the custom Firestore+JWT layer per the task).
2. **This batch's required execution: `0009`** — the threshold-constraint correction + global-threshold upsert. Open `supabase/migrations/0009_threshold_constraint_75_floor.sql` in the Supabase SQL Editor and run its parts **in order**:

   - **Part A** — `SELECT` rows with `matching_threshold`/`threshold < 75` (read-only identification). Review the output.
   - **Part B** (optional) — `UPDATE <75` values UP to 75 (commented out; uncomment + run only after reviewing Part A and accepting that legacy <75 candidate thresholds are raised to 75 — opt-ins preserved, nothing deleted). Run Part B **before** Part C.
   - **Part C** — `BEGIN; DO $$ ... $$; ALTER TABLE ... ADD CONSTRAINT ... CHECK (BETWEEN 75 AND 100); COMMIT;` (x2 tables). Atomic: if any row still violates the new 75-100 bound (Part B not run), the `ADD CONSTRAINT` fails AND the `DROP` rolls back → the original 25-100 CHECK remains. That failure is the safety signal.
   - **Part D** — verification `SELECT`s (counts of rows <75 should be 0; constraint definitions confirmed).
   - **Part E** — `UPSERT app_settings 'matching_threshold_floor' = {"minimum_matching_percentage": 80}` (the default global threshold).

## 3. Pre-execution checks (before 0009)

- Confirm `candidate_profiles.matching_threshold` + `job_alert_preferences.threshold` currently have `CHECK (BETWEEN 25 AND 100)` (from 0001): `SELECT con.conname, pg_get_constraintdef(con.oid) FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid WHERE rel.relname IN ('candidate_profiles','job_alert_preferences') AND con.contype = 'c';`
- Run Part A to see how many rows (if any) are <75. If zero, you may skip Part B.

## 4. Post-execution verification (after 0009)

- `SELECT (SELECT count(*) FROM public.candidate_profiles WHERE matching_threshold < 75) AS profiles_below_75, (SELECT count(*) FROM public.job_alert_preferences WHERE threshold < 75) AS prefs_below_75;` → both must be `0`.
- Confirm the constraints: `SELECT con.conname, pg_get_constraintdef(con.oid) ... WHERE rel.relname IN ('candidate_profiles','job_alert_preferences') AND con.contype = 'c';` → both must show `BETWEEN 75 AND 100`.
- Confirm the global threshold row: `SELECT key, value FROM public.app_settings WHERE key = 'matching_threshold_floor';` → `{"minimum_matching_percentage": 80}`.
- Confirm the runtime reads it: after provisioning `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` in the deployment env + redeploying, `GET /api/admin/jobs/matching-threshold` returns `minimum_matching_percentage: 80`.

## 5. Recovery (if Part C failed or you want to revert)

Part C is atomic — a failure rolls back the `DROP`, leaving the original 25-100 `CHECK` in place. To intentionally restore the 25-100 policy, run the same `DO $$ ... DROP ... $$; ALTER TABLE ... ADD CONSTRAINT ... CHECK (BETWEEN 25 AND 100);` pattern (documented at the bottom of the 0009 file). Only do this if you intentionally want the looser policy.

## 6. Migration status checklist

- [ ] 0001-0008 applied to the Supabase project (verify table count = 24, RLS enabled).
- [ ] 0009 Part A run (identification) — output reviewed.
- [ ] 0009 Part B run (if any rows <75) — legacy values clamped to 75.
- [ ] 0009 Part C run — CHECK constraints tightened to 75-100 (atomic, verified).
- [ ] 0009 Part D run — zero rows <75, constraints confirmed.
- [ ] 0009 Part E run — `app_settings.matching_threshold_floor = {"minimum_matching_percentage": 80}`.
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` provisioned in Vercel (Preview + Production).
- [ ] `APP_BASE_URL` set to the deployment URL (required for the event-driven continuation chain — Part 7).
- [ ] Redeploy — verify `GET /api/admin/jobs/matching-threshold` returns 80 from Supabase.

## 7. Cutover status (honest)

- **Threshold (this batch):** Supabase-backed. `getGlobalMatchingThreshold` reads `app_settings` via the Supabase data-access layer (`src/lib/supabase/data/app-settings.ts`); `setGlobalMatchingThreshold` writes it. The Firestore `app_settings` threshold doc is no longer used (removed per Prompt §5.1 — no conflicting values). Until Supabase is provisioned, the reader returns the default 80 (matching still runs) and admin writes return an honest 503.
- **Other routes:** 55 direct + 7 transitive = **62 Firestore-dependent routes** remain on Firestore (the custom JWT auth layer + all candidate/admin/public data). The full route cutover is a separate, founder-approved effort; the schema (0001-0009), the migration mapper (12 collections → 18 tables), and the typed Supabase clients are staged. Auth stays on the custom Firestore+JWT layer until the Supabase Auth transition is implemented and verified.
- **Live acceptance is separate from code acceptance:** the SQL must be executed + verified against the actual project before the Supabase database is considered migrated.
