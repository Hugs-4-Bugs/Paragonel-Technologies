# External service integration verification (Batch 5 Task 2)

This document records the **current** external-service connectivity status +
the exact steps the founder must run to verify production connectivity.

## Honest status (this environment)

**No external service is live-verified in the development/CI environment.**
The cleanroom has no real credentials (SMTP, Gemini, Turnstile, Firebase Admin
service-account, Supabase service-role key). Per the batch rules, no passing
result is fabricated for a service that is not actually connected.

The runnable diagnostic (`scripts/check-integrations.mjs`) reports **SKIP** for
every service in this environment — meaning a required credential is missing.
SKIP is not a failure: the application is engineered to **fail closed**
per-route when a service is unset (honest 503 / `misconfigured` /
`smtp_not_configured` / `missing_key`), so an unset service does not produce
false success responses or partial data. The code-side fail-closed behavior IS
unit-tested (see `src/ai/__tests__/models.test.ts`, `src/lib/__tests__/cron-auth.test.ts`,
`src/lib/auth/__tests__/*`, `src/lib/job-alerts/__tests__/*`).

| Service | Status (this env) | Missing credential | Fail-closed behavior (code-side verified) |
|---|---|---|---|
| SMTP | SKIP | `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` | `getSmtpConfig()` → null → `sendOtpEmail` returns `{sent:false, reason:'smtp_not_configured'}` |
| Gemini | SKIP | `GEMINI_API_KEY` | `hasGeminiKey()` → false → chat returns classified 503; resume parser throws `ResumeAnalysisError('missing_key')` (resume stored, parse skipped) |
| Cloudflare Turnstile | SKIP | `TURNSTILE_SECRET_KEY`/`NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `getCaptchaConfig()` → `mode:'misconfigured'` → `verifyCaptcha` returns `{ok:false, reason:'misconfigured'}` |
| Firebase Admin | SKIP | `FIREBASE_ADMIN_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY` | `initAdmin()` → null → `getAdminDb()` → null → routes 503 |
| Supabase | SKIP | `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` | Cutover target — not yet the live data source; routes that read Supabase return honest errors |
| Vercel Cron | SKIP | `CRON_SECRET` | `verifyCronSecret()` → `{ok:false, status:503}`; Vercel auto-provisions `CRON_SECRET` for projects with a `vercel.json` crons entry |

## How to verify production connectivity (founder action)

After the production environment is configured in Vercel (or locally with a
populated `.env.local`), run:

```bash
node scripts/check-integrations.mjs
# or with an env file:
node --env-file=.env.local scripts/check-integrations.mjs
```

The script reports one of **PASS** / **FAIL** / **SKIP** per service:

- **PASS** — credentials present AND a minimal read-only probe succeeded
  (service reachable + authenticated).
- **FAIL** — credentials present BUT the probe errored (misconfigured or
  unreachable — see the sanitized detail; the script never prints credential
  values).
- **SKIP** — a required credential is still missing.

All probes are read-only (SMTP `verify()` connects + authenticates but sends
no email; Gemini lists models via REST; Turnstile siteverifies a dummy token
that Cloudflare rejects with a known error code — confirms reachability +
secret acceptance; Firebase Admin lists collections; Supabase runs a trivial
`select` on `app_settings`). Exit code: `0` if every service is PASS or SKIP,
`1` if any configured service FAILs.

### What "PASS" means + what it does NOT mean

A PASS proves the credential is valid + the service is reachable from the
runtime. It does **not** prove every email-delivery, chat-completion, or
resume-parse journey is correct end-to-end — those require the Task 3 journey
verification against a deployed environment. PASS is the connectivity
prerequisite; the journey tests are the behavior verification.

## Founder verification checklist (required before production launch)

1. Populate every required env var in Vercel (Production environment):
   `JWT_SECRET`, `OTP_SECRET`, `SUPERADMIN_BOOTSTRAP_EMAIL`, the Firebase Admin
   trio, the Turnstile pair, `NEXT_PUBLIC_SITE_URL=https://paragonel.com`,
   `APP_BASE_URL=https://paragonel.com`, `NEXT_PUBLIC_FIREBASE_*` (client).
2. Populate the optional providers you intend to use: SMTP (`SMTP_HOST`/`PORT`/
   `USER`/`PASS`/`FROM`/`SMTP_SECURE`), `GEMINI_API_KEY`, `COMPANY_INBOX`.
3. Confirm Vercel has provisioned `CRON_SECRET` (visible in the project's
   environment variables after the `vercel.json` crons entry is deployed).
4. Run `node scripts/check-integrations.mjs` against the production env.
   Every service you intend to use must report **PASS**. SKIP is acceptable only
   for a service you have deliberately chosen not to use (e.g. GA4).
5. For any **FAIL**, fix the configuration + re-run until PASS.

## Vercel Cron authorization + idempotency

- `vercel.json` schedules `GET /api/cron/process-match-events` every 10 minutes.
- Vercel sends `authorization: Bearer <CRON_SECRET>`; the route verifies it with
  a constant-time compare (`src/lib/cron-auth.ts`). A missing/empty
  `CRON_SECRET` yields an honest 503 (no silent bypass); a wrong header yields
  401. Tested in `src/lib/__tests__/cron-auth.test.ts`.
- The drain reuses the idempotent `drainPendingJobMatchEvents()`: an atomic
  Firestore `claimEvent` transaction (`status:'processing'` + `claimedAt`)
  prevents two concurrent cron invocations from double-processing the same
  event, and a per-candidate `claimSendSlot` on `jobAlertsSent` (keyed by
  `dedupKey(email, job, version)`) prevents any duplicate successful delivery.
  Stuck events (`claimedAt` older than the 5-minute timeout) are recovered by
  `recoverStuckEvents()` on the next drain. No duplicate notifications, no data
  loss on retry.
