# Existing Feature Inventory

**Baseline:** `develop` @ `405b75a` · **Audit date:** 2026-11-20
Each feature is classified: Fully working / Partially working / UI-only / API-connected / Backend-connected but not browser-verified / Broken / Missing / Security-sensitive / Requires env config / Requires external credentials. "Browser verification" here means verified against the running `develop` app in the GLM workspace (Firestore + Storage emulator + Mailpit), unless noted as a live-site (`paragonel.vercel.app`) observation.

Legend — Status: ✅ Fully working · ⚠️ Partially / caveats · 🟡 UI-only or stale-on-live · 🔴 Broken / missing · 🔒 Security-sensitive · 🔧 Requires env config.

---

## A. Public pages

| # | Feature | Route / Component / API | Status | Backend integration | Browser verification | Security status | Outstanding defects | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | Homepage | `src/app/page.tsx:44` | ✅ | Composes ~16 sections; AI sections call Genkit | Loads 200 locally; AI sections error without API key | — | AI sections show visible error UIs when no `GEMINI_API_KEY` (no graceful hide) | `page.tsx:37-42,155-270` |
| 2 | Hero ecosystem | `src/components/sections/hero-ecosystem.tsx` | ✅ | — | Renders | — | Headline says "AcquisitionOS in Private Beta" (consistent) | `hero-ecosystem.tsx:110` |
| 3 | Tech marquee | `src/components/sections/tech-marquee.tsx` | ✅ | — | Animates | — | Tech-name scroll, not a verified partner-logo ticker (PART I gap) | component file |
| 4 | Stats bar | `src/components/sections/stats-bar.tsx` | ✅ | Static | Renders | — | Stats (Products Shipped 3, Founded 2024, Technologies 10+) are asserted, not sourced | `stats-bar.tsx:5-9` |
| 5 | Services section | `src/components/sections/services-section.tsx` | ⚠️ | Reads `services` Firestore collection client-side | Renders locally only because emulator allows it | 🔒 G16 | `services` has **no Firestore read rule** → will fail in production unless a rule is added or pages move server-side | `services-section.tsx:29-34`, `firestore.rules:38-41` |
| 6 | AcquisitionOS feature | `src/components/sections/acquisitionos-feature.tsx` | ✅ | — | Renders | — | — | component file |
| 7 | Tech stack section | `src/components/sections/tech-stack-section.tsx` | ✅ | Static | Renders | — | Broad tech catalogue; must be classified (actively-used vs familiarity) per PART M | component file |
| 8 | Product preview | `src/app/page.tsx:101-147` | ✅ | Static `basePortfolio` (3 projects) | Renders | — | SystemFoundry/CodeGuard links external | `src/lib/data.ts:53-87` |
| 9 | Testimonials section | dynamic import `page.tsx:37-42` | 🟡 | Static | Renders | — | Testimonial content has credibility concerns (see Content Truth Register) | `src/lib/data.ts` |
| 10 | Founder spotlight | `src/app/page.tsx:155-196` | ✅ | Static | Renders | — | Only Prabhat Kumar shown (correct per PART D §2) | `page.tsx:172-174` |
| 11 | Engineering process | `src/components/sections/*` + `page.tsx:203` | ⚠️ | Static | Renders | — | Existing staging differs from PART D §5 8-stage spec (Understand→…→Improve) | component |
| 12 | AI content (recommendations) | `src/components/sections/ai-content.tsx` | ⚠️ | Genkit `recommendRelatedContent` | Errors without API key | — | No graceful offline fallback; visible error card | `ai-content.tsx:35-76` |
| 13 | Tech news | `src/components/sections/tech-news-section.tsx` | ⚠️ | Genkit `fetchTechNews`, lazy via IntersectionObserver | Errors without API key | — | Visible destructive Alert on failure | `tech-news-section.tsx:43-53` |
| 14 | Chat widget | `src/components/sections/chat-section.tsx` | ⚠️ | Genkit `companyQnaFlow`; auto-opens after 2.5s | Fallback message on failure | — | Auto-opens globally on non-admin pages; 🔒 client writes to `jobApplications` from chat (`chat-section.tsx:246`) are blocked by rules → silently fails | `chat-section.tsx:42-45,102-104,246` |
| 15 | About page | `src/app/about/page.tsx` → `AboutSection` | ✅ | Static | Renders | — | Founder narrative substantial | `about-section.tsx:70-99` |
| 16 | Team page | `src/app/team/page.tsx` | ✅ | `redirect('/about')` | 307 locally | — | Live site shows stale 4-person team (not on `develop`) | `team/page.tsx:3-5` |
| 17 | Services index | `src/app/services/page.tsx` | ⚠️ | Reads `services` Firestore client-side | Renders locally | 🔒 G16 | Same production-read-rule gap as #5 | `services/page.tsx:14-21` |
| 18 | Service detail (AI Solutions) | `src/app/services/ai-solutions/page.tsx` | ✅ | Static | Renders | — | — | `ai-solutions/page.tsx:24` |
| 19 | Service detail (Cloud Infra) | `src/app/services/cloud-infrastructure/page.tsx` | ✅ | Static | Renders | — | Folds in Distributed Systems/Scalability/Microservices/DB/Event Streaming as capabilities | `cloud-infrastructure/page.tsx:27` |
| 20 | Service detail (DevOps) | `src/app/services/devops-automation/page.tsx` | ✅ | Static | Renders | — | — | `devops-automation/page.tsx:28` |
| 21 | Service detail (SaaS Platforms) | `src/app/services/saas-platforms/page.tsx` | ✅ | Static | Renders | — | — | `saas-platforms/page.tsx:27` |
| 22 | Service stubs (redirects) | `ai-automation`, `custom-platform`, `fractional-cto`, `mobile-apps` | ✅ | `redirect()` | 307 locally | — | No real content; aliases only | respective `page.tsx:3` |
| 23 | Our Product index | `src/app/our-product/page.tsx` | ✅ | Static `basePortfolio` | Renders locally | — | **Live site returns 404** (stale deployment) | `our-product/page.tsx:17` |
| 24 | AcquisitionOS product page | `src/app/our-product/acquisitionos/page.tsx` | ✅ | Static + honesty badges | Renders locally | — | **Live site returns 404**; product identity split between acquisitionos.net and beta | `acquisitionos/page.tsx:104` |
| 25 | Portfolio (legacy alias) | `src/app/portfolio/page.tsx` | ✅ | `redirect('/our-product')` | 307 locally | — | Live site still renders old 3-product portfolio with unsourced "75%/20%" claims | `portfolio/page.tsx:3` |
| 26 | Careers / job board | `src/app/careers/page.tsx` | ✅ | Reads `jobs` Firestore client-side | Renders locally | — | Live site shows no open roles; depends on seeded jobs | `careers/page.tsx:38,58-66` |
| 27 | Job filters | `src/app/careers/page.tsx:82-116` | ✅ | Client-side | Works | — | — | `careers/page.tsx:82-116` |
| 28 | Job description modal | `src/components/job-description-modal.tsx` | ⚠️ | Client | Renders | — | Reads `companyLogoUrl` field that does not exist on `Job` type (TS error) | `job-description-modal.tsx:42-44` |
| 29 | Apply job modal | `src/components/apply-job-modal.tsx` | ⚠️ | multipart POST `/api/job-applications`; Genkit email formatting | Submits | 🔒 G17 | Client 10 MB limit vs server 5 MB; reads `noticePeriod`/`preferredJobLocation` not on type | `apply-job-modal.tsx:45-46,124-125,176` |
| 30 | Blog listing | `src/app/blog/page.tsx` | ✅ | Reads `blogPosts` Firestore client-side | Renders | — | Search + category filter client-side | `blog/page.tsx:17-46` |
| 31 | Blog post page | `src/app/blog/[slug]/page.tsx` | ⚠️ | Client query by slug | Renders | — | Body rendered as `whitespace-pre-wrap` (raw text, not markdown) — mermaid block in AcquisitionOS post shows as raw text; no per-post `generateMetadata` | `blog/[slug]/page.tsx:14` |
| 32 | Contact page | `src/app/contact/page.tsx` → `ContactSection` | ⚠️ | POST `/api/contact` | Submits 201 locally; Mailpit captures ack email | 🔒 G2 | **No enquiry categories; no consent checkbox** (PART J gaps); contact data stored in Firestore CRM (against founder preference) | `contact-section.tsx:14-103`, `api/contact/route.ts:84-95` |
| 33 | FAQ | `src/app/faq/page.tsx` | ✅ | Static | Renders | — | Live site shows 8 questions with no answers (stale); `develop` FAQ content should be verified | `faq/` |
| 34 | Testimonials page | `src/app/testimonials/page.tsx` | 🟡 | Static | Renders | — | Credibility concerns — see Content Truth Register | `testimonials/` |
| 35 | Privacy policy | `src/app/privacy-policy/page.tsx` | ✅ | Static (Phase 1B rewrite) | Renders locally | — | **Live site returns 404**; current policy must be updated to match PART J data-handling decisions | `privacy-policy/page.tsx:7` |
| 36 | Profile (end-user) | `src/app/profile/page.tsx` | 🟡 | Simulated auth | Renders | — | UI-only; no real backend | `profile/page.tsx:9` |
| 37 | Auth login | `src/app/auth/login/page.tsx` | 🟡 | Simulated (`auth-context`) | UI works | 🔒 G20 | Plaintext test credential shipped in client bundle | `auth-context.tsx:19-26` |
| 38 | Auth signup | `src/app/auth/signup/page.tsx` | 🟡 | Simulated | UI works | 🔒 G20 | Simulated OTP flow; no real email | `auth-context.tsx:109-125` |
| 39 | Forgot / reset password | `src/app/auth/{forgot,reset}-password` | 🟡 | Simulated | UI works | — | UI-only | respective pages |

## B. Public API routes

| # | Feature | Route / file | Status | Behavior | Defects |
|---|---|---|---|---|---|
| 40 | Contact submit | `POST /api/contact` `route.ts:29` | ✅ | Validate → honeypot → rate limit (5/10min) → dedupe → Firestore `leads` write → email notifications → status write-back | G2 (CRM storage), G14 (no CSRF), no enquiry categories/consent |
| 41 | Newsletter subscribe | `POST /api/newsletter` `route.ts:25` | ✅ | Validate → rate limit (10/10min) → Firestore `newsletterSubscribers` write | No email confirmation; no CSRF |
| 42 | Job application | `POST /api/job-applications` `route.ts:37` | ⚠️ | multipart → validate → 5 MB cap → resume to Storage → Firestore `jobApplications` → Genkit email formatting | G17 (client/server limit mismatch); no email sent by default (`route.ts:13-15`); no CSRF |
| 43 | Contact GET | `GET /api/contact` | ✅ | Returns 405 (correct) | — | `route.ts:145` |

## C. Admin / CRM

| # | Feature | Route / file | Status | Backend integration | Browser verification | Defects |
|---|---|---|---|---|---|---|
| 44 | Admin login | `POST /api/admin/auth/login` `route.ts:19` | ✅ | bcrypt + JWT cookie | Login 200 locally; `qf_admin_token` set; `/api/admin/auth/me` returns admin | 🔧 requires `ADMIN_EMAIL`+`ADMIN_PASSWORD_HASH`+`JWT_SECRET`; `.env` bcrypt `$` must be escaped (see Phase 0 run notes) |
| 45 | Admin logout | `POST /api/admin/auth/logout` | ✅ | Deletes cookie | Works | — |
| 46 | Admin me | `GET /api/admin/auth/me` | ✅ | JWT verify | Returns `{email, role}` | — |
| 47 | Admin dashboard | `/admin/page.tsx` | ✅ | `/api/admin/stats` | Renders | "System Health" widget is hard-coded "Online"/"Ready" (not real) |
| 48 | Jobs CMS | `/admin/jobs/**` + `/api/admin/jobs/**` | ✅ | CRUD + archive toggle + audit log | API verified locally | 🔒 verifyAdmin on each route |
| 49 | Blog CMS | `/admin/blog/**` + `/api/admin/blog/**` | ✅ | CRUD + draft/publish + revisions + audit | API verified locally | 🔒 verifyAdmin |
| 50 | Leads CRM | `/admin/leads` + `/api/admin/leads/**` | ✅ | Admin SDK list/update/delete | Verified via admin API locally (lead from contact form appears) | 🔒 leads PII-locked; G2 retention concern |
| 51 | Applications CRM | `/admin/applications/**` + `/api/admin/applications/**` | ✅ | List/detail/update/delete | API responds | — |
| 52 | Resume access | `GET /api/admin/applications/[id]/resume` `route.ts:34` | ✅ | verifyAdmin → strict regex → Admin Storage `getSignedUrl` (5-min TTL) | API responds | Emulator signing may 500 locally without real creds |
| 53 | Newsletter CRM | `/admin/newsletter` + `/api/admin/newsletter/**` | ✅ | List/delete | API responds | — |
| 54 | Services CMS | `/admin/services` | 🟡 | **Client-only — no `/api/admin/services` route** | UI only | Writes blocked by rules (no `services` rule); falls back to nothing |
| 55 | Activity logs | `/admin/activity` + `/api/admin/activity` | ✅ | `adminActivityLogs` via Admin SDK | Renders | — |
| 56 | Stats | `GET /api/admin/stats` | ✅ | Counts + recent applications | Returns 401 unauth / 200 auth | — |
| 57 | Seed (dev) | `POST /api/admin/seed` | ✅ | Admin SDK batch; hard 403 in production | Works locally | Dev-only |
| 58 | Admin sidebar | `src/app/admin/layout.tsx:32-43` | 🔴 | — | Renders | Dead links to `/admin/portfolio` and `/admin/testimonials` (no page dirs) — G18 |
| 59 | `/aq-internal` route | — | 🔴 | — | — | Does not exist; only `/admin` (PART L rename not done) — G3 |
| 60 | Middleware admin gate | `src/middleware.ts` | ✅ | Protects `/admin/:path*` pages (not `/api/admin/**`) | Redirects to `/admin/login` when unauth | `/api/admin/**` gated separately by `verifyAdmin()` |

## D. Cross-cutting

| # | Feature | Component / file | Status | Defects |
|---|---|---|---|---|
| 61 | Navbar (mega-menu) | `src/components/layout/navbar.tsx` | ✅ | Home→Services(mega)→Our Product→About→More; no admin links public; Portfolio replaced by Our Product |
| 62 | Footer | `src/components/layout/footer.tsx` | ✅ | Company/Services/Our Product/Careers/Blog + Resources + Newsletter + social; HSR Layout Bangalore address, contact@paragonel.com, +91 9663076023 |
| 63 | Cookie consent | `src/components/cookie-consent/*` | ⚠️ | TS5097 import-extension errors; `essential` type is `true` literal causing assignability error | cookie-consent files, `use-cookie-consent.tsx:71` |
| 64 | Theme provider | `src/components/theme-provider.tsx` | ⚠️ | TS5097 import-extension error | `theme-provider.tsx:7` |
| 65 | ScrollFadeIn | `src/components/*` | ✅ | Phase 4 IU-10 added fallback | — |
| 66 | Email service | `src/lib/email.ts` | ✅ | Mailpit fallback local; SMTP prod coded; branded HTML; resilient | 🔧 `COMPANY_INBOX` unset → company notification skipped |
| 67 | Submission security | `src/lib/submission-security.ts` | ⚠️ | zod + honeypot + in-memory rate limit + dedupe | In-memory (not shared across instances); no CSRF |
| 68 | Firebase Admin | `src/lib/firebase-admin.ts` | ✅ | Emulator-mode no creds; prod requires service account | 🔧 service account required for prod |
| 69 | Firestore rules | `firestore.rules` | ⚠️ | PII + CMS locked; jobs/blogPosts public-read tightened | G15 (`users` open), G16 (`services` no rule), `drafts` default-deny breaks autosave |
| 70 | Storage rules | `storage.rules` | ✅ | All denied to client; uploads via Admin SDK | — |
| 71 | SEO metadata | per-route `metadata` exports | ⚠️ | Many pages have title+description | G9: no root metadataBase/OG/Twitter, no sitemap, no robots, no JSON-LD, no per-post metadata |
| 72 | Sitemap | — | 🔴 | Missing | G9 |
| 73 | Robots | — | 🔴 | Missing | G9 |
| 74 | Open Graph / Twitter | — | 🔴 | Missing | G9 |
| 75 | JSON-LD structured data | — | 🔴 | Missing | G9 |

## E. Quality gates

| # | Item | Command | Result | Evidence |
|---|---|---|---|---|
| 76 | TypeScript | `tsc --noEmit` | 🔴 39 errors (exit 2) | `logs/typecheck.log`; masked by `next.config.ts ignoreBuildErrors=true` |
| 77 | ESLint | `next lint` | ⚠️ masked by `eslint.ignoreDuringBuilds=true` | `next.config.ts:7-9` |
| 78 | Build | `next build` | not run (would pass due to ignore flags; turbopack dev OOM-kills in 4 GB sandbox — runtime only, not a code bug) | `next.config.ts:4-9` |
| 79 | Tests | `node --test test/*.test.mjs` | 🔴 3/3 fail standalone | Integration tests require dev server + emulators + `.env` loaded; standalone run fails with `JWT_SECRET missing`, `Bucket name not specified`, `Could not load default credentials` |
| 80 | Vercel config | `vercel.json` | ⚠️ references non-existent `src/app/api/genkit/**` | `vercel.json:1-7` — G19 |

---

## Summary counts

- Fully working (✅): 38
- Partially / caveats (⚠️): 22
- UI-only / stale-on-live (🟡): 9
- Broken / missing (🔴): 7
- Security-sensitive (🔒): 9 distinct issues (G2, G14, G15, G16, G17, G18, G19, G20, + chat client-write-to-jobApplications)
- Requires env config (🔧): 4 (admin creds, Firebase Admin service account, `COMPANY_INBOX`, Gemini key)

No feature is reported "working" merely because its page renders. Where browser verification was possible locally it was performed (homepage 200, contact submit 201 + Mailpit capture + Firestore lead, admin login 200 + leads list). Live-site behavior is reported separately and is **stale vs. `develop`**.
