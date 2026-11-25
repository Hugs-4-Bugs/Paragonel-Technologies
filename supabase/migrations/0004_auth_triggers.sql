-- =============================================================================
-- Paragonel Technologies — Auth triggers (migration 0004)
-- =============================================================================
-- Production-only: references `auth.users` (provisioned by Supabase Auth). NOT
-- applied to PGlite (no auth schema) — verified by review, runs against the real
-- Supabase project.
--
-- On a new auth.users row (signup), auto-create:
--   1. public.profiles(id = new.id, email = new.email, email_verified, account_type='candidate')
--   2. public.candidate_profiles(user_id = new.id)
-- This keeps profiles in sync with auth.users without dual-write in app code.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, email_verified, account_type, status)
  VALUES (new.id, new.email, COALESCE(new.email_confirmed_at IS NOT NULL, false), 'candidate', 'active')
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
        email_verified = COALESCE(new.email_confirmed_at IS NOT NULL, public.profiles.email_verified);
  INSERT INTO public.candidate_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mirror email_verified changes back to profiles when Supabase confirms an email.
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (new.email_confirmed_at IS NOT NULL AND old.email_confirmed_at IS NULL) THEN
    UPDATE public.profiles SET email_verified = true WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW WHEN (new.email_confirmed_at IS NOT NULL AND old.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_confirmed();

-- =============================================================================
-- End of migration 0004.
-- =============================================================================
