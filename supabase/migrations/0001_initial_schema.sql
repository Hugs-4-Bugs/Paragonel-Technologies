-- =============================================================================
-- Paragonel Technologies — Supabase initial schema (migration 0001)
-- =============================================================================
-- Replaces Firebase Firestore as the primary application database.
--
-- Design principles:
--   - UUID primary keys (gen_random_uuid, built into Postgres 13+).
--   - Foreign keys with referential integrity (ON DELETE CASCADE for owned
--     child rows, RESTRICT for cross-entity references).
--   - Normalized candidate profile (skills/experience/education/projects/
--     certifications split into their own tables) — mirrors the existing
--     CandidateProfile sub-fields but queryable + indexable.
--   - CHECK-constrained enums for status/type/role columns.
--   - updated_at auto-maintained by a trigger.
--   - Soft deletion (deleted_at) ONLY where justified (jobs, applications,
--     newsletter, CMS content, enquiries) — never on auth/security tables.
--   - profiles.id IS the Supabase Auth user id (standard Supabase pattern:
--     a trigger on auth.users insert creates the matching profile). The DB-
--     level FK to auth.users is intentionally omitted here so the schema is
--     portable + testable against raw Postgres / PGlite; production enforces
--     the linkage via the auth-users trigger + app-level user-id usage.
-- =============================================================================

-- ---------- shared updated_at trigger function ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------- enum types ----------
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('candidate', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM ('Full Time', 'Part Time', 'Contract', 'Internship');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.work_arrangement AS ENUM ('Remote', 'Onsite', 'Hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('New', 'Reviewed', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.email_status AS ENUM ('sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.enquiry_status AS ENUM ('New', 'Contacted', 'Qualified', 'Closed', 'Spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.match_eligibility AS ENUM ('eligible', 'ineligible');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 1. profiles  (mirrors auth.users; one row per authenticated user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  email_verified  boolean NOT NULL DEFAULT false,
  full_name       text,
  account_type    public.account_type NOT NULL DEFAULT 'candidate',
  status          public.user_status NOT NULL DEFAULT 'active',
  -- consent evidence (DPDP / GDPR)
  consent_version text,
  consent_at      timestamptz,
  marketing_consent boolean NOT NULL DEFAULT false,
  marketing_consent_at timestamptz,
  token_version   integer NOT NULL DEFAULT 1,   -- bumped on password reset → revokes sessions
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 2. admin_roles  (RBAC: a user may hold one admin role)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id      uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         public.admin_role NOT NULL,
  granted_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  suspended_at timestamptz,
  suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);

-- =============================================================================
-- 3. candidate_profiles  (the candidate's application-facing profile)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  user_id                     uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline                    text,
  summary                     text,
  current_location            text,
  preferred_locations         text[] NOT NULL DEFAULT '{}',
  preferred_employment_type   public.employment_type,
  work_mode_preference        public.work_arrangement,
  total_experience_years      numeric(4,1),
  current_designation         text,
  phone                       text,
  domain                      text,
  -- job-alert + matching preferences
  job_alert_enabled           boolean NOT NULL DEFAULT false,
  matching_threshold          integer NOT NULL DEFAULT 80
                              CHECK (matching_threshold BETWEEN 25 AND 100),
  last_alert_at               timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER candidate_profiles_set_updated_at BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. candidate_skills
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  skill        text NOT NULL,
  proficiency  text,
  source       text NOT NULL DEFAULT 'manual'  -- 'manual' | 'parsed'
);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate ON public.candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill ON public.candidate_skills(skill);

-- 5. candidate_experience
CREATE TABLE IF NOT EXISTS public.candidate_experience (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  company      text NOT NULL,
  designation  text,
  start_date   date,
  end_date     date,
  is_current   boolean NOT NULL DEFAULT false,
  description  text
);
CREATE INDEX IF NOT EXISTS idx_candidate_exp_candidate ON public.candidate_experience(candidate_id);

-- 6. candidate_education
CREATE TABLE IF NOT EXISTS public.candidate_education (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  institution  text NOT NULL,
  degree       text,
  field        text,
  start_year   integer,
  end_year     integer
);
CREATE INDEX IF NOT EXISTS idx_candidate_edu_candidate ON public.candidate_education(candidate_id);

-- 7. candidate_projects
CREATE TABLE IF NOT EXISTS public.candidate_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  tech_stack   text[] NOT NULL DEFAULT '{}',
  url          text,
  role         text
);
CREATE INDEX IF NOT EXISTS idx_candidate_proj_candidate ON public.candidate_projects(candidate_id);

-- 8. candidate_certifications
CREATE TABLE IF NOT EXISTS public.candidate_certifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  name         text NOT NULL,
  issuer       text,
  issued_date  date,
  expiry_date  date,
  url          text
);
CREATE INDEX IF NOT EXISTS idx_candidate_cert_candidate ON public.candidate_certifications(candidate_id);

-- =============================================================================
-- 9. resumes  (metadata + private storage reference; never a public URL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  storage_path  text NOT NULL,              -- Supabase Storage object path in candidate-resumes bucket
  file_name     text NOT NULL,
  content_type  text NOT NULL,
  size_bytes    bigint CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 5242880)), -- 5 MB; NULL only for migrated rows without size info
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  parsed_at     timestamptz,
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_resumes_candidate ON public.resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_active ON public.resumes(candidate_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- 10. jobs  (careers CMS — the matching source)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              text UNIQUE,                          -- human-readable ref e.g. PAR-001
  title               text NOT NULL,
  department          text,
  location            text NOT NULL,
  employment_type     public.employment_type NOT NULL DEFAULT 'Full Time',
  work_arrangement    public.work_arrangement NOT NULL DEFAULT 'Remote',
  experience_required text,                                  -- free text e.g. "3-5 years"
  skills              text[] NOT NULL DEFAULT '{}',          -- REQUIRED skills
  preferred_skills    text[] NOT NULL DEFAULT '{}',
  seniority           text,
  education_required  text,
  description         text,
  is_active           boolean NOT NULL DEFAULT true,
  deleted_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(created_at DESC) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON public.jobs USING GIN (skills);
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 11. job_applications  (atomic duplicate protection via UNIQUE partial index)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id          text UNIQUE NOT NULL,              -- APP_<random>
  job_id                  uuid NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  candidate_id            uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  candidate_email         text NOT NULL,
  candidate_name          text,
  cover_letter            text,
  expected_salary         text,
  notice_period           text,
  preferred_job_location  text,
  match_score             integer CHECK (match_score BETWEEN 0 AND 100),
  applied_via             text NOT NULL DEFAULT 'web',       -- 'web' | 'ai_agent'
  status                  public.application_status NOT NULL DEFAULT 'New',
  confirmation_email      jsonb,                              -- {status, detail, at}
  applied_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz
);
-- Atomic duplicate: one ACTIVE application per (candidate, job). A partial UNIQUE
-- index means soft-deleted applications don't block a re-apply, but an active
-- one does — enforced at the DB level, immune to TOCTOU races.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_job_applications_active
  ON public.job_applications(candidate_id, job_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON public.job_applications(candidate_id);

-- =============================================================================
-- 12. job_match_results  (explainable scoring output)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.job_match_results (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                   uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id             uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  overall_score            integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  eligibility              public.match_eligibility NOT NULL,
  matched_required_skills  text[] NOT NULL DEFAULT '{}',
  missing_required_skills  text[] NOT NULL DEFAULT '{}',
  matched_preferred_skills text[] NOT NULL DEFAULT '{}',
  reasons                  text[] NOT NULL DEFAULT '{}',
  computed_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_match_results_candidate ON public.job_match_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_results_eligible ON public.job_match_results(candidate_id) WHERE eligibility = 'eligible';

-- 13. job_alert_preferences (denormalized mirror of candidate_profiles alert fields for fast pipeline reads)
CREATE TABLE IF NOT EXISTS public.job_alert_preferences (
  candidate_id    uuid PRIMARY KEY REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  enabled         boolean NOT NULL DEFAULT false,
  threshold       integer NOT NULL DEFAULT 80 CHECK (threshold BETWEEN 25 AND 100),
  last_alert_at   timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER job_alert_prefs_set_updated_at BEFORE UPDATE ON public.job_alert_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 14. job_alert_events (one row per alert email sent — for dedup + suppression audit)
CREATE TABLE IF NOT EXISTS public.job_alert_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(user_id) ON DELETE CASCADE,
  job_id       uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sent_at      timestamptz NOT NULL DEFAULT now(),
  email_status public.email_status NOT NULL DEFAULT 'sent'
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_job_alert_events_dedup
  ON public.job_alert_events(candidate_id, job_id);  -- one alert per (candidate, job) ever

-- =============================================================================
-- 15. newsletter_subscribers
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                    text NOT NULL,
  source                   text NOT NULL DEFAULT 'Website Footer',
  subscribed_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz,                -- soft-delete on unsubscribe (suppression)
  unsubscribed_at          timestamptz,
  confirmation_email       jsonb
);
-- One ACTIVE subscription per email. Re-subscribe allowed after unsubscribe.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_newsletter_active
  ON public.newsletter_subscribers(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

-- =============================================================================
-- 16. contact_enquiries  (per the founder's inbox-only privacy preference,
--     these are stored for processing but flagged; the founder decides CRM use)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  email             text NOT NULL,
  company           text,
  role              text,
  business_problem  text NOT NULL,
  required_service  text,
  project_description text,
  scope             text,
  budget            text,
  timeline          text,
  preferred_contact text,
  additional_info   text,
  marketing_consent boolean NOT NULL DEFAULT false,
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  status            public.enquiry_status NOT NULL DEFAULT 'New',
  deleted_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.contact_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON public.contact_enquiries(email);

-- =============================================================================
-- 17. email_delivery_events  (honest delivery tracking — no OTP/token/PII values)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.email_delivery_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient    text NOT NULL,                 -- email address (hashed in logs, plaintext here for delivery audit)
  template     text NOT NULL,                 -- 'otp' | 'application_confirmation' | 'newsletter_welcome' | ...
  subject      text NOT NULL,
  status       public.email_status NOT NULL,
  detail       text,                          -- short non-sensitive code, never OTP/token/password
  message_id   text,
  related_type text,                          -- 'application' | 'newsletter' | 'enquiry' | ...
  related_id   uuid,
  sent_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON public.email_delivery_events(recipient);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON public.email_delivery_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_related ON public.email_delivery_events(related_type, related_id);

-- =============================================================================
-- 18. audit_logs  (admin activity + security events; actor IP hashed)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email  text,
  action       text NOT NULL,                 -- 'admin.login' | 'job.create' | 'application.view' | ...
  target_type  text,
  target_id    text,
  ip_hash      text,                          -- HMAC-hashed IP, never raw
  detail       jsonb,                         -- non-sensitive context
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =============================================================================
-- 19. services  (CMS — public marketing services)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  summary     text,
  description text,
  icon        text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(sort_order) WHERE deleted_at IS NULL AND is_active = true;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 20. blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  excerpt      text,
  content      text,
  cover_image  text,
  author       text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(published_at DESC) WHERE deleted_at IS NULL AND is_published = true;
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 21. tech_ecosystem
CREATE TABLE IF NOT EXISTS public.tech_ecosystem (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  category    text,
  description text,
  logo        text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER tech_ecosystem_set_updated_at BEFORE UPDATE ON public.tech_ecosystem
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 22. testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name   text NOT NULL,
  client_role   text,
  company       text,
  content       text NOT NULL,
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  is_published  boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials(sort_order) WHERE deleted_at IS NULL AND is_published = true;

-- 23. client_projects
CREATE TABLE IF NOT EXISTS public.client_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  client       text,
  summary      text,
  description  text,
  technologies text[] NOT NULL DEFAULT '{}',
  image        text,
  is_published boolean NOT NULL DEFAULT false,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER client_projects_set_updated_at BEFORE UPDATE ON public.client_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 24. app_settings  (key-value for bootstrap flag + operational config)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE TRIGGER app_settings_set_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bootstrap sentinel: 'superadmin_bootstrapped' = true once the first super_admin exists.
INSERT INTO public.app_settings (key, value) VALUES ('superadmin_bootstrapped', 'false'::jsonb)
  ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- End of migration 0001 — 24 tables, full referential integrity.
-- RLS policies follow in 0002_rls_policies.sql.
-- =============================================================================
