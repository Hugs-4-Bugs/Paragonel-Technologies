-- 0007_newsletter_double_optin.sql
--
-- Additive: double-opt-in columns for newsletter subscribers (Batch 2 Task 5).
--
-- The Firestore path now creates subscribers with status='pending' and activates
-- them only after they click the signed confirmation link
-- (/api/newsletter/confirm?token=). This adds the matching columns to the
-- Supabase schema WITHOUT altering existing data: existing migrated rows have no
-- `status`, so they default to 'active' (they were already-confirmed
-- subscriptions under the previous immediate-active model). No existing column
-- or index is modified destructively.
--
-- The pre-existing unique index `uniq_newsletter_active (email) WHERE
-- deleted_at IS NULL` (0001) already enforces at most one non-deleted row per
-- email regardless of status — correct for double opt-in (one pending OR active
-- per email), so it is left unchanged.

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

COMMENT ON COLUMN public.newsletter_subscribers.status IS
  'pending (awaiting double-opt-in confirmation) or active (confirmed). Existing rows default to active.';
COMMENT ON COLUMN public.newsletter_subscribers.confirmed_at IS
  'When the subscriber confirmed via the signed confirmation link (double opt-in). Null while pending.';
