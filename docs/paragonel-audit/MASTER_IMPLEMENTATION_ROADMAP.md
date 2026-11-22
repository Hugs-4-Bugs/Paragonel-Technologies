# Master Implementation Roadmap

**Baseline:** `develop` @ `405b75a` · **Audit date:** 2026-11-20
11 phases, page-level batches. Each phase: scope, pages/components, backend/API impact, dependencies, risks, required tests, visual acceptance criteria, functional acceptance criteria, git commit/push acceptance criteria, Vercel deployment acceptance criteria.

**Cross-phase rules (PART S):** Start each phase from latest verified `origin/develop`; verify workspace integrity; implement only the approved phase; run tests; review diff; review secrets; commit only reviewed changes; push only to `develop`; never push to `master`/`main`; fetch remote and verify the SHA includes the new commit; verify Vercel deployment separately; test the deployed site; report actual evidence. Never claim a local commit was pushed. Never claim a push caused a successful Vercel deployment without checking.

**Sequencing note:** Phase 0 deliverables (this audit) are committed to `develop` first. No implementation phase begins without founder approval. Phase 1 should also include **deploying `develop`** so the public site stops contradicting the credible baseline (the live site is stale with 404s and legacy branding).

---

## Phase 1 — Company identity, homepage and founder narrative

**Scope:** Establish brand tokens, deploy `develop`, rebuild homepage to the approved direction, deepen founder narrative. Preserve navy/blue brand.
**Pages/components:** `src/app/page.tsx`, `hero-ecosystem.tsx`, `stats-bar.tsx`, founder spotlight, `about-section.tsx`, `globals.css`/`tailwind.config.ts` brand tokens, careers page hard-coded hex → tokens.
**Backend/API impact:** None (static content). AI sections: add graceful offline fallback (hide, not error) when no `GEMINI_API_KEY`.
**Dependencies:** Founder confirmation of founder facts, stats sources, approved hero headline.
**Risks:** Over-claiming; brand drift. Mitigation: Content Truth Register.
**Required tests:** Homepage renders 200 on all viewports; no console errors; AI sections degrade gracefully without API key.
**Visual acceptance:** Cinematic hero with approved headline "We Engineer Digital Products That Move Businesses Forward." + ecosystem visual; navy/blue tokens enforced site-wide; founder section covers the 10 narrative dimensions (PART D §2).
**Functional acceptance:** Homepage sections in the PART D §3 order; `StatsBar` only shows sourced metrics; no placeholder strings.
**Git/push:** One commit per logical batch on `develop`; SHA verified after push.
**Vercel:** Deploy; verify live `/`, `/about` match `develop`; 404s on live (privacy-policy/our-product) resolved by deploy.

## Phase 2 — Service architecture and individual service pages

**Scope:** Define service taxonomy (primary/supporting/specialized/emerging); build service-page template from IT Lab skeleton; implement approved service pages.
**Pages/components:** `src/app/services/page.tsx`, service detail pages, `src/lib/data.ts` services, navbar Services mega-menu, About mega-menu, `services` Firestore read rule OR migrate reads to server route.
**Backend/API impact:** 🔴 Add `services` Firestore read rule (`isActive && deletedAt==null`) or server-side reads (fixes G16); add `/api/admin/services` route (fixes services CMS).
**Dependencies:** Founder service hierarchy decision (which of the 13 are primary vs supporting vs specialized vs emerging).
**Risks:** Over-publishing 13 services as equally prominent; production read-rule gap.
**Required tests:** Each service page renders; services CMS CRUD E2E; production Firestore rule test.
**Visual acceptance:** Each service page has all 11 elements (problem/deliverables/architecture/stack/capabilities/process/use-cases/FAQ/CTA/SEO); sticky anchor sub-nav; dual CTA band.
**Functional acceptance:** Service mega-menu links to real pages; About mega-menu uses only existing approved pages.
**Git/push:** `develop` only.
**Vercel:** Verify all service pages live; mega-menu works.

## Phase 3 — Interactive engineering and AI automation showcase

**Scope:** 8-stage interactive engineering process (Understand→Architect→Design→Engineer→Integrate→Validate→Deploy→Improve); AI/automation visual showcase; tech ecosystem classification.
**Pages/components:** `EngineeringProcess` redesign, AI showcase section, `tech-stack-section.tsx` (classified tiers).
**Backend/API impact:** None (unless AI showcase calls Genkit — add graceful fallback).
**Dependencies:** Reference research (Qorvia dashboard mocks); tech classification (Content Truth Register).
**Risks:** Fabricated dashboards/metrics — mitigation: label illustrative metrics explicitly; no fake performance data.
**Required tests:** Interactive process works on mobile; reduced-motion respected; AI sections degrade without key.
**Visual acceptance:** 8 stages each with icon/description/activity/visual/transition/animation/mobile interaction; tech ecosystem classified into 5 tiers.
**Functional acceptance:** No fabricated stats; reduced-motion fallback.
**Git/push:** `develop` only.
**Vercel:** Verify on deployed site.

## Phase 4 — Reference-inspired animations, graphs, integrations and workflow experiences

**Scope:** Qorvia-style infinite partner/integration logo marquee (multi-row, pause-on-hover, reduced-motion); AigentX-style filterable integration directory + recipe cards + connection-model explainer; **four-use-case tabbed experience (Sales/Support/Marketing/Engineering)** with animated workflow diagrams (founder-required).
**Pages/components:** New marquee component, integration directory component, four-use-case tabbed component; AcquisitionOS integration directory alignment.
**Backend/API impact:** Integration data source (AcquisitionOS integrations or static).
**Dependencies:** Reference visual confirmation (live browser snapshot of AigentX/recipes to confirm the four-tab pattern); verified partner logos for the marquee.
**Risks:** Copying proprietary template assets — mitigation: recreate patterns only, original assets; no third-party logos without relationship.
**Required tests:** Marquee smooth/no abrupt restart; tabs switch with animated diagram; responsive collapse; reduced-motion.
**Visual acceptance:** Marquee meets PART I §8 requirements; four tabs each with persona/workflow/metrics/integrations; navy/blue brand.
**Functional acceptance:** Integration directory searchable/filterable; recipe cards clickable; connection-model explainer present.
**Git/push:** `develop` only.
**Vercel:** Verify on deployed site across viewports.

## Phase 5 — AcquisitionOS product experience

**Scope:** Reconcile AcquisitionOS product identity; enrich the product page; ensure all CTAs→acquisitionos.net; clear available/partial/planned/roadmap distinction.
**Pages/components:** `src/app/our-product/acquisitionos/page.tsx`, `AcquisitionWorkflow`.
**Backend/API impact:** None (static + honesty badges).
**Dependencies:** 🔴 Founder reconciliation of acquisitionos.net vs beta product identity (Content Truth Register blocker #5).
**Risks:** Over-claiming capabilities; product identity split. Mitigation: honesty badges; "private beta" framing; label illustrative content.
**Required tests:** All CTAs link to acquisitionos.net; every capability has a status badge; no GA claims for beta features.
**Visual acceptance:** 12-stage lifecycle visualization; integration directory with honesty badges; architecture visual; trust/privacy disclaimers; roadmap.
**Functional acceptance:** Available/partial/planned/roadmap clearly distinguished; canonical = acquisitionos.net.
**Git/push:** `develop` only.
**Vercel:** Verify product page live (currently 404 on live).

## Phase 6 — Portfolio, clients, verified partnerships and testimonials

**Scope:** Partner/client logo ticker (verified only); portfolio with verified products; approved testimonials only.
**Pages/components:** `our-product/page.tsx`, logo ticker component, testimonials section.
**Backend/API impact:** None.
**Dependencies:** 🔴 Founder-supplied verified logos (Maa Arogyam, Primoreon, others if approved); approved testimonials (Content Truth Register blockers #1, #2, #3, #4).
**Risks:** Publishing unverified logos/testimonials — mitigation: only verified + approved.
**Required tests:** Ticker smooth/infinite/responsive/reduced-motion/pause-on-hover; no prospect logos.
**Visual acceptance:** Verified logos only, consistent treatment; testimonials with verifiable attribution.
**Functional acceptance:** No fabricated testimonials; no prospect companies as partners.
**Git/push:** `develop` only.
**Vercel:** Verify.

## Phase 7 — About, leadership and long-term vision

**Scope:** About page with mission/vision/values/journey timeline; long-term 10–15 year vision presented as vision; leadership = Prabhat Kumar only.
**Pages/components:** `about-section.tsx` expansion, About mega-menu.
**Backend/API impact:** None.
**Dependencies:** Founder confirmation of facts; vision content.
**Risks:** Inventing history/awards. Mitigation: Content Truth Register.
**Required tests:** About page renders; only Prabhat Kumar shown.
**Visual acceptance:** Mission/vision/purpose; milestones timeline (real history); core values; 10 narrative dimensions.
**Functional acceptance:** Vision clearly labeled as vision, not current capability.
**Git/push:** `develop` only.
**Vercel:** Verify.

## Phase 8 — Contact, privacy, terms and email delivery

**Scope:** Contact page explanatory content + 7 enquiry categories + mandatory consent checkbox (not preselected) + links to Terms/Privacy; implement founder's contact-data decision (CRM storage vs inbox-only); configure `COMPANY_INBOX`/SMTP; update privacy policy to reflect retention truth.
**Pages/components:** `contact-section.tsx`, `src/app/api/contact/route.ts`, `src/lib/email.ts`, `src/app/privacy-policy/page.tsx`, Terms page (if missing).
**Backend/API impact:** 🔴 Per founder decision: either remove Firestore `leads` write (deliver to inbox only) or make opt-in; align privacy policy; configure SMTP/COMPANY_INBOX.
**Dependencies:** 🔴 Founder contact-data decision (Content Truth Register blocker #6); real company Gmail address (blocker #8).
**Risks:** Privacy misstatements; storing data the founder said not to store. Mitigation: privacy policy matches actual retention.
**Required tests:** Contact submit → email captured (Mailpit local / company inbox prod); consent enforced server-side; enquiry category persisted or delivered; privacy policy accurate.
**Visual acceptance:** 7 categories; consent checkbox (not preselected); explanatory content (who/what/why/after-submit).
**Functional acceptance:** No misleading absolute privacy guarantee; consent required to submit.
**Git/push:** `develop` only.
**Vercel:** Verify contact flow on deployed site (with COMPANY_INBOX configured in Vercel env).

## Phase 9 — Blog, SEO and footer

**Scope:** Blog markdown rendering, per-post metadata, social sharing, author details, reading time, related articles, empty/error states; site-wide SEO (sitemap, robots, root metadataBase, OG/Twitter, JSON-LD, alt text, internal links); footer completeness with unified Paragonel social links.
**Pages/components:** `blog/[slug]/page.tsx` (markdown), blog listing, `src/app/layout.tsx` (root metadata), `sitemap.ts`, `robots.ts`, JSON-LD components, `footer.tsx`.
**Backend/API impact:** Possibly `generateMetadata` server-side for blog posts.
**Dependencies:** Real blog content (no fabricated authors/articles).
**Risks:** SEO gaps compound. Mitigation: comprehensive SEO pass.
**Required tests:** Sitemap valid; robots correct; OG previews render; JSON-LD validates; blog markdown renders; no broken links.
**Visual acceptance:** Blog as a real knowledge platform; footer complete with real social links.
**Functional acceptance:** All PART N SEO elements present; no placeholder articles.
**Git/push:** `develop` only.
**Vercel:** Verify SEO on deployed site (search preview tools).

## Phase 10 — Admin portal, CRM, CMS and publishing workflows

**Scope:** Rename `/admin`→`/aq-internal` (PART L); add `/api/admin/services` route (fix services CMS); remove dead sidebar links (G18); content preview; ensure all admin workflows E2E; CSRF protections; responsive admin.
**Pages/components:** `src/app/admin/**` → `src/app/aq-internal/**`, `src/middleware.ts` matcher, `verifyAdmin` (add CSRF), admin sidebar fix, services CMS API, preview route.
**Backend/API impact:** Route rename + middleware + CSRF on mutations + services API.
**Dependencies:** None external.
**Risks:** Breaking existing admin URLs (add redirects); CSRF regression. Mitigation: redirects + tests.
**Required tests:** All admin workflows E2E (create/edit/delete/publish jobs+blog, applications+resume, leads, newsletter, activity, preview); CSRF tests; responsive at 5 viewports.
**Visual acceptance:** Admin responsive desktop/laptop/tablet/mobile/narrow.
**Functional acceptance:** `/aq-internal` auth-gated; not in nav/footer/sitemap; services CMS works; preview works; publish-without-code-edits works for all content types.
**Git/push:** `develop` only.
**Vercel:** Verify admin on deployed site.

## Phase 11 — Responsive, security, performance and accessibility QA

**Scope:** Final QA across 9 viewports (360/375/390/430/768/1024/1280/1440/1920); accessibility (contrast, keyboard, reduced-motion, touch targets); performance/Core Web Vitals; security hardening (CSRF, Firebase Auth for end-users to lock `users`, Redis rate limiting, align resume limits); re-enable TS/ESLint in build; fix 39 type errors; add unit tests.
**Pages/components:** All.
**Backend/API impact:** Firebase Auth adoption; Redis; build config.
**Dependencies:** Firebase Auth project; Redis instance.
**Risks:** Breaking changes from build re-enablement. Mitigation: fix errors incrementally before re-enabling.
**Required tests:** Full test suite green; Lighthouse pass; axe a11y pass; 9 viewports visual inspection (actual, not DOM-only — PART O).
**Visual acceptance:** No horizontal overflow/text clipping/image distortion/card overflow at any viewport; touch targets ≥44px; mobile nav works; sticky headers; modal scrolling; keyboard nav; contrast; reduced-motion.
**Functional acceptance:** TS/ESLint enforced in build; tests pass; CSRF on all mutations; `users` locked; rate limit multi-instance; resume limits aligned.
**Git/push:** `develop` only.
**Vercel:** Verify deployed site passes all QA gates.

---

## Recommended phase order

Phase 0 (this audit, committed) → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11.

Phases 1 and 8 have the highest founder-decision dependencies (hero headline/founder facts; contact-data retention/company inbox). Phase 5 depends on the AcquisitionOS identity reconciliation. Phase 6 depends on verified logos/testimonials. The founder should resolve Content Truth Register blockers #4, #5, #6 before Phase 1 begins, and blockers #1–3, #8 before Phases 6 and 8.
