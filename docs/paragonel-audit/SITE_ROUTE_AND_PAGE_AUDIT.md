# Site Route and Page Audit

**Baseline:** `develop` @ `405b75a` · **Audit date:** 2026-11-20
Routes verified two ways: (1) against the running `develop` app in the GLM workspace (Next.js dev on :3000, Firestore + Storage emulator, Mailpit) — "Local"; (2) against the live deployment `paragonel.vercel.app` via WebFetch — "Live". Where Live differs from Local, the live deployment is **stale** and `develop` is the source of truth.

HTTP codes: Local = curl against :3000 (200 unless noted). Live = WebFetch result.

---

## Public page routes (`src/app/**/page.tsx`)

| Route | Local | Live | Condition & notes | Evidence |
|---|---|---|---|---|
| `/` | 200 | 200 | Homepage ~16 sections. **Live** hero "Shaping the Future", shows 4 testimonials, placeholder strings "Curating content…", "Fetching latest news…", social handles mismatched. **Develop** hero "Shaping the Future · AcquisitionOS in Private Beta", only Prabhat Kumar, AI sections error without API key. | `src/app/page.tsx:44` |
| `/about` | 200 | 200 | Founder narrative (Prabhat Kumar). **Live** shows stale 4-product journey incl. "AaharAI" and "Maa-Aarogyam"; broken `[](/)` link artifact. **Develop** AboutSection substantial. | `src/app/about/page.tsx:10` |
| `/services` | 200 | 200 (thin) | **Live** = hero only, no service detail sections. **Develop** reads `services` Firestore (works locally; 🔒 G16 production read-rule gap). | `src/app/services/page.tsx:11` |
| `/services/ai-solutions` | 200 | — | AI Solutions & LLM Ops detail. | `ai-solutions/page.tsx:24` |
| `/services/cloud-infrastructure` | 200 | — | Cloud Infra & Platform Eng (folds in Distributed/Scalability/Microservices/DB/Event Streaming). | `cloud-infrastructure/page.tsx:27` |
| `/services/devops-automation` | 200 | — | DevOps & Reliability. | `devops-automation/page.tsx:28` |
| `/services/saas-platforms` | 200 | — | Custom SaaS / Product Engineering. | `saas-platforms/page.tsx:27` |
| `/services/ai-automation` | 307→`/services/ai-solutions` | — | Redirect alias. | `ai-automation/page.tsx:3` |
| `/services/custom-platform` | 307→`/services/saas-platforms` | — | Redirect alias. | `custom-platform/page.tsx:3` |
| `/services/fractional-cto` | 307→`/about` | — | Redirect alias. | `fractional-cto/page.tsx:3` |
| `/services/mobile-apps` | 307→`/services/saas-platforms` | — | Redirect alias. | `mobile-apps/page.tsx:3` |
| `/our-product` | 200 | **404** | 3 projects (AcquisitionOS, SystemFoundry, CodeGuard AI). **Live missing.** | `our-product/page.tsx:17` |
| `/our-product/acquisitionos` | 200 | **404** | Comprehensive product page: 12-stage lifecycle, integration honesty badges, scoring sample, trust disclaimers, roadmap, CTAs→acquisitionos.net. **Live missing.** | `acquisitionos/page.tsx:104` |
| `/portfolio` | 307→`/our-product` | 200 (stale) | **Live** still renders old 3-product portfolio with unsourced "75%/20%" claims. **Develop** redirects to Our Product. | `portfolio/page.tsx:3` |
| `/team` | 307→`/about` | 200 (stale) | **Live** shows 4 people incl. "Dr. Lena Petrova" (unverifiable). **Develop** redirects to About (only Prabhat Kumar). | `team/page.tsx:3` |
| `/careers` | 200 | 200 | Job board + filters + benefits. **Live** shows no open roles. **Develop** depends on seeded jobs. | `careers/page.tsx:38` |
| `/blog` | 200 | 200 (stale) | Search + category filter. **Live** branded "QuantumInsights" (legacy), no articles visible. **Develop** reads `blogPosts` Firestore (3 seeded posts). | `blog/page.tsx:17` |
| `/blog/[slug]` | 200 | — | Individual post. Body rendered `whitespace-pre-wrap` (raw text, **not markdown** — mermaid block shows as raw). No per-post `generateMetadata`. | `blog/[slug]/page.tsx:14` |
| `/contact` | 200 | 200 | Form (Name/Email/Company/Message). No enquiry categories, no consent checkbox. Submits 201 locally; Mailpit captures ack email; Firestore `leads` stored. | `contact/page.tsx:10` |
| `/faq` | 200 | 200 (stale) | **Live** = 8 questions, no answers. **Develop** FAQ content present. | `faq/page.tsx` |
| `/testimonials` | 200 | 200 | Static testimonials. Credibility concerns (see Content Truth Register). | `testimonials/page.tsx` |
| `/privacy-policy` | 200 | **404** | Phase 1B rewrite on develop. **Live missing** (footer link dead). Must be updated for PART J data decisions. | `privacy-policy/page.tsx:7` |
| `/profile` | 200 (sim-auth) | — | End-user profile, simulated auth only. | `profile/page.tsx:9` |
| `/auth/login` | 200 | 200 | Simulated auth UI. 🔒 plaintext test cred in bundle. | `auth/login/page.tsx` |
| `/auth/signup` | 200 | 200 | Simulated signup + OTP UI. | `auth/signup/page.tsx` |
| `/auth/forgot-password` | 200 | — | Simulated. | `auth/forgot-password/page.tsx` |
| `/auth/reset-password` | 200 | — | Simulated. | `auth/reset-password/page.tsx` |

## Admin routes (`src/app/admin/**`) — private, not linked publicly

| Route | Local | Condition | Evidence |
|---|---|---|---|
| `/admin` | 200 (auth) | Dashboard: stats cards, recent applications, Seed button (dev), "System Health" widget (hard-coded). | `admin/page.tsx` |
| `/admin/login` | 200 | Login form. | `admin/login/page.tsx` |
| `/admin/jobs` | 200 (auth) | Jobs list CMS. | `admin/jobs/page.tsx` |
| `/admin/jobs/new` | 200 (auth) | Create job. | `admin/jobs/new/page.tsx` |
| `/admin/jobs/[id]/edit` | 200 (auth) | Edit job. | `admin/jobs/[id]/edit/page.tsx` |
| `/admin/blog` | 200 (auth) | Blog list CMS. | `admin/blog/page.tsx` |
| `/admin/blog/new` | 200 (auth) | Create post (writes initial revision). | `admin/blog/new/page.tsx` |
| `/admin/blog/[id]/edit` | 200 (auth) | Edit post. | `admin/blog/[id]/edit/page.tsx` |
| `/admin/applications` | 200 (auth) | Applications CRM. | `admin/applications/page.tsx` |
| `/admin/applications/[id]` | 200 (auth) | Application detail. | `admin/applications/[id]/page.tsx` |
| `/admin/leads` | 200 (auth) | Leads CRM. | `admin/leads/page.tsx` |
| `/admin/newsletter` | 200 (auth) | Subscribers CRM. | `admin/newsletter/page.tsx` |
| `/admin/services` | 200 (auth) | 🔴 Client-only — no `/api/admin/services` route; writes blocked by rules. | `admin/services/page.tsx` |
| `/admin/activity` | 200 (auth) | Audit log viewer. | `admin/activity/page.tsx` |
| `/admin/portfolio` | — | 🔴 Dead sidebar link — page dir does not exist. | `admin/layout.tsx:39` |
| `/admin/testimonials` | — | 🔴 Dead sidebar link — page dir does not exist. | `admin/layout.tsx:40` |
| `/aq-internal` | — | 🔴 Does not exist (PART L rename not done). | grep |

## API routes (`src/app/api/**/route.ts`)

| Route | Methods | Local | Condition | Evidence |
|---|---|---|---|---|
| `/api/contact` | POST, GET | 201 / 405 | Validate→honeypot→rate limit→dedupe→Firestore `leads`→email→status write-back. 🔒 G2, G14. | `api/contact/route.ts:29` |
| `/api/newsletter` | POST | 201 | Validate→rate limit→`newsletterSubscribers`. No CSRF. | `api/newsletter/route.ts:25` |
| `/api/job-applications` | POST | 201 | multipart→validate→5 MB cap→resume to Storage→`jobApplications`→Genkit email fmt. 🔒 G17. | `api/job-applications/route.ts:37` |
| `/api/admin/auth/login` | POST | 200 | bcrypt+JWT cookie. 🔧 env. | `api/admin/auth/login/route.ts:19` |
| `/api/admin/auth/logout` | POST | 200 | Deletes cookie. | `api/admin/auth/logout/route.ts:3` |
| `/api/admin/auth/me` | GET | 200/401 | JWT verify. | `api/admin/auth/me/route.ts:15` |
| `/api/admin/stats` | GET | 200/401 | Counts + recent applications. | `api/admin/stats/route.ts` |
| `/api/admin/seed` | POST | 200/403 | Dev-only batch seed; 403 in prod. | `api/admin/seed/route.ts` |
| `/api/admin/activity` | GET, POST | 200/401 | `adminActivityLogs` via Admin SDK. | `api/admin/activity/route.ts` |
| `/api/admin/applications` | GET | 200/401 | List. | `api/admin/applications/route.ts` |
| `/api/admin/applications/[id]` | GET, PATCH, DELETE | 200/401 | Detail/update/delete. | `api/admin/applications/[id]/route.ts` |
| `/api/admin/applications/[id]/resume` | GET | 200/401 | Signed URL 5-min TTL, strict regex. | `…/resume/route.ts:34` |
| `/api/admin/jobs` | GET, POST | 200/401 | Jobs list/create. | `api/admin/jobs/route.ts` |
| `/api/admin/jobs/[id]` | GET, PUT, PATCH, DELETE | 200/401 | Jobs detail/update/archive/delete. | `api/admin/jobs/[id]/route.ts` |
| `/api/admin/blog` | GET, POST | 200/401 | Blog list/create (+revision). | `api/admin/blog/route.ts` |
| `/api/admin/blog/[id]` | GET, PUT, PATCH, DELETE | 200/401 | Blog detail/update/publish/delete. | `api/admin/blog/[id]/route.ts` |
| `/api/admin/leads` | GET | 200/401 | Leads list. | `api/admin/leads/route.ts` |
| `/api/admin/leads/[id]` | GET, PATCH, DELETE | 200/401 | Leads detail/update/delete. | `api/admin/leads/[id]/route.ts` |
| `/api/admin/newsletter` | GET | 200/401 | Subscribers list. | `api/admin/newsletter/route.ts` |
| `/api/admin/newsletter/[id]` | GET, DELETE | 200/401 | Subscriber detail/delete. | `api/admin/newsletter/[id]/route.ts` |
| `/api/admin/services` | — | 🔴 | Does not exist (services CMS is client-only). | grep |

## Redirects & layout-level behavior

- **Page-level `redirect()`**: `/team→/about`, `/portfolio→/our-product`, `/services/ai-automation→/services/ai-solutions`, `/services/custom-platform→/services/saas-platforms`, `/services/fractional-cto→/about`, `/services/mobile-apps→/services/saas-platforms`.
- **`next.config.ts`**: no `redirects()` export; only `images.remotePatterns` (placehold.co, picsum.photos, firebasestorage.googleapis.com, acquisitionos.net) + `typescript.ignoreBuildErrors=true` + `eslint.ignoreDuringBuilds=true`.
- **Layout conditional render** (`src/app/layout.tsx:36,51-54`): Navbar/Footer/ChatSection suppressed on any `/admin/*` path via `isAdminPath`.
- **Middleware** (`src/middleware.ts`): matcher `/admin/:path*`; protects admin pages except `/admin/login`; missing/invalid/expired token → redirect to `/admin/login` + delete cookie. Does **not** cover `/api/admin/**` (gated separately by `verifyAdmin()`).

## SEO-route artifacts (missing site-wide)

- No `sitemap.ts` / `sitemap.xml`.
- No `robots.ts` / `robots.txt`.
- No root `metadataBase`, default `openGraph`, or `twitter` config in `src/app/layout.tsx`.
- No JSON-LD / structured data anywhere.
- No per-post `generateMetadata` on `/blog/[slug]`.
- Per-route `metadata` (title+description) exists on: about, contact, faq/layout, our-product, our-product/acquisitionos (also `alternates.canonical: 'https://acquisitionos.net'`), portfolio/layout, privacy-policy, services/layout + 4 service detail pages, team/layout, testimonials/layout.

## Route-condition summary

- **Develop (baseline):** all public pages and admin pages render locally; redirects work; API routes respond correctly (201/405/401/403 as designed). Verified defects: `services` production read-rule gap (G16), admin dead sidebar links (G18), client-only services CMS, no `/aq-internal` (G3), blog raw-text rendering, no per-post metadata.
- **Live deployment (stale):** `/our-product`, `/our-product/acquisitionos`, `/privacy-policy` return **404**; `/services`, `/blog`, `/faq`, `/careers` are underbuilt; brand/handle inconsistency; stale 4-person team and 4 testimonials with credibility concerns; unsourced "75%/20%" claims on `/portfolio`.

The live deployment must be reconciled to `develop` as a first deployment task in Phase 1.
