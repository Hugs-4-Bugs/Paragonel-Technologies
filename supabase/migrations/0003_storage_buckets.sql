-- =============================================================================
-- Paragonel Technologies — Supabase Storage buckets (migration 0003)
-- =============================================================================
-- Private bucket for candidate resumes. NEVER public. Access is via signed URLs
-- issued by the service role (server-side, short expiry) or via storage RLS
-- policies that enforce per-user folder ownership.
--
-- NOTE: this migration targets the Supabase `storage` schema (storage.buckets +
-- storage.objects), which is provisioned by the Supabase platform. It is NOT
-- applied to PGlite (which has no storage schema) — it runs against the real
-- Supabase project. RLS policies on storage.objects enforce ownership.
-- =============================================================================

-- 1. Private candidate-resumes bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-resumes',
  'candidate-resumes',
  false,                                   -- PRIVATE
  5242880,                                 -- 5 MB
  ARRAY['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies on storage.objects for the candidate-resumes bucket.
--    Folder convention: candidate-resumes/<user_id>/<timestamp>_<sanitized_name>
--    A candidate may upload/list/read only objects under their own <user_id>.
--    Admins may read (for application review). Service role bypasses RLS.

-- Candidates: CRUD their own folder.
CREATE POLICY "resumes_upload_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'candidate-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'candidate-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins: read any resume (for application review). No upload/delete — resumes
-- are always candidate-uploaded; admins download via service-role signed URLs.
CREATE POLICY "resumes_read_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'candidate-resumes'
    AND public.is_admin()
  );

-- =============================================================================
-- End of migration 0003.
-- =============================================================================
