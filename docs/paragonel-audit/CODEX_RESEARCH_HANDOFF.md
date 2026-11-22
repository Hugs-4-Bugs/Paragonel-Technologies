# Codex Research Handoff

**Audit date:** 2026-11-20
Purpose: enable Codex (or any subsequent research agent) to perform additional research on the original reference sites and recreate the relevant experiences in Paragonel's existing architecture and design language. Each entry follows the 10-field structure required by PART P.

**Hard constraints (PART F):** Do not copy protected source code, proprietary assets, logos, or copyrighted imagery. Recreate the visual behaviour and interaction quality using original implementation and properly licensed assets. All three reference properties are commercial templates (Qorvia by Pixcut Studio LLC; IT Lab by 21Lab) or proprietary Framer sites (AigentX). Recreate **patterns and information architecture only**.

---

## Qorvia

### Entry Q1 — Home + Feature pages
1. **Reference website URL:** `https://qorvia.framer.website/` and `https://qorvia.framer.website/feature`
2. **Exact page/section:** Hero (billing-dashboard mock); "Everything you need to grow" capabilities grid; "Get started in minutes" 3-step onboarding; "Why choose Qorvia" 4-benefit grid; "Flexible plans" pricing toggle; integration logos area.
3. **Observed layout:** Hero = headline + right-side dashboard mock (line chart, KPI tile, transaction list). Capabilities grid = 4–5 cards each with a mini UI mock. Onboarding = numbered 3-step with per-step stat card. Benefits = 4 quantified blocks. Pricing = tiered table with monthly/yearly toggle.
4. **Interaction behaviour:** Pricing toggle recompute; "Load more"-style progressive disclosure on integrations; card hover states (inferred).
5. **Animation behaviour:** On-card chat mock state loop ("Enter your prompt" → "Processed"); scroll-reveal section choreography (inferred, Framer convention); possible horizontally scrolling integration-logo wall (names confirmed: Slack, Zapier, Notion; marquee parameters NOT confirmed by text fetch).
6. **Content structure:** headline + one-line value prop + bulleted capabilities + paired UI mock per feature.
7. **Relevant implementation opportunities:** Hero-with-dashboard-mock pattern; capabilities grid; 3-step onboarding strip; 4-point "Why choose" grid; pricing toggle (if Paragonel tiers engagements); integration marquee.
8. **Paragonel adaptation:** Recreate the hero+dashboard pattern with a Paragonel-branded "platform" dashboard tile showing a real Paragonel metric (navy background, blue accent). Use the capabilities grid for Paragonel service pillars. Use the 3-step strip for the engagement process. Use the 4-point grid for the trust section (only sourced metrics). Use the marquee for **verified** partner logos.
9. **Technical considerations:** Multi-row infinite marquee with pause-on-hover and reduced-motion support (PART F §1). Dashboard mocks must use Paragonel's real numbers or be explicitly labeled illustrative. Framer Motion available in repo.
10. **Assets or licensing considerations:** Qorvia is a commercial Framer template (Pixcut Studio LLC). Do not copy screenshots, copy strings, chart data, or layout pixel-for-pixel. Named integration brands are third-party trademarks — display only with a real relationship and brand-guideline compliance.

### Entry Q2 — Blog (research, not yet fetched)
1. **Reference website URL:** `https://qorvia.framer.website/blog`
2. **Exact page/section:** Blog listing + article structure.
3–10. **Research instruction:** Fetch and document the blog listing layout (card grid, categories, featured article, author/date/reading-time) and the article page structure (cover image, body rendering, social sharing, related articles). Adapt the pattern to Paragonel's blog (Phase 9) with Paragonel's own categories (AI Engineering, Agentic AI, RAG, SaaS Product Engineering, Cloud, DevOps, Distributed Systems, Database, Security, Automation, AcquisitionOS, Company Insights) and real author details. Do not copy Qorvia copy or imagery.

---

## AigentX

### Entry A1 — Integrations page
1. **Reference website URL:** `https://aigentx.framer.website/integrations`
2. **Exact page/section:** Searchable integration directory, category chips, card grid, connection-model explainer.
3. **Observed layout:** Category chips (Communication, Productivity, CRM & Sales, Dev & Ops, Finance & Commerce, Marketing, Data & AI + All); integration card grid (name, category, description, trigger/action counts); "Load more"; 3-step connection explainer; technical flow strip (Trigger fires → Match → Auth → Sync).
4. **Interaction behaviour:** Client-side search + category filter re-render the grid; card click opens detail (modal/panel implied); Load more progressive disclosure.
5. **Animation behaviour:** Not captured (JS-rendered) — confirm via live browser snapshot.
6. **Content structure:** directory-as-catalog, standardized card fields.
7. **Relevant implementation opportunities:** Filterable integration directory; connection-model explainer as a trust strip.
8. **Paragonel adaptation:** Rebuild with Paragonel's own connector list (align with AcquisitionOS integration honesty badges) and navy/blue card styling. Add the connection-model explainer as a trust strip on the AcquisitionOS or services pages.
9. **Technical considerations:** Client-side filter + search over a static or Firestore-backed integration list; accessible (keyboard, ARIA); responsive grid.
10. **Assets or licensing considerations:** AigentX integration logos are third-party trademarks. Display only for integrations Paragonel actually supports. Recreate the pattern, not the copy.

### Entry A2 — Recipes page + four-use-case experience
1. **Reference website URL:** `https://aigentx.framer.website/recipes`
2. **Exact page/section:** Recipe library by department; the "Same engine, four very different jobs" Sales/Support/Marketing/Engineering experience.
3. **Observed layout:** Recipe cards (title, description, tools, step count, department tag) grouped by department (~15 recipes).
4. **Interaction behaviour:** Department grouping; clickable recipe cards.
5. **Animation behaviour:** ⚠️ The four-use-case tabbed experience was **NOT captured** by WebFetch (the page rendered as a flat card list). It may exist in the live DOM. **Codex must perform a live headless-browser snapshot to confirm whether the four-tab experience exists and document its transitions, animated diagrams, text changes, outcome metrics, and responsive behaviour.**
6. **Content structure:** per-recipe standardized fields.
7. **Relevant implementation opportunities:** Recipe-card library; the founder-required four-use-case tabbed experience.
8. **Paragonel adaptation:** Build a horizontal tab bar (Sales / Support / Marketing / Engineering, navy active, blue underline). On tab change, animate a central workflow node-graph (source → agent → destination) where nodes re-label and connectors re-draw; supporting text + outcome metrics cross-fade beneath. Each tab: persona headline, 3–4 node workflow, 2–3 outcome metrics (label illustrative if not sourced), relevant integration set. Responsive: tabs collapse to scroll row or `<select>` under ~640px; diagram stacks vertically.
9. **Technical considerations:** Framer Motion `AnimatePresence` for tab transitions; reduced-motion fallback; accessible tab pattern (ARIA tabs); responsive reflow.
10. **Assets or licensing considerations:** Recreate the pattern only. No third-party logos without a real relationship. Metrics must be labeled illustrative unless sourced (PART F §3).

---

## IT Lab

### Entry I1 — Home + Services listing + mega-menus
1. **Reference website URL:** `https://it-lab.webflow.io/` and `https://it-lab.webflow.io/services`
2. **Exact page/section:** Global nav with Services mega-menu and About mega-menu; numbered 1–6 service module list; "Elevate IT Performance" dual-CTA band.
3. **Observed layout:** Top nav Home/About/Services/Case Studies/Blog/Contact; Services mega-menu (6 services + All Services); About mega-menu (About Company, Leadership, Pricing, Locations); numbered service list with action links; closing dual-CTA band.
4. **Interaction behaviour:** Mega-menu reveal (hover desktop / accordion-tap mobile — confirm via live snapshot); numbered list scroll-reveal.
5. **Animation behaviour:** Not captured — confirm via live browser snapshot.
6. **Content structure:** numbered modules with action text-links.
7. **Relevant implementation opportunities:** Dual mega-menu nav; closing dual-CTA band on every page.
8. **Paragonel adaptation:** Port the dual mega-menu (Services + About) with Paragonel's service taxonomy and About pages that actually exist and are approved. Add the closing CTA band (Paragonel-branded) on every page.
9. **Technical considerations:** Hover-reveal desktop with focus support; accordion/scroll mobile; accessible; does not sacrifice mobile usability (PART F §4).
10. **Assets or licensing considerations:** IT Lab is a commercial Webflow template by 21Lab. Do not copy template files, the 21Lab/Webflow credits, or placeholder content.

### Entry I2 — Individual service page skeleton
1. **Reference website URL:** `https://it-lab.webflow.io/managed-it-services` (and the 5 sibling service pages: it-consulting-and-support, software-development, data-protection-services, infrastructure-deploy, ai-integration)
2. **Exact page/section:** Sticky in-page anchor sub-nav; hero/problem statement; hero stats; "Services we provided" deliverables grid; Insights; Approach (3-step process); Benefits; Testimonial; FAQs ("Knowledge Hub"); closing CTA.
3. **Observed layout:** Identical 10-part skeleton across all 6 service pages, with service-specific copy and 3-step process naming.
4. **Interaction behaviour:** Sticky anchor sub-nav with scroll-spy; FAQ accordion.
5. **Animation behaviour:** Not captured — confirm via live snapshot.
6. **Content structure:** definition → proof stats → 6 deliverables → 3 insights → 3-step methodology with outcomes → 4 benefits → 1 testimonial → FAQ → dual CTA.
7. **Relevant implementation opportunities:** The service-page skeleton is the single most reusable artifact — build one Paragonel service-page template, instantiate per vertical.
8. **Paragonel adaptation:** Adopt the skeleton for each Paragonel service vertical. Coin Paragonel's own verb-led 3-step process per service. Replace the placeholder testimonial (Martin Nguyen/linethemes) with a real Paragonel client quote or omit.
9. **Technical considerations:** Sticky sub-nav with scroll-spy; anchor IDs; responsive; accessible.
10. **Assets or licensing considerations:** The skeleton is a generic information architecture — safe to recreate. Do not copy the "Elevate IT Performance"/"Knowledge Hub" labels verbatim, placeholder testimonials, or template credits.

### Entry I3 — About page
1. **Reference website URL:** `https://it-lab.webflow.io/about`
2. **Exact page/section:** Stat highlights; four-point framework; "Key Milestones" timeline; mission/vision/purpose; four core values; CTAs.
3. **Observed layout:** stat strip → framework → milestones timeline (1988→present) → mission/vision/purpose → core values → CTAs.
4–10. **Research instruction:** Adapt the structure to Paragonel's About page (Phase 7) with Paragonel's real history (founded 2024), real stats (sourced only), real milestones, and real core values. Do not copy IT Lab's 1988 origin or the linethemes placeholder testimonial.

---

## AcquisitionOS

### Entry Acq1 — Marketing site
1. **Reference website URL:** `https://acquisitionos.net`
2. **Exact page/section:** Hero; 3-step daily rhythm (Capture → Move → Follow through); pipeline/follow-up/customer-profile/messaging features; pilot access CTA; "registration paused".
3. **Observed layout:** Simple non-AI CRM for home-service contractors; sample data (kitchen remodel, etc.); pre-launch.
4. **Interaction behaviour:** Pilot access / Sign in CTAs.
5. **Animation behaviour:** Minimal (marketing site).
6. **Content structure:** marketing copy + sample dashboard preview.
7. **Relevant implementation opportunities:** Reconcile this product story with the beta 12-stage AI story before any external claim.
8. **Paragonel adaptation:** The Paragonel AcquisitionOS page (`/our-product/acquisitionos`) should present ONE reconciled product identity. Until reconciled, keep the honesty-badge + "private beta" framing already on `develop`.
9. **Technical considerations:** All Paragonel AcquisitionOS CTAs redirect to `https://acquisitionos.net` (do not build a fake internal duplicate — PART H).
10. **Assets or licensing considerations:** Do not duplicate the product website internally.

### Entry Acq2 — Beta/demo marketing page
1. **Reference website URL:** `https://acquisitionosbeta.vercel.app/`
2. **Exact page/section:** 9-stage core workflow; 12-stage end-to-end flow; discovery/enrichment; AI scoring; outreach channels (Email/WhatsApp/LinkedIn/Instagram); pipeline; pricing calculator + tiers (Free/Starter/Pro/Elite) with Stripe/Razorpay; automation workflow engine flowchart; 60-second walkthrough (placeholder video).
3. **Observed layout:** AI-native B2B acquisition platform; demo data labeled "DEMO — illustrative".
4. **Interaction behaviour:** Interactive demo simulates `app.acquisitionos.net/discovery` ("representative sequence, not a recorded session").
5. **Animation behaviour:** Automation workflow engine flowchart with conditional branches (diagram, not necessarily live).
6. **Content structure:** capability sections + demo previews.
7. **Relevant implementation opportunities:** The 12-stage lifecycle matches the `develop` AcquisitionOS page — align the Paragonel page's lifecycle presentation with this canonical list.
8. **Paragonel adaptation:** Keep the 12-stage lifecycle; use honesty badges for each capability; label illustrative content explicitly; do not claim GA for beta features.
9. **Technical considerations:** Static content on the Paragonel page (the real app is at app.acquisitionos.net, login-gated).
10. **Assets or licensing considerations:** Do not copy beta screenshots as if they were Paragonel's own; describe capabilities with honesty badges.

---

## Research instructions for Codex

1. Perform a **live headless-browser snapshot** (Agent Browser skill) of each reference URL — WebFetch text extraction drops JS-rendered interactions (mega-menu reveal, marquee timings, tab transitions). This is especially required for the AigentX four-tab pattern (founder-required).
2. Document for each: observed layout, interaction behaviour, animation behaviour (timings, easing, triggers), content structure, responsive behaviour.
3. Separate observed behaviour from implementation recommendations.
4. Recreate the patterns in Paragonel's existing Next.js + Tailwind + Framer Motion architecture and navy/blue brand.
5. Never copy protected source code, proprietary assets, logos, or copyrighted imagery. Use original implementation and properly licensed assets only.
6. Respect PART F §3: if metrics are illustrative, label them clearly as illustrative. Do not use fabricated operational statistics.
