-- =============================================================================
-- Paragonel Technologies — role grants (migration 0005)
-- =============================================================================
-- Supabase convention: grant broad table-level privileges to the anon +
-- authenticated roles, then rely on RLS policies (0002) to filter rows. The
-- platform does this automatically for tables created via the dashboard, but
-- raw SQL migrations (and PGlite/local Postgres) need explicit grants so the
-- policies are actually reachable.
--
-- This keeps the schema portable: it works identically on a real Supabase
-- project, raw Postgres, and PGlite (local tests).
-- =============================================================================

-- Schema usage.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- SELECT on all public tables for both roles. RLS policies filter which rows
-- are actually visible (e.g. anon sees 0 rows from profiles because there is
-- no anon SELECT policy on profiles).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Authenticated users may attempt INSERT/UPDATE/DELETE; RLS WITH CHECK policies
-- enforce ownership (e.g. a candidate can only INSERT a job_application whose
-- candidate_id = auth.uid(), only UPDATE their own profile, etc.).
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Anonymous may submit (insert-only) to the two public-submit tables.
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT INSERT ON public.contact_enquiries TO anon;

-- Default privileges for future tables created by the postgres role, so the
-- grants stay current as the schema evolves.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- =============================================================================
-- End of migration 0005.
-- =============================================================================
