# Paragonel Technologies — Founder Requirements (source of truth)

This is the durable source of truth for Paragonel's positioning, brand, buyers,
narrative, differentiators, service taxonomy, product status, portfolio,
trust requirements, design principles, conversion goals, runtime persistence,
and git/deployment safety. It consolidates decisions from Phases 1–3 and
overrides any conflicting ad-hoc copy in components or content.

**Do not** contradict this document in public-facing copy without an explicit,
recorded decision. **Do not** invent facts, metrics, testimonials, or product
capabilities not listed here as verified.

---

## 1. Company positioning

Paragonel Technologies Pvt. Ltd. is an **AI-native product-engineering
company**. We design and engineer AI-powered systems, scalable software
products, and cloud-native platforms that solve practical business problems —
from architecture and development to automation and deployment.

The two halves of the business feed each other: we ship our own products
(AcquisitionOS, CodeGuard AI, SystemFoundry) and we deliver the cloud, DevOps,
AI, and product-engineering services that stand them up. Shipping products we
run ourselves is how we validate the engineering we deliver to clients.

**One-line:** *We engineer digital products that move businesses forward.*

## 2. Brand identity

- **Name:** Paragonel Technologies Pvt. Ltd.
- **Logos:** `public/images/logo3.png` (light theme), `public/images/logo4.png`
  (dark theme). The footer and header MUST use the correct theme-specific logo.
- **Colour system (Phase 2+):** deep navy foundation, **neutral** dark surfaces
  (not blue-tinted on every card), white/light sections, **electric blue as a
  restrained accent** (never the background of every section). Avoid excessive
  gradients, glowing icons, and giant rounded cards.
- **Legacy brand to remove on sight:** "QuantumFusion", "QuantumInsights",
  "Quantum Leap", old website links, old social links, unsupported team
  profiles. (Cookie storage keys named `quantumfusion_*` are internal
  identifiers, not public brand — left to preserve existing consent state.)
- **Tone:** precise, factual, defensible. We say "missing" instead of guessing.

## 3. Target buyers

1. Product / engineering leaders who need a partner that ships, not
   body-shops hours.
2. Founders / operators who want AI integrated into a real product workflow
   (not a chatbot bolted on).
3. Teams modernising cloud infrastructure, CI/CD, or data platforms.
4. Buyers evaluating AcquisitionOS for their client-acquisition motion.

## 4. Homepage narrative (buyer journey)

The homepage must flow as a coherent buyer journey, in this order:

1. **Hero** — who Paragonel is, what it does, why trust it (exact headline:
   *We Engineer Digital Products That Move Businesses Forward.* + the exact
   supporting message). CTAs: *Explore Our Capabilities* → `/services`,
   *Discover AcquisitionOS* → `/our-product/acquisitionos`.
2. **Positioning** — "Who we are": AI-native product-engineering company.
3. **Business problems we address** — the four recurring problems, mapped to
   the service that solves each (see `ProblemsWeSolve`).
4. **Why Paragonel** — differentiation vs generic outsourcing (we ship our own
   products; explicit about the unknown; you talk to the engineers).
5. **Services** — the four primary categories.
6. **AcquisitionOS flagship** — what it is and that it is in private beta.
7. **What we build / Our product** — verified product portfolio.
8. **Verified selected work** — factual case-study cards (no fabricated
   testimonials).
9. **Trust & evaluation evidence** — founder, tech stack, engineering process.
10. **Engagement CTA** — *Let's build something that works* → `/contact`.

Do not simply add more sections; improve clarity, hierarchy, and conversion.

## 5. Defensible differentiators (and what NOT to claim)

**Defensible:**
- We ship and operate our own products — the engineering we deliver is the
  engineering we depend on.
- AI-native by construction (retrieval, evaluation, LLM ops), not AI-bolted-on.
- Explicit about the unknown — missing stays missing; AI output is
  human-confirmed signals, not unsupervised decisions.
- You talk to the engineers who build the work.

**Do NOT claim:** better than every competitor; guaranteed business growth;
unverified enterprise-grade reliability; unverified customer results; invented
testimonials; invented revenue, team size, awards, or partnerships.

## 6. Service positioning (the four primary categories)

Single taxonomy, single source of truth (`src/lib/services-content.ts`):

1. **AI Solutions** — AI Agents, Internal AI Copilots, Knowledge Assistants,
   Customer Support Automation, Document Intelligence.
2. **Custom Software Development** — SaaS Platforms, Enterprise Applications,
   Internal Business Systems, Workflow Automation, Customer Portals.
3. **Cloud & DevOps** — Cloud Migration, CI/CD Automation, Infrastructure
   Management, Monitoring & Observability, Scalability Engineering.
4. **Data & Analytics** — Dashboards, Business Intelligence, Data Pipelines,
   Reporting Systems, KPI Monitoring.

Old slugs (`saas-platforms`, `cloud-infrastructure`, `devops-automation`,
`custom-platform`, `mobile-apps`) redirect to the canonical routes. Each
detail page has a **distinct** architecture/data-flow diagram (not four copies
with different labels).

## 7. AcquisitionOS — status and claims

- **Status:** PRIVATE BETA. Label honestly as private beta; do not claim
  general availability.
- **Beta URL:** `https://acquisitionosbeta.vercel.app/` — the ONLY approved
  link. **Never** use `acquisitionos.net` or any unconfirmed domain.
- **Workflow (12 stages):** Discover → Research → Find Gaps → Opportunity
  Report → Score → Personalize → Outreach → Reply → Meeting → Pipeline →
  Proposal → Close. Kept as an interactive product explanation, **secondary**
  to the value proposition (what it does / which problem it solves).
- **Value framing:** lead with the 10 capability areas (prospect discovery,
  company research, opportunity identification, lead qualification & scoring,
  personalized outreach, follow-up management, conversation & reply workflows,
  meeting & pipeline management, proposal generation, deal progression).
- **Honest status labels:** distinguish working / partial / roadmap. Do not
  label an integration (ChatGPT, HubSpot, Slack, PWA, etc.) live unless
  verified. Describe unverified integrations as architectural examples /
  possible patterns.

## 8. Verified portfolio and case studies

| Project | Type | Status | Evidence |
|---|---|---|---|
| AcquisitionOS | Flagship product | Private Beta | Built and operated by Paragonel; beta URL live. |
| CodeGuard AI | VS Code extension | Published | Listed on the VS Code Marketplace. |
| SystemFoundry | Internal tool | Internal | Used internally for cloud-engineering scenarios. Honestly labelled internal, not commercial. |
| Maa Arogyam | Client engagement | Delivered | Website build. Listed factually — no outcome metric, quote, or endorsement. |

**Excluded / unresolved:**
- **Primoreon** — explicitly excluded.
- **DietMended** — NOT listed. No logo or verified reference exists in the
  workspace. Do not add until the founder supplies the logo + verification. Do
  not assume DietMended and Maa Arogyam are the same brand/project.

**Testimonials:** NO client quotes are approved for publication. Do not invent
quotes, designations, or outcomes to fill the page. Use factual case-study
cards instead.

## 9. Trust and credibility requirements

- Remove unsupported counters: "3 Products Shipped", "2024 Founded",
  "10+ Technologies", or any unverified statistic. `StatsBar` shows only
  verified facts (AcquisitionOS: Private Beta; CodeGuard AI: VS Code
  Marketplace; Based In: India; Founder: Prabhat Kumar).
- Verified contact: HSR Layout, Bangalore 560102, India;
  contact@paragonel.com; +91 9663076023. Do not invent phone numbers, emails,
  addresses, or social accounts.
- Social links: only the founder-provided accounts used as Paragonel's
  presence (LinkedIn, X/@kattyPrabhat, GitHub/Hugs-4-Bugs). Do not invent new
  ones.
- Founder: Prabhat Kumar, Founder & CEO, BE CS. Do not invent founder
  milestones, awards, or prior roles beyond what is verified (background at
  Netcore Cloud).

## 10. Design principles (Phase 2 direction, maintained in Phase 3)

- Neutral, professional surfaces; deep navy where appropriate; white/light
  sections; electric blue as a restrained accent.
- Consistent typography and spacing; restrained borders, shadows, corner
  radii (avoid repeated giant rounded cards).
- Responsive layouts (no horizontal overflow at 375 px); accessible contrast.
- Purposeful Framer Motion animations (scroll reveals, staggered entrances,
  hover states, animated diagrams). **Respect `prefers-reduced-motion`.**
- Avoid generic AI-generated SaaS patterns, excessive gradients, decorative
  sections without purpose, and unsupported visual claims.

## 11. Conversion goals

- Homepage must make a prospective high-value client understand why they
  should contact Paragonel.
- Primary CTAs route to `/services` and `/our-product/acquisitionos`.
- Engagement CTA routes to `/contact`.
- CTAs must navigate correctly; no broken links.

## 12. Runtime persistence requirements (see docs/RUNTIME.md)

- ONE authoritative `next dev` server on port 3000, supervised by
  `scripts/dev-supervisor.sh` (bounded restart + exponential backoff,
  health-check via `/api/health`, logging to `logs/`, no duplicate servers,
  no silent restart loops).
- Firebase Firestore emulator on 8080 for local data only.
- `.env.local` (gitignored) provides `ADMIN_PASSWORD_HASH` (bcrypt hash of the
  dev password, `$` escaped as `\$`).
- **Honest limitation:** no userspace supervisor survives Z.ai workspace
  container destruction. After a recycle, re-run the supervisor and re-seed.
- Production (Vercel) and local dev preview are independent environments.

## 13. Blog content requirements

- At least 7–8 substantive technical articles with real architecture,
  data-flow diagrams, tech stack, trade-offs/limitations, and conclusion.
- Articles must be manageable through the admin Blog CMS.
- Diagrams are real technical diagrams, not decorative image cards.
- Do not claim an integration is live in AcquisitionOS unless verified — label
  as an architectural example / possible pattern.

## 14. Admin CMS requirements

- Non-technical HR/admin user can manage published content without editing
  code: blog, services, selected work, jobs.
- Draft and published states; preview before publishing; public page reflects
  changes after publishing.
- Firestore is NOT publicly writable; admin API requires authentication (401
  unauthenticated).
- The Jobs/Careers workflow must not regress.

## 15. Git and deployment safety

- Repository: `Hugs-4-Bugs/Paragonel-Technologies`. Branch: `develop`.
- **Never:** reset/discard uncommitted work; force-push; touch `master`/`main`;
  overwrite unrelated changes; commit credentials/tokens/secrets.
- Commit to `develop` only after verification (tsc + `next build` strict +
  route/browser checks).
- `.env*` is gitignored; `.env.local` and `.env` are never committed.
- Production deploys via Vercel from `develop`; local dev preview is separate.
