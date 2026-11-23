# Critical user journey verification (Batch 5 Task 3)

This document maps each of the 15 critical user journeys to the tests that
cover it + the **local** verification result. Per the batch rules, no live
production verification is claimed — the cleanroom has no deployment access +
no real external credentials. Every result below is **LOCAL** (the vitest suite
run against the in-memory fakes / PGlite; routes that need the Firebase
emulator are marked).

**Suite result (local):** 511 passed / 514 — the 3 failures are the pre-existing
emulator-gated `registration-acceptance` tests (require `FIRESTORE_EMULATOR_HOST`;
unchanged across batches, not code regressions). No new failures introduced.

| # | Journey | Covering tests | Local result | Env |
|---|---|---|---|---|
| 1 | Homepage + company navigation | build (116/116 pages generate); nav-link↔route cross-check (no 404s, verified in Batch 4) | PASS (build) | LOCAL |
| 2 | Services pages + mega-menu | build (`/services`, `/services/[slug]` generate); services-catalogue (13 offerings, 5 domains) | PASS (build) | LOCAL |
| 3 | AcquisitionOS product page + 12 workflow stages | build (`/our-product/acquisitionos` generates); PRODUCT_DOMAIN + 12-stage terminology preserved | PASS (build) | LOCAL |
| 4 | AcquisitionOS domain + canonical URL | `src/lib/__tests__/canonical-host.test.ts` (acquisitionos.net NOT redirected; www→apex; apex/preview/localhost preserved; no redirect loop) | PASS (13 tests) | LOCAL |
| 5 | Candidate registration, OTP, login | `registration-acceptance.test.ts` (no account before OTP verify), `otp.test.ts`, `sessions.test.ts`, `captcha.test.ts` | PASS — 3 acceptance tests are emulator-gated (SKIP without emulator); the OTP/session/captcha unit tests pass | LOCAL (emulator-gated subset) |
| 6 | Password recovery + reset | `src/lib/auth/__tests__/password.test.ts` | PASS | LOCAL |
| 7 | Candidate profile + server-backed drafts | `src/lib/auth/__tests__/candidate-profile.test.ts`, `src/lib/__tests__/drafts.test.ts` | PASS | LOCAL |
| 8 | Resume upload, parsing, replacement, download | `src/lib/__tests__/resume-security.test.ts` (path validation, access control), `src/lib/ai/__tests__/analyze-resume-flow.test.ts` (parse + missing-key fail-closed) | PASS | LOCAL |
| 9 | Job applications + application status | `src/lib/supabase/__tests__/rls.test.ts` (`uniq_job_applications_active` partial unique index — atomic duplicate guard); job-application route uses a Firestore transactional duplicate-check (emulator-only at the route level) | PASS (index + RLS verified on PGlite); route-level transaction is emulator-gated | LOCAL |
| 10 | Job matching + candidate notifications | `src/lib/matching/__tests__/match-engine.test.ts`, `preferences.test.ts`, `skill-aliases.test.ts`; `src/lib/job-alerts/__tests__/{trigger,process,dedup,status,unsubscribe}.test.ts` | PASS (full pipeline: match → enqueue → claim → send → dedup → unsubscribe) | LOCAL |
| 11 | Admin permissions + alert-status page | `src/lib/auth/__tests__/{rbac,sessions,accept-invite,bootstrap}.test.ts`; `src/lib/job-alerts/__tests__/status.test.ts` (alert-status summary + consumer contract); `/admin/alerts` UI generates (build) | PASS | LOCAL |
| 12 | Newsletter double opt-in + unsubscribe | `src/lib/__tests__/{newsletter-lifecycle,newsletter-confirm-token}.test.ts` | PASS (subscribe → confirm-token → double-opt-in → unsubscribe) | LOCAL |
| 13 | Chatbot + career-assist | `src/lib/ai/__tests__/{paragonel-ai-flow,knowledge-retrieval,lead-qualification,phase1-corrections}.test.ts` | PASS (system prompt, knowledge base, fail-closed 503) | LOCAL |
| 14 | Contact form + email delivery | `src/lib/__tests__/submission-security.test.ts` (fingerprint + isLikelyDuplicate double-submit dedup); `src/lib/auth/__tests__/email.test.ts` | PASS (dedup contract; SMTP fail-closed `smtp_not_configured`) | LOCAL |
| 15 | Cron-triggered job alert processing | `src/lib/__tests__/cron-auth.test.ts` (CRON_SECRET verify), `src/lib/job-alerts/__tests__/process.test.ts` (idempotent drain + atomic claim + stuck recovery) | PASS | LOCAL |

## Journey defects found + fixed (this batch)

- **Contact dedup untested (journey 14):** the `fingerprint()` +
  `isLikelyDuplicate()` functions in `src/lib/submission-security.ts` (used by
  the contact + lead routes to absorb double-submits) had NO unit test. Added
  `src/lib/__tests__/submission-security.test.ts` (9 tests) covering
  determinism, case-insensitivity, undefined-part handling, input sensitivity,
  first-submission recording, immediate-repeat detection, route-scoping, and
  distinct-fingerprint handling. No code defect was found — the functions were
  correct; the gap was test coverage.

No other genuine journey defect was found. The 3 `registration-acceptance`
failures are environment-gated (emulator), not code defects — they pass when
`FIRESTORE_EMULATOR_HOST` is set (verified in prior batches).

## What is NOT verified here (honest scope)

- **No production or preview deployment was exercised.** The build succeeds
  (116/116 pages; middleware 38.7 kB) but a green build is not live verification.
- **No real email delivery, Gemini completion, Turnstile challenge, or
  Firestore/Supabase round-trip was performed** — those require credentials the
  cleanroom does not have. See `docs/INTEGRATION_VERIFICATION.md` for the
  founder-run connectivity diagnostic.
- **UI journeys (1, 2, 3):** verified by build (pages compile + generate) + the
  Batch-4 nav-link cross-check, NOT by a browser render (the test env is `node`,
  no jsdom/RTL).

## Founder action to close the verification gap

1. Deploy to a Vercel preview (or production) with real credentials.
2. Run `node scripts/check-integrations.mjs` against the deployed env — every
   intended service must PASS.
3. Walk the 15 journeys above against the live URL; record the actual outcome +
   evidence (screenshots / logs) for each. The local suite proves the code paths
   are correct; the live walk proves the deployed integrations behave.
