# Reference Research

**Audit date:** 2026-11-20 · Method: WebFetch (page→markdown) on each URL.
Framer/Webflow pages are JS-rendered; WebFetch exposes rendered text but not live animation timings. Motion observations are inferred from section structure, repeated chart labels, and template conventions where the fetch did not return explicit animation metadata — and are marked as such. **A live headless-browser pass (Agent Browser) is recommended before finalizing motion specs**, especially for the AigentX four-tab pattern the founder specifically requires.

All three properties are commercial templates or proprietary sites. Paragonel may recreate **patterns and information architecture only** — never copy screenshots, copy strings, placeholder testimonials, vendor credits, or third-party logos without a real partnership and brand-guideline compliance.

---

## 1. Qorvia — `qorvia.framer.website`

Fetched: `/` (home), `/feature`. Both succeeded. Commercial Framer template by **Pixcut Studio LLC**.

### Observed layout & section structure (home)
1. Top nav — Feature, Pricing, Blog, About, Contact + "Start Free Trial".
2. Hero — H1 "Scale Your SaaS with Confidence and Speed"; right-side **billing-dashboard mock**: "total spent" line chart Jan–Aug, credit balance, hero number **$25,215**, recent transactions list. CTA "Start Free Trial".
3. Trust banner — "TRUSTED BY INNOVATIVE TEAMS WORLDWIDE" (named logos not returned by fetch — logo row inferred, unconfirmed).
4. **"Everything you need to grow"** — capabilities showcase: chat-interface mock + feature cards (AI Automation, Smart Analytics, API Integration, Team Collaboration, Seamless Integrations). The Seamless Integrations card contains an "Income & Expenses" bar graph Mon–Sun → $3,162.
5. "Designed for simplicity Built for scale" — no-code builders, enterprise SSO, collaboration, reporting + KPI dashboard (95% on-time deliveries, $650,000 revenue, Jan–May line graph).
6. **"Get started in minutes"** — 3-step onboarding (Create Account → Customize Workflow [with +12.8% / 3.18K hours stat card] → Launch and Scale).
7. **"Why choose Qorvia"** — 4 benefit blocks (Save Time −45% manual ops; Increase Productivity; Drive Growth [churn prediction + upsell]; Automate Workflows).
8. "Flexible plans for every stage" — monthly/yearly toggle; 3 tiers Basic $10 / Pro $25 / Enterprise $49.
9. "Trusted by Industry Leaders" — 3 testimonials (Marcus Thorne, David Chen, Elena Vance).
10. FAQ — free trials, plan changes, annual billing, security, integrations, support.
11. Footer — Features, Integrations, Privacy, Terms, Cookie Policy, Documentation, API Reference, Support + Framer/Pixcut credit.

### Interaction & animation behavior
- **Integration-logo marquee**: fetch confirmed integration *names* (Slack, Zapier, Notion) but did **not** return marquee parameters (rows, direction, speed, pause-on-hover). A horizontally scrolling logo wall is **likely present but unverified** — confirm visually.
- **Pricing toggle**: monthly/yearly interactive toggle with price recompute.
- **Chat mock animation**: "Enter your prompt" → "Processed" labels imply an on-card animated state loop.
- **Dashboard visuals**: every feature section pairs copy with a fabricated SaaS UI mock (line chart, bar graph, KPI tile, transaction list). Decorative, not real data.
- **Section choreography**: alternating left/right text-vs-visual per feature; standard Framer scroll-reveal (inferred).

### Paragonel adaptation opportunities (navy/blue brand)
- **Hero + dashboard-mock pattern**: navy background, blue accent, a fabricated "platform" dashboard tile showing a *Paragonel* metric. Use Paragonel's own (real) numbers, never Qorvia's $25,215.
- **"Everything you need to grow" capabilities grid** (4–5 cards each with a mini UI mock) → Paragonel service pillars.
- **3-step "Get started in minutes"** numbered onboarding strip with a per-step stat card → Paragonel engagement process.
- **4-point "Why choose"** benefit grid with quantified outcomes → Paragonel trust section (only sourced metrics).
- **Monthly/yearly pricing toggle** → only if Paragonel tiers engagements.
- **Integration marquee** (if confirmed) → recreate with Paragonel's **verified** partner logos.

### Assets / licensing
Qorvia is a commercial Framer template (Pixcut Studio LLC). All dashboard mocks, chart labels, copy, and layout are proprietary. Recreate **patterns** only. Named integration brands (Slack/Zapier/Notion) are third-party trademarks — display only with a real relationship, following each brand's logo guidelines.

---

## 2. AigentX — `aigentx.framer.website`

Fetched: `/integrations`, `/recipes`. Both succeeded.

### Integrations page
- Header premise: "Search, filter, and connect in minutes."
- **Category chips/filters**: Communication, Productivity, CRM & Sales, Dev & Ops, Finance & Commerce, Marketing, Data & AI + "All" default.
- **Integration card grid** — each card: app name, category, short description, trigger/action counts (e.g. Slack: "5 triggers, 6 actions").
- **"Load more"** pagination.
- **Connection-model explainer** — 3-step: "Pick an app → Sign in once → Start automating." Notes scoped access.
- **Technical flow strip**: "Trigger fires → Match connector → Auth verified → Data synced."
- Integrations usable immediately in "Agents" or "Recipes"; "request a new integration" path.

### Recipes page
- Library of ready-made **recipes** grouped by department.
- Each **recipe card**: title, brief description, integrated tools (e.g. "Salesforce, Slack"), step count, department tag.
- Examples: Sales — "New Salesforce lead, straight to Slack" (3 steps); Engineering — "GitHub PR to Slack and Linear" (4 steps). ~15 recipes.

### ⚠️ Four-use-case tabbed experience (Sales/Support/Marketing/Engineering)
**Factual negative:** the fetch did **not** return a "Same engine, four very different jobs" section, nor Sales/Support/Marketing/Engineering tabs, animated diagrams, transitions, text changes, or outcome metrics. The recipes page presents as a **flat card list by department**, not an interactive four-tabbed experience. The page is JS-rendered, so a tabbed section may exist in the live DOM but was not captured by markdown extraction. **Confirm via a live browser snapshot before assuming the pattern is absent.**

### Paragonel adaptation opportunities
- **Integration directory pattern** (category chips + searchable card grid + standardized card fields + Load more + Request-an-integration CTA) → rebuild with Paragonel's own connector list and navy/blue styling.
- **Connection-model explainer** (Pick → Sign in → Automate; Trigger→Match→Auth→Sync) → trust strip.
- **Recipes library** as department-tagged cards → Paragonel use-cases.
- **Four-use-case tabbed experience** (founder-required): since AigentX's live tabbed UI was not captured, treat the requirement as "recreate the pattern." Recommended Paragonel implementation:
  - Horizontal tab bar (Sales / Support / Marketing / Engineering), navy active state, blue underline accent.
  - On tab change: animate a central **workflow node-graph** (source → agent → destination) where nodes re-label and connectors re-draw; supporting text + outcome metrics cross-fade beneath.
  - Each tab: persona headline, 3–4 node workflow, 2–3 outcome metrics (e.g. "−40% first-response time" for Support), relevant integration set.
  - Responsive: tabs collapse to a horizontal scroll row or `<select>` under ~640px; diagram stacks vertically.
  - Confirm via live browser snapshot of AigentX/recipes, then calibrate — but do not block design on it.

### Assets / licensing
AigentX integration logos are third-party trademarks. Display only for integrations Paragonel actually supports, following vendor guidelines. Recreate the **pattern**, not the copy. AigentX appears to be a Framer site — do not clone layout verbatim.

---

## 3. IT Lab — `it-lab.webflow.io`

Fetched: `/`, `/services`, `/managed-it-services`, `/it-consulting-and-support`, `/software-development`, `/data-protection-services`, `/infrastructure-deploy`, `/ai-integration`, `/about`. All succeeded. Commercial Webflow template by **21Lab**.

### Global navigation (every page)
- Top-level: Home, About, Services, Case Studies, Blog, Contact.
- **Services mega-menu** (confirmed via nested link structure): Managed IT, IT Consulting & Support, Software Development, Data Protection, Infrastructure Deploy, AI Integration + "All Services".
- **About mega-menu** (confirmed): About Company, Leadership Team, Pricing and Plans, Locations.
- **"Now Hiring" recruitment banner** above nav on every page.

### Home
Hero "IT Solutions Built For Your Business" + numbered 1–6 service module list (each: heading + one-line description + unique action link, e.g. Managed IT → "Stay up and running") + "Elevate IT Performance" dual-CTA block (Start Your Project / Get a Free Consultation) + footer.

### Individual service pages — identical skeleton (all 6 fetched)
1. **Sticky in-page anchor sub-nav**: Overview / Services we provided / Insights / Approach / Benefits / Testimonial / FAQs.
2. **Hero / problem statement** — verb-led tagline + service definition.
3. **Hero stats** — 2–3 trust metrics (e.g. Managed IT: 99% Uptime SLA, 3× faster resolution, 80+ enterprise clients; AI Integration: 40% faster workflows).
4. **"Services we provided" deliverables grid** — 6 sub-service cards.
5. **Insights** — 3 related blog posts.
6. **Approach (process)** — 3-step numbered methodology, service-specific (Managed IT: Stabilize→Optimize&Secure→Operationalize; Software Dev: Envision→Transform→Evolve; Data Protection: Assess→Protect→Monitor; Infrastructure: Plan→Deploy→Optimize; AI Integration: Stabilize→Optimize→Operationalize), each step with a measurable outcome.
7. **Benefits** — 4 cards.
8. **Testimonial** — single quote (template placeholder: Martin Nguyen, CEO/Founder of linethemes — **must be replaced** with a real Paragonel client).
9. **FAQs ("Knowledge Hub")** — 3–5 Q&A.
10. **Closing CTA** — "Elevate IT Performance" dual buttons.

### About
Stat highlights (25+ Years, 154 Projects) → four-point framework (what we do / who we help / values / leadership) → "Key Milestones" timeline 1988→present → mission/vision/purpose → four core values (Positivity, Excellence, Commitment, Community) → CTAs (Download Brochure, Start Your Project, Get a Free Consultation).

### Footer (every page)
Contact block (Brooklyn, NY — template placeholder) + social icons (GitHub, Facebook, X, LinkedIn) + three link columns (Company / IT Services mirroring mega-menu / Support) + bottom bar "Designed and Developed by 21Lab · Powered by Webflow".

### Interaction & animation behavior
- **Mega-menu nav**: both About and Services expose multi-item dropdown panels (confirmed by nested link structure). Hover vs. click trigger not captured — typical Webflow is hover-reveal desktop, accordion-tap mobile.
- **Sticky in-page anchor sub-nav** on service pages — scroll-spy active state inferred.
- **FAQ "Knowledge Hub"** — accordion pattern.
- **Numbered service list** (1–6) — likely scroll-reveal numbered cards.
- Hover states, dropdown animations, mobile hamburger behavior, motion timings **not captured** — recommend a live browser pass.

### Paragonel adaptation opportunities (navy/blue brand)
- **Dual mega-menu nav** (Services + About) → port directly with Paragonel's service taxonomy and an About mega-menu.
- **Sticky anchor sub-nav on service pages** (Overview/Deliverables/Insights/Approach/Benefits/Testimonial/FAQs) → adopt for each Paragonel service vertical.
- **Service-page skeleton** (definition → proof stats → 6 deliverables → insights → 3-step methodology with outcomes → 4 benefits → testimonial → FAQ → dual CTA) → the single most reusable artifact; build one Paragonel service-page template, instantiate per vertical.
- **Service-specific 3-step process naming** → Paragonel coins its own verb-led 3-step per service.
- **"Elevate IT Performance" closing CTA band** with dual buttons → Paragonel-branded closing band on every page.
- **About page** stat strip → framework → milestones timeline → mission/vision/purpose → core values → reuse with Paragonel's real history and real client quote.
- **Now Hiring banner** → optional Paragonel recruiting strip.
- Navy/blue fit: IT Lab's template is light/clean; invert to navy backgrounds with blue accents on stat tiles, deliverable cards, process-step numbers.

### Assets / licensing
IT Lab is a commercial Webflow template by **21Lab**. The "Elevate IT Performance" label, "Knowledge Hub" FAQ label, placeholder testimonial (Martin Nguyen / linethemes), "Now Hiring" copy, and Style Guide/Changelog/Licenses/Instructions footer links are template artifacts. Do **not** copy template files, the 21Lab/Webflow credits, or placeholder content. The **pattern** (mega-menu, anchor sub-nav, service-page skeleton, dual CTA band, About timeline) is a generic information architecture and is safe to recreate in Paragonel's own brand and copy. Brooklyn address and the GitHub/Facebook/X/LinkedIn social set are template placeholders — use Paragonel's real address and social channels.

---

## Cross-cutting conclusions

**Strongest reusable patterns for Paragonel (navy/blue brand):**
1. IT Lab's **service-page skeleton + sticky anchor sub-nav + dual mega-menu** (information architecture).
2. Qorvia's **hero-with-dashboard-mock + capabilities grid + 3-step onboarding + pricing toggle** (product framing).
3. AigentX's **filterable integration directory + recipe-card library + connection-model explainer** (trust + ecosystem).
4. The founder-required **four-use-case tabbed experience** (Sales/Support/Marketing/Engineering) — pattern to be (re)created for Paragonel; AigentX/recipes is the intended reference but its tabbed UI was not confirmed via WebFetch, so verify visually first.

**WebFetch limitation acknowledged:** all three properties are JS-rendered. Where this report says "inferred" or "not captured," confirm with a live headless-browser snapshot before finalizing motion specs — especially the AigentX four-tab pattern and the Qorvia integration marquee.

**Licensing red line:** recreate **patterns and IA only**; never copy screenshots, copy strings, placeholder testimonials, vendor credits, or third-party logos without a real partnership and brand-guideline compliance.
