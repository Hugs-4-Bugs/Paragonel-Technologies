-- =============================================================================
-- Paragonel Technologies — Row Level Security (migration 0002)
-- =============================================================================
-- Strict record-level authorization. Supabase exposes two roles:
--   anon          — unauthenticated browser requests
--   authenticated — a logged-in user (auth.uid() returns their id)
--
-- Helper functions (SECURITY DEFINER, fixed search_path) let policies check the
-- caller's admin role without RLS recursion on admin_roles itself.
--
-- Principles:
--   - Candidates read/write ONLY their own profile, resumes, applications,
--     skills, experience, education, projects, certifications, alert prefs.
--   - Anonymous can: subscribe to newsletter, submit a contact enquiry, read
--     published jobs + published CMS content. Nothing else.
--   - Admins (any role) read operational tables; super_admin manages roles +
--     app_settings + bootstrap.
--   - Newsletter subscriber list is NEVER exposed to anonymous/authenticated
--     (no enumeration). Unsubscribe is handled by the service role (token-based).
--   - email_delivery_events + audit_logs are service-role-write, admin-read.
--   - The Postgres service role bypasses RLS entirely (server-side trusted ops).
-- =============================================================================

-- ---------- role helper functions ----------
-- is_admin(): caller holds ANY non-suspended admin role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND suspended_at IS NULL
  );
$$;

-- is_super_admin(): caller is a non-suspended super_admin.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() AND role = 'super_admin' AND suspended_at IS NULL
  );
$$;

-- ---------- 1. profiles ----------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- INSERT handled by the service role (auth trigger creates the profile).

-- ---------- 2. admin_roles ----------
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_roles_select_own_or_super ON public.admin_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY admin_roles_insert_super ON public.admin_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY admin_roles_update_super ON public.admin_roles
  FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY admin_roles_delete_super ON public.admin_roles
  FOR DELETE TO authenticated USING (public.is_super_admin());

-- ---------- 3. candidate_profiles ----------
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY candidate_profiles_select_own_or_admin ON public.candidate_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY candidate_profiles_upsert_own ON public.candidate_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY candidate_profiles_update_own ON public.candidate_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY candidate_profiles_delete_own ON public.candidate_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------- 4-8. candidate_skills / experience / education / projects / certifications ----------
-- All owned via candidate_id → candidate_profiles.user_id = auth.uid().
-- A helper function centralizes the ownership check (avoids a join in every policy).
CREATE OR REPLACE FUNCTION public.owns_candidate_row(candidate_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidate_profiles
    WHERE user_id = auth.uid() AND user_id = candidate_id
  );
$$;

-- candidate_skills
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY cskills_select_own_or_admin ON public.candidate_skills
  FOR SELECT TO authenticated USING (public.owns_candidate_row(candidate_id) OR public.is_admin());
CREATE POLICY cskills_insert_own ON public.candidate_skills
  FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cskills_update_own ON public.candidate_skills
  FOR UPDATE TO authenticated USING (public.owns_candidate_row(candidate_id)) WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cskills_delete_own ON public.candidate_skills
  FOR DELETE TO authenticated USING (public.owns_candidate_row(candidate_id));

-- candidate_experience
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
CREATE POLICY cexp_select_own_or_admin ON public.candidate_experience
  FOR SELECT TO authenticated USING (public.owns_candidate_row(candidate_id) OR public.is_admin());
CREATE POLICY cexp_insert_own ON public.candidate_experience
  FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cexp_update_own ON public.candidate_experience
  FOR UPDATE TO authenticated USING (public.owns_candidate_row(candidate_id)) WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cexp_delete_own ON public.candidate_experience
  FOR DELETE TO authenticated USING (public.owns_candidate_row(candidate_id));

-- candidate_education
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY cedu_select_own_or_admin ON public.candidate_education
  FOR SELECT TO authenticated USING (public.owns_candidate_row(candidate_id) OR public.is_admin());
CREATE POLICY cedu_insert_own ON public.candidate_education
  FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cedu_update_own ON public.candidate_education
  FOR UPDATE TO authenticated USING (public.owns_candidate_row(candidate_id)) WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cedu_delete_own ON public.candidate_education
  FOR DELETE TO authenticated USING (public.owns_candidate_row(candidate_id));

-- candidate_projects
ALTER TABLE public.candidate_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY cproj_select_own_or_admin ON public.candidate_projects
  FOR SELECT TO authenticated USING (public.owns_candidate_row(candidate_id) OR public.is_admin());
CREATE POLICY cproj_insert_own ON public.candidate_projects
  FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cproj_update_own ON public.candidate_projects
  FOR UPDATE TO authenticated USING (public.owns_candidate_row(candidate_id)) WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY cproj_delete_own ON public.candidate_projects
  FOR DELETE TO authenticated USING (public.owns_candidate_row(candidate_id));

-- candidate_certifications
ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY ccert_select_own_or_admin ON public.candidate_certifications
  FOR SELECT TO authenticated USING (public.owns_candidate_row(candidate_id) OR public.is_admin());
CREATE POLICY ccert_insert_own ON public.candidate_certifications
  FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY ccert_update_own ON public.candidate_certifications
  FOR UPDATE TO authenticated USING (public.owns_candidate_row(candidate_id)) WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY ccert_delete_own ON public.candidate_certifications
  FOR DELETE TO authenticated USING (public.owns_candidate_row(candidate_id));

-- ---------- 9. resumes ----------
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY resumes_select_own_or_admin ON public.resumes
  FOR SELECT TO authenticated USING (public.owns_candidate_row(candidate_id) OR public.is_admin());
CREATE POLICY resumes_insert_own ON public.resumes
  FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY resumes_update_own ON public.resumes
  FOR UPDATE TO authenticated USING (public.owns_candidate_row(candidate_id)) WITH CHECK (public.owns_candidate_row(candidate_id));
CREATE POLICY resumes_delete_own ON public.resumes
  FOR DELETE TO authenticated USING (public.owns_candidate_row(candidate_id));
-- The actual file bytes live in Supabase Storage (private bucket); RLS on this
-- metadata table prevents reading another candidate's resume path. Signed URLs
-- are issued by the service role only.

-- ---------- 10. jobs ----------
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- Public (anon + authenticated) reads active, non-deleted jobs.
CREATE POLICY jobs_select_public_active ON public.jobs
  FOR SELECT TO anon, authenticated USING (is_active = true AND deleted_at IS NULL);
-- Admins can read everything (incl. drafts/archived).
CREATE POLICY jobs_select_admin ON public.jobs
  FOR SELECT TO authenticated USING (public.is_admin());
-- Admins write.
CREATE POLICY jobs_insert_admin ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY jobs_update_admin ON public.jobs
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY jobs_delete_admin ON public.jobs
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- 11. job_applications ----------
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
-- Candidate reads only their own (active or soft-deleted) applications.
CREATE POLICY apps_select_own_or_admin ON public.job_applications
  FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR public.is_admin());
-- Candidate may insert their own application ONLY (candidate_id must = auth.uid()).
-- The UNIQUE partial index uniq_job_applications_active enforces no duplicate
-- active application at the DB level — atomic, TOCTOU-safe.
CREATE POLICY apps_insert_own ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
-- Updates (status changes) are admin-only; candidates cannot edit their application.
CREATE POLICY apps_update_admin ON public.job_applications
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- 12. job_match_results ----------
ALTER TABLE public.job_match_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY match_select_own_or_admin ON public.job_match_results
  FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR public.is_admin());
-- Writes are service-role only (the matching pipeline runs server-side).

-- ---------- 13. job_alert_preferences ----------
ALTER TABLE public.job_alert_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_prefs_select_own_or_admin ON public.job_alert_preferences
  FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR public.is_admin());
CREATE POLICY alert_prefs_upsert_own ON public.job_alert_preferences
  FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
CREATE POLICY alert_prefs_update_own_or_admin ON public.job_alert_preferences
  FOR UPDATE TO authenticated USING (candidate_id = auth.uid() OR public.is_admin())
  WITH CHECK (candidate_id = auth.uid() OR public.is_admin());
CREATE POLICY alert_prefs_delete_own ON public.job_alert_preferences
  FOR DELETE TO authenticated USING (candidate_id = auth.uid());

-- ---------- 14. job_alert_events ----------
ALTER TABLE public.job_alert_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_events_select_own_or_admin ON public.job_alert_events
  FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR public.is_admin());
-- Writes are service-role only (pipeline).

-- ---------- 15. newsletter_subscribers ----------
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Anonymous may INSERT a subscription (subscribe). No SELECT for anon/authenticated
-- (subscriber list is never exposed — prevents enumeration).
CREATE POLICY newsletter_insert_anon ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Unsubscribe is handled by the service role (token-verified server-side), so no
-- DELETE policy for anon/authenticated. Admins can read for campaign management.
CREATE POLICY newsletter_select_admin ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY newsletter_update_admin ON public.newsletter_subscribers
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- 16. contact_enquiries ----------
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
-- Anonymous may INSERT an enquiry. No SELECT for anon/authenticated (no enumeration).
CREATE POLICY enquiries_insert_anon ON public.contact_enquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY enquiries_select_admin ON public.contact_enquiries
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY enquiries_update_admin ON public.contact_enquiries
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- 17. email_delivery_events ----------
ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;
-- Admin read-only; writes are service-role only.
CREATE POLICY email_events_select_admin ON public.email_delivery_events
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------- 18. audit_logs ----------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- super_admin read-only; writes are service-role only.
CREATE POLICY audit_logs_select_super ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_super_admin());

-- ---------- 19-23. CMS content (services / blog_posts / tech_ecosystem / testimonials / client_projects) ----------
-- Public read of active/published rows; admin write.

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_select_public_active ON public.services
  FOR SELECT TO anon, authenticated USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY services_select_admin ON public.services
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY services_write_admin ON public.services
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY blog_select_public_published ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY blog_select_admin ON public.blog_posts
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY blog_write_admin ON public.blog_posts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.tech_ecosystem ENABLE ROW LEVEL SECURITY;
CREATE POLICY tech_select_public_active ON public.tech_ecosystem
  FOR SELECT TO anon, authenticated USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY tech_select_admin ON public.tech_ecosystem
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY tech_write_admin ON public.tech_ecosystem
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonials_select_public_published ON public.testimonials
  FOR SELECT TO anon, authenticated USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY testimonials_select_admin ON public.testimonials
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY testimonials_write_admin ON public.testimonials
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_select_public_published ON public.client_projects
  FOR SELECT TO anon, authenticated USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY projects_select_admin ON public.client_projects
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY projects_write_admin ON public.client_projects
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- 24. app_settings ----------
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_select_admin ON public.app_settings
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY settings_write_super ON public.app_settings
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =============================================================================
-- End of migration 0002 — every table has RLS enabled + least-privilege policies.
-- The service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS for trusted server ops.
-- =============================================================================
