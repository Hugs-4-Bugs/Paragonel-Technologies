# Auth Implementation Plan — SMTP-OTP + Super Admin RBAC

**Status:** 🔜 PENDING implementation — this is the design contract for the
**next dedicated authentication/RBAC task**. It is NOT yet enforced by code.
The current admin auth (JWT + bcrypt password, fail-closed) remains in place
and **must keep working** until the dedicated task swaps the new system in.

**Authority:** `docs/FOUNDER_REQUIREMENTS.md` §15 (Admin CMS & authentication
direction). **Bootstrap Super Admin email:** `contact@prabhat.online` (founder-provided).

This plan exists so the next task can execute against a fixed contract instead
of re-deriving requirements. It deliberately does **not** introduce insecure
shortcuts, public Super-Admin signup, or any change to the working admin auth
until the full secure path is ready.

---

## 1. Current state (preserve until cutover)

| Concern | Current | File |
|---|---|---|
| Admin login | email + bcrypt password → JWT (HS256, 8h) in `qf_admin_token` httpOnly cookie; fail-closed (503 if env missing) | `src/app/api/admin/auth/login/route.ts` |
| Session verify | `jwtVerify` against `JWT_SECRET` (≥32 chars) | `src/app/api/admin/auth/me/route.ts`, `src/lib/admin-auth.ts` |
| Server authz | `verifyAdmin(request)` re-verifies the JWT on every `/api/admin/**` data route → `{ok, user:{email, role}}` or 401 | `src/lib/admin-auth.ts` |
| Audit | `logActivityServer(user, action, resourceType, resourceId)` → `adminActivityLogs` via Admin SDK | `src/lib/admin-auth.ts` |
| Firestore access | `getAdminDb()` (emulator when `FIRESTORE_EMULATOR_HOST` set; real service-account in prod, else null → 503) | `src/lib/firebase-admin.ts` |
| Env | `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`; `SMTP_*` already declared but unused by auth | `.env.example`, `.env.local` |

The current model is **single-admin, password-only, no OTP, no RBAC, no
rate-limiting, no user accounts**. That is the gap this plan closes.

## 2. Target hierarchy & roles

```
SUPER_ADMIN  →  ADMIN  →  RESTRICTED STAFF / CONTENT ROLES  →  REGISTERED USERS
```

- **SUPER_ADMIN** — exactly one at bootstrap (`contact@prabhat.online`). Can:
  create/disable admins; assign & revoke roles; manage permissions; restore
  disabled admins; manage users; review security & admin activity; manage
  password & account recovery. **No public Super-Admin registration.**
- **ADMIN** — full CMS + user-management scope, cannot manage other admins or
  change roles (unless granted by Super Admin).
- **RESTRICTED STAFF / CONTENT ROLES** — scoped roles, e.g. `content_editor`
  (blog/services/jobs), `hr` (jobs/applications), `leads_viewer` (read-only
  leads/newsletter). Permission = role → allowed resource+action map, checked
  server-side.
- **REGISTERED USERS** — end-users (e.g. AcquisitionOS waitlist, contact
  submitters) who authenticate with email + OTP, no admin scope.

## 3. Super Admin bootstrap (one-time, secure)

- Bootstrap is a **server-side, one-time** operation, not a public route. It
  runs only when the `superAdmins` collection is empty (first run) and is gated
  by a short-lived bootstrap token / console invocation — **never** an
  unauthenticated endpoint.
- Creates the Super Admin document for `SUPERADMIN_BOOTSTRAP_EMAIL`
  (`contact@prabhat.online`) with `role: super_admin`, `status: active`, and a
  forced first-login password setup (the Super Admin sets their own password via
  a secure, expiring, single-use setup link — not a hardcoded password).
- Subsequent bootstraps are no-ops (the collection is no longer empty). This
  prevents a second Super Admin from being created by re-running bootstrap.
- Forgotten-password recovery for Super Admin: secure recovery flow (OTP to the
  bootstrap email + a secondary verification factor TBD by the founder), never a
  public reset link.

## 4. SMTP OTP flow (users + admins)

Two OTP modes, same primitive:

1. **Request** `POST /api/auth/otp/request` `{ email, purpose }` —
   `purpose ∈ {signup, login, password_reset, admin_login, admin_step2}`.
   Server issues an HMAC-signed OTP request id (signed with `OTP_SECRET`) and
   emails a 6-digit code. The OTP is stored as a **bcrypt hash** (never
   plaintext) with `expiresAt` + `consumedAt` + `attemptCount`.
2. **Verify** `POST /api/auth/otp/verify` `{ otpRequestId, code }` — checks
   signature, expiry, not-consumed, attempt budget; on success marks consumed
   (single-use) and issues the appropriate session token.

**OTP properties (mandatory):**
- Expiring (default TTL 10 min; configurable).
- Single-use (consumed on first successful verify).
- HMAC-signed request id (verify the code was server-issued).
- Bcrypt-hashed at rest.
- Rate-limited per email + per IP (see §7).
- Attempt budget (e.g. max 5 wrong codes → request voided).

Admin login becomes **password + OTP** (two-step): step 1 password (existing
bcrypt path), step 2 OTP to the admin's verified email. A valid step-1 token is
short-lived (e.g. 5 min) and only authorizes step-2, not CMS access.

## 5. Data model (Firestore — Admin SDK only)

| Collection | Doc id | Key fields |
|---|---|---|
| `superAdmins` | email | `email`, `role: super_admin`, `status`, `createdAt`, `passwordHash` (post-setup), `recovery` |
| `adminUsers` | email | `email`, `role`, `status (active/disabled)`, `permissions[]`, `passwordHash`, `otpEmailVerified`, `createdAt`, `disabledAt?`, `disabledBy?` |
| `users` | email | `email`, `status`, `otpEmailVerified`, `createdAt`, `lastLoginAt` |
| `otpRequests` | requestId (HMAC-signed) | `emailHash`, `codeHash` (bcrypt), `purpose`, `expiresAt`, `consumedAt?`, `attemptCount`, `ipHash` |
| `adminActivityLogs` | auto | `adminEmail`, `action`, `resourceType`, `resourceId`, `timestamp` (existing) |
| `securityEvents` | auto | `type (login_success/login_failed/otp_issued/otp_failed/rate_limited/role_change/disabled)`, `email?`, `ip?`, `timestamp` |

All writes via `getAdminDb()` (Admin SDK bypasses rules). Firestore rules stay
locked (public cannot read/write these collections).

## 6. Sessions & RBAC

- Session = JWT (HS256, `JWT_SECRET`) with claims `{ sub: email, role, perms[], tier: admin|user }`,
  httpOnly cookie, short access TTL (e.g. 1h) + refresh path. Extend the existing
  `qf_admin_token` cookie pattern (do not introduce a second cookie scheme).
- `verifyAdmin(request)` is extended to `verifySession(request, requiredPermission?)`:
  returns `{ok, user:{email, role, perms, tier}}` or a 401/403. Existing
  `/api/admin/**` routes migrate from `verifyAdmin` → `verifySession('admin:<resource>:<action>')`.
- Permission checks are **server-side only**. UI hides actions for UX, never for
  security — every mutation route enforces its own permission.

## 7. Rate limiting & brute-force protection

- Per email + per IP windowed limits on: OTP request, OTP verify, login step-1.
- Exponential backoff after repeated failures; lockout threshold (e.g. 10 failed
  logins / 15 min → 15-min lockout + security event).
- Implementation: in-memory windowed counter for single-instance dev; for prod,
  a Firestore-backed or Upstash-backed counter (TBD by founder — no external
  dependency assumed here). Every limited request writes a `securityEvents` row.

## 8. Audit logging

- Extend `logActivityServer` → also write `securityEvents` for auth-sensitive
  actions (login/OTP/role change/disable/recovery). Existing `adminActivityLogs`
  semantics preserved (never blocks a successful mutation; surfaces failures).

## 9. Env requirements (contract ready in `.env.example`)

| Var | Purpose | Status |
|---|---|---|
| `JWT_SECRET` (≥32) | session signing | ✅ already used |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | current single-admin login (kept until cutover) | ✅ |
| `SUPERADMIN_BOOTSTRAP_EMAIL` | one-time Super Admin bootstrap (`contact@prabhat.online`) | ✅ documented in `.env.example` |
| `OTP_SECRET` (≥32) | HMAC-sign OTP request ids | ✅ documented in `.env.example` |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | outbound OTP email | ⚠️ declared; **founder must provide real SMTP credentials** — OTP email cannot be sent without them |
| `APP_BASE_URL` | links in OTP/setup emails | ✅ |
| `COMPANY_INBOX` | notifications | ✅ |

**Blocker for the OTP phase:** real SMTP credentials. In local dev the app can
fall back to Mailpit (`MAILPIT_SMTP_PORT`) for delivery inspection, but
production OTP requires the founder's SMTP creds. **No SMTP creds in Git** (`.env*`
gitignored).

## 10. Integration points (what the next task changes/adds)

**New (add):**
- `src/lib/auth/otp.ts` — OTP issue/verify (HMAC sign, bcrypt hash, TTL, single-use).
- `src/lib/auth/rbac.ts` — role→permission map, `verifySession(req, perm?)`.
- `src/lib/auth/rate-limit.ts` — windowed counters + lockout.
- `src/lib/auth/sessions.ts` — JWT issue/refresh (extends current pattern).
- `src/lib/auth/bootstrap.ts` — one-time Super Admin bootstrap (idempotent).
- `src/app/api/auth/otp/request/route.ts`, `…/verify/route.ts`.
- `src/app/api/auth/login/route.ts` (user OTP login) + admin two-step login.
- `src/app/api/admin/admins/route.ts` (+ `[id]`) — Super Admin manages admins.
- `src/app/api/admin/roles/route.ts` — role assignment/revocation.

**Change (carefully, preserve behavior until cutover):**
- `src/lib/admin-auth.ts` — `verifyAdmin` delegates to `verifySession`; keep the
  old export as a thin shim so existing callers compile until migrated.
- `src/app/api/admin/auth/login/route.ts` — add OTP step-2 (gate behind a feature
  flag / env so password-only still works during rollout).
- `src/middleware.ts` — extend page-gating to honor `tier`/`role` for admin pages.

**Do NOT touch:** `src/lib/firebase-admin.ts` credential logic, `firestore.rules`
lock state, the public CMS data routes' serialization (`toJsonValue`/`serializeDoc`).

## 11. Security checklist (non-negotiable)

- ✅ No secrets in Git (`.env*` gitignored; `OTP_SECRET`/`JWT_SECRET` generated).
- ✅ No public Super-Admin signup (bootstrap is server-side, one-time, idempotent).
- ✅ Fail-closed everywhere (missing env → 503; invalid session → 401; insufficient
  permission → 403; never a silent fallback).
- ✅ Server-side authorization on every mutation/read route (UI hiding is UX only).
- ✅ Expiring, single-use, HMAC-signed, bcrypt-hashed OTPs.
- ✅ Rate limiting + brute-force lockout + security event logging.
- ✅ Secure session cookies (httpOnly, SameSite, secure in prod), short TTL + refresh.
- ✅ Audit trail for all auth-sensitive actions.
- ✅ No insecure shortcuts: no plaintext OTPs at rest, no shared OTP secrets, no
  forever-valid setup tokens, no admin login without OTP (post-cutover).

## 12. Phased plan for the next dedicated task

1. **P1 — primitives:** `otp.ts`, `sessions.ts`, `rbac.ts`, `rate-limit.ts`,
   Firestore collections + rules review. Unit-test OTP sign/verify/expiry/single-use.
2. **P2 — user OTP auth:** `/api/auth/otp/{request,verify}` + user login +
   `users` collection. Wire SMTP (founder creds) / Mailpit fallback.
3. **P3 — Super Admin bootstrap:** `bootstrap.ts` (one-time, idempotent) for
   `contact@prabhat.online`; secure first-password setup flow.
4. **P4 — admin two-step login + RBAC migration:** extend `verifyAdmin` →
   `verifySession`; migrate `/api/admin/**` routes to permission checks; add
   admin-management + role-assignment routes (Super Admin only).
5. **P5 — hardening:** rate-limit/lockout tuning, audit + security-events
   review, recovery flows, middleware role gating. Cutover (retire
   password-only admin login) only after P1–P5 verified.

**What is explicitly deferred to that task:** all code in §10, the SMTP
credential wiring, the cutover that retires password-only admin login, and the
founder decisions still needed (recovery second factor, prod rate-limit store).
