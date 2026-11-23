# Security Audit & Configuration Hardening

Status of the application-wide hardening (Batch 1, Tasks 1–5). This documents
the security posture, the dependency-vulnerability review, the environment
validation strategy, and the configuration changes. **No production deployment
or live integration was performed.**

## Environment validation

- **Startup (non-fatal report):** `src/lib/env-validation.ts` declares a
  `VAR_SPECS` table (category / requirement: always|prod|dev|optional / secret
  / minLen) and `validateEnvironment()` runs at boot via
  `src/instrumentation.ts`. It NEVER throws — the app must still start — and
  NEVER prints secret values (only presence / empty / missing + a length
  bucket). Missing production-required vars surface as `[env-validation]`
  problems in the server log.
- **Runtime-boundary fail-closed checks** (the load-bearing gates):
  - `JWT_SECRET` (≥32 chars) — `getJwtSecret()` returns null when missing/weak
    → middleware + `verifySession` fail closed (no token can be verified).
  - `OTP_SECRET` (≥32 chars) — `getOtpSecret()` returns null → OTP issue/verify
    fail closed.
  - `SMTP_*` — `getSmtpConfig()` validates the sender + returns null when
    incomplete → OTP email returns `{sent:false, reason:'smtp_not_configured'}`
    (never a fake delivery).
  - `FIREBASE_ADMIN_*` — `initAdmin()` returns null when the service-account
    trio is missing/malformed → `getAdminDb()`/`getAdminBucket()` return null →
    routes respond 503 (never throw, never use a fallback credential).
- `.env.example` + `.env.template` carry placeholders + section purpose
  comments only — no real secrets. `SUPERADMIN_BOOTSTRAP_EMAIL` is a real
  founder email (PII, not a credential).

## Security headers (next.config.ts)

Applied to `/:path*`:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
- `X-Frame-Options: DENY` (and CSP `frame-ancestors 'none'`)
- `Content-Security-Policy` — `default-src 'self'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, `connect-src` whitelists Firebase +
  GA + Cloudflare Turnstile. `script-src` includes `'unsafe-inline'` (Next.js
  inline hydration + GA4 init) — **known follow-up**: a nonce-based CSP that
  removes `'unsafe-inline'` is the documented next step; it was NOT done here
  because removing it without nonces breaks inline scripts + the app shell.
  `'unsafe-eval'` is dev-only.
- `X-Robots-Tag: noindex, nofollow` on `/admin`, `/auth`, `/profile`.

## Production error handling

- `src/app/error.tsx` — segment-level error boundary (branded, recoverable,
  no stack trace rendered to the client in production).
- `src/app/global-error.tsx` — global error boundary (own `<html><body>`,
  branded, no stack trace).
- Route handlers return sanitized errors via `jsonError` / `NextResponse.json`
  (`{ error: '...' }` / `{ message: '...' }`); `console.error` logs a truncated
  `err.message` server-side only. No route returns `err.stack`, a JWT, a
  password hash, a service-account key, or `process.env.X` in a response body.

## Direct-Firestore-write paths (default-deny conflicts)

- **Candidate profile** — the legacy `/profile` page wrote `users/{uid}` from
  the browser (denied by `firestore.rules`). Removed: `/profile` now redirects
  to the server-verified `/candidate/profile` (Task 1).
- **Admin draft autosave** — `src/hooks/useAutosave.ts` wrote `drafts/{...}`
  from the browser (no rule match → default-deny → silently failed on every
  call). Rewritten to localStorage-only (the actual working path); the
  `saveStatus` contract is preserved so callers need no changes (Task 5).
- All other client→data paths go through `/api/**` route handlers (Admin SDK,
  `verifySession`/`requirePermission`-gated). Confirmed for chat, contact,
  newsletter, lead, job-application, candidate profile/resume, and every admin
  CMS route.

## .gitignore

Covers `.env*` (with `!.env.example`/`!.env.template` re-includes), `*.pem`,
build artifacts (`.next/`, `out/`, `build`, `*.tsbuildinfo`, `next-env.d.ts`,
`.vercel`, `coverage`, `.genkit/*`), firebase debug logs, and (added in Task 5)
`service-account*.json`, `serviceAccount*.json`, `*.key`, `*.keystore`.

## Dependency vulnerability review

`npm audit` (production + development): **88 advisories — 0 critical, 17 high,
71 moderate, 0 low.** Total deps: 1661.

**High-severity (17), by cluster:**
- **Genkit + OpenTelemetry chain** (unfixable without a major Genkit upgrade):
  `@genkit-ai/core`, `@genkit-ai/firebase`, `@genkit-ai/next`,
  `@opentelemetry/propagator-jaeger`, `@opentelemetry/sdk-trace-node`,
  `@grpc/grpc-js`, `@tanstack-query-firebase/react` — `fixAvailable: false`.
- **Firebase client SDK** (retained during the Supabase cutover):
  `@firebase/firestore`, `@firebase/firestore-compat`, `firebase` —
  `fixAvailable: false`.
- **zod** (`< 4.6.6`, pinned transitively by Genkit): `fixAvailable: false`.
- **postcss** (`<= 8.5.22`, build tool, pinned by tailwindcss):
  `fixAvailable: false`.
- Fixable in isolation but transitive + risky: `@asteasolutions/zod-to-openapi`,
  `@genkit-ai/telemetry-server`, `@genkit-ai/tools-common`, `genkit-cli`,
  `zod-to-json-schema` — `fixAvailable: true`.

**Decision:** no broad dependency upgrades were performed. The fixable
advisories are transitive (upgrading them in isolation would not remove the
root `fixAvailable: false` advisories and risks breaking the Genkit/firebase
pinning). The unfixable advisories require major version bumps to Genkit /
firebase / zod that are out of scope for a hardening batch and would risk
breaking the running application. These are tracked as follow-ups:
- Upgrade Genkit + OpenTelemetry when a compatible release lands.
- Complete the Firebase → Supabase data-access cutover (retires the
  `firebase`/`@firebase/firestore` client + `@grpc/grpc-js` advisories).
- Re-evaluate `zod` / `postcss` once their dependents allow it.

## What was NOT done (honest scope)

- No nonce-based CSP (would break inline scripts without a per-response nonce
  plumbing change).
- No distributed rate limiter (the in-memory limiter is per-process; documented
  as a single-instance limitation in `src/lib/auth/rate-limit.ts` +
  `src/lib/api-security.ts`).
- No production deployment, no live Firebase/Supabase/SMTP/Vercel integration
  verification.
- No dependency version bumps.
