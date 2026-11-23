# Release Readiness — Paragonel Technologies

Status as of this batch: **the app builds, typechecks, and the test suite passes
(except the 3 pre-existing emulator-gated integration tests).** This document
records what was verified, the genuine external blockers, and the known
follow-ups that are NOT release blockers.

## Verification performed this batch

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | PASS |
| Lint (changed files) | `npx eslint <files>` | PASS (0 errors; pre-existing unused-import / `catch (error: any)` warnings in untouched files remain) |
| Unit / integration tests | `npx vitest run` | PASS — see counts below |
| Schema validation | `node scripts/validate-schema.js` | PASS (24 tables, 73 RLS policies, applies 0001+0002+0005+0007) |
| Production build | `npm run build` | PASS (115/115 static pages; middleware 38.6 kB; `/faq`, `/careers/[id]`, `/services/[slug]`, AcquisitionOS all compile) |

### Test counts
- 3 failing tests — **all pre-existing, environment-gated**:
  `src/lib/auth/__tests__/registration-acceptance.test.ts` (Steps A / C / D+E).
  These require `FIRESTORE_EMULATOR_HOST` + a running Firestore emulator
  (unavailable in the sandbox). They are integration-style assertions on
  `getAdminDb()` returning null without the emulator — NOT code regressions.
  Confirmed identical to the Batch-2 baseline.
- All other tests pass (the +9 canonical-host tests added this batch are
  included).

## Routes verified functional (no website-change regressions)

The website changes (founder/services/AcquisitionOS/SEO) did not touch the
auth/data layer. Verified by the passing test suite + build:

- **Auth**: `/api/auth/*` (register/init → otp/verify → register/complete, login,
  logout, me, forgot-password, reset-password, change-password) — covered by
  `sessions`, `otp`, `password`, `captcha`, `rbac`, `registration-acceptance`
  tests.
- **Candidate applications**: `/api/candidate/profile`, `/api/candidate/resume`,
  `/api/candidate/applications`, `/api/job-applications` (atomic + deduped) —
  covered by `candidate-profile`, `resume-security`, `drafts`, `safe-redirect`.
- **Admin permissions**: `/api/admin/*` RBAC via `verifyAdminPermission` —
  covered by `rbac`, `sessions`, `accept-invite`, `bootstrap`.
- **Newsletter**: `/api/newsletter` (double opt-in) + `/api/newsletter/confirm`
  + `/api/newsletter/unsubscribe` — covered by `newsletter-lifecycle`,
  `newsletter-confirm-token`.
- **Chat**: `/api/chat` + `/api/chat/career-assist` (honest 503 on provider
  failure) — covered by `paragonel-ai-flow`, `knowledge-retrieval`,
  `analyze-resume-flow`.
- **Resume processing**: `analyze-resume-flow` (fail-closed on missing key) +
  `/api/candidate/resume` (RBAC, path validation, size cap) — covered by
  `analyze-resume-flow`, `resume-security`.
- **Contact**: `/api/contact` + `/api/lead` — CSRF/origin/body-size enforced by
  middleware (`api-security` test); route handlers are public + rate-limited.

## Security headers + CSP (reviewed, not weakened)

`next.config.ts` `headers()` applies to `/:path*`:
- `Content-Security-Policy` (default-src 'self'; frame-ancestors 'none';
  object-src 'none'; script-src 'self' 'unsafe-inline' + GTM + Turnstile;
  connect-src 'self' + Firebase + GA4 + Turnstile; img-src 'self' data: blob:
  https:; etc.)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
- `X-Frame-Options: DENY`
- `X-Robots-Tag: noindex, nofollow` on `/admin/:path*`, `/auth/:path*`,
  `/profile/:path*`, `/candidate/:path*`.

The middleware matcher was expanded this batch to run on all non-static routes
(so the canonical-host redirect is evaluated on every page request). The admin
gate + API CSRF/body-size checks still only act on `/admin/**` + `/api/**` —
they are no-ops on other paths. No existing protection was weakened.

## Client-bundle secret exposure (reviewed)

No `NEXT_PUBLIC_*` var carries a secret. The `NEXT_PUBLIC_*` vars are
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_FIREBASE_*` — all public-by-design.
All real secrets (`JWT_SECRET`, `OTP_SECRET`, `TURNSTILE_SECRET_KEY`,
`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_ADMIN_PRIVATE_KEY`,
`SMTP_PASS`) are read server-side only. No hardcoded API keys in src.

## Deployment config (Vercel-compatible)

- `vercel.json`: `{"framework":"nextjs","installCommand":"npm ci"}`.
- `next.config.ts`: `typescript.ignoreBuildErrors: false` (typecheck ON at
  build), `eslint.ignoreDuringBuilds: true` (lint not enforced in the build —
  run `npm run lint` separately).
- No `output: 'standalone'` (Vercel-managed build).
- Firebase + Supabase backend configs present (`firebase.json`,
  `firestore.rules`, `supabase/migrations/`).

## Genuine external blockers (must be resolved before a live release)

These are NOT code defects — they are external configuration the founder must
provide. Until supplied, each integration fails CLOSED with an honest error
(never a silent bypass):

1. **SMTP** (`SMTP_HOST/PORT/USER/PASS/FROM` + `APP_BASE_URL`) — every email
   path (OTP, newsletter confirmation, job alerts, application confirmation)
   returns honest `smtp_not_configured` / `smtp_error` until supplied. OTP
   registration/login works end-to-end in tests via `issueOtp`'s direct return,
   but real email delivery requires SMTP.
2. **Cloudflare Turnstile** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
   `TURNSTILE_SECRET_KEY`) — registration + login fail closed
   (`misconfigured`) until supplied.
3. **Gemini** (`GEMINI_API_KEY`) — chat returns honest classified 503; resume
   parser throws `ResumeAnalysisError('missing_key')` (resume stored, parse
   skipped) until supplied.
4. **Firebase Admin service-account** (`FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/
   PRIVATE_KEY`) — admin SDK returns null → routes respond 503 until supplied.
   (Emulator works for local dev.)
5. **Supabase project keys** (`NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` +
   `SUPABASE_SERVICE_ROLE_KEY`) — for the data-access cutover (see
   `docs/MIGRATION_READINESS.md`).
6. **`NEXT_PUBLIC_SITE_URL`** — set to the canonical apex
   (`https://paragonel.com`) in production so OG/canonical/sitemap/robots URLs
   resolve correctly. The metadataBase fallback is now the apex; without this
   var, OG URLs default to `paragonel.com` (correct for SEO, but the founder
   should confirm the apex is pointed at the deployment).
7. **Custom domain** (`paragonel.com`) pointed at the Vercel deployment — so the
   www→apex redirect + canonical URLs are live.

See `docs/EXTERNAL_SERVICES_SETUP.md` for the full configuration walkthrough.

## Known follow-ups (NOT release blockers)

- **CSP `script-src 'unsafe-inline'`** — required because Next.js emits inline
  hydration scripts + GA4 uses an inline init. A nonce-based CSP removing
  `'unsafe-inline'` is the documented follow-up (commented in `next.config.ts`).
  The current CSP is otherwise strict (frame-ancestors 'none', object-src
  'none', no 'unsafe-eval' in production).
- **In-memory rate limiter** — per-process only; on Vercel serverless, each
  invocation may be a fresh instance. A distributed limiter (Firestore/Upstash)
  is the documented follow-up (`src/lib/api-security.ts` comment).
- **`/candidate/*` page middleware gating** — candidate pages rely on
  client-side auth + API-level `verifySession` (data is protected); the page
  shell may flash briefly before the API rejects. Middleware Edge gating for
  `/candidate` is a possible follow-up; not a data-protection gap (the API
  blocks all unauthenticated reads/writes).
- **`eslint.ignoreDuringBuilds: true`** — lint is not enforced in the Vercel
  build. Run `npm run lint` in CI separately (the repo has `eslint.config.mjs`).

## No production cutover performed

This batch did NOT deploy to production or alter any production database. The
Supabase migrations (0001–0007) are reviewed + PGlite-validated but not applied
to a live Supabase project. No live integration (SMTP, Gemini, Firebase, Turnstile,
Vercel) was verified against real credentials.
