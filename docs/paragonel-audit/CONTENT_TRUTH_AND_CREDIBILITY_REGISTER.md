# Content Truth & Credibility Register

**Baseline:** `develop` @ `405b75a` · **Audit date:** 2026-11-20
Purpose: separate verified company facts from unverified claims, fabricated content, and items that must NOT be published. This is the single most important document for protecting Paragonel's credibility. **Nothing in the "must not be published" column may appear on the site until independently verified and founder-approved.**

Sources used: the `develop` codebase, the live deployment `paragonel.vercel.app`, the AcquisitionOS public properties, the repo's existing docs, and the founder's PART D–I requirements. The founder-supplied workbook of prospect/lead/client information referenced in PART I was **not found** in the repo or workspace (`upload/` contains only this Phase 0 instructions file) — recorded as a blocker.

---

## 1. Verified company facts

| Fact | Source | Confidence | Notes |
|---|---|---|---|
| Company name: Paragonel Technologies Pvt. Ltd. | Founder (PART D), repo | High | — |
| Brand: Paragonel | Founder, repo | High | — |
| Tagline direction: "Shaping the Future." (current) / "We Engineer Digital Products That Move Businesses Forward." (approved new hero direction) | repo + PART D §3 | High | Approved new hero headline is in PART D §3 |
| Founder & CEO: Prabhat Kumar | repo `about-section.tsx:70-72`, `page.tsx:172-174`; founder | High | Only approved team member |
| Founder background: BE Computer Science; specialist Java backend developer; Spring Boot + AWS/GCP; prior role at Netcore Cloud building high-concurrency backend systems handling millions of real-time events | `about-section.tsx:73-91` | Medium-High | Stated in repo; founder should confirm exact wording before expanding |
| "Precision Engineering" philosophy derived from that background | `about-section.tsx` | Medium | Founder framing |
| Founded: 2024 | `stats-bar.tsx:7`, journey timeline | Medium | Repo asserts; founder to confirm exact date |
| Products: AcquisitionOS (private beta), SystemFoundry (internal tool), CodeGuard AI (published on VS Code Marketplace) | `src/lib/data.ts:53-87`, `our-product/page.tsx` | High | CodeGuard AI on VS Code Marketplace is verifiable; SystemFoundry link `systemfoundry.vercel.app`; AcquisitionOS at acquisitionos.net |
| AcquisitionOS is in **private beta** | `acquisitionos/page.tsx:112-114,122,392-395`; acquisitionos.net ("registration currently paused") | High | Consistent across both |
| AcquisitionOS official site: https://acquisitionos.net | repo, founder | High | All AcquisitionOS CTAs redirect here |
| Verified client engagement: Maa Arogyam (maarogyam.com) — real client engagement | Founder (PART I) | High | Founder states real client engagement. **Do not add Maa Arogyam's website link publicly merely because it is used for research** (PART I). |
| Verified partnership: Primoreon (primoreon.com) — founder built the Primoreon website; partnership exists | Founder (PART I) | High | Founder states partnership exists |
| Office: HSR Layout, Bangalore 560102, India | `footer.tsx:43-59` | Medium | Repo asserts; founder to confirm |
| Contact email: contact@paragonel.com; phone +91 9663076023 | `footer.tsx` | Medium | Repo asserts; founder to confirm |
| Founder LinkedIn: `/in/prabhat-kumar-6963661a4/` | `about-section.tsx:99`, footer | Medium | Repo asserts |
| Founder personal site: https://www.prabhat.online/ ("Engineering Hub") | `about-section.tsx:99` | Medium | Repo asserts |
| AcquisitionOS 12-stage lifecycle: Discover → Research → Find Gaps → Opportunity Report → Score → Personalize → Outreach → Reply → Meeting → Pipeline → Proposal → Close | `acquisitionos/page.tsx:25-74`; acquisitionosbeta | High | Matches beta site's end-to-end flow |
| AcquisitionOS integration honesty badges: AVAILABLE / DECLARED / IN DEVELOPMENT / BUILDING / COMING SOON / PLANNED / IN MAP | `acquisitionos/page.tsx:76-92` | High | Good practice — preserves truth |
| AcquisitionOS does NOT hold SOC 2 / ISO 27001 / GDPR certification | `acquisitionos/page.tsx:329-332` (explicit disclaimer) | High | Correctly disclaimed |
| Tech stack in repo: Next.js, React, TypeScript, Firebase (Firestore/Storage), Genkit/Gemini, Nodemailer, bcryptjs, jose, Tailwind, Framer Motion, Recharts, Radix/shadcn | `package.json` | High | Actively used |
| Brand palette: navy/blue (dark navy `#0f172a`-ish background, blue primary, indigo accent) | `globals.css`, `tailwind.config.ts`, manifest | High | — |

## 2. Verified founder facts

| Fact | Source | Confidence |
|---|---|---|
| Prabhat Kumar — Founder & CEO | repo, founder | High |
| BE Computer Science | `about-section.tsx` | Medium-High (founder confirm) |
| Specialist Java backend developer; Spring Boot; AWS/GCP | `about-section.tsx` | Medium-High |
| Prior role: Netcore Cloud, high-concurrency real-time event backend systems | `about-section.tsx` | Medium-High |
| Builds/leads product portfolio: AcquisitionOS, SystemFoundry, CodeGuard AI | repo | High |
| LinkedIn `/in/prabhat-kumar-6963661a4/`; personal site prabhat.online | repo | Medium |

**Do not invent:** degrees beyond BE CS, job history beyond Netcore Cloud, awards, investments, press, certifications, or achievements not stated by the founder. No fabricated biography dimensions.

## 3. Verified clients

| Client | Relationship | Source | Publish? |
|---|---|---|---|
| Maa Arogyam (maarogyam.com) | Real client engagement | Founder (PART I) | ✅ may be listed as a client **without** a public website link (PART I: do not add the link publicly merely because it is used for research) |
| Primoreon (primoreon.com) | Partnership; founder built the Primoreon website | Founder (PART I) | ✅ may be listed as a partner |

**No other clients are verified.** The repo's `basePortfolio` lists AcquisitionOS, SystemFoundry, CodeGuard AI — these are Paragonel's own products, not client engagements.

## 4. Verified partnerships

| Partner | Relationship | Source | Publish? |
|---|---|---|---|
| Primoreon | Partnership; founder built their site | Founder (PART I) | ✅ |

No other partnerships are verified. **No prospect/lead company may be listed as a partner.**

## 5. Approved testimonials

| Testimonial | Attribution | Source | Publish? |
|---|---|---|---|
| None | — | — | 🔴 None approved |

🔴 **No testimonials are approved for publication.** The repo's static testimonials (and the live site's 4 testimonials — Dr. Anita Desai / Maa-Aarogyam, Rajesh Kumar / TechIndia Corp, Amit Sharma / StartScale AI, Dhiraj Singh / Maa Arogyam) are **NOT approved**. They must not be published until the founder supplies verifiable attribution and explicit approval. The founder-supplied workbook referenced in PART I was not found — blocker. The associated company mailbox for genuine feedback was not accessed (no authorized access in this audit).

**Rules (PART I):** Do not invent testimonial text. Do not convert ordinary lead conversations, sales requests, partnership interest, or prospect feedback into client testimonials. Only publish testimonials with verifiable attribution and approval.

## 6. Unverified claims (must be removed or verified before publishing)

| Claim | Location | Issue |
|---|---|---|
| 4-person team on live `/team` (Prabhat Sharma, Vivek Sharma, Ajay Pal, Dr. Lena Petrova) | live `paragonel.vercel.app/team` | 🔴 Not on `develop` (develop shows only Prabhat Kumar). The live 4-person team has no verifiable external links. "Dr. Lena Petrova" especially reads as constructed. Must NOT be republished. |
| Live testimonials (Anita Desai, Rajesh Kumar, Amit Sharma, Dhiraj Singh) | live `/testimonials`, repo static data | 🔴 No verifiable attribution; "Maa Arogyam" appears twice under two people with inconsistent spelling; TechIndia Corp / StartScale AI are generic and uncorroborated. |
| SystemFoundry "reduce configuration errors by 75%" and "optimize initial costs by 20%" | live `/portfolio` | 🔴 Unsourced quantified claims, no methodology. Must not be published without source. |
| AcquisitionOS "AI-assisted signals (reply potential, deal conversion, urgency, revenue potential)" | acquisitionosbeta | ⚠️ Presented as MVP features with no methodology/evidence they compute reliably. If illustrative, label clearly as illustrative (PART F §3). |
| AcquisitionOS "Automation Workflow Engine" | acquisitionosbeta | ⚠️ Shown as an interactive flowchart ("representative sequence, not a recorded session") — not proof the engine runs end-to-end. Label as planned/illustrative unless verified. |
| Stats "Products Shipped 3", "Technologies 10+", "Founded 2024" | `stats-bar.tsx:5-9` | ⚠️ Asserted, not sourced. Founder to confirm. "3+ Years Experience" on live site conflicts with "Founded 2024". |
| "4+ Products Built", "3+ Years Experience", "10+ Technologies", "India-Based Global Delivery" | live home stats strip | ⚠️ Same sourcing concern. |
| Beta walkthrough video placeholder | acquisitionosbeta ("Drop the final film… to ship") | 🔴 Placeholder asset shipped — must not be promoted as a feature. |

## 7. Technology classifications (PART M)

The founder supplied a broad technology catalogue. Per PART M, technologies must be classified and must NOT all be claimed as production-proven. Proposed classification (to be founder-confirmed):

| Tier | Meaning | Examples |
|---|---|---|
| **Actively used** (in this repo) | Production dependencies of the Paragonel site/app | Next.js, React, TypeScript, Firebase (Firestore/Storage/Admin), Genkit/Gemini, Nodemailer, bcryptjs, jose, Tailwind, Framer Motion, Recharts, Radix/shadcn, zod, react-hook-form |
| **Demonstrated in existing projects** | Used in Paragonel's own products (AcquisitionOS/SystemFoundry/CodeGuard) per repo claims | Spring Boot, Java, Python, PostgreSQL, AWS, Docker (per portfolio stack lists) |
| **Engineering familiarity** | Founder/team background | Spring Boot, AWS, GCP, high-concurrency real-time event systems (from founder narrative) |
| **Potentially supported** | Founder catalogue, not yet demonstrated in shipped Paragonel work | Azure, Terraform, ArgoCD, Kubernetes, PyTorch, LangGraph, vLLM, pgvector, Temporal, Kafka, Redis, etcd, gRPC, CRDTs, Cloudflare, Varnish, DDD, GraphQL, MySQL, Vitess, MongoDB, Kafka Streams, Flink, Schema Registry, Spark, dbt, Airflow, Delta Lake, ARKit, ARCore, WebXR, Three.js, Figma, Design Tokens, Storybook |
| **Future capability** | Roadmap/aspirational | As the founder defines |

**Rule (PART M):** Do not place every technology in the hero or claim Paragonel actively uses every technology in client delivery. Use a structured technology ecosystem section with these tiers.

## 8. Product availability

| Product | Availability | Source |
|---|---|---|
| AcquisitionOS | **Private beta** (registration paused on acquisitionos.net; pilot access only) | repo + acquisitionos.net |
| SystemFoundry | Internal tool (link systemfoundry.vercel.app) | repo |
| CodeGuard AI | Published (VS Code Marketplace) | repo |

🔴 **AcquisitionOS product identity split (highest credibility risk):** `acquisitionos.net` presents a **simple non-AI 3-step CRM for home-service contractors**, while `acquisitionosbeta.vercel.app` + the `develop` AcquisitionOS page present an **AI-native 12-stage B2B acquisition platform** with LLMs, scoring, multi-channel outreach, and Stripe/Razorpay tiers. These are materially different product stories on two domains. Must be reconciled before any external claim. The `develop` page's honesty-badge + "private beta" + explicit certification disclaimers is the more defensible posture.

## 9. Future vision (10–15 year)

Present as **vision, not current operational capability** (PART D §1). Distinguish clearly:
1. Proven client delivery (Maa Arogyam, Primoreon).
2. Current engineering capabilities (actively-used stack).
3. Technology familiarity (founder background + catalogue).
4. Products under active development (AcquisitionOS private beta, SystemFoundry internal, CodeGuard published).
5. Future roadmap and long-term vision (AcquisitionOS roadmap sections; founder's 10–15 year ambition).

## 10. Claims that must NOT be published

- Any team member other than Prabhat Kumar (until independently verified and authorized).
- Any testimonial without verifiable attribution and founder approval.
- Any client/partner beyond Maa Arogyam and Primoreon (until verified; never prospect/lead companies).
- Any quantified metric (percentages, counts, savings, uptime, revenue) without a source and methodology. If illustrative, label clearly as illustrative.
- Any certification (SOC 2, ISO 27001, GDPR, etc.) Paragonel does not hold. (AcquisitionOS page already correctly disclaims these.)
- Any claim that AcquisitionOS features are live/GA when they are planned/beta. Use honesty badges and "private beta" framing.
- Any claim that contact enquiry data is "never stored" if Firestore/mailbox/logs retain it. State retention truthfully.
- Any logo (partner, integration, technology) without a real relationship and brand-guideline compliance.
- Any "QuantumInsights"/"QuantumFusion Solutions"/personal social handles — legacy brand artifacts (live site still shows these; `develop` has moved past them).

## 11. Blockers (information needed from the founder)

1. **Founder workbook** of prospect/lead/client information (PART I) — not found in repo/workspace. Needed to verify clients/testimonials.
2. **Authorized access to the company mailbox** for genuine feedback (PART I) — not available in this audit.
3. **Additional company logos/names** the founder previously supplied in conversation (PART I) — inspect available project assets; only Maa Arogyam + Primoreon are confirmed in this audit.
4. **Confirmation of which team members beyond Prabhat Kumar are authorized.**
5. **AcquisitionOS product identity reconciliation** — which story is the truth (acquisitionos.net simple CRM vs. beta 12-stage AI platform)?
6. **Contact-data retention decision** — store in Firestore CRM (current) or deliver to company inbox only (founder PART J preference)?
7. **Source/methodology for any quantified metric** the founder wants to publish.
8. **Real company Gmail address** for `COMPANY_INBOX` (to be configured later).

No implementation phase should begin until items 4, 5, and 6 are confirmed.
