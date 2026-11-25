# Production release handover (Batch 5 Task 5)

**Date:** 2026-11-23
**Branch:** `develop` (HEAD `efa509e`)
**Master:** `89e8e57` — NOT modified

## Release-readiness verdict

**The application is code-side release-ready. The production launch is BLOCKED
on external configuration actions that require the founder's Vercel + DNS +
credential access — none of which can be performed from this cleanroom.**

A green `next build` is NOT the release signal. The release signal is: every
external service reports PASS in `scripts/check-integrations.mjs` against the
production env, AND the 15 critical journeys pass against the live URL, AND the
domains resolve. Until then, the product is staged but not launched.

## Verification summary (this batch, local)

| Check | Result |
|---|---|
| Typecheck (`tsc --noEmit`) | **PASS** (exit 0) |
| Production build (`next build`) | **PASS** (116/116 pages; middleware 38.8 kB) |
| Test suite (`vitest run`) | **520 / 523** — 3 failures are the pre-existing emulator-gated `registration-acceptance` tests (require `FIRESTORE_EMULATOR_HOST`; unchanged across all 5 batches, not code regressions) |
| Schema validation (`validate-schema.js`) | **PASS** — 25 tables, 74 RLS policies, all indexes + the migration_audit table (0006) applied cleanly to real PGlite Postgres |
| Lint (`npm run lint`) | 96 problems (53 errors, 43 warnings) — **down from 109** (60 err + 49 warn) at batch start. The high-risk security/type-safety subset is fixed (see Task 4 commit). The remainder are `no-explicit-any` in non-security data-fetcher/UI files + unused-icon-import warnings — documented follow-up, NOT release blockers. Build is not lint-gated (`eslint.ignoreDuringBuilds: true`). |
| Secret scan (tracked files) | **CLEAN** — no real credentials in source. The 2 matches are documented placeholders (`EXTERNAL_SERVICES_SETUP.md` private-key template; `gen-env-local.js` `AIzaSyDevPlaceholderKeyForEmulatorOnly`). `.env.local`, `service-account.json`, `.env.production` are gitignored. `firebase.json` is the Firebase CLI config (rules + emulators), not credentials. |
| Final tree | **CLEAN**, HEAD == freshly fetched `origin/develop` == `efa509e`, master untouched. |

## Precise blocker list (external — requires founder action)

Each blocker has the exact required action + the responsible account/service.
**None can be resolved from the cleanroom.**

| # | Blocker | Required action | Responsible |
|---|---|---|---|
| B1 | **SMTP credentials** | Set `SMTP_HOST`/`PORT`/`USER`/`PASS`/`FROM`/`SMTP_SECURE` in the Vercel Production env. Without these, OTP/password-reset/application-confirmation/newsletter/job-alert emails are NOT delivered (the routes return honest `smtp_not_configured`; no false success). | Founder (SMTP provider account) |
| B2 | **Gemini API key** | Set `GEMINI_API_KEY`. Without it, the chatbot returns an honest classified 503 + resume parsing is skipped (resume stored, not parsed). | Founder (Google AI Studio) |
| B3 | **Cloudflare Turnstile keys** | Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`. Without them, candidate registration + login FAIL CLOSED (`misconfigured`) in production. | Founder (Cloudflare dashboard) |
| B4 | **Firebase Admin service account** | Set `FIREBASE_ADMIN_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY`. Without it, `getAdminDb()` returns null → every admin/candidate data route + Firestore/Storage access returns 503. | Founder (Firebase console) |
| B5 | **Supabase project keys** | Set `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`. Required for the data-access cutover (Supabase is currently the migration target, not the live data source — Firestore is live). | Founder (Supabase dashboard) |
| B6 | **`CRON_SECRET`** | Confirm Vercel auto-provisioned `CRON_SECRET` after the `vercel.json` crons entry deployed. Without it, the job-match alert drain cron returns honest 503 (alerts only send on manual admin drain). | Vercel (auto-provisioned on deploy) |
| B7 | **`paragonel.com` DNS → Vercel** | Add the apex A record (or Vercel ALIAS) + `www` CNAME → `cname.vercel-dns.com`; set `paragonel.com` as the primary domain in Vercel; set `NEXT_PUBLIC_SITE_URL=https://paragonel.com` + `APP_BASE_URL=https://paragonel.com` in Production env. | Founder (DNS provider + Vercel) |
| B8 | **`acquisitionos.net` DNS → AcquisitionOS product deployment** | Point `acquisitionos.net` at the AcquisitionOS product Vercel deployment (currently `acquisitionosbeta.vercel.app`, which remains directly accessible). Until configured, the CTA target `acquisitionos.net` will not resolve. | Founder (DNS provider + AcquisitionOS Vercel project) |
| B9 | **Production deploy** | Deploy `develop` to Vercel production (after B1–B8). Then run the journey walk + the integration diagnostic against the live URL. | Founder (explicit authorization required — no deploy performed from this cleanroom) |

## Exact manual steps (founder, in order)

1. **In the Vercel project (Settings → Environment Variables, Production):**
   set `JWT_SECRET` (≥32 chars), `OTP_SECRET` (≥32 chars),
   `SUPERADMIN_BOOTSTRAP_EMAIL`, the Firebase client trio
   (`NEXT_PUBLIC_FIREBASE_API_KEY`/`AUTH_DOMAIN`/`PROJECT_ID`/`STORAGE_BUCKET`/
   `MESSAGING_SENDER_ID`/`APP_ID`), `NEXT_PUBLIC_SITE_URL=https://paragonel.com`,
   `APP_BASE_URL=https://paragonel.com`, `COMPANY_INBOX`.
2. **Set the optional providers you intend to use:** SMTP block (B1),
   `GEMINI_API_KEY` (B2), the Turnstile pair (B3), the Firebase Admin trio (B4),
   the Supabase trio (B5).
3. **Configure the domains** (B7, B8) — see `docs/DOMAINS.md` for the exact DNS
   records + Vercel domain-settings steps for both `paragonel.com` +
   `acquisitionos.net`.
4. **Deploy `develop` to production** (B9). Vercel auto-provisions `CRON_SECRET`
   on the first deploy with the `vercel.json` crons entry (B6).
5. **Run `node scripts/check-integrations.mjs`** against the production env
   (e.g. from a Vercel terminal or a local clone with the production env
   exported). Every service you intend to use must report **PASS**. Resolve any
   **FAIL**; **SKIP** is acceptable only for a service you deliberately omit.
6. **Walk the 15 critical journeys** (`docs/JOURNEY_VERIFICATION.md`) against the
   live URL. Record the actual outcome + evidence (screenshots/logs) for each.
   The local suite proves the code paths; the live walk proves the deployed
   integrations behave.
7. **Bootstrap the first super_admin** via `/admin/bootstrap` using
   `SUPERADMIN_BOOTSTRAP_EMAIL` (the only bootstrap path; documented in
   `docs/RELEASE_READINESS.md`).

## Code-side release readiness (already complete)

- Environment configuration finalized (`.env.example`, `env-validation.ts`
  VAR_SPECS covers every used var; sitemap/robots apex fallback;
  `docs/DOMAINS.md`, `docs/INTEGRATION_VERIFICATION.md`,
  `docs/JOURNEY_VERIFICATION.md`).
- Fail-closed posture verified for every external service (SMTP, Gemini,
  Turnstile, Firebase Admin, Supabase, CRON_SECRET) — honest 503 / misconfigured
  / smtp_not_configured / missing_key; no false success responses; no silent
  bypass.
- AcquisitionOS canonical domain corrected (`acquisitionos.net` is the intended
  canonical product domain; NOT redirected to the beta URL; no redirect loops;
  beta deployment remains accessible).
- Candidate + profile page-gating added (middleware user-tier JWT check) —
  closes the page-shell flash gap.
- PII redaction extended to runtime logs (6 `console.error` sites wrapped with
  `redactReason`).
- Cron drain is idempotent + concurrency-safe (atomic `claimEvent` +
  per-candidate `claimSendSlot` dedup + stuck recovery).
- Admin RBAC coverage complete; every admin mutation writes an audit event.
- Schema validation covers all 7 migrations (0006 now included).

## No existing functionality removed

Every change in this batch EXTENDS or hardens existing functionality. No
feature, page, route, API, component, database capability, integration,
animation, or workflow was removed or downgraded. The unused-security-import
removals were dead code (the behavior was intact via other functions — verified
per file). The AcquisitionOS beta deployment remains directly accessible.

## Honest scope (what was NOT done)

- **No production or preview deployment was performed** — no Vercel access from
  the cleanroom. The build succeeds locally; that is not live verification.
- **No real external-service connectivity was verified** — no credentials
  available. `scripts/check-integrations.mjs` reports SKIP for every service
  here; the founder must run it with real credentials.
- **No live user-journey verification** — the 15 journeys are verified LOCALLY
  (vitest). The live walk is a founder action post-deploy.
- **No production data touched; no migrations applied to a live database; no
  destructive operations.**

## Commit history (this batch, on top of `ff69f74`)

| SHA | Subject |
|---|---|
| `8938b11` | `chore(release): finalize production environment configuration` |
| `0ecf7d7` | `test(integrations): verify production external service connectivity` |
| `f76a364` | `test(release): verify critical application user journeys` |
| `efa509e` | `fix(security): close verified production release blockers` |
| *(this commit)* | `chore(release): finalize production release handover` |

All five pushed to `origin/develop` + remote-SHA-verified. `origin/master`
unchanged at `89e8e57`.
