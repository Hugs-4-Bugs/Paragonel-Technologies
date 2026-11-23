# Paragonel Technologies — Founder Requirements (source of truth)

This is the durable source of truth for Paragonel's identity, business
objectives, buyers, engineering capabilities, service taxonomy, brand, product
status, portfolio, trust requirements, design direction, conversion goals,
admin/auth roadmap, runtime persistence, and git/deployment safety.

It consolidates **Foundation Prompt 01** with the decisions recorded across
Phases 1–3, and **overrides any conflicting ad-hoc copy** in components or
content. New constraints from Foundation Prompt 01 are merged in — no previously
recorded constraint has been deleted.

**Do not** contradict this document in public-facing copy without an explicit,
recorded decision. **Do not** invent facts, metrics, testimonials, or product
capabilities not listed here as verified.

## Status legend

Every material statement below is tagged so verified facts, pending
verification, and future plans stay explicitly distinguishable:

- ✅ **Verified** — confirmed fact; safe to publish.
- ⏳ **Pending verification** — mentioned by the founder but not yet
  evidenced; do **not** publish as fact.
- 🔜 **Future plan** — intended direction for a separate, authorized
  implementation prompt; do not represent as current capability.

---

## 1. Company identity & positioning

- **Legal name:** Paragonel Technologies Pvt. Ltd. ✅
- **Brand:** PARAGONEL ✅
- **Tagline:** *Shaping the Future.* ✅
- **Identity (three responsibilities):** Paragonel is a technology engineering
  **and** product company whose identity combines three responsibilities ✅:
  1. **Technology engineering partner** for businesses.
  2. **Independent software and product company**.
  3. **Builder of AI-native products and intelligent business systems**.
- **What Paragonel is NOT** ✅ — it must not be represented as:
  - A generic website-development agency.
  - A student portfolio.
  - A simple IT outsourcing company.
  - An AI wrapper company.
  - A company that only builds chatbots.
- **Positioning:** Paragonel is an **AI-native product-engineering company**.
  We design and engineer AI-powered systems, scalable software products, and
  cloud-native platforms that solve practical business problems — from
  architecture and development to automation and deployment. The two halves of
  the business feed each other: we ship our own products (AcquisitionOS,
  CodeGuard AI, SystemFoundry) and deliver the cloud, DevOps, AI, and
  product-engineering services that stand them up. Shipping products we run
  ourselves is how we validate the engineering we deliver to clients. ✅
- **One-line:** *We engineer digital products that move businesses forward.* ✅

## 2. Business objectives & target buyers

The website must help Paragonel ✅: attract serious B2B clients; build
confidence among founders and business decision-makers; generate qualified
business enquiries; present actual engineering capabilities; demonstrate
products and real project work; establish credibility without fabricated
claims; position AcquisitionOS as the flagship product; and support future
partnerships and business opportunities.

**Primary buyer groups** ✅:
- Startup founders.
- Small and medium-sized businesses (SMBs).
- Growing companies.
- Agencies and consultants.
- Business owners seeking automation.
- Teams building SaaS and software products.
- Companies needing AI, cloud, data, and platform engineering.

Refined to the four engagement personas used in the homepage narrative ✅:
1. Product / engineering leaders who need a partner that ships, not body-shop
   hours.
2. Founders / operators who want AI integrated into a real product workflow
   (not a chatbot bolted on).
3. Teams modernising cloud infrastructure, CI/CD, or data platforms.
4. Buyers evaluating AcquisitionOS for their client-acquisition motion.

## 3. What Paragonel engineers — engineering domains (current capabilities)

Paragonel's engineering capabilities span five domains ✅. These are current
capabilities (distinct from the planned 13-offering catalogue in §5, which
expands them into individual sellable offerings).

- **A. Product & Experience Engineering** — SaaS and product engineering; web
  application development; custom business software; UI/UX and product design.
- **B. AI & Intelligent Automation** — AI and machine-learning solutions; AI
  agents; workflow orchestration; RAG and knowledge systems; business process
  automation.
- **C. Cloud & Platform Engineering** — cloud architecture; cloud migration;
  DevOps; platform engineering; infrastructure automation; reliability and
  observability.
- **D. Data & Systems Engineering** — data engineering; analytics; database
  engineering; API and systems integration; data pipelines.
- **E. Advanced Software Architecture** — distributed systems; microservices;
  scalable backend systems; event-driven architecture; performance engineering.

Do not invent demonstrated expertise. Distinguish current engineering
capabilities from planned service expansion. Do not copy another company's
service list verbatim. ✅

## 4. Service positioning — current four primary categories

Single taxonomy, single source of truth (`src/lib/services-content.ts`) ✅:

1. **AI Solutions** — AI Agents, Internal AI Copilots, Knowledge Assistants,
   Customer Support Automation, Document Intelligence.
2. **Custom Software Development** — SaaS Platforms, Enterprise Applications,
   Internal Business Systems, Workflow Automation, Customer Portals.
3. **Cloud & DevOps** — Cloud Migration, CI/CD Automation, Infrastructure
   Management, Monitoring & Observability, Scalability Engineering.
4. **Data & Analytics** — Dashboards, Business Intelligence, Data Pipelines,
   Reporting Systems, KPI Monitoring.

Old slugs (`saas-platforms`, `cloud-infrastructure`, `devops-automation`,
`custom-platform`, `mobile-apps`) redirect to the canonical routes. Each detail
page has a **distinct** architecture/data-flow diagram (not four copies with
different labels). ✅

## 5. Service catalogue expansion (🔜 future plan)

The founder wants more than the current four service cards. The intended
catalogue will contain **approximately 13 individual offerings** grouped into
the five engineering domains in §3 🔜. This is a content/business requirement
for a **separate authorized implementation prompt**, not current copy.

Expected individual offerings 🔜:

1. **Product & Experience Engineering:** SaaS & Product Engineering · Web &
   Application Development · UI/UX & Product Design.
2. **AI & Intelligent Automation:** AI/ML Solutions · AI Agents & Workflow
   Orchestration · RAG & Knowledge Systems.
3. **Cloud & Platform Engineering:** Cloud Architecture & Migration · DevOps &
   Platform Engineering · Infrastructure Automation & SRE.
4. **Data & Systems Engineering:** Data Engineering & Analytics · Database &
   Performance Engineering · API & Systems Integration.
5. **Advanced Software Architecture:** Distributed Systems & Microservices.

Do not copy another website's UI for these. Do not present them as live before
the authorized implementation. ✅ (constraint) / 🔜 (the catalogue itself)

## 6. Homepage narrative & information architecture

**Navigation direction** ✅: Home → Services → Our Product → About → More.

The homepage must flow as a coherent buyer journey, in this order ✅:

1. **Hero** — who Paragonel is, what it does, why trust it (exact headline:
   *We Engineer Digital Products That Move Businesses Forward.* + the exact
   supporting message). CTAs: *Explore Our Capabilities* → `/services`,
   *Discover AcquisitionOS* → `/our-product/acquisitionos`.
2. **Positioning** — "Who we are": AI-native product-engineering company.
3. **Business problems we address** — the four recurring problems, mapped to
   the service that solves each (see `ProblemsWeSolve`).
4. **Why Paragonel** — differentiation vs generic outsourcing (we ship our own
   products; explicit about the unknown; you talk to the engineers).
5. **Services** — the four primary categories (§4).
6. **AcquisitionOS flagship** — what it is and that it is in private beta.
7. **What we build / Our product** — verified product portfolio.
8. **Verified selected work** — factual case-study cards (no fabricated
   testimonials).
9. **Trust & evaluation evidence** — founder, tech stack, engineering process.
10. **Engagement path** — how engagement works (`HowWeEngage`: intro call with
    engineers → scope & proposal → build, ship, operate).
11. **Engagement CTA** — *Let's build something that works* → `/contact`.

The site must also communicate: company identity, business problems solved,
engineering capabilities, why Paragonel, products, selected work, service
catalogue, technical knowledge, engagement process, and contact/conversion
paths. Do not simply add more sections; improve clarity, hierarchy, and
conversion. Avoid unsupported superiority claims. ✅

## 7. Defensible differentiators (and what NOT to claim)

**Defensible** ✅:
- We ship and operate our own products — the engineering we deliver is the
  engineering we depend on.
- AI-native by construction (retrieval, evaluation, LLM ops), not
  AI-bolted-on.
- Explicit about the unknown — missing stays missing; AI output is
  human-confirmed signals, not unsupervised decisions.
- You talk to the engineers who build the work.

**Do NOT claim** ✅: better than every competitor; guaranteed business growth;
unverified enterprise-grade reliability; unverified customer results; invented
testimonials; invented revenue, team size, awards, certifications,
partnerships, production uptime, or international presence.

## 8. AcquisitionOS — flagship product

- **Status:** PRIVATE BETA ✅. Label honestly as private beta; do not claim
  general availability. Never represent planned or incomplete capabilities as
  fully operational.
- **Canonical product domain:** `https://acquisitionos.net` ✅ — the intended
  canonical AcquisitionOS product domain (Batch 4 Task 2). The current temporary
  deployment is `https://acquisitionosbeta.vercel.app` (accessible directly
  until acquisitionos.net DNS is pointed at that Vercel deployment — see
  `docs/DOMAINS.md`). CTAs + metadata reference `acquisitionos.net` (canonical);
  the raw URL is never shown as visible text — always behind a labelled link.
- **What it is:** Paragonel's flagship AI-powered Client Acquisition Operating
  System — a real product (not merely another Paragonel service) that connects
  the client-acquisition lifecycle. ✅
- **Lifecycle (12 stages):** Discover → Research → Find Gaps → Opportunity
  Report → Score → Personalize → Outreach → Reply → Meeting → Pipeline →
  Proposal → Close. Kept as an interactive product explanation, **secondary**
  to the value proposition (what it does / which problem it solves). ✅
- **Intended users:** B2B businesses, agencies, consultants, founders, sales
  teams. ✅
- **Value framing:** lead with the 10 capability areas (prospect discovery,
  company research, opportunity identification, lead qualification & scoring,
  personalized outreach, follow-up management, conversation & reply workflows,
  meeting & pipeline management, proposal generation, deal progression). ✅
- **Honest status labels:** distinguish working / partial / roadmap. Do not
  label an integration (ChatGPT, HubSpot, Slack, PWA, etc.) live unless
  verified. Describe unverified integrations as architectural examples /
  possible patterns. ✅

## 9. Verified portfolio & case studies

| Project | Type | Status | Evidence |
|---|---|---|---|
| AcquisitionOS | Flagship product | Private Beta ✅ | Built and operated by Paragonel; beta URL live. |
| CodeGuard AI | VS Code extension (identifies potentially expensive AWS infrastructure choices in Terraform) | Published ✅ | Listed on the VS Code Marketplace. |
| SystemFoundry | Internal tool (cloud architecture & infrastructure simulation) | Internal ✅ | Used internally for cloud-engineering scenarios. Honestly labelled internal, not commercial. |
| Maa Arogyam | Client engagement — website build | Delivered ✅ | Listed factually — no outcome metric, quote, or endorsement. Do **not** describe it as a health-data platform or medical-technology product. |

**Excluded / unresolved:**
- **Primoreon** ✅ — explicitly excluded from the public company portfolio.
- **DietMended** ⏳ — a requested project/reference. Its logo and public-facing
  evidence still require verification. Do **not** fabricate its identity or
  case-study outcomes. Do **not** add until the founder supplies the logo +
  verification. Do not assume DietMended and Maa Arogyam are the same
  brand/project.
- **Quantum AI** ✅ (constraint) — a **separate associated entity/product**. Do
  **not** merge it into Paragonel, and do **not** remove it through
  indiscriminate branding replacement. (This is distinct from the legacy
  *Paragonel* brand strings "QuantumFusion"/"QuantumInsights"/"Quantum Leap"
  in §11, which ARE to be removed as Paragonel's old brand.)

**Testimonials:** NO client quotes are approved for publication ✅. Do not
invent quotes, designations, or outcomes to fill the page. Use factual
case-study cards instead.

## 10. Trust & credibility requirements

- **Verified founder:** Prabhat Kumar, Founder & CEO, BE CS ✅. Background at
  Netcore Cloud is verified; do not invent founder milestones, awards, or
  prior roles beyond that.
- **Verified contact:** HSR Layout, Bangalore 560102, India;
  contact@paragonel.com; +91 9663076023 ✅. Do not invent phone numbers,
  emails, addresses, or social accounts.
- **Super Admin bootstrap email (🔜 auth redesign, §14):**
  contact@prabhat.online ⏳ — the initial Super Admin email for the future
  auth redesign; distinct from the public company contact above.
- **Social links:** only the founder-provided accounts used as Paragonel's
  presence (LinkedIn, X/@kattyPrabhat, GitHub/Hugs-4-Bugs) ✅. Do not invent
  new ones.
- **StatsBar / numbers:** remove unsupported counters ("3 Products Shipped",
  "2024 Founded", "10+ Technologies", or any unverified statistic). StatsBar
  shows only verified facts (AcquisitionOS: Private Beta; CodeGuard AI: VS
  Code Marketplace; Based In: India; Founder: Prabhat Kumar). ✅
- **Unverified figures (do NOT publish) ⏳:** the following were mentioned as
  visual/content references only — **not** verified company facts:
  *10+ core services*, *16+ systems delivered*, *10+ countries served*,
  *24/7 systems running*. Do not publish these until the founder provides
  evidence.
- **Do not fabricate** ✅: customer logos, testimonials, customer names,
  revenue, business outcomes, team size, international presence, certifications,
  awards, partnerships, production uptime. Use accurate descriptions of actual
  work.

## 11. Brand & repository constraints

- **Branding:** Paragonel. Legal name: Paragonel Technologies Pvt. Ltd.
  Tagline: *Shaping the Future.* ✅
- **Logos:** `public/images/logo3.png` (light theme), `public/images/logo4.png`
  (dark theme) ✅. Preserve their existing purpose and dimensions unless a
  specific change is required. The footer and header MUST use the correct
  theme-specific logo.
- **Colour system (Phase 2+):** deep navy foundation, **neutral** dark surfaces
  (not blue-tinted on every card), white/light sections, **electric blue as a
  restrained accent** (never the background of every section). Avoid excessive
  gradients, glowing icons, and giant rounded cards. ✅
- **Legacy brand to remove on sight:** "QuantumFusion", "QuantumInsights",
  "Quantum Leap", old website links, old social links, unsupported team
  profiles ✅. Do **not** reintroduce QuantumFusion as company branding.
  (Cookie storage keys named `quantumfusion_*` are internal identifiers, not
  public brand — left to preserve existing consent state.) Note: this is
  separate from the **Quantum AI** associated entity in §9, which is not to be
  merged or indiscriminately removed.
- **Tone:** precise, factual, defensible. We say "missing" instead of
  guessing. ✅
- **Stack:** React, TypeScript, Next.js ✅. **Do not introduce Vue or `.vue`
  files.**
- **Preserve working features** ✅: do not remove working functionality,
  routes, APIs, CMS, database, authentication, payment systems, or
  integrations unless a separately authorized implementation explicitly
  requires a secure change. Do not remove working features merely to simplify
  the website.

## 12. Design principles & visual references

**Design principles (Phase 2 direction, maintained in Phase 3)** ✅:
- Neutral, professional surfaces; deep navy where appropriate; white/light
  sections; electric blue as a restrained accent.
- Consistent typography and spacing; restrained borders, shadows, corner
  radii (avoid repeated giant rounded cards / no universal oversized rounded
  corners).
- Responsive layouts (no horizontal overflow at 375 px); accessible contrast.
- Purposeful Framer Motion animations (scroll reveals, staggered entrances,
  hover states, animated diagrams). **Respect `prefers-reduced-motion`.**
- Avoid generic AI-generated SaaS card layouts, excessive gradients,
  decorative sections without purpose, and unsupported visual claims.

**Visual reference sources (for studying design patterns — do NOT copy
branding or content)** 🔜/✅ (references; exact visual implementation is a
separate authorized prompt):

- Primary references: https://aigentx.framer.website/ ,
  https://qorvia.framer.website/ , https://quantumservice.vercel.app/ .
- Additional inspiration: https://www.framer.com/community/gallery/ ,
  https://www.buildinframer.com/ , https://www.landing.love/platform/framer/ ,
  https://www.framer.com/community/gallery/categories/saas/ ,
  https://www.buildinframer.com/best-framer-websites/agency .

The founder wants the **complete** reference sites explored — not just hero
sections: navigation, scroll behavior, animations, interactions, service
presentation, product demonstrations, blog layouts, responsive behavior.

**Observed (2026-11-21):** the founder was reviewing **Qorvia**
(qorvia.framer.website) — a light SaaS landing with a "Get started in minutes"
3-step flow (Create Your Account → Customize Your Workflow → Launch and Scale)
and a metrics dashboard. Noted as inspiration only; do not copy its content or
branding.

**UI expectations (for the separate visual-implementation prompt)** 🔜:
distinctive premium technology-company identity; modern, attractive visual
storytelling; Framer Motion across the site; GSAP + ScrollTrigger for suitable
advanced motion; scroll-triggered reveals and progressive content loading;
purposeful transitions and interactive diagrams; different visual compositions
for different content types; editorial blog design; avoidance of generic
AI-generated card layouts; no universal oversized rounded corners; real
product and project visuals wherever available.

## 13. Conversion goals

- Homepage must make a prospective high-value client understand why they should
  contact Paragonel. ✅
- Primary CTAs route to `/services` and `/our-product/acquisitionos`. ✅
- Engagement CTA routes to `/contact`. ✅
- CTAs must navigate correctly; no broken links. ✅

## 14. Blog content requirements

- At least 7–8 substantive technical articles with real architecture,
  data-flow diagrams, tech stack, trade-offs/limitations, and conclusion. ✅
- Articles must be manageable through the admin Blog CMS. ✅
- Diagrams are real technical diagrams, not decorative image cards. ✅
- Do not claim an integration is live in AcquisitionOS unless verified — label
  as an architectural example / possible pattern. ✅

## 15. Admin CMS & authentication direction

**Admin CMS (current)** ✅:
- Non-technical HR/admin user can manage published content without editing
  code: blog, services, selected work, jobs.
- Draft and published states; preview before publishing; public page reflects
  changes after publishing.
- Firestore is NOT publicly writable; admin API requires authentication (401
  unauthenticated).
- The Jobs/Careers workflow must not regress.

**Authentication redesign (🔜 future dedicated phase; current admin auth is
considered insufficiently secure and will be redesigned then):**

- **Hierarchy:** SUPER ADMIN → ADMIN → RESTRICTED STAFF / CONTENT ROLES →
  REGISTERED USERS. 🔜
- **Initial Super Admin email:** contact@prabhat.online ⏳.
- **Super Admin capabilities 🔜:** create administrators; assign and revoke
  roles; manage permissions; disable and restore admin accounts; manage users;
  review security and administrative activity; manage password and account
  recovery workflows.
- **Requirements 🔜:** SMTP-based email OTP verification for users and admins;
  admin login with password + OTP; secure Super Admin password setup, change,
  and forgotten-password recovery; secure one-time Super Admin bootstrap;
  expiring, single-use OTPs; server-side authorization; rate limiting and
  brute-force protection; secure session management; audit logging; no public
  Super Admin registration; no secrets committed to Git.

Detailed security implementation will be authorized in a separate prompt. Do
not begin it in this task.

## 16. Runtime persistence requirements (see docs/RUNTIME.md)

- **Independent durable hosting** ✅ (the primary truth): the site the founder
  can open at any time — without an active GLM/Z.ai execution — is the
  **Vercel deployment**, NOT a local `next dev` process. See `docs/RUNTIME.md`
  for the four-environment breakdown (A local dev / B workspace lifecycle /
  C Vercel Preview / D production).
- **Local dev** ✅: ONE authoritative `next dev` server on port 3000,
  supervised by `scripts/dev-supervisor.sh` (bounded restart + exponential
  backoff, health-check via `/api/health`, logging to `logs/`, no duplicate
  servers, no silent restart loops). Firebase Firestore emulator on 8080 for
  local data only. `.env.local` (gitignored) provides `ADMIN_PASSWORD_HASH`
  (bcrypt hash of the dev password, `$` escaped as `\$`).
- **Honest limitation** ✅: no userspace supervisor (`pm2`/`nohup`/the script)
  survives Z.ai workspace container destruction. After a recycle, re-run the
  supervisor and re-seed. The Z.ai workspace toolbar and preview have
  repeatedly disappeared; the development environment must be recoverable and
  the website must remain accessible independently of a temporary GLM
  execution.
- The local supervisor is for **recoverable process crashes only** — it is not
  permanent hosting.

## 17. Execution principles

- Do not repeat completed work without a specific reason. ✅
- Do not ask the founder to restate known requirements. ✅
- Do not generate unrelated tasks. ✅
- Do not silently reduce the requested scope. ✅
- Do not substitute a small cosmetic change for a larger requirement. ✅
- Do not report success without actual verification. ✅
- Preserve existing working features. ✅
- Keep the founder's requirements available across future execution sessions
  (this document is that record). ✅

## 18. Git & deployment safety

- **Repository:** `Hugs-4-Bugs/Paragonel-Technologies`. **Branch:** `develop`. ✅
- **Latest verified baseline:** `92510d2` ✅ (verified against the remote at the
  start of this task). This SHA must be verified against the current remote
  before future modifications.
- **Never:** reset/discard uncommitted work; force-push; touch `master`/`main`
  without explicit authorization; overwrite unrelated changes; commit
  `.env`, `.env.local`, SMTP passwords, OTP secrets, or access tokens. ✅
- Commit to `develop` only after verification (tsc + `next build` strict +
  route/browser checks). ✅
- `.env*` is gitignored; `.env.local` and `.env` are never committed. ✅
- Push completed authorized implementation to GitHub; verify the final remote
  SHA; verify the corresponding Vercel deployment. ✅
- **Deployment environments (correction of the earlier "production deploys
  from develop" statement)** ✅: production (`paragonel.vercel.app`) deploys
  from **`master`**; `develop` deploys to the **Vercel Preview** environment
  (currently gated by Vercel Authentication — team-only). See
  `docs/RUNTIME.md` §D/§C. Do not promote `develop` to production or touch
  `master`/`main` without explicit authorization.

---

## 19. Implementation status tracker (Prompt 05A + 05B + 05C + 05D + 05E + 05F + 05G + 05H)

This section is the live implementation status, appended **in addition to** the
existing requirements above — it does not replace or weaken any prior
requirement. Status labels:

- **DONE** — implemented and verified.
- **PARTIAL** — implemented, but remaining work or verification exists.
- **PENDING** — not implemented.
- **BLOCKED** — requires an external dependency or missing evidence.
- **FUTURE** — explicitly deferred to a later implementation batch.

| Area | Current status |
|---|---|
| Company identity and founder context | DONE — preserve existing content |
| Foundation Prompt 01 documentation | DONE — preserve |
| Runtime recovery and supervisor | DONE — preserve, subject to current environment |
| Light theme default | DONE — preserve (`defaultTheme="light"`) |
| AcquisitionOS contrast fix | DONE — preserve |
| SMTP OTP and RBAC implementation | PARTIAL — implemented locally; production SMTP verification remains dependent on credentials |
| Super Admin bootstrap | PARTIAL — implemented; production verification depends on production configuration |
| Admin portal and management UI | DONE — continue preserving |
| Authentication tests | PARTIAL — 45/45 reported passing in Prompt 04; rerun only relevant tests when changing auth |
| Homepage visual transformation (Prompt 05A) | DONE — preserve and build upon it |
| Header/footer logo size and theme consistency (Prompt 05B) | DONE — navbar restored to pre-05A dimensions (`h-20 w-[200px] md:h-24 md:w-[220px]`); footer mirrors the header's two-image swap (logo3 light / logo4 dark), no `dark:brightness-110`; verified in-browser that dark-mode header + footer both render `logo4.png` |
| Favicon / avatar mark (Prompt 05B) | DONE — founder-supplied mark installed as `src/app/icon.png` (512×512) + `src/app/favicon.ico` (multi-size) + `public/images/paragonel-mark.png` for avatar use |
| Services catalogue + detailed compositions (Prompt 05B) | DONE — 5 engineering domains + 13 offerings; editorial landing (`/services`) with a distinct composition per domain; dynamic `/services/[slug]` detail pages; CMS (`getPublicServices`) preserved; legacy 4 static service routes preserved |
| AcquisitionOS / product-page visual transformation (Prompt 05C) | DONE — `/our-product/acquisitionos` redesigned onto the 05A editorial system: positioning + the 6-problem framing, a premium interactive 12-stage `LifecycleWorkflow` (connected node track, click-to-reveal detail, conceptual-labelled), scoring sample (signals-not-predictions), honest integration directory, trust, roadmap, CTA. 12-stage terminology/order/detail preserved verbatim. Beta URL (`acquisitionosbeta.vercel.app`) behind CTAs only — verified 0 visible-text URL occurrences; 0 `.net` refs; Private Beta labelled throughout; canonical = `paragonel.vercel.app/...` |
| Runtime stability (Prompt 05C P0) | DONE — failure cause re-confirmed as workspace/container recycle (no OOM/heap/EADDRINUSE/crash signature in `logs/dev-server.log`; workspace was destroyed between batches and re-cloned to start 05C). Supervisor already meets the 10 requirements (one authoritative server, stale cleanup, bounded backoff, `wait $dev_pid` no false-crash loop, health-check, honest container-destruction caveat). Added `scripts/resume-dev.sh` (one-command recycle recovery) + RUNTIME.md 05C confirmation |
| About / company story / Selected Work / case studies (Prompt 05D) | DONE — `/about` redesigned onto the editorial system: company introduction, why Paragonel exists, 5 engineering-philosophy principles, founder (verified facts only — Prabhat Kumar, Founder & CEO, BE CS, prior: Netcore Cloud; NO fabricated quote/years/awards/journey), 5 engineering disciplines (narrative + link to /services; 13-offering catalogue framed as scope not 13 engagements), 3-step engagement process (CTA → /contact). `/portfolio` is now a real Selected Work page (was a 307→/our-product redirect) with a page h1. New single source of truth `src/lib/selected-work.ts` drives the homepage work index (`home/products.tsx`), `/portfolio`, and `/testimonials` — no duplicate arrays. Fabricated `portfolio-section.tsx` (TechCorp/EduFuture/SkillUp/Remote Team + 40% metric + placeholder case-study buttons) DELETED; `basePortfolio` wrong images + SystemFoundry external link + CodeGuard 404 marketplace URL removed. Verified: 4 projects only (AcquisitionOS=Private Beta, CodeGuard AI=Published, SystemFoundry=Internal, Maa Arogyam=Delivered); 0 fabricated names on any public route; 0 `.net`; 0 visible-text beta URL; no overflow@375; tsc 0; clean build 0 |
| Capability expansion + specialization + hero fix (Prompt 05E) | DONE — expanded `/services` from 5 domains/13 offerings → **13 capability families** with a per-domain + per-offering `status` field (Deliver Now / Specialist Support / Research & Emerging). Original 5 domains + 13 offerings preserved as a subset (backward-compatible slugs). New `docs/MARKET_OPPORTUNITY_RESEARCH.md` (35 evidence-backed problems, 10 briefs, 5 product directions, 5 rejected, scoring methodology, 120 search results across 15 queries) + `docs/CAPABILITY_STRATEGY.md` (15-20yr vision, 13-family taxonomy w/ status, industry strategy, product-company strategy, 12/36/60mo priorities, specialization: ONE primary identity "engineers AI-native systems end-to-end" + 3 pillars + adjacent + industry focus + explicit NOT-pursue list). New `/industries` route (8 industry solution patterns, conceptual-labelled, no fake case studies). New `HomePositioning` section (3 dimensions: Our Products / Engineering Solutions / Applied Research). Homepage hero fixed: 4-line headline → 2-line controlled headline, header-aware padding (clears sticky h-24), CTAs at mt-7, compact core-pillars panel replacing the 5-domain index. **Hero verified at all 5 required viewports — primary CTA visible in first viewport, 0 horizontal overflow**: 1440×900 (CTA bottom 660<900), 1366×768 (654<768), 1280×720 (644<720), 375×812 (566<812), 390×844 (548<844). Verified: tsc 0; clean build 0; all routes 200 (incl new `/industries` + 10 new offering slugs); 0 `.net`; 0 visible-text beta URL; Private Beta throughout; 0 fabricated content; no regression to About/Portfolio/AcquisitionOS/CMS/auth/jobs/blog/contact. Specialization does NOT pursue: generic horizontal SaaS (CRM/LMS/CMS), regulated critical infra without specialist, chatbot-only positioning, pure staff augmentation, RPA-as-usual |
| Editorial blog redesign (Prompt 05F) | DONE — redesigned the Blog onto the 05A–05E editorial system. `/blog`: editorial masthead (publication identity, distinct from the homepage hero), featured real published post, category nav + search that work together, latest-articles editorial list (not a card grid), read-time estimates, useful empty state with reset, graceful "Coming soon" intro when no posts (no fake articles/authors/metrics). `/blog/[slug]`: new `ArticleReader` client component — reading-progress bar (reduced-motion respected), editorial header (breadcrumb/category/title/excerpt/author/date/read-time/featured image), comfortable reading-width layout, **sticky TOC on desktop + collapsible TOC on mobile** built from the ACTUAL rendered headings (`extractHeadings`, ≥3 headings required — no empty/broken TOC), active-section highlight via IntersectionObserver, prev/next + related (computed server-side from real published posts), share via Web Share API + copy-link fallback, back-to-Insights. `Markdown` component extended: heading IDs (slugified) for TOC anchors, **GFM table support**, fenced-code-block copy button, editorial classNames (replaces font-black/zinc). Server-side data fetching preserved (getPublishedPosts/getPublishedPostBySlug/getPublishedSlugs, Admin SDK, status=='Published' && deletedAt==null — drafts never leak); prev/next/related + JSON-LD `Article` structured data computed server-side. Homepage `HomeBlog` section added (server-fetched from the SAME source as /blog, graceful empty, no second conflicting source, no hardcoded blogPosts). SEO: per-article OG/Twitter/canonical/publishedTime/authors, `/blog` OG metadata, JSON-LD Article (accurate fields only — no fabricated ratings/reviewCounts), sitemap + `/industries` + `/terms` + `/cookie-policy` added. Verified: tsc 0; clean build 0 (with Firestore emulator up — the designed build path; build-time data-fetch needs the emulator, ECONNREFUSED otherwise); all routes 200 incl `/blog`, real `/blog/[slug]` (8 seeded articles), `/blog/<invalid>` → 404; TOC + heading anchors (19) + share + prev/next + JSON-LD + read-time confirmed on a real article; 0 horizontal overflow at 1440/1366/1280/390/375 (blog + contact + terms + cookie-policy); 0 `.net`; 0 visible beta URL; Private Beta; 0 fabricated content. **Pre-existing site-wide 768px tablet overflow from the navbar mega-menu dropdown (`w-[560px]`, unchanged from 05A, affects /about+/faq+/services identically) is NOT a 05F regression — left for the pending polish task per §10 (no unrelated refactoring).** CMS unavailable-in-local-build is distinguished from app defects. Screenshots captured at all 6 viewports (non-blank); model has no image input so NOT visually inspected — verification via objective DOM checks (scrollWidth vs clientWidth, content greps, route codes) |
| Contact form consent, privacy & legal compliance (Prompt 05F additional) | DONE — mandatory consent gate on the contact form: unchecked-by-default acknowledgement ("I have read the Privacy Notice and understand Paragonel… will use the information to respond to and manage my inquiry") with Privacy Policy + Terms links (open in new tab, do not discard entered data); submit disabled until acknowledged; accessible inline validation (role="alert", aria-invalid, aria-describedby). **Server-side enforcement** via `contactSchema` zod `.refine(v => v === true)` — direct API calls cannot bypass (verified: no-consent → 400 "Required"; consent=false → 400 "Please acknowledge the Privacy Notice…"). **Separate optional marketing consent** (not a condition of submission; recorded separately; withdraw via contact email). **Consent evidence** stored on the lead document SERVER-side (not forgeable from client): `{acknowledged, marketingConsent, consentNoticeVersion, privacyPolicyVersion, termsVersion, timestampUtc}` — versions are server constants (`CONSENT_NOTICE_VERSION='2026-11-21-v1'` etc.), timestamp server-captured UTC; no raw IP/fingerprint/tracking-id stored as PII. Form data preserved on validation/network error (reset only on 201). **Cookie consent made honest**: removed the mock script simulation ("Mock Google Analytics initialized"/"Mock Facebook Pixel initialized") from `CookieConsentManager`; the site loads NO analytics/marketing/advertising/performance scripts — only strictly-necessary cookies (auth/session/theme/consent-record). CookieSettingsModal category descriptions now accurately state which categories are/are not currently used (no invented trackers). Cookie consent version (`COOKIE_CONSENT_NOTICE_VERSION='2026-11-21-v1'`) + UTC timestamp recorded in local storage. Cookie consent remains separate from contact submission (never blocks inquiry). New `/terms` (Terms & Conditions — website use, submitted inquiry info, prohibited submissions, IP, third-party links, liability without waiving statutory rights, governing law India/Bengaluru subject to legal review) + `/cookie-policy` (accurate cookie/technology disclosure, preference controls, version recording) pages; footer links to Privacy/Terms/Cookie. Privacy Policy updated: new "Consent + your choices" section (DPDP-aligned: inquiry acknowledgement vs separate marketing vs separate cookies; right to withdraw), "Your rights + grievances" section (DPDP data-principal rights + grievance redressal via contact@paragonel.com; **no fabricated DPO/office/cert** — notes the DPDP Rules 2025 phased commencement + that a designated grievance officer will be published when legally required), last-updated 2026-11-21. New `docs/LEGAL_PRIVACY_NOTES.md` records applicable laws (DPDP Act 2023 in force; DPDP Rules 2025 notified 14 Nov 2025, phased commencement; IT Act 2000 + SPDI Rules 2011 to extent relevant; GDPR/ePrivacy only if EU/EEA visitors targeted), consent purposes/wording, actual cookie behavior, server-side enforcement, tests, + outstanding legal-review dependencies. Verified: consent server-side rejection (both cases); 0 `.net`; 0 visible beta URL; routes 200; tsc 0; build 0. **NOT marked legally certified/compliant — implementation reflects actual data practices + must be reviewed by qualified legal counsel before being represented as compliant.** Remaining founder-provided/legal dependencies: formal grievance officer designation (when DPDP Rules phase requires), legal review of Terms governing-law/liability clauses, retention-period specificity |
| Final site-wide polish + dev-server auto-recovery + Vercel deployment repair (Prompt 05G) | DONE — **P0 Vercel dependency fix**: the Vercel build failed at install with `ERESOLVE` — `vite@8.3.8` peer-requires `@types/node@"^20.19.0 || >=22.12.0"` AND `vitest@5.1.1` peer-requires `@types/node@"^22.0.0 || >=24.0.0"`; the root `"@types/node": "^20"` resolved `20.17.17` (satisfies neither). The founder's suggested `^20.19.0` would satisfy vite but NOT vitest. Selected `@types/node: "^24"` — the intersection that satisfies BOTH peers (`>=24.0.0` ∩ `>=22.12.0`) + matches the local Node v24 runtime. Lockfile regenerated STRICTLY (`npm install --package-lock-only`, NO `--force`/`--legacy-peer-deps`) → resolves `@types/node@24.19.2`. Verified: `npm ci` exit 0; `npm ls` clean (only UNMET OPTIONAL deps, no ERESOLVE/invalid peers); `tsc --noEmit` 0; `next build` 0 (80/80 static pages); vitest 45/45 pass. `vercel.json` now sets `"installCommand": "npm ci"` so Vercel uses the lockfile-respecting path. `resume-dev.sh` + `dev-supervisor.sh` updated to use `npm ci` (removed `--legacy-peer-deps`). **P0 dev-server auto-recovery**: new `scripts/finalize-dev-session.sh` — mandatory post-implementation finalization (detects existing healthy server on :3000 + does NOT start a duplicate; starts `resume-dev.sh` only if unhealthy, preserving the Firestore emulator; waits for `/api/health` → 200; verifies the requested route → 200; prints clear SUCCESS/FAILURE). `docs/RUNTIME.md` updated with a permanent rule: every implementation task MUST end with a verified dev-server startup/recovery + health check; GLM must not declare complete while the local preview is unavailable (unless the workspace was destroyed — then report the limitation + the one-command recovery). **P0 navbar 768px tablet overflow FIXED** (was PENDING, now in scope): the hover-only `invisible w-[560px]` mega-menu contributed to scrollWidth even when closed + the desktop nav rendered too many items (Home+Services+OurProduct+About+More+Login+Signup+ThemeToggle) for 768px. Fix: mega-menu converted to state-driven (`useState` + `useEffect` for Escape + outside-click) — `display:none` when closed (zero scrollWidth contribution), bounded width `min(560px, calc(100vw-1.5rem))`, click/keyboard/touch open, Escape closes, `aria-expanded`/`aria-haspopup`; desktop nav breakpoint `md:` → `lg:` so tablet (768–1023) uses the mobile Sheet menu. Verified: **63/63 route×viewport checks 0 horizontal overflow** (1440/1366/1280/1024/768/390/375 × 9 routes); mega-menu opens on click (aria-expanded=true, no overflow) + Escape closes (aria-expanded=false). Verified: all public+admin routes 200; `/blog/<invalid>` → 404; AcquisitionOS 12/12 stages; Private Beta; consent server-side rejection intact; 0 `.net`; 0 visible beta URL; 0 fabricated content (TechCorp=0); tsc 0; build 0; vitest 45/45. Screenshots captured at all 7 viewports (non-blank); model has no image input so NOT visually inspected — verification via objective DOM checks. **Vercel Preview status: see deployment verification below (polled separately).** Pre-existing site-wide 768px overflow is now RESOLVED (was the navbar). |
| Product card experience redesign + application-wide Framer Motion (Prompt 05H) | DONE — inspected all product-card implementations (HomeProducts AcquisitionOS feature + OTHER_WORK cards; selected-work/portfolio cards; capabilities list). Verdict: the cards were ALREADY on the editorial system (border-top cards, status dots, strong hierarchy, no gradients/glows/excessive shadows, status accuracy — Private Beta etc., 0 `.net`, 0 visible beta URL) — NOT generic AI-template cards. The 05H value-add was therefore interaction + motion consistency, not a teardown. **Reusable motion architecture extended**: added `hoverLift` (2px upward lift), `tapPress` (small settle), + `cardRest` variants to `src/lib/motion.ts` (transform-only, no layout shift). New `src/components/motion/motion-card.tsx` — a reusable `MotionCard` wrapper (`whileHover`/`whileTap` + `useReducedMotion` renders static when reduced + optional `focusable` focus ring). Applied `MotionCard` to the OTHER_WORK product cards (`home/products.tsx`) + the portfolio/selected-work cards (`sections/selected-work-section.tsx`) for consistent hover/tap feedback + keyboard focus rings on the card links. `pt-btn` gained `:focus-visible` ring + `:active` press (a11y + interaction consistency). Existing `Reveal`/`RevealGroup`/`RevealItem` + `fadeUp`/`fadeIn`/`fadeScale`/`staggerContainer` entrance system preserved (already reduced-motion aware). Verified: tsc 0; build 0; h1=1 per page; no hydration errors; 0 overflow at 1440 + 375 on / + /portfolio + /services; no console errors. Motion is transform/opacity-only, reduced-motion respected (global CSS neutralizes transitions + MotionCard renders static), no essential info communicated via animation. No new animation framework added (Framer Motion already installed). |
| Remaining responsive / motion / accessibility polish | PENDING — the site-wide 768px tablet overflow is now RESOLVED (05G). Remaining 05H+ polish: deeper automated a11y audit (axe), Lighthouse perf profiling, page-transition motion refinement. |
| Vercel deployment recovery | UNBLOCKED (05G) — the install-phase ERESOLVE is fixed (`@types/node@^24` + `npm ci`). Final `develop` deployment status polled separately in the completion report; not promoted to production. |

### 19.1 Distinction preserved (no invented claims)

- **Verified capabilities:** the five engineering domains and the 13 offerings
  are within Paragonel's stated engineering scope; no offering is published as
  "delivered at enterprise scale."
- **Actual delivered work:** AcquisitionOS (private beta), CodeGuard AI (VS Code
  Marketplace), SystemFoundry (internal tool), Maa Arogyam (engagement) —
  referenced honestly with their real status labels.
- **Future planned offerings:** the 13-offering catalogue is the structured
  surface; individual offerings are not claimed as already-delivered engagements.
- **Unverified claims:** none introduced. No invented customers, metrics,
  testimonials, awards, certifications, uptime guarantees or performance claims.

### 19.2 Pricing / free-service stance

No free-service promise, free consultation, free development offer or zero-cost
delivery claim has been introduced. The existing founder requirements contain no
approved pricing/free-service statement; pricing claims are left unchanged and
the relevant content remains marked for clarification rather than invented.

### 19.3 Remaining implementation sequence (not dropped)

- **Prompt 05C — AcquisitionOS + product pages:** ✅ DONE (see row above). premium product storytelling,
  real product visuals, product workflows, honest private-beta status, clear
  product CTA, preserve the 12-stage lifecycle.
- **Prompt 05D — About / company story / Selected Work:** ✅ DONE (see row above). company identity,
  founder/company story, actual engineering work, verified case studies, trust
  evidence, engagement process. No fabricated testimonials or customer outcomes.
- **Prompt 05E — Capability expansion + specialization + hero fix:** ✅ DONE (see row
  above). Expanded `/services` to 13 capability families with Deliver Now /
  Specialist Support / Research & Emerging status; new `/industries` route;
  product-company positioning (3 dimensions); homepage hero fixed (CTAs above
  fold on all 5 required viewports); `MARKET_OPPORTUNITY_RESEARCH.md` +
  `CAPABILITY_STRATEGY.md` (specialization: ONE primary identity + 3 pillars +
  what NOT to pursue). Blog redesign deferred to a later prompt.
- **Prompt 05F — Editorial blog redesign + Contact consent/privacy:** ✅ DONE (see
  rows above). Blog redesigned onto the editorial system (masthead, featured real
  post, discovery, TOC, reading progress, share, prev/next, related, JSON-LD);
  Markdown extended (tables, heading IDs, code copy); homepage blog section;
  Contact consent gate (mandatory inquiry acknowledgement + separate optional
  marketing + separate cookie consent) with server-side enforcement + consent
  evidence; cookie consent made honest (no mock trackers); Privacy Policy updated
  (DPDP-aligned) + new Terms + Cookie Policy pages. NOT legally certified.
- **Prompt 05G — Final polish + dev recovery + Vercel repair:** ✅ DONE (see
  row above). Vercel install-phase ERESOLVE fixed (`@types/node@^24` satisfies
  both vite + vitest peers; lockfile strict; `npm ci` 0 + `npm ls` clean + tsc 0
  + build 0 + vitest 45/45; `vercel.json` installCommand=`npm ci`).
  `scripts/finalize-dev-session.sh` + RUNTIME.md mandatory finalization rule.
  Navbar 768px tablet overflow FIXED (state-driven mega-menu `display:none` +
  `lg:` breakpoint + Escape/keyboard/touch) — 63/63 route×viewport 0 overflow.
- **Prompt 05H — Product cards + Framer Motion:** ✅ DONE (see row above).
  Cards were already editorial (not generic AI-template); added reusable
  `hoverLift`/`tapPress`/`cardRest` variants + `MotionCard` component; applied
  to product + portfolio cards; `pt-btn` focus-visible/active; reduced-motion
  safe; no new animation framework.
- **Remaining polish (post-05H):** PENDING — deeper automated a11y audit (axe),
  Lighthouse perf profiling, page-transition motion refinement.

### 19.4 Vercel blocker (unchanged)

The Vercel Preview deployment of `develop` continues to fail after the Prompt 03
authentication implementation, despite successful local builds (`tsc` + clean
`next build` both pass). The exact Vercel build error is unknown because the
deployment logs are access-restricted (Vercel Authentication on Preview +
failed-deploy URL redirects to SSO; no `VERCEL_TOKEN` in the sandbox). This
remains a **BLOCKED** release item. No speculative dependency, bundle-size,
Firebase or Next.js change will be made without evidence from the actual log.
Local development remains usable and visible; a healthy local preview is not a
successful production deployment.

