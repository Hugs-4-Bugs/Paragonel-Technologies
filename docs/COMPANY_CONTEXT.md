# Paragonel — Company & Product Context (quick reference)

A fast-lookup identity card. The full, authoritative source of truth is
[`FOUNDER_REQUIREMENTS.md`](./FOUNDER_REQUIREMENTS.md); this file summarizes it
for quick orientation at the start of any implementation session. Tagged with
the same legend: ✅ Verified · ⏳ Pending verification · 🔜 Future plan.

## Company

- **Legal name:** Paragonel Technologies Pvt. Ltd. ✅
- **Brand:** PARAGONEL ✅
- **Tagline:** *Shaping the Future.* ✅
- **One-line positioning:** *We engineer digital products that move businesses
  forward.* ✅
- **Identity — three responsibilities:** (1) technology engineering partner for
  businesses; (2) independent software & product company; (3) builder of
  AI-native products & intelligent business systems. ✅
- **Must NOT be represented as:** a generic web-dev agency; a student
  portfolio; a simple IT outsourcing shop; an AI wrapper company; a
  chatbot-only company. ✅

## What Paragonel engineers (5 domains) ✅

| Domain | Scope |
|---|---|
| A. Product & Experience Engineering | SaaS/product engineering; web apps; custom business software; UI/UX & product design |
| B. AI & Intelligent Automation | AI/ML solutions; AI agents; workflow orchestration; RAG & knowledge systems; BPA |
| C. Cloud & Platform Engineering | Cloud architecture & migration; DevOps; platform engineering; infra automation; reliability & observability |
| D. Data & Systems Engineering | Data engineering; analytics; database engineering; API & systems integration; data pipelines |
| E. Advanced Software Architecture | Distributed systems; microservices; scalable backends; event-driven architecture; performance engineering |

**Current service surface (live):** four primary categories — AI Solutions,
Custom Software Development, Cloud & DevOps, Data & Analytics. ✅
**Planned catalogue (🔜 future):** ~13 individual offerings across the 5
domains — separate authorized implementation prompt.

## Flagship product — AcquisitionOS

- **Status:** PRIVATE BETA ✅. Present as a real product, not just a service.
- **Beta URL (only approved link):** https://acquisitionosbeta.vercel.app/ ✅
- **Never use:** `acquisitionos.net`. ✅
- **Lifecycle (12 stages):** Discover → Research → Find Gaps → Opportunity
  Report → Score → Personalize → Outreach → Reply → Meeting → Pipeline →
  Proposal → Close. ✅
- **Intended users:** B2B businesses, agencies, consultants, founders, sales
  teams. ✅
- Label working / partial / roadmap honestly; never mark an integration live
  unless verified. ✅

## Verified projects ✅

| Project | Type | Status |
|---|---|---|
| AcquisitionOS | Flagship product | Private Beta |
| CodeGuard AI | VS Code extension (flags expensive AWS infra choices in Terraform) | Published (Marketplace) |
| SystemFoundry | Internal cloud-architecture/infra simulation tool | Internal (not commercial) |
| Maa Arogyam | Client engagement — website build | Delivered (no outcome metric claimed) |

- **Primoreon:** excluded from the public portfolio. ✅
- **DietMended:** ⏳ pending logo/verification — do not add or fabricate.
- **Quantum AI:** a **separate associated entity** — do not merge into
  Paragonel or remove via indiscriminate branding replacement. ✅ (Distinct
  from legacy Paragonel brand strings "QuantumFusion"/"QuantumInsights"/
  "Quantum Leap", which ARE to be removed.)

## Verified facts ✅

- **Founder:** Prabhat Kumar, Founder & CEO, BE CS (prior: Netcore Cloud).
- **Contact:** HSR Layout, Bangalore 560102, India; contact@paragonel.com;
  +91 9663076023.
- **Social:** LinkedIn; X/@kattyPrabhat; GitHub/Hugs-4-Bugs.
- **Super Admin bootstrap email (🔜 auth redesign):** contact@prabhat.online ⏳
  (distinct from the public company contact).

## Do NOT publish (unverified / forbidden)

- **Unverified figures ⏳:** 10+ core services · 16+ systems delivered · 10+
  countries served · 24/7 systems running (visual/content references only,
  not facts).
- **Never fabricate:** customer logos, testimonials, customer names, revenue,
  business outcomes, team size, international presence, certifications,
  awards, partnerships, production uptime.

## Brand & stack constraints

- **Logos:** `public/images/logo3.png` (light), `public/images/logo4.png`
  (dark) — use the correct theme-specific logo. ✅
- **Stack:** React + TypeScript + Next.js. **No Vue / `.vue` files.** ✅
- **Preserve** working routes, APIs, CMS, DB, auth, payment systems,
  integrations — do not remove working features to simplify. ✅
- **Visual references (inspiration only, do not copy):** aigentx.framer.website
  · qorvia.framer.website · quantumservice.vercel.app · framer community /
  buildinframer / landing.love. Exact visual implementation is a separate
  authorized prompt. 🔜

## Navigation direction ✅

Home → Services → Our Product → About → More.

## Runtime & deployment (summary — see `docs/RUNTIME.md`)

- **Durable public site:** Vercel production (`paragonel.vercel.app`, deploys
  from `master`) — independent of any GLM/Z.ai execution. ✅
- **Durable develop preview:** Vercel Preview (auto-deployed from `develop` on
  push; currently gated by Vercel Authentication — team-only). ✅
- **Local dev:** `scripts/dev-supervisor.sh` (next dev + Firestore emulator) —
  recoverable process supervision, **not** durable hosting. ✅

## Git

- **Repo:** `Hugs-4-Bugs/Paragonel-Technologies` · **Branch:** `develop` ✅
- **Verified baseline:** `92510d2` ✅
- Never touch `master`/`main`, never force-push, never discard uncommitted
  work, never commit `.env`/secrets. ✅
