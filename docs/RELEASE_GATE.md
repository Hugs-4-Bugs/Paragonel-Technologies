# Production release gate (Batch 6 Task 5)

**Date:** 2026-11-23
**Branch:** `develop` (HEAD `baa6a8f`)
**Master:** `89e8e57` — NOT modified

## Verdict

**NOT LAUNCHED.** The application is code-side + security-side release-ready.
The production launch is **blocked on founder-performed external
configuration + deployment + live verification** — none of which the agent can
execute (no Vercel, DNS, or credential access from the cleanroom).

The application is declared launched **only when every dimension below reads
PASS against the live production deployment.** A green `next build` is one input
to the code dimension, not the launch signal.

## Seven-dimension gate

| # | Dimension | Status | Evidence / remaining action |
|---|---|---|---|
| 1 | **Code readiness** | **PASS** | typecheck 0; build 116/116 (middleware 38.8 kB); 520/523 tests (3 pre-existing emulator-gated); schema 25 tables / 74 RLS policies; lint 96 (down from 109, high-risk security subset fixed); tracked-file secret scan CLEAN. |
| 2 | **Environment readiness** | **FOUNDER-PENDING** | Every env var is documented in `.env.example` + covered by the `env-validation.ts` boot summary. **None are set in the production Vercel environment yet.** Founder action: set the required + provider env vars in Vercel Production (LAUNCH_PLAYBOOK Phase 2). Fail-closed posture means an unset var produces an honest error, not a silent bypass. |
| 3 | **Domain readiness** | **FOUNDER-PENDING** | `paragonel.com` + `acquisitionos.net` DNS records are not configured; neither custom domain is added to a Vercel project yet. Founder action: add the apex A records + `www` CNAMEs at the DNS provider; add the domains to the correct Vercel projects (two separate projects — LAUNCH_PLAYBOOK Phase 0 + Phase 1). The code-side canonical redirect (www→apex) + apex metadataBase fallback are ready. |
| 4 | **Integration readiness** | **FOUNDER-PENDING** | `scripts/check-integrations.mjs` reports **6 SKIP** in this environment (no credentials). The fail-closed code paths ARE unit-tested. Founder action: set the provider credentials (Phase 2) → run the diagnostic against production → every intended service must report **PASS**. No passing result is claimed until the founder sees PASS with real credentials. |
| 5 | **Security readiness** | **PASS** (code-side) | Fail-closed for every external service; admin RBAC + audit coverage complete; `/candidate` + `/profile` middleware user-tier gating (Batch 5); PII redaction on stored + runtime logs; CSP strict (the `unsafe-inline` follow-up is documented, not a blocker); cron idempotent + concurrency-safe; schema RLS on all 25 tables. `npm audit`: 76 vulns (64 moderate, 12 high); the notable high is `zod <4.6.6` (no fix without a breaking zod 4.x major bump — not a release blocker for bounded-input request validation); the rest are transitive under `@genkit-ai/*`. |
| 6 | **User journey readiness** | **PARTIAL** | LOCAL: 520/523 + the 15 journeys mapped to covering tests (`docs/JOURNEY_VERIFICATION.md`). PRODUCTION: **FOUNDER-PENDING** — the founder must walk the 15 journeys against the live URL with authorized test accounts + record actual outcomes. No live journey is claimed. |
| 7 | **Deployment readiness** | **FOUNDER-PENDING** | No deploy performed. Founder action: confirm the Vercel Production Branch is `develop` (LAUNCH_PLAYBOOK Phase 3a — the repo default is `master`, which the agent must not modify; set the Vercel Production Branch to `develop`); trigger the production deploy; verify the deployed commit SHA == `develop` HEAD; check the build logs (116/116, no errors). |

**Aggregate:** 2 of 7 dimensions PASS (code + security, both code-side). 5 of 7
are FOUNDER-PENDING (environment, domain, integration, journey, deployment).
The launch cannot proceed until the 5 pending dimensions read PASS against the
live deployment.

## Remaining founder actions — in execution order

These are the exact steps, in the order they must be performed. Full detail for
each is in `docs/LAUNCH_PLAYBOOK.md` (phase references inline).

1. **Set environment variables in Vercel Production** (Playbook Phase 2):
   `JWT_SECRET`, `OTP_SECRET`, `SUPERADMIN_BOOTSTRAP_EMAIL`, the Firebase client
   trio+ (`NEXT_PUBLIC_FIREBASE_*`), `NEXT_PUBLIC_SITE_URL=https://paragonel.com`,
   `APP_BASE_URL=https://paragonel.com`, `COMPANY_INBOX`. Then the optional
   providers you intend to use: SMTP block, `GEMINI_API_KEY`, the Turnstile pair,
   the Firebase Admin trio, the Supabase trio. **Never paste secrets into chat —
   set them in the Vercel dashboard or via `vercel env add`.**
2. **Configure `paragonel.com` + `www.paragonel.com`** (Playbook Phase 1a):
   add the domains to the Paragonel Vercel project; create the apex A record +
   `www` CNAME at the DNS provider; set `paragonel.com` as primary + enable the
   Vercel `www`→apex redirect.
3. **Configure `acquisitionos.net`** (Playbook Phase 1b): add the domain to the
   **AcquisitionOS product Vercel project** (separate from the Paragonel
   project); create the apex A record + `www` CNAME; set `acquisitionos.net` as
   primary. The beta host `acquisitionosbeta.vercel.app` remains accessible.
4. **Confirm the Vercel Production Branch = `develop`** (Playbook Phase 3a).
   (The agent must not modify `master`; set the Vercel Production Branch to
   `develop` instead of merging.)
5. **Deploy `develop` to production** (Playbook Phase 3b): push to `develop` or
   Promote the latest deployment.
6. **Verify the deployed commit + build logs** (Playbook Phase 3c): the
   Production deployment's commit SHA == `develop` HEAD; build logs show
   `✓ Compiled successfully` + `116/116` + no errors.
7. **Run `node scripts/check-integrations.mjs`** against the production env
   (Playbook Phase 4.1): every intended service must report **PASS**.
8. **Verify both domains + the www→apex redirect + canonical/OG URLs +
   robots/sitemap** (Playbook Phase 4.2–4.5).
9. **Verify cron execution** (Playbook Phase 4.6): Vercel Cron shows `200`
   invocations (not `503`); or the manual `curl` with `CRON_SECRET`.
10. **Walk the 15 critical journeys** (Playbook Phase 4.7 +
    `docs/JOURNEY_VERIFICATION.md`) against the live URL with authorized test
    accounts. Record actual outcomes + evidence.
11. **Bootstrap the first super_admin** (Playbook Phase 4.8): `/admin/bootstrap`
    with `SUPERADMIN_BOOTSTRAP_EMAIL`, then `/admin/login`.
12. **Security spot-checks** (Playbook Phase 5): no secrets in the client
    bundle; security headers present; admin/auth pages noindex; `/candidate`
    gating redirect.

**Only after steps 1–12 all pass** is the application declared launched. If any
step fails, stop + resolve it before proceeding (the fail-closed posture means
a failed step does not corrupt data or produce false success — it surfaces an
honest error to fix).

## What "launched" will mean

When the founder reports that steps 1–12 are complete with evidence (PASS for
the integration diagnostic, `200` for the cron, real outcomes for the 15
journeys, the deployed SHA confirmed), the release gate flips to 7/7 PASS +
the application is live. Until then, the product is staged — code-complete,
security-hardened, fully documented, and blocked only on external configuration
the founder alone can perform.

## Honest scope (this batch)

- No Vercel, DNS, or credential access. No deploy. No live connectivity. No live
  journey walk. No production database modification. No `master` modification.
- The agent's contribution this batch: reconciled the handover docs to the
  current code (Task 1) + produced the executable launch playbook (Tasks 2–4) +
  this release gate (Task 5). All code-side; all pushed to `origin/develop`.

## Batch 6 commits (on top of `ac2e642`)

| SHA | Subject |
|---|---|
| `2fa428f` | `docs(release): reconcile handover docs with current code (Batch 6 Task 1)` |
| `baa6a8f` | `docs(release): add founder launch playbook (Batch 6 Tasks 2-4)` |
| *(this commit)* | `docs(release): production release gate (Batch 6 Task 5)` |

All pushed to `origin/develop` + remote-SHA-verified. `origin/master` unchanged
at `89e8e57`.
