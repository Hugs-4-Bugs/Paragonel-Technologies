# Environment Setup — Paragonel Technologies (Supabase architecture)

This document is the complete handoff for configuring every environment variable
the application needs, plus the external (non-code) setup that environment
variables alone cannot cover. The goal: the founder can fill in the variables +
configure the corresponding Supabase / email / CAPTCHA / AI resources without
hunting through source code.

## Architecture status

**Supabase is the approved primary backend.** The complete Supabase foundation
is delivered + verified locally against real Postgres (PGlite):

- `supabase/migrations/0001_initial_schema.sql` — 24 normalized tables (UUID PKs,
  FKs, indexes, constraints, soft-delete where justified).
- `supabase/migrations/0002_rls_policies.sql` — 73 RLS policies (anon/candidate/
  admin/super-admin least-privilege).
- `supabase/migrations/0003_storage_buckets.sql` — private `candidate-resumes`
  bucket + storage RLS.
- `supabase/migrations/0004_auth_triggers.sql` — auto-create `profiles` +
  `candidate_profiles` on Supabase Auth signup.
- `supabase/migrations/0005_grants.sql` — role grants (portable to raw Postgres).
- `src/lib/supabase/{server,client,types}.ts` — typed Supabase client lib.
- `src/lib/migration/{mapper,migrate}.ts` + `scripts/migrate-firebase-to-supabase.ts`
  — idempotent Firebase→Supabase migration tooling (verified end-to-end:
  Firestore emulator → PGlite, with counts + reconciliation).
- 49 local tests pass (23 RLS behavioral + 19 mapper + 7 migration e2e).

**The Firebase variables are RETAINED** because the 50 Firebase Admin SDK routes
are still active. The route-level data-access cutover (swapping `getAdminDb()`
calls for `getSupabaseServer()` + the data-access layer) is the next batch.
Removing the Firebase variables before the routes are swapped would break the
running app. Once the cutover is complete + the founder confirms, delete the
entire Firebase section from `.env.local`.

A startup validation module (`src/lib/env-validation.ts`, wired via
`src/instrumentation.ts`) prints a non-sensitive summary of missing/empty
required variables on every server boot.

---

## 1. Files you need

| File | Purpose | Committed? |
| --- | --- | --- |
| `.env.example` | Placeholders only — documents every variable. Copy to start. | Yes |
| `.env.template` | Founder-facing blank quick-fill template. | Yes |
| `.env.local` | Your real local values. The dev server reads this. | No (gitignored) |

**Never commit a `.env.local` containing real secrets.**

---

## 2. Supabase variables (primary backend)

| Variable | Public/Secret | Where to obtain | Local | Vercel |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase dashboard → Project settings → API → Project URL | `https://<project>.supabase.co` (or local) | Project → Settings → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase dashboard → API → anon public key | the anon key | same |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase dashboard → API → service_role key | the service-role key | same (mark as Sensitive) |

**Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable.** It
bypasses RLS + must stay server-side.

---

## 3. Email / SMTP

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `SMTP_HOST` | Secret | Your SMTP provider (e.g. `smtp.resend.com`) |
| `SMTP_PORT` | Secret | `587` (STARTTLS) or `465` (TLS) |
| `SMTP_SECURE` | Secret | `true` for 465, `false` for 587 |
| `SMTP_USER` | Secret | SMTP username (API key for Resend) |
| `SMTP_PASS` | Secret | SMTP password / API key |
| `SMTP_FROM` | Secret | Verified sender: `Paragonel <noreply@yourdomain.com>` |
| `COMPANY_INBOX` | Secret | Real company inbox for enquiry notifications |
| `APP_BASE_URL` | Public-ish | `http://localhost:3000` (dev) / prod URL |

Pick ONE provider (Resend recommended — simple, generous free tier, SMTP-compatible).
Verify the sending domain in the provider dashboard (DNS SPF/DKIM/DMARC). `SMTP_FROM`
must use an address on a verified domain. Local dev: leave `SMTP_HOST` empty → the
email service falls back to Mailpit (`localhost:1025`); inspect captured emails at
`http://localhost:8025`.

---

## 4. AI (Gemini)

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `GEMINI_API_KEY` | Secret | `https://aistudio.google.com/app/apikey` |
| `GOOGLE_API_KEY` | Secret | Alternative (Genkit accepts either) |

Required for the chatbot, resume parsing, + tech-news. Without it the chatbot
returns an honest fallback + resume parse is skipped.

---

## 5. Security

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `JWT_SECRET` | Secret | `openssl rand -hex 32` (≥32 chars) |
| `OTP_SECRET` | Secret | `openssl rand -hex 32` (≥32 chars) |
| `SUPERADMIN_BOOTSTRAP_EMAIL` | Non-secret | `contact@prabhat.online` |

`JWT_SECRET` signs session tokens during the cutover. `OTP_SECRET` signs OTP
request IDs + one-click unsubscribe tokens. Both ≥32 chars. After the Supabase
Auth cutover, `JWT_SECRET` may be retired (Supabase manages sessions) — keep it
until then.

---

## 6. CAPTCHA (Cloudflare Turnstile)

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | `https://dash.cloudflare.com` → Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret | same |

Required in production (dev uses test mode automatically).

---

## 7. Firebase — RETAINED during cutover (remove after route migration)

These keep the 50 active Firebase routes running. In local dev, set
`FIRESTORE_EMULATOR_HOST` (the supervisor does this automatically) instead of the
service-account vars. Once the routes are cut over to Supabase + the founder
confirms, delete this entire section.

`NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_ADMIN_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`FIRESTORE_EMULATOR_HOST`, `STORAGE_EMULATOR_HOST`.

---

## 8. External setup (cannot be done with env vars alone)

### 8.1 Supabase project (production)
1. Create a project at `https://supabase.com`.
2. Apply the schema: `supabase db push` (after `supabase link`) OR paste
   `supabase/migrations/0001..0005` into the SQL editor in order.
3. Copy the Project URL + anon key + service-role key into the env vars.
4. Verify RLS is enabled on all tables (the migration does this; check in the
   dashboard → Authentication → Policies).
5. Storage: the `candidate-resumes` bucket is created by migration 0003. Verify
   it is private in the dashboard → Storage.

### 8.2 Data migration (Firebase → Supabase)
1. With the Firestore emulator running + seeded, run:
   `FIRESTORE_EMULATOR_HOST=localhost:8080 npx tsx scripts/migrate-firebase-to-supabase.ts`
2. Review the per-collection counts + reconciliation.
3. For production Firebase data: the script reads production Firebase if
   `FIRESTORE_EMULATOR_HOST` is unset + service-account creds are present. Output
   SQL with `--sql` + apply to Supabase via the SQL editor. **BLOCKED until the
   founder provides production Firebase service-account creds.**

### 8.3 Email provider
Pick ONE, verify the sending domain, create API key/SMTP creds, set `SMTP_FROM`
on the verified domain, set `COMPANY_INBOX`.

### 8.4 Cloudflare Turnstile, Google AI, Vercel
As in the Firebase-era doc: Turnstile widget keys, Gemini API key, import the
GitHub repo into Vercel + set all Secret + Public vars (do NOT set the §7 dev-only
vars). The startup env-validation summary appears in Vercel function logs.

---

## 9. Local development quickstart (Mac)

```bash
# 1. Install deps
npm install

# 2. Copy the template + fill required local values
cp .env.template .env.local
# Edit .env.local: JWT_SECRET/OTP_SECRET (openssl rand -hex 32),
#   NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY (or leave for after cutover),
#   GEMINI_API_KEY (optional), FIRESTORE_EMULATOR_HOST=localhost:8080 (emulator).

# 3. Start the supervised dev server (Firestore emulator + Next.js + health check)
bash scripts/dev-supervisor.sh
# → http://localhost:3000  (app)
# → http://localhost:8080  (Firestore emulator)
# → http://localhost:8025  (Mailpit — install separately if you want email capture)

# 4. (Supabase local validation — no project needed)
node scripts/validate-schema.js          # applies schema + RLS to PGlite
npx vitest run src/lib/supabase          # 23 RLS policy tests
npx vitest run src/lib/migration         # 26 mapper + migrate tests

# 5. (Optional) test the Firebase→Supabase migration locally:
FIRESTORE_EMULATOR_HOST=localhost:8080 npx tsx scripts/migrate-firebase-to-supabase.ts
```

---

## 10. Verifying your configuration

```bash
npm run typecheck && npm run build   # must pass (ignoreBuildErrors:false)
npm run test                         # 271 Firebase-era + 49 Supabase tests
bash scripts/dev-supervisor.sh       # check the [env-validation] line at boot
curl http://localhost:3000/api/health  # → 200
```

For production: after deploying to Vercel, check the function logs for the
`[env-validation]` line. `problems=0` (ignoring the RETAINED Firebase vars during
cutover) means the Supabase configuration is complete.

---

## 11. Security rules (do not weaken)

- Every Supabase table has RLS enabled. Candidates read/write ONLY their own
  rows (enforced by `auth.uid()` policies + the `owns_candidate_row` helper).
- Anonymous can subscribe to the newsletter + submit enquiries + read published
  content — nothing else.
- Admin actions require the `is_admin()` / `is_super_admin()` helper (SECURITY
  DEFINER, fixed search_path).
- The service-role key bypasses RLS — use it ONLY in server code for trusted
  operations. Never expose it to the browser.
- Resumes are stored in a private Storage bucket; access is via short-lived
  signed URLs issued server-side, never public URLs.

Do not loosen RLS policies to make something work. If a feature cannot work
under the current policies, the fix is a server route with proper authorization.
