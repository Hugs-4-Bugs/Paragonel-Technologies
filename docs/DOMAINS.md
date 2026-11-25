# Domain configuration — Paragonel + AcquisitionOS

This document records the canonical-domain decisions + the manual Vercel/DNS
configuration required to make them live. Batch 4 Task 2 corrected the
AcquisitionOS domain handling: **acquisitionos.net is the intended canonical
product domain** (it is NOT redirected to the temporary beta Vercel URL).

## Two separate deployments

| Deployment | Canonical domain | Current host | Repo |
|---|---|---|---|
| Paragonel company site (this repo) | `paragonel.com` (apex) | `paragonel.vercel.app` (preview) | `Hugs-4-Bugs/Paragonel-Technologies` |
| AcquisitionOS product app (separate) | `acquisitionos.net` (apex) | `acquisitionosbeta.vercel.app` (temporary beta) | separate (not this repo) |

The two deployments are independent. This repo (the Paragonel company site)
handles ONLY Paragonel company-domain redirects. The AcquisitionOS product
domain is handled by its own deployment.

## Paragonel company site — canonical host

- **Canonical apex:** `paragonel.com`
- **www → apex:** `www.paragonel.com` → `paragonel.com` (308 permanent, path +
  query preserved). Enforced in `src/lib/canonical-host.ts` → `src/middleware.ts`.
- **Vercel preview host** (`paragonel.vercel.app`, `*.vercel.app` preview
  branches): NEVER redirected — preview access is preserved.
- **metadataBase fallback:** `https://paragonel.com` (in `src/app/layout.tsx`).
  Override per-environment with `NEXT_PUBLIC_SITE_URL`.
- **sitemap.xml / robots.txt:** origin from `NEXT_PUBLIC_SITE_URL` (fallback
  `paragonel.com` — set `NEXT_PUBLIC_SITE_URL=https://paragonel.com` in
  production so sitemap/robots URLs resolve to the apex from the first deploy).

### Manual Vercel configuration (Paragonel)
1. In the Paragonel Vercel project → **Settings → Domains**, add `paragonel.com`
   (apex) + `www.paragonel.com`.
2. At the DNS provider, add:
   - An **A record** (or Vercel-managed ALIAS/ANAME) for `paragonel.com` →
     Vercel's verification/anycast IP (Vercel shows the exact value on the
     domain settings page).
   - A **CNAME record** for `www.paragonel.com` → `cname.vercel-dns.com`.
3. In Vercel, set `paragonel.com` as the **primary domain** + (optionally) mark
   `www.paragonel.com` to redirect to the apex (Vercel can do this natively; the
   app's middleware also enforces www→apex as a backstop).
4. Set the env var `NEXT_PUBLIC_SITE_URL=https://paragonel.com` in the Vercel
   project (Production + Preview environments) so OG/canonical/sitemap/robots
   URLs resolve to the apex.

## AcquisitionOS product — canonical domain

- **Intended canonical product domain:** `acquisitionos.net`
- **Current temporary deployment:** `acquisitionosbeta.vercel.app` (the
  private-beta Vercel deployment). Accessible directly until acquisitionos.net
  DNS is configured.
- **No redirect on this app:** the Paragonel company site does NOT redirect
  `acquisitionos.net` (or the beta host) anywhere. If `acquisitionos.net`
  arrives at the Paragonel deployment, it is a DNS misconfiguration —
  `acquisitionos.net` DNS must point at the AcquisitionOS product Vercel
  deployment, NOT the Paragonel deployment.
- **CTAs + metadata on this site** reference `acquisitionos.net` (canonical).
  The raw URL is never shown as visible text — always behind a labelled link
  ("Request Private Beta Access", "Open the beta").
- **AI knowledge base + system prompt** reference `acquisitionos.net` as the
  canonical product domain (the prior "NEVER use acquisitionos.net" instruction
  was removed in Batch 4 Task 2).

### Manual Vercel configuration (AcquisitionOS — separate deployment)
1. In the AcquisitionOS product's Vercel project → **Settings → Domains**, add
   `acquisitionos.net` (apex) + `www.acquisitionos.net`.
2. At the DNS provider for `acquisitionos.net`, add:
   - An **A record** (or Vercel-managed ALIAS/ANAME) for `acquisitionos.net` →
     Vercel's verification/anycast IP (shown on the Vercel domain settings page).
   - A **CNAME record** for `www.acquisitionos.net` → `cname.vercel-dns.com`.
3. In Vercel, set `acquisitionos.net` as the **primary domain**; redirect
   `www.acquisitionos.net` → `acquisitionos.net` (apex).
4. The existing `acquisitionosbeta.vercel.app` Vercel preview host remains
   accessible (it is the underlying deployment the custom domain points at).

> **Until acquisitionos.net DNS is configured**, the CTA target
> (`https://acquisitionos.net`) will not resolve. This is an external DNS
> configuration step, not a code defect. The beta deployment remains directly
> accessible at `acquisitionosbeta.vercel.app` throughout.

## No redirect loops

The Paragonel app redirects ONLY `www.paragonel.com` → `paragonel.com`. It does
not redirect `acquisitionos.net`, `www.acquisitionos.net`, or the beta host
(`acquisitionosbeta.vercel.app`) — these all fall through (`canonicalHostRedirect`
returns `null`). The AcquisitionOS product deployment (a separate app) handles
its own domain independently. Neither app redirects to the other, so no
cross-domain redirect loop is possible. Regression-tested in
`src/lib/__tests__/canonical-host.test.ts`.

## Pre-existing audit finding (historical, not a living decision)

`docs/paragonel-audit/` contains Phase-0 audit findings that flagged an
"AcquisitionOS product identity split" between `acquisitionos.net` (a simple
non-AI 3-step CRM observed at audit time) and `acquisitionosbeta.vercel.app`
(the 12-stage AI platform). Those audit files are a **historical record** of the
Phase-0 state and are not updated here. The living decision (Batch 4 Task 2) is
that `acquisitionos.net` is the intended canonical product domain for the
AcquisitionOS 12-stage AI platform built by Paragonel; the beta Vercel host is
the current temporary deployment.
