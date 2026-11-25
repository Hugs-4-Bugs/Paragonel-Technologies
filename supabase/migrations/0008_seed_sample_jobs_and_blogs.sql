-- =============================================================================
-- 0008_seed_sample_jobs_and_blogs.sql
-- Prepared seed data for the Supabase cutover (Prompt §8.2, §9.2, §5.2).
-- -----------------------------------------------------------------------------
-- STATUS: PREPARED, NOT YET APPLIED.
--   The live Supabase project is NOT reachable from the build sandbox (no real
--   NEXT_PUBLIC_SUPABASE_URL / service-role key provisioned — only the
--   placeholder `https://your-project.supabase.co` exists in .env.example).
--   The running application currently persists to Firebase/Firestore; the
--   Supabase layer (src/lib/supabase/*) is schema-complete but not yet wired
--   into any route. Apply this migration ONLY after the Supabase cutover is
--   explicitly authorized and real credentials are provisioned.
--
-- SAFETY:
--   - Idempotent: ON CONFLICT DO NOTHING on the unique job_id / slug keys, so
--     repeated execution does not create duplicate seed rows.
--   - Non-destructive: INSERT-only (no DROP / DELETE / TRUNCATE / ALTER).
--   - Sample jobs are marked is_active = true so they are visible on the
--     careers page once the app reads from Supabase; they do NOT trigger
--     candidate notifications by themselves (job-match alerts are driven by the
--     app's event flow on publish/activate, not by this seed).
--   - Existing hardcoded blog content in src/lib/data.ts is PRESERVED
--     (Prompt §9.1) — this file only ADDS Supabase-backed blog rows.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8 sample jobs across the categories listed in Prompt §8.2
-- (Java Backend, Full Stack, Frontend, Cloud, DevOps, AI/ML, QA Automation,
--  Data Engineering). skills/preferred_skills are normalized text[] arrays.
-- -----------------------------------------------------------------------------
INSERT INTO public.jobs
  (job_id, title, department, location, employment_type, work_arrangement,
   experience_required, skills, preferred_skills, seniority, education_required,
   description, is_active)
VALUES
  ('PAR-JBE-001', 'Java Backend Engineer', 'Engineering', 'Bengaluru, India',
   'Full Time', 'Hybrid', '3-5 years',
   ARRAY['Java','Spring Boot','Hibernate','PostgreSQL','REST API','Docker'],
   ARRAY['Microservices','Kubernetes','Kafka'],
   'Mid', 'B.E./B.Tech in CS or equivalent',
   'Design and build scalable Java backend services for the Paragonel platform — APIs, data models, and integrations with Firebase and Supabase. Own service reliability and performance end-to-end.',
   true),
  ('PAR-FSE-002', 'Full Stack Engineer', 'Engineering', 'Remote (India)',
   'Full Time', 'Remote', '4-6 years',
   ARRAY['TypeScript','React','Next.js','Node.js','PostgreSQL','Tailwind CSS'],
   ARRAY['Supabase','Vercel','GraphQL'],
   'Mid', 'B.E./B.Tech in CS or equivalent',
   'Build features across the Next.js front end and Node/Serverless back end. Work on the admin portal, candidate experience, and the public website.',
   true),
  ('PAR-FE-003',  'Frontend Engineer', 'Engineering', 'Bengaluru, India',
   'Full Time', 'Hybrid', '2-4 years',
   ARRAY['TypeScript','React','Next.js','Tailwind CSS','Accessibility'],
   ARRAY['Framer Motion','Storybook'],
   'Junior', 'B.E./B.Tech in CS or equivalent',
   'Craft responsive, accessible UI for the Paragonel website and candidate portal. Pixel-faithful implementation from design, with attention to performance and Core Web Vitals.',
   true),
  ('PAR-CLD-004', 'Cloud Engineer', 'Platform', 'Remote (India)',
   'Full Time', 'Remote', '4-6 years',
   ARRAY['AWS','Terraform','Docker','Kubernetes','Linux','CI/CD'],
   ARRAY['GCP','Azure','CloudFormation'],
   'Mid', 'B.E./B.Tech in CS or equivalent',
   'Own cloud infrastructure, IaC, and deployment pipelines for the Paragonel platform across Vercel, Firebase, and Supabase.',
   true),
  ('PAR-DEV-005', 'DevOps Engineer', 'Platform', 'Bengaluru, India',
   'Full Time', 'Hybrid', '3-5 years',
   ARRAY['Docker','Kubernetes','GitHub Actions','Terraform','Linux','Prometheus'],
   ARRAY['Grafana','ArgoCD','Ansible'],
   'Mid', 'B.E./B.Tech in CS or equivalent',
   'Automate build, test, and deployment. Improve observability, reliability, and incident response for production services.',
   true),
  ('PAR-AIM-006', 'AI/ML Engineer', 'Engineering', 'Remote (India)',
   'Full Time', 'Remote', '3-5 years',
   ARRAY['Python','TensorFlow','PyTorch','LLM','RAG','Vector Database'],
   ARRAY['Genkit','Gemini','Hugging Face'],
   'Mid', 'M.E./M.Tech or B.E./B.Tech in CS/AI',
   'Develop the Paragonel AI candidate assistant and matching features — retrieval-augmented generation, evaluation harnesses, and safe, explainable recommendations.',
   true),
  ('PAR-QA-007',  'QA Automation Engineer', 'Engineering', 'Bengaluru, India',
   'Full Time', 'Hybrid', '3-5 years',
   ARRAY['TypeScript','Playwright','Vitest','CI/CD','API Testing'],
   ARRAY['Cypress','k6','Postman'],
   'Mid', 'B.E./B.Tech in CS or equivalent',
   'Build and maintain automated test coverage across the web app, APIs, and the admin portal. Own release quality gates and regression suites.',
   true),
  ('PAR-DEN-008', 'Data Engineer', 'Platform', 'Remote (India)',
   'Full Time', 'Remote', '3-5 years',
   ARRAY['Python','SQL','PostgreSQL','Airflow','dbt','Spark'],
   ARRAY['Kafka','Snowflake','BigQuery'],
   'Mid', 'B.E./B.Tech in CS or equivalent',
   'Design and operate data pipelines, warehouse models, and analytics that power product insights and the matching engine.',
   true)
ON CONFLICT (job_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Company-related blog posts (Prompt §9.2). Original content, Paragonel-relevant.
-- Hardcoded blog entries in src/lib/data.ts remain available (Prompt §9.1).
-- -----------------------------------------------------------------------------
INSERT INTO public.blog_posts
  (slug, title, excerpt, content, author, is_published, published_at)
VALUES
  ('enterprise-software-engineering-disciplines',
   'The Disciplines That Separate Enterprise Software Engineering from Projects',
   'Why enterprise software engineering is a discipline of tradeoffs, observability, and long-horizon ownership — not just shipping features.',
   'Enterprise software engineering is less about any single technology and more about the disciplines that keep a system honest over years: explicit interfaces, reversible decisions, observable behavior, and a bias toward boring, well-understood components. In this post we outline the practices Paragonel applies — contract-first APIs, structured logs as a primary interface, infrastructure as code, and change management that treats production as a privilege to write to — and why they matter more than framework choice for systems that must outlive their original authors.',
   'Paragonel Technologies', true, now()),
  ('java-spring-boot-at-scale-hard-won-lessons',
   'Java and Spring Boot at Scale: Hard-Won Lessons',
   'A field guide to the Spring Boot decisions that bite at scale — classpath bloat, transaction boundaries, connection pools, and scheduled-job pitfalls.',
   'Spring Boot accelerates delivery, but its defaults quietly encode assumptions that surface only under load. We share lessons from running Java/Spring services in production: right-sizing HikariCP against your actual workload, treating @Transactional boundaries as explicit architecture, avoiding classpath drift between services, and replacing ad-hoc @Scheduled jobs with durable, idempotent event processing. The pattern that recurs: the cost of a decision is paid in operations, not in the initial build, so optimize for operability first.',
   'Paragonel Technologies', true, now()),
  ('cloud-infrastructure-as-code-from-first-principles',
   'Cloud Infrastructure as Code: From First Principles',
   'A pragmatic approach to IaC that avoids the two failure modes — under-automation and over-abstraction.',
   'Infrastructure as Code fails in two directions: too little automation (snowflake environments, drift, fear of reproduction) and too much abstraction (DSLs that obscure the underlying cloud). We describe the middle path Paragonel takes: Terraform modules that mirror the cloud provider''s own resource model, environment separation via state rather than branches, and a policy of "every resource is reproducible from main." The goal is not clever code but a system where creating or recreating any environment is a single, auditable command.',
   'Paragonel Technologies', true, now())
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Matching threshold floor (Prompt §5.2: minimum_matching_percentage = 75).
-- This is the storage-side configuration for the future Supabase-backed path.
-- The CURRENT app enforces the 75% floor in code (src/lib/matching/preferences.ts,
-- MIN_THRESHOLD = 75) regardless of this value; this row makes the policy
-- explicit at the data layer for when the cutover occurs.
-- -----------------------------------------------------------------------------
INSERT INTO public.app_settings (key, value)
VALUES ('matching_threshold_floor', '{"minimum_matching_percentage": 75}'::jsonb)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();
