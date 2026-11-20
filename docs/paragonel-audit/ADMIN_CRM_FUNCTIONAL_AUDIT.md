# Admin & CRM Functional Audit

**Baseline:** `develop` @ `405b75a` · **Audit date:** 2026-11-20
Every admin workflow is documented with route/component/API, current status, and browser-or-API verification evidence. A successful API response alone is not proof a workflow works — where browser verification was possible it is noted. Verified locally against the running app (Next dev :3000 + Firestore/Storage emulator + Mailpit) using the local admin account `admin@paragonel.local`.

---

## 1. Authentication & session

| Workflow | Route/component/API | Status | Verification | Defects |
|---|---|---|---|---|
| Login | `POST /api/admin/auth/login` (`route.ts:19`) + `/admin/login` page | ✅ | Login returned `{"success":true}` 200; `qf_admin_token` httpOnly cookie set | 🔧 env required; `.env` bcrypt `$` must be escaped (local footgun) |
| Session verify | `GET /api/admin/auth/me` (`route.ts:15`) | ✅ | Returns `{"user":{"email":"admin@paragonel.local","role":"admin"}}` 200 with cookie; 401 without | — |
| Page gate | `src/middleware.ts` (matcher `/admin/:path*`) | ✅ | Unauthenticated → redirect to `/admin/login` + cookie deleted | Does not cover `/api/admin/**` (covered by `verifyAdmin()`) |
| API gate | `verifyAdmin()` (`admin-auth.ts:45`) on every `/api/admin/**` data route | ✅ | `GET /api/admin/stats` → 401 without cookie, 200 with | 🔴 no CSRF beyond `sameSite=lax` |
| Logout | `POST /api/admin/auth/logout` (`route.ts:3`) | ✅ | Deletes cookie | — |
| Token expiry | JWT `8h` (`login/route.ts:46`) | ✅ | — | — |

## 2. Jobs CMS

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| List jobs | `GET /api/admin/jobs` (`route.ts`) | ✅ | Returns list 200 with cookie; 401 without | — |
| Create job | `POST /api/admin/jobs` | ✅ | zod `jobFormSchema` validation; audit log written | — |
| Edit job | `PUT /api/admin/jobs/[id]` | ✅ | — | — |
| Archive/toggle active | `PATCH /api/admin/jobs/[id]` (`isActive`) | ✅ | — | — |
| Delete job | `DELETE /api/admin/jobs/[id]` | ✅ | Permanent delete; audit log | — |
| Public read | `jobs` rules: `isActive==true && deletedAt==null` | ✅ | Careers page reads active jobs client-side | — |
| Admin UI | `/admin/jobs`, `/admin/jobs/new`, `/admin/jobs/[id]/edit` | ✅ | Pages render | — |

**E2E status:** Jobs CRUD fully functional (create→list→archive→activate→update→delete). Public careers page consumes active jobs.

## 3. Blog CMS

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| List posts | `GET /api/admin/blog` | ✅ | Returns list 200 with cookie | — |
| Create post | `POST /api/admin/blog` | ✅ | zod `blogCreateSchema`; writes initial revision to `blogPosts/{id}/revisions`; audit log | — |
| Edit post | `PUT /api/admin/blog/[id]` | ✅ | zod `blogEditSchema` | — |
| Publish/unpublish | `PATCH /api/admin/blog/[id]` (`status: 'Published'|'Draft'`) | ✅ | — | — |
| Delete post | `DELETE /api/admin/blog/[id]` | ✅ | Permanent; audit log | — |
| Public read | `blogPosts` rules: `status=='Published' && deletedAt==null` | ✅ | Blog listing reads published posts | — |
| Revisions | `blogPosts/{id}/revisions` | ✅ | Fully denied to client; Admin SDK only | — |
| Admin UI | `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit` | ✅ | Pages render | — |
| Public post page | `/blog/[slug]` | ⚠️ | Renders, but body is `whitespace-pre-wrap` (raw text, **not markdown**) — mermaid block in the AcquisitionOS post shows as raw text; no per-post `generateMetadata` | Rendering gap |

**E2E status:** Blog CRUD + draft/publish functional. Public rendering lacks markdown support and per-post SEO metadata.

## 4. Leads CRM

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| Create lead (inbound) | `POST /api/contact` writes `leads` | ✅ | Contact submit returned `{"success":true,"id":"6vZ0jVUlILEWgeir6hoy","notification":"sent"}` 201 | 🔴 G2: stored in CRM against founder PART J preference |
| List leads | `GET /api/admin/leads` (`route.ts`) | ✅ | Returns `{"leads":[{id,name,email,company,message,source,status,createdAt,notificationStatus,notificationDetail}]}` 200 with cookie; lead from contact form appears | — |
| Update lead | `PATCH /api/admin/leads/[id]` | ✅ | — | — |
| Delete lead | `DELETE /api/admin/leads/[id]` | ✅ | — | — |
| PII lock | `leads` rules: all denied to client | ✅ | Verified — anonymous REST list returns empty (denied); admin API returns docs | — |
| Admin UI | `/admin/leads` | ✅ | Page renders | — |

**E2E status:** Leads CRM fully functional end-to-end (contact submit → Firestore lead → admin list). The only issue is policy (G2): the founder prefers enquiries not be stored in the DB.

## 5. Applications CRM

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| Create application (inbound) | `POST /api/job-applications` writes `jobApplications` + resume to Storage | ✅ | multipart; 5 MB cap; Genkit email formatting | 🔴 G17: client 10 MB vs server 5 MB |
| List applications | `GET /api/admin/applications` | ✅ | Returns list 200 with cookie | — |
| Application detail | `GET /api/admin/applications/[id]` | ✅ | — | — |
| Update application | `PATCH /api/admin/applications/[id]` | ✅ | — | — |
| Delete application | `DELETE /api/admin/applications/[id]` | ✅ | — | — |
| Resume access | `GET /api/admin/applications/[id]/resume` (`route.ts:34`) | ✅ | verifyAdmin → strict regex `^resumes/[A-Za-z0-9._-]{1,200}$` → Admin Storage `getSignedUrl` (5-min TTL, v4) | Emulator signing may 500 without real creds |
| PII lock | `jobApplications` rules: all denied to client | ✅ | — | — |
| Admin UI | `/admin/applications`, `/admin/applications/[id]` | ✅ | Pages render | — |
| Chat-initiated application | `chat-section.tsx:246` client write | 🔴 | Blocked by rules → silently fails | Route through API or remove |

**E2E status:** Applications CRM functional. Resume access is properly signed-URL gated. Chat-initiated application path is broken (blocked by rules).

## 6. Newsletter CRM

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| Subscribe (inbound) | `POST /api/newsletter` writes `newsletterSubscribers` | ✅ | zod validate; rate limit 10/10min | No email confirmation; no CSRF |
| List subscribers | `GET /api/admin/newsletter` | ✅ | Returns list 200 with cookie | — |
| Delete subscriber | `DELETE /api/admin/newsletter/[id]` | ✅ | — | — |
| PII lock | `newsletterSubscribers` rules: all denied to client | ✅ | — | — |
| Admin UI | `/admin/newsletter` | ✅ | Page renders | — |

**E2E status:** Newsletter CRM functional.

## 7. Services CMS

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| Admin UI | `/admin/services` | 🟡 | Page renders | 🔴 **No `/api/admin/services` route exists** — CMS is client-only |
| Client write | direct Firestore write from admin UI | 🔴 | Blocked by rules (`services` has no match → default-deny) | G16: writes silently fail |
| Public read | `services` rules: no match → default-deny | 🔴 | Reads work locally only because emulator allows; **will fail in production** | G16 |

**E2E status:** 🔴 Services CMS is **non-functional** in production. Dev seed (`/api/admin/seed`) writes `services` via Admin SDK (bypasses rules), so seeded data exists locally, but neither admin editing nor public reading works against real Firestore. Needs a `/api/admin/services` route + a `services` read rule or server-side rendering.

## 8. Activity / audit logs

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| Write log | `logActivityServer()` called from jobs/blog/applications/leads handlers | ✅ | Writes `adminActivityLogs` via Admin SDK | — |
| List logs | `GET /api/admin/activity` | ✅ | Returns list 200 with cookie | — |
| Manual log | `POST /api/admin/activity` | ✅ | — | — |
| PII lock | `adminActivityLogs` rules: all denied | ✅ | — | — |
| Admin UI | `/admin/activity` | ✅ | Page renders | — |

**E2E status:** Audit logging functional across CMS mutations.

## 9. Stats & dashboard

| Workflow | Route/API | Status | Verification | Defects |
|---|---|---|---|---|
| Stats | `GET /api/admin/stats` | ✅ | Returns counts (jobs/blogPosts/leads/subscribers) + 6 recent applications | — |
| Dashboard | `/admin/page.tsx` | ✅ | Renders stat cards + recent applications + Seed button (dev) | "System Health" widget hard-coded "Online"/"Ready" (not real telemetry) |
| Seed (dev) | `POST /api/admin/seed` | ✅ | Admin SDK batch; hard 403 if `NODE_ENV==='production'` | Dev-only |

**E2E status:** Dashboard functional; "System Health" is cosmetic, not real.

## 10. Admin route protection & responsiveness

- Admin route: `/admin` (NOT `/aq-internal`). 🔴 G3: PART L rename not implemented.
- Admin not linked publicly (navbar/footer). ✅
- Middleware page-gate + `verifyAdmin()` API-gate. ✅
- Admin sidebar (`admin/layout.tsx:32-43`): 10 items, incl. 🔴 dead links to `/admin/portfolio` and `/admin/testimonials` (G18).
- Responsive: admin layout exists but **not audited at all viewports** (PART L §responsive) — pending Phase 11.

## Summary

| Workflow | E2E status |
|---|---|
| Auth/session | ✅ |
| Jobs CMS | ✅ |
| Blog CMS | ✅ (public rendering: raw text, no per-post metadata) |
| Leads CRM | ✅ (policy conflict G2) |
| Applications CRM | ✅ (resume signed-URL ✅; chat-initiated path broken) |
| Newsletter CRM | ✅ |
| Services CMS | 🔴 non-functional in prod (no API route + no read rule) |
| Activity logs | ✅ |
| Stats/dashboard | ✅ (System Health cosmetic) |
| Admin rename to `/aq-internal` | 🔴 not done |
| Admin responsiveness | ⚠️ not audited at all viewports |

**Required real-time workflows (PART L) status:** Create/edit/delete blog ✅; draft/publish ✅; create/edit/publish/close jobs ✅; view/manage applications ✅; secure resume access ✅; manage newsletter ✅; view/manage CRM leads ✅; activity/audit ✅; content preview ⚠️ (no dedicated preview); publish changes to public site without manual code edits ✅ for jobs/blog (Firestore-backed) but 🔴 for services (no API/rule).
