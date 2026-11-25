# External Services Setup — SMTP, CAPTCHA, Gemini, OTP

This document walks through the external configuration the Paragonel app needs
for authentication, communication, and AI features. All values are placed in
`.env.local` (gitignored); `.env.example` / `.env.template` carry placeholders
only. **Never commit real secrets.**

## Required for the app to boot + authenticate

### `JWT_SECRET` (required, ≥ 32 chars)
Signs the httpOnly session cookies (`qf_user_token`, `qf_admin_token`) and gates
every `verifySession` call. If missing or < 32 chars, `getJwtSecret()` returns
null → middleware + auth routes **fail closed** (no session can be issued or
verified). Generate with: `openssl rand -hex 32`.

### `OTP_SECRET` (required, ≥ 32 chars)
Signs OTP challenge tokens, the HMAC newsletter unsubscribe + confirmation
tokens, and the job-alert unsubscribe tokens. If missing or < 32 chars, OTP
issue/verify + all token-based links **fail closed**. Generate with:
`openssl rand -hex 32`.

## SMTP — outbound email (OTP, newsletter, job alerts, application confirmations)

Without SMTP, every email path returns an honest `{sent:false,
reason:'smtp_not_configured'}` / `{status:'skipped'}` — no fake delivery. OTP
registration/login still works end-to-end in tests via `issueOtp`'s direct
return; for real email delivery, configure:

```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false            # true for port 465 (implicit TLS)
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Paragonel <noreply@your-domain.com>
```

`SMTP_FROM` is validated (must be a valid email or `Name <email>` form); an
invalid sender is treated as "not configured". The transport is built with
bounded connection/greeting/socket timeouts (10s/10s/20s) so a slow provider
cannot hang the request. Send failures return a sanitized `{sent:false,
reason:'smtp_error'}` — no credentials, SMTP codes, or stack traces leak.

### Local dev with Mailpit (optional)
Set `MAILPIT_HOST=localhost` + `MAILPIT_SMTP_PORT=1025` (never in production) to
route all mail to a local Mailpit mailbox for inspection. This is real delivery
to a local mailbox, never a verification bypass.

### `APP_BASE_URL` (required for email links)
The absolute origin used to build confirmation / unsubscribe / job-link URLs in
emails, e.g. `https://paragonel.com`. Defaults to `http://localhost:3000`.

## CAPTCHA — Cloudflare Turnstile (login, registration, contact, application)

Turnstile is mandatory on login + registration (fail-closed: a missing/invalid
token is rejected). Configure:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key      # browser (public)
TURNSTILE_SECRET_KEY=your-secret-key              # server-only
```

If `TURNSTILE_SECRET_KEY` is absent, `verifyCaptcha` returns `misconfigured` →
the route surfaces "CAPTCHA verification is required but unavailable" (never
silently passes).

## Gemini (Google AI) — chat, resume parsing, content flows

The model is centralized in `src/ai/models.ts` (`GEMINI_MODEL_REF`, default
`googleai/gemini-flash-latest`). Every flow imports it from there — no per-flow
hardcoding. Configure:

```
GEMINI_API_KEY=your-gemini-api-key       # primary (server-only)
# GOOGLE_API_KEY=...                      # documented fallback
GEMINI_MODEL=gemini-flash-latest         # optional override (pin to a GA model)
GEMINI_REQUEST_TIMEOUT_MS=25000          # optional bounded request timeout
```

If no key is present, `hasGeminiKey()` returns false → the chat flow returns an
honest classified 503 (never fabricates an answer) and the resume parser throws
`ResumeAnalysisError('missing_key')` (never fabricates an extraction). The key
is never exposed to the browser or logged — only its presence is checked.

## Firebase Admin (server-side Firestore + Storage)

Until the Supabase data-access cutover, the app reads/writes via the Admin SDK:

```
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

If any of the trio is missing/malformed, `getAdminDb()` / `getAdminBucket()`
return null → routes respond 503 (never throw, never use a fallback credential).
Locally, set `FIRESTORE_EMULATOR_HOST=localhost:8080` to run against the
emulator without service-account creds. (Storage emulator is not used — the
Storage Admin SDK reads `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` directly.)

## Supabase (migration-readiness; not yet the live data source)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # public (browser)
SUPABASE_SERVICE_ROLE_KEY=...            # server-only (bypasses RLS; never NEXT_PUBLIC_*)
```

See `docs/MIGRATION_READINESS.md` for the cutover prerequisites.

## Validation ladder

```
npm run typecheck     # tsc --noEmit
npm run lint          # eslint .
npx vitest run        # unit + RLS + migration tests (no emulator needed for the non-integration set)
node scripts/validate-schema.js   # Supabase schema invariants
npm run build         # next build
```

The 3 `registration-acceptance` integration tests require `FIRESTORE_EMULATOR_HOST`
+ a running emulator; they are pre-existing environment failures, not code
regressions.
