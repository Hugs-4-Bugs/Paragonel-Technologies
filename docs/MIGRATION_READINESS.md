# Migration Readiness — Firebase → Supabase

Status: **readiness only.** The Supabase schema, RLS, storage, client lib, and
migration tooling are complete and tested locally. The application still reads
from Firebase; the route-level data-access cutover is a later, controlled
batch. This document captures what is verified locally, what is NOT verified
remotely, the deterministic-mapping policy, and the exact external credentials
a cutover requires. **Never print credentials.**

## What is verified locally (deterministic, tested)

- **Schema + RLS** — `supabase/migrations/0001`–`0005` apply cleanly to an
  in-process PGlite; 24 tables, constraints, indexes, RLS policies, the private
  `candidate-resumes` bucket, auth triggers, and grants are validated by
  `src/lib/supabase/__tests__/rls.test.ts` (23 behavioral tests) +
  `scripts/validate-schema.js`.
- **Deterministic mapping** — `src/lib/migration/mapper.ts` uses UUIDv5
  (SHA-1, fixed namespace) so the same Firestore email/job-id produces the same
  uuid every run → upserts are idempotent (`src/lib/migration/__tests__/migrate.test.ts`).
- **Timestamp policy (no `new Date()` fallback)** — migrated rows whose source
  Firestore doc had no timestamp fall back to the deterministic sentinel
  `MIGRATION_FALLBACK_TIMESTAMP = '1970-01-01T00:00:00.000Z'` (the Unix epoch),
  NOT a per-row `new Date()`. The target columns are `NOT NULL DEFAULT now()`, so
  a value is required; the epoch is an explicit, documented sentinel that makes
  missing-timestamp rows identical across runs + identifiable for reconciliation
  via `WHERE created_at = '1970-01-01'`. Verified by
  `src/lib/migration/__tests__/mapper-hardening.test.ts`.
- **Resume Storage path remap** — `remapResumeStoragePath` rewrites the Firebase
  `candidates/{email}/resumes/{ts}_{name}` path to the Supabase
  `candidate-resumes/{userId}/{ts}_{name}` convention so the bucket RLS policy
  `(storage.foldername(name))[1] = auth.uid()::text` holds. The file bytes are
  migrated separately (copy objects between buckets during cutover); this only
  rewrites the metadata reference on the `resumes` row.
- **Checksums + reconciliation** — `src/lib/migration/checksum.ts`
  (`checksumDoc`, stable SHA-256 over sorted-key JSON with Timestamp
  normalization) + `src/lib/migration/reconcile.ts`
  (`reconcileCounts`, `detectDuplicateSources`, `detectTargetIdCollisions`,
  `buildAuditRows`) enable drift detection, duplicate/collision detection, and
  audit-row production. Covered by `checksum.test.ts` + `reconcile.test.ts`.
- **Reconciliation table** — `supabase/migrations/0006_migration_reconciliation.sql`
  adds an additive `migration_audit` table (source_collection, source_id,
  target_table, target_id, checksum, migrated_at) with a unique constraint on
  (source_collection, source_id) for idempotent upsert + super-admin-only reads.
  This migration does not alter 0001–0005.
- **Supabase Auth import** — `src/lib/migration/auth-import.ts` imports a
  Firebase user via `supabase.auth.admin.createUser({ email, password,
  email_confirm })`. It intentionally does NOT pass `password_hash` (the Supabase
  Auth Admin API does not accept it); a strong random password is generated +
  the user resets via OTP on first login. Covered by `auth-import.test.ts`.

## What is NOT verified remotely (external blockers)

The following require credentials/permissions the founder must supply; they are
not verified by local tests:

1. **Production Firebase service-account** — `FIREBASE_ADMIN_PROJECT_ID`,
   `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`. Required for the
   orchestrator (`scripts/migrate-firebase-to-supabase.ts`) to read production
   Firestore. Without these, the migration runs only against the local emulator.
2. **Supabase project** — `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The service-role
   key is required to write `migration_audit` rows + call `auth.admin.createUser`.
   Never put it in a `NEXT_PUBLIC_*` variable.
3. **Storage object copy** — the resume file bytes are NOT migrated by the
   current tooling (only the metadata reference is). A controlled cutover must
   copy each object from the Firebase default bucket to the Supabase
   `candidate-resumes` bucket under the remapped `{userId}/{name}` path.
4. **Supabase Auth cutover** — importing users creates them with a random
   password; every imported user must complete a password reset via OTP. The
   custom JWT session layer (`JWT_SECRET`/`OTP_SECRET`) stays until the route
   layer switches to Supabase Auth.

## Known migration drift

- **Historical timestamps** — any Firestore doc missing `createdAt`/`updatedAt`/
  `appliedAt`/`subscribedAt`/etc. is stamped `1970-01-01T00:00:00.000Z`. These
  rows are identifiable for later backfill if the real timestamp is recovered.
- **Password hashes** — Firebase bcrypt hashes cannot be forwarded to Supabase
  Auth (the Admin API does not accept `password_hash`). Imported users must
  reset their password.
- **Resume file bytes** — metadata migrates; bytes do not (see blocker 3).
- **Unmapped collections** — `otpRequests`, `sessions`, `securityEvents`,
  `registrationChallenges`, `bootstrap` are intentionally not migrated (Supabase
  Auth + a new session/audit model replace them). `reconcileCounts` ignores them.
- **Orphaned job applications** — applications with no resolvable candidate
  email are skipped by `mapApplication` (no FK to invent).

## Cutover prerequisites (exact external credentials/permissions)

| Variable | Purpose | Required for |
| --- | --- | --- |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase source read | production migration read |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase source read | production migration read |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase source read | production migration read |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase target | cutover + app runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | cutover + app runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin writes | `migration_audit`, `auth.admin.createUser` |
| `JWT_SECRET` (≥32 chars) | custom session layer | retained until Auth cutover |
| `OTP_SECRET` (≥32 chars) | OTP signing | retained until Auth cutover |

## Local validation ladder

```
node scripts/validate-schema.js          # schema invariants (24 tables, RLS, indexes)
npx vitest run src/lib/supabase          # RLS behavioral (23)
npx vitest run src/lib/migration         # mapper + migrate + checksum + reconcile + auth-import (62)
npm run typecheck && npm run build       # typecheck + build
```

All of the above run without external credentials. Production cutover is blocked
on the credentials in the table above.
