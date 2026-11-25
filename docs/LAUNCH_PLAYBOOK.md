# Paragonel + AcquisitionOS — Production Launch Playbook (Batch 6)

This is the founder's executable launch guide. It consolidates the external
configuration + verification steps (domains, providers, deploy, post-deploy
checks) into a single ordered sequence. **Every step below is a founder
action** — the agent has no Vercel, DNS, or credential access, and did not
execute any of this. The code-side is ready (Batch 5); this walks the launch.

For depth on any single area, the detailed docs are referenced inline — this
playbook does not duplicate them.

## Pre-launch code-side status (already complete — Batch 5)

| Check | Result |
|---|---|
| Typecheck | PASS |
| Production build | PASS (116/116 pages; middleware 38.8 kB) |
| Test suite | 520 / 523 (3 pre-existing emulator-gated failures) |
| Schema validation | PASS (25 tables, 74 RLS policies, 0001–0007 applied to PGlite) |
| Lint | 96 problems (down from 109; high-risk security subset fixed) |
| Secret scan (tracked files) | CLEAN |

Full status: `docs/RELEASE_HANDOVER.md`, `docs/RELEASE_READINESS.md`.

---

## Phase 0 — Two Vercel projects (confirm BEFORE configuring DNS)

**Do not assume both domains belong to the same Vercel project.** They do not.

| Deployment | Canonical domain | Repo | Vercel project |
|---|---|---|---|
| Paragonel company site | `paragonel.com` | `Hugs-4-Bugs/Paragonel-Technologies` (this repo) | the Paragonel project |
| AcquisitionOS product app | `acquisitionos.net` | separate (NOT this repo) | the AcquisitionOS project |

Before touching DNS, confirm in the Vercel dashboard which project each custom
domain will be added to. `acquisitionos.net` must point at the AcquisitionOS
product project, NOT the Paragonel company-site project — if it lands on the
Paragonel deployment, the CTA target will show the wrong site (a DNS
misconfiguration, not a code defect; the Paragonel app does not redirect
`acquisitionos.net` anywhere).

---

## Phase 1 — Configure production domains (Task 2)

### 1a. Paragonel company site — `paragonel.com` + `www.paragonel.com`

1. **Vercel → Paragonel project → Settings → Domains.** Add `paragonel.com`
   (apex) and `www.paragonel.com`.
2. **DNS provider** (wherever `paragonel.com` is registered):
   - **A record** (or Vercel-managed ALIAS/ANAME) for `paragonel.com` → the
     Vercel anycast IP shown on the Vercel domain-settings page.
   - **CNAME** for `www.paragonel.com` → `cname.vercel-dns.com`.
3. **Vercel:** set `paragonel.com` as the **primary domain**; enable the Vercel
   native `www` → apex redirect. (The app's `src/middleware.ts` also enforces
   `www.paragonel.com` → `paragonel.com` as a 308 backstop — tested in
   `src/lib/__tests__/canonical-host.test.ts`.)
4. **HTTPS:** Vercel auto-provisions Let's Encrypt certificates once DNS
   resolves — no manual cert step.
5. **Canonical metadata:** set `NEXT_PUBLIC_SITE_URL=https://paragonel.com` and
   `APP_BASE_URL=https://paragonel.com` in the Vercel Production environment
   (Phase 2). The code-side fallback is already the apex (`src/app/layout.tsx`
   `metadataBase`, `sitemap.ts`, `robots.ts`) — setting the vars makes the
   sitemap/robots URLs canonical from the first deploy.
6. **Verify (post-DNS):**
   - `curl -I https://paragonel.com` → `200`.
   - `curl -I https://www.paragonel.com` → `308` → `https://paragonel.com`.
   - View page source → `<link rel="canonical" href="https://paragonel.com/…">`
     and `og:url` point at the apex.

### 1b. AcquisitionOS product — `acquisitionos.net` (SEPARATE Vercel project)

1. **Vercel → AcquisitionOS product project (NOT the Paragonel project) →
   Settings → Domains.** Add `acquisitionos.net` (apex) and
   `www.acquisitionos.net`.
2. **DNS provider** for `acquisitionos.net`:
   - **A record** (or ALIAS/ANAME) for `acquisitionos.net` → the Vercel anycast
     IP shown on that project's domain-settings page.
   - **CNAME** for `www.acquisitionos.net` → `cname.vercel-dns.com`.
3. **Vercel:** set `acquisitionos.net` as primary; redirect
   `www.acquisitionos.net` → `acquisitionos.net`.
4. The existing `acquisitionosbeta.vercel.app` host remains directly accessible
   (it is the underlying deployment the custom domain points at).
5. **Verify (post-DNS):** `https://acquisitionos.net` resolves to the
   AcquisitionOS product (the 12-stage AI platform), NOT the Paragonel company
   site. If it shows the Paragonel site, the DNS A record points at the wrong
   Vercel project — fix the DNS target, not the code.

**No DNS record is changed by this playbook without explicit founder
authorization.** The above are the records to create; the founder performs them
in their DNS provider dashboard.

### 1c. Redirects + canonical behavior (code-side, already verified)

- `www.paragonel.com` → `paragonel.com` (308, path + query preserved) —
  `src/middleware.ts` via `src/lib/canonical-host.ts`.
- `acquisitionos.net`, `www.acquisitionos.net`, `acquisitionosbeta.vercel.app`,
  `*.vercel.app` previews, `localhost` → NOT redirected by this app (fall
  through). No cross-domain redirect loop (regression-tested).

Full domain decisions + the historical Phase-0 audit context: `docs/DOMAINS.md`.

---

## Phase 2 — Configure external providers (Task 3)

For every provider: (1) where the credential is obtained, (2) which environment
variable receives it, (3) Production / Preview / Development, (4) how to verify
without exposing the value, (5) the application's fail-safe if it is missing.

**Never paste a secret into chat.** Set every secret directly in the Vercel
dashboard (Settings → Environment Variables) or via `vercel env add` from a
local terminal — never in a PR, a commit, or this conversation.

### 2a. SMTP (transactional email)

1. **Obtained from:** your transactional email provider — Resend, SendGrid,
   Postmark, Amazon SES, or any standards-based SMTP relay.
2. **Env vars (server-only):**
   - `SMTP_HOST` — the relay hostname.
   - `SMTP_PORT` — `587` (STARTTLS) or `465` (implicit TLS).
   - `SMTP_SECURE` — set to the string `true` ONLY for port 465; leave unset or
     empty for 587 (parsed as `=== 'true'`).
   - `SMTP_USER`, `SMTP_PASS` — the relay credentials.
   - `SMTP_FROM` — a verified sender address, e.g.
     `"Paragonel <noreply@paragonel.com>"`.
   - `COMPANY_INBOX` — the inbox that receives enquiry notifications
     (`/api/contact`, `/api/lead`).
   - `APP_BASE_URL` — `https://paragonel.com` (used in email body links).
3. **Environment:** Production + Preview. (Development falls back to Mailpit via
   `MAILPIT_HOST` / `MAILPIT_SMTP_PORT` when `SMTP_HOST` is unset.)
4. **Verify without exposing:** run `node scripts/check-integrations.mjs` with
   the env set → `SMTP PASS` (nodemailer `verify()` connects + authenticates,
   sends nothing). Or trigger a real OTP to a test address and confirm delivery.
5. **Fail-safe:** `SMTP_HOST`/`USER`/`PASS` unset → `getSmtpConfig()` returns
   null → `sendOtpEmail` returns `{sent:false, reason:'smtp_not_configured'}`.
   Registration/login still function (the OTP is returned directly in dev), but
   no email is delivered. No false success response.

### 2b. Gemini (chatbot + resume analysis)

1. **Obtained from:** Google AI Studio (`aistudio.google.com`) → API keys.
2. **Env vars (server-only):**
   - `GEMINI_API_KEY` (primary) OR `GOOGLE_API_KEY` (documented fallback —
     Genkit accepts either).
   - `GEMINI_MODEL` (optional; default `gemini-flash-latest`; pin to
     `gemini-2.0-flash` if your key lacks the latest alias).
   - `GEMINI_REQUEST_TIMEOUT_MS` (optional; default 25000).
3. **Environment:** Production + Preview (server-only; never `NEXT_PUBLIC_`).
4. **Verify without exposing:** `node scripts/check-integrations.mjs` →
   `Gemini PASS` (lists models via the REST API). Or `POST /api/chat` with a
   test message → a real completion (not the classified 503 fallback).
5. **Fail-safe:** no key → `hasGeminiKey()` returns false (`src/ai/models.ts`)
   → chat returns an honest classified 503; the resume parser throws
   `ResumeAnalysisError('missing_key')` (the resume is stored, parse skipped).
   No fabricated answer, no silent fallback. Tested in
   `src/ai/__tests__/models.test.ts`.

### 2c. Cloudflare Turnstile (bot protection on auth)

1. **Obtained from:** Cloudflare dashboard → Turnstile → create a widget
   (choose the Managed or Invisible mode).
2. **Env vars:**
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — the public site key (renders the widget).
   - `TURNSTILE_SECRET_KEY` — the server secret (server-only).
3. **Environment:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in **all** environments
   (Production + Preview + Development — the widget must render everywhere the
   form is tested). `TURNSTILE_SECRET_KEY` in Production + Preview.
4. **Verify without exposing:** `node scripts/check-integrations.mjs` →
   `Turnstile PASS` (siteverify endpoint reachable + the secret accepted — a
   dummy token yields the known `invalid-input-response`, confirming
   connectivity without revealing the secret). Or complete a real registration →
   the widget renders + the form submits (no `misconfigured` error).
5. **Fail-safe:** `TURNSTILE_SECRET_KEY` unset → `getCaptchaConfig()` returns
   `mode:'misconfigured'` → `verifyCaptcha` returns `{ok:false,
   reason:'misconfigured'}` → registration + login **fail closed** in
   production. A direct API call cannot bypass it (`consentAcknowledged` is
   server-enforced). Tested in `src/lib/auth/__tests__/captcha.test.ts`.

### 2d. Firebase Admin (server-side Firestore + Storage)

1. **Obtained from:** Firebase console → Project Settings → Service Accounts →
   "Generate new private key" (downloads a JSON file).
2. **Env vars (server-only):**
   - `FIREBASE_ADMIN_PROJECT_ID` — the `project_id` from the JSON.
   - `FIREBASE_ADMIN_CLIENT_EMAIL` — the `client_email` from the JSON.
   - `FIREBASE_ADMIN_PRIVATE_KEY` — the `private_key` from the JSON, pasted with
     the `\n` escapes preserved (the value is a single string with escaped
     newlines; the code un-escapes them).
3. **Environment:** Production + Preview (server-only). (Development uses
   `FIRESTORE_EMULATOR_HOST=localhost:8080` to run against the local emulator
   without a service account.)
4. **Verify without exposing:** `node scripts/check-integrations.mjs` →
   `Firebase Admin PASS` (initializes the Admin SDK, lists Firestore
   collections, + checks the Storage bucket exists). Or `GET /api/admin/jobs`
   with a valid admin session → a real response (not 503).
5. **Fail-safe:** the trio unset or malformed → `initAdmin()` returns null →
   `getAdminDb()` / `getAdminBucket()` return null → every admin/candidate data
   route + Firestore/Storage access returns **503**. Never throws, never uses a
   fallback credential.

**Also set the Firebase CLIENT env vars** (public, all environments — the client
SDK must initialize in the browser):
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
(`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` optional).

### 2e. Supabase (migration-readiness — NOT the live data source)

1. **Obtained from:** Supabase dashboard → Project Settings → API.
2. **Env vars:**
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL (public).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon/publishable key (public, RLS-enforced).
   - `SUPABASE_SERVICE_ROLE_KEY` — the service-role key (server-only, bypasses
     RLS — NEVER in a `NEXT_PUBLIC_` var).
3. **Environment:** the two `NEXT_PUBLIC_` in all environments; the service-role
   key in Production + Preview only.
4. **Verify without exposing:** `node scripts/check-integrations.mjs` →
   `Supabase PASS` (runs a trivial `select` on `app_settings`).
5. **Fail-safe:** unset → the Supabase client creation fails → routes that read
   Supabase return honest errors.
   **Important scope:** Supabase is currently the **migration target**, NOT the
   live data source — Firestore is live. Setting these keys now is **readiness**,
   not a cutover. Do NOT switch the live application data source to Supabase
   without the explicit migration cutover (`docs/MIGRATION_READINESS.md`). Do
   **NOT** apply the migrations to the production Supabase project without
   explicit authorization — the migrations are PGlite-validated locally, not
   applied to a live database.

### 2f. Vercel Cron / `CRON_SECRET`

1. **Obtained from:** Vercel **auto-provisions** `CRON_SECRET` when the
   `vercel.json` `crons` entry is deployed. No manual key generation.
2. **Env var:** `CRON_SECRET` (server-only, Production — auto-provisioned).
3. **The cron:** `GET /api/cron/process-match-events` every 10 minutes
   (`vercel.json` `crons: [{"path": "/api/cron/process-match-events",
   "schedule": "*/10 * * * *"}]`).
4. **Verify without exposing:** after deploy, confirm `CRON_SECRET` appears in
   the Vercel project's Production environment variables (Vercel injects it
   automatically). In Vercel → Functions → Cron, confirm the route shows
   scheduled invocations with `200` responses (not `503`). Or manually:
   `curl -H "authorization: Bearer $CRON_SECRET" \
   https://paragonel.com/api/cron/process-match-events` → `200` + a JSON
   summary (`drained N events` or `no pending events`).
5. **Fail-safe:** `CRON_SECRET` unset → `verifyCronSecret()` returns
   `{ok:false, status:503}` (`src/lib/cron-auth.ts`); a wrong header → `401`.
   The drain is **idempotent** (atomic `claimEvent` transaction +
   per-candidate `claimSendSlot` on `jobAlertsSent` + stuck-event recovery) — no
   duplicate notifications on retry overlap, no data loss. Without the cron,
   job-match alerts send only when an admin manually drains via `/admin/alerts`.
   Tested in `src/lib/__tests__/cron-auth.test.ts` +
   `src/lib/job-alerts/__tests__/process.test.ts`.

---

## Phase 3 — Deploy (Task 4)

### 3a. Confirm the production branch (critical decision)

The repository's default branch is `master`, but all release work is on
`develop`. **Vercel deploys the configured "Production Branch" to production.**
Confirm which branch Vercel treats as Production:

- **Vercel → Paragonel project → Settings → Git → Production Branch.**
- If it is `master` (the Vercel default for many projects): the founder must
  either (a) change the Production Branch to `develop`, OR (b) merge
  `develop` → `master`. **The batch rules forbid modifying `master`** from the
  agent side, so the recommended path is (a): set the Vercel Production Branch
  to `develop`. This is a one-time Vercel dashboard setting; it does not touch
  the git history.

Do NOT proceed to a production deploy until the Production Branch is confirmed
to be `develop` (or `develop` is merged to `master` by the founder).

### 3b. Trigger the production deploy

After the env vars (Phase 2) + domains (Phase 1) are configured:

- Push to `develop` (or click "Redeploy" in Vercel → Deployments → the latest
  `develop` deployment → Promote to Production).

### 3c. Verify the deployed commit + build logs

1. **Deployed commit SHA:** Vercel → Deployments → the Production deployment →
   confirm the commit SHA equals the `develop` HEAD. (Batch 6 final HEAD will be
   the SHA after Task 5 — confirm against `git rev-parse origin/develop`.)
2. **Build logs:** Vercel → the Production deployment → Build Logs → confirm:
   - `✓ Compiled successfully`
   - `✓ Generating static pages (116/116)`
   - `ƒ Middleware … 38.8 kB`
   - No `Error:` or `Failed to compile` lines.
3. **Deployment URL:** the Vercel production URL (or `paragonel.com` once DNS
   resolves) loads the site.

---

## Phase 4 — Post-deploy verification (Task 4)

Run these against the **live production URL** after deploy. Record actual
outcomes + evidence (HTTP status, screenshots, log excerpts) — not assumptions.

1. **Integration diagnostic:** run
   `node scripts/check-integrations.mjs` against the production env (e.g. from a
   Vercel terminal, or a local clone with the production env exported via
   `vercel env pull`). **Every service you intend to use must report `PASS`.**
   Resolve any `FAIL`; `SKIP` is acceptable only for a service deliberately
   omitted.
2. **Both domains:**
   - `https://paragonel.com` → the Paragonel company site.
   - `https://acquisitionos.net` → the AcquisitionOS product (separate
     deployment; verified in its own Vercel project).
3. **www → apex redirect:** `curl -I https://www.paragonel.com` → `308` →
   `https://paragonel.com`.
4. **Canonical / OG URLs:** view the page source of the homepage →
   `<link rel="canonical" href="https://paragonel.com">` + `og:url` point at the
   apex.
5. **robots.txt + sitemap.xml:** `https://paragonel.com/robots.txt` +
   `/sitemap.xml` → list the apex URLs (not `paragonel.vercel.app`).
6. **Cron authorization + execution:** Vercel → Functions → Cron → the route
   shows scheduled invocations with `200` responses. Or the manual `curl` from
   Phase 2f.
7. **Critical user journeys:** walk the 15 journeys in
   `docs/JOURNEY_VERIFICATION.md` against the live URL using **authorized test
   accounts only** (do not insert fake production data). Record the actual
   outcome + evidence for each. The local suite proves the code paths; the live
   walk proves the deployed integrations behave.
8. **Bootstrap the first super_admin:** visit `/admin/bootstrap`, authenticate
   with `SUPERADMIN_BOOTSTRAP_EMAIL` → creates the first `super_admin` role.
   Then sign in via `/admin/login` (2-step: password + OTP).

---

## Phase 5 — Security spot-checks (post-launch)

- **No secrets in the client bundle:** browser DevTools → Sources → search for
  `sk-`, `AIza`, `private_key`, `BEGIN PRIVATE KEY` → none present.
- **Security headers:** `curl -I https://paragonel.com` → `Strict-Transport-
  Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Content-Security-Policy`, `X-Frame-Options: DENY`.
- **Admin/auth pages noindex:** `curl -I https://paragonel.com/admin/login` →
  `X-Robots-Tag: noindex, nofollow`. Same for `/auth/*`, `/candidate/*`,
  `/profile`.
- **Candidate gating:** `curl -I https://paragonel.com/candidate/profile` (no
  cookie) → `307` → `/auth/login?redirect=/candidate/profile` (the Batch-5
  middleware user-tier gate).

---

## Honest scope — what the agent did NOT do

- No Vercel account, DNS provider, or external-service credential access.
- No production or preview deployment performed or claimed.
- No real external-service connectivity verified (every service reports `SKIP`
  in the cleanroom; the founder must run the diagnostic with real credentials).
- No live user-journey verification (the 15 journeys are verified LOCALLY; the
  live walk is a founder action post-deploy).
- No production database modified; no migrations applied to a live Supabase
  project; no destructive operations.
- No `master` modification.

## Reference documents

| Doc | Purpose |
|---|---|
| `docs/RELEASE_HANDOVER.md` | Blocker list (B1–B9) + manual steps + verification summary |
| `docs/INTEGRATION_VERIFICATION.md` | The diagnostic + the fail-closed table per service |
| `docs/JOURNEY_VERIFICATION.md` | The 15 critical journeys + LOCAL test mapping |
| `docs/DOMAINS.md` | Canonical-domain decisions + the two-deployment split + DNS records |
| `docs/RELEASE_READINESS.md` | Verification status + known follow-ups (not release blockers) |
| `docs/EXTERNAL_SERVICES_SETUP.md` | Per-provider configuration walkthrough (depth) |
| `docs/MIGRATION_READINESS.md` | The Firestore → Supabase migration cutover (NOT for this launch) |
| `scripts/check-integrations.mjs` | The runnable connectivity diagnostic (PASS/FAIL/SKIP per service) |
| `.env.example` | The full env-var template with section purpose + guidance |
