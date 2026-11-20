# Security and Privacy Audit

**Baseline:** `develop` @ `405b75a` · **Audit date:** 2026-11-20
Scope: authentication, authorization, admin routes, API security, Firestore rules, contact data flow, email processing, file handling, privacy, retention. Findings are evidence-based (file:line). Severity: 🔴 High · ⚠️ Medium · 🟡 Low/info.

---

## 1. Authentication

### End-user (simulated) — `src/contexts/auth-context.tsx`
- Pure client-side. `simulatedUserDatabase` seeded with one test account `admin@paragonel.com / admin123` (`auth-context.tsx:19-26`). 🔴 **G20: plaintext credential shipped in the client bundle.** This is unrelated to real admin auth but is visible to anyone reading the bundle.
- `login()` matches email+password in-memory; persists `isAuthenticated`/`user` in `localStorage` (`auth-context.tsx:69-107`). No token, no backend, no Firebase Auth.
- `signup()` pushes to the in-memory array and auto-logs-in (`auth-context.tsx:109-125`). Simulated OTP UI flow.
- 🔴 **No real end-user authentication.** `users` Firestore collection is left world-read/write because there is no `request.auth.uid` to gate on (G15).

### Admin (real) — bcrypt + JWT (HS256 via `jose`)
- Login: `src/app/api/admin/auth/login/route.ts:19`. Reads `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (bcrypt) from env; `bcrypt.compare` (`route.ts:38`). **Fail-closed 503** if env missing (`route.ts:25-30`). No code-level default credentials. ✅
- Cookie `qf_admin_token` (`route.ts:54`): `httpOnly:true`, `secure` only when request URL starts `https`, `sameSite:'lax'`, `path:'/'`, `maxAge: 8h`.
- JWT: `{email, role:'admin'}`, HS256, `setExpirationTime('8h')` (`route.ts:43-47`), signed with `JWT_SECRET` (env, ≥32 chars enforced at three points: login sign, middleware verify, `verifyAdmin` verify). ✅
- `verifyAdmin(request)` in `src/lib/admin-auth.ts:45` re-verifies the JWT server-side on every `/api/admin/**` data route (reads cookie from `cookie` header). Fail-closed → 401. ✅
- `/api/admin/auth/me` returns `{email, role}` from JWT; `/api/admin/auth/logout` deletes cookie. ✅
- 🔧 Env required: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`. ⚠️ **Local-config footgun:** `@next/env` runs `dotenv-expand` which mangles unescaped `$` in the bcrypt hash (the hash is full of `$2a$10$…`). The hash must be stored with each `$` escaped as `\$` in `.env`, or login silently fails with "Invalid credentials". This is a latent footgun for anyone copy-pasting a bcrypt hash — worth a one-line note in `.env.example` in a future phase. (Not a code bug; local env config.)

## 2. Authorization

- Admin data routes: each `/api/admin/**` handler calls `verifyAdmin()` → fail-closed 401. ✅
- Admin pages: `src/middleware.ts` matcher `/admin/:path*` (`middleware.ts:50`); protects all admin pages except `/admin/login`; missing/invalid/expired token → redirect to `/admin/login` + delete cookie (`middleware.ts:22-43`). If `JWT_SECRET` missing/weak → denies all + logs error (`middleware.ts:26-33`). ✅
- ⚠️ **Middleware scope does not cover `/api/admin/**`** — but those are independently gated by `verifyAdmin()` in each handler, so the gap is covered by defense-in-depth. Acceptable.
- ⚠️ **Secret-URL is not relied upon for security.** Admin is at `/admin` (not `/aq-internal`); the founder's PART L rename is not implemented (G3). Security depends on auth, not URL secrecy — which is the correct posture. The rename is a discoverability/obscurity improvement, not a security control.

## 3. Admin route protection

- Page gate: middleware. ✅
- API gate: `verifyAdmin()` per route. ✅
- Admin is **not linked** in public Navbar (`navbar.tsx:22-42`) or Footer (`footer.tsx:11-20`). ✅ (No public exposure.)
- ⚠️ Admin sidebar (`admin/layout.tsx:32-43`) lists 10 destinations incl. dead links to `/admin/portfolio` and `/admin/testimonials` (G18) — pages do not exist.

## 4. API security

### Public POST routes — `/api/contact`, `/api/newsletter`, `/api/job-applications`
- **Input validation**: zod schemas (`submission-security.ts:14-25`, `cms-schemas.ts`). ✅
- **Honeypot**: contact has hidden `website` field; if filled → silent 201 drop (`api/contact/route.ts:40-42`). ✅
- **Rate limiting**: in-memory per-process — contact 5/10min, newsletter 10/10min, jobApplication 5/10min (`submission-security.ts:78-103`). ⚠️ **Not shared across instances** (documented Redis-swap candidate, `submission-security.ts:5-9`). Single-instance Vercel serverless functions may not share state → limits are best-effort under load.
- **Dedupe**: contact 5-min in-memory fingerprint window (`submission-security.ts:109-127`). Same single-instance caveat.
- 🔴 **No CSRF protection.** No CSRF token, no `Origin`/`Sec-Fetch-Site` validation on any POST route (G14). The admin cookie `sameSite:'lax'` mitigates top-level-navigation CSRF for admin, but public POST routes rely only on honeypot + rate limit. Recommend adding `Origin`/`Sec-Fetch-Site` same-origin checks and/or double-submit tokens.

### Admin data routes
- All gated by `verifyAdmin()`. ✅
- 🔴 **No CSRF on admin mutations** beyond `sameSite:'lax'`. For state-changing admin POST/PUT/PATCH/DELETE, add same-origin verification or CSRF tokens.
- Resume signed-URL route `GET /api/admin/applications/[id]/resume` (`…/resume/route.ts:34`): verifyAdmin → resolves `resumeUrl` from the application record (never from client) → strict regex `^resumes/[A-Za-z0-9._-]{1,200}$` → Admin Storage `getSignedUrl` (read, **5-min TTL**, v4). Signed URLs never persisted/logged. ✅ (503 if Admin SDK unset; emulator signing may 500 locally without real creds.)

## 5. Firestore rules — `firestore.rules` (Phase 4 IU-0 lockdown)

| Collection | Read | Write | Notes |
|---|---|---|---|
| `jobs/{jobId}` | `isActive==true && deletedAt==null` | `false` | Admin CRUD via `/api/admin/jobs` (Admin SDK bypasses rules). ✅ |
| `blogPosts/{postId}` | `status=='Published' && deletedAt==null` | `false` | Admin via `/api/admin/blog`. ✅ |
| `blogPosts/{postId}/revisions/{revId}` | `false` | `false` | Written/read via Admin SDK. ✅ |
| `jobApplications/{appId}` | `false` | `false` | Create via `/api/job-applications`, manage via `/api/admin/applications`. ✅ |
| `leads/{leadId}` | `false` | `false` | Create via `/api/contact`, manage via `/api/admin/leads`. ✅ |
| `newsletterSubscribers/{subId}` | `false` | `false` | Create via `/api/newsletter`, manage via `/api/admin/newsletter`. ✅ |
| `adminActivityLogs/{logId}` | `false` | `false` | Admin SDK only. ✅ |
| `admins/{adminId}` | `false` | `false` | ✅ |
| `users/{userId}` | **`true`** | **`true`** | 🔴 **G15: world-read/write** — left open because simulated end-user auth provides no `request.auth.uid`. Locking requires Firebase Auth for end-users. |
| `services` | — | — | 🔴 **G16: no match → default-deny.** Public service pages read `services` client-side (`services-section.tsx:29-34`, `services/page.tsx:14-21`) → **reads will fail in production** unless a read rule is added or pages migrate to a server route. |
| `drafts` | — | — | No match → default-deny. `useAutosave` hook attempts client writes which silently fail → falls back to localStorage (`firestore.rules:33-37`). Non-fatal but broken feature. |

**Verdict:** PII and CMS collections are correctly locked to Admin-SDK-only. Two gaps remain: `users` (open, pending Firebase Auth) and `services` (no rule, breaks public reads in prod).

## 6. Storage rules — `storage.rules`

`allow read, write: if false` for all paths (`storage.rules:11-13`). Browser never uploads; resumes received by `/api/job-applications` and uploaded via Admin SDK. Resume viewing requires the signed-URL route. ✅

## 7. Contact data flow — `src/app/api/contact/route.ts` + `src/lib/email.ts`

Flow: Visitor → JSON parse → honeypot → zod validate → rate limit → dedupe fingerprint → **Firestore `leads` write** (source of truth) → `sendContactNotifications` (ack to submitter + company notification if `COMPANY_INBOX` set) → notification status written back to lead → 201 `{success, id, notification}`.

🔴 **G2 (privacy/truth):** the founder's PART J preference is that contact enquiries should **not** be stored in the website's persistent database/CRM — only delivered to the company Gmail inbox. The current implementation **stores every enquiry in Firestore `leads`** (with name, email, company, message, fingerprint). This is a direct conflict requiring an approved Phase 8 design change (either remove CRM storage, or make it opt-in, or retain per an explicit founder decision). The privacy policy must accurately reflect whatever retention decision is made.

⚠️ **No enquiry categories** (PART J requires 7 categories). ⚠️ **No consent checkbox** (PART J requires mandatory, non-preselected consent with links to Terms/Privacy).

`COMPANY_INBOX` unset → company notification returns `{status:'skipped', detail:'no-company-inbox'}` and is **never faked** (`email.ts:184-189`). Acknowledgement to submitter still attempts to send. ✅ (Honest behavior.)

## 8. Email processing — `src/lib/email.ts`

- Nodemailer, env-driven SMTP, **lazy transport** (import-time never throws; app always starts). ✅
- Local dev fallback to **Mailpit** when no `SMTP_HOST` and (`FIRESTORE_EMULATOR_HOST` set OR `NODE_ENV!=='production'`) (`email.ts:36-42,71-83`). ✅
- Production: `SMTP_HOST`+`SMTP_PORT`+`SMTP_SECURE`+`SMTP_USER`+`SMTP_PASS`+`SMTP_FROM`; if host set but creds missing → `smtp-incomplete` (transport null, sends return `skipped`); if no host and prod → `smtp-unconfigured`. ✅
- Branded HTML wrapper (`email.ts:127-147`), HTML-escaped submitter content (`escapeHtml`). ✅ No secrets logged; errors surfaced as short non-sensitive codes. ✅
- Resilience: lead stored **before** email send; failed email never discards lead; status recorded for retry (`api/contact/route.ts:84,106,133-137`). ✅
- 🔧 Production email requires `COMPANY_INBOX` (company Gmail, to be configured later) + SMTP creds. Until then company notification is skipped.

## 9. File handling — `src/app/api/job-applications/route.ts`

- `MAX_RESUME_BYTES = 5 * 1024 * 1024` (5 MB) (`route.ts:29`).
- `ALLOWED_RESUME_TYPES` = PDF, DOC, DOCX, plain text (`route.ts:30-35`).
- Filename sanitized: `replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,80)` (`route.ts:127`); stored at `resumes/<timestamp>_<sanitizedName>` via Admin SDK.
- 🔴 **G17: client/server mismatch.** `apply-job-modal.tsx:45-46` uses a **10 MB** client limit and slightly different accepted types than the server's 5 MB. A user may select a 7 MB file that passes client validation but is rejected by the server. Align both to 5 MB and the same type list.
- Resume access: signed URL only, 5-min TTL, admin-gated, strict path regex (see §4). ✅

## 10. Privacy & retention

### Current privacy policy — `src/app/privacy-policy/page.tsx`
Phase 1B rewrite exists on `develop` (live site 404s). Must be updated to accurately reflect PART J:
- What data is collected (contact: name/email/company/message; job applications: PII + resume; newsletter: email).
- Why collected (enquiry response, recruitment, updates).
- **Where contact enquiries are delivered** — currently to Firestore `leads` (CRM) AND optionally to `COMPANY_INBOX`. The policy must state this truthfully; it must NOT claim "data is never stored" if Firestore retention or mailbox retention means it is retained somewhere (PART J: "Do not claim that data is never stored if email delivery, infrastructure logs, or mailbox retention means it is retained somewhere.").
- Retention: Firestore documents persist until admin-deleted; mailbox retention per the company Gmail provider. Logs (`adminActivityLogs`) persist until admin-deleted.
- Access: admin (JWT-gated).
- Service providers: Firebase (Firestore/Storage), the SMTP/Gmail provider, Vercel (hosting). All process data.
- Deletion: how to request deletion (contact email).
- Job application data: stored in `jobApplications` + Storage resume; admin-managed.
- Newsletter data: stored in `newsletterSubscribers`; admin-managed.
- Cookies/analytics: cookie-consent system governs functional/performance/analytics/marketing; essential always on.

### Consent
🔴 No mandatory consent checkbox on contact form (G/R-J3). Job application modal does have `acceptTerms` (`apply-job-modal.tsx:72`) but contact does not.

## 11. Other security notes

- 🔴 **ChatSection client write to `jobApplications`** (`chat-section.tsx:246`) is blocked by `firestore.rules:67-70` → the "apply on behalf" path silently fails. Either remove the client write or route through `/api/job-applications`.
- ⚠️ `next.config.ts` disables TS and ESLint checks during build (`ignoreBuildErrors`, `ignoreDuringBuilds`) — type/lint regressions won't fail CI (G12: 39 TS errors currently masked).
- ⚠️ `vercel.json` references non-existent `src/app/api/genkit/**` (G19) — stale matcher.
- 🟡 OpenTelemetry exporters present (`@opentelemetry/exporter-jaeger`, `exporter-trace-otlp-http`) — not wired to a collector in this env; ensure no unintended trace export of PII in production.

## Severity summary

- 🔴 High: G2 (contact CRM storage vs founder preference), G14 (no CSRF), G15 (`users` open), G16 (`services` no rule → prod break), G17 (resume limit mismatch), G19/G20 (lesser but real).
- ⚠️ Medium: rate-limit single-instance, no admin CSRF beyond sameSite, middleware scope, admin dead links, build quality gates disabled, chat client-write blocked.
- 🟡 Info: OTEL exporters, `/aq-internal` rename pending (obscurity, not security).

## Recommendations (for later approved phases)

1. Add `Origin`/`Sec-Fetch-Site` same-origin checks (or CSRF tokens) to all POST routes; add CSRF tokens for admin mutations.
2. Add a Firestore read rule for `services` (public-read of `isActive && deletedAt==null`) **or** migrate service pages to a server route using the Admin SDK.
3. Adopt Firebase Auth for end-users so `users` can be locked to `request.auth.uid`.
4. Move rate limiting to Redis for multi-instance correctness.
5. Align client/server resume limits and accepted types.
6. Implement the founder's PART J contact-data decision; update the privacy policy to match retention truth.
7. Re-enable TS/ESLint in build; fix the 39 type errors.
