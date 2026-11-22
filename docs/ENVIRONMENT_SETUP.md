# Environment Setup — Paragonel Technologies

This document is the complete handoff for configuring every environment variable
the application needs, plus the external (non-code) setup that environment
variables alone cannot cover. The goal: the founder can fill in the variables
and configure the corresponding Firebase / email / CAPTCHA / AI resources
without hunting through source code.

A startup validation module (`src/lib/env-validation.ts`, wired via
`src/instrumentation.ts`) prints a non-sensitive summary of missing/empty
required variables on every server boot — so misconfigurations are visible
immediately instead of surfacing as mysterious per-route 500/503 errors.

---

## 1. Two files you need

| File | Purpose | Committed? |
| --- | --- | --- |
| `.env.example` | Placeholders only — documents every variable the code reads. Copy it to start. | Yes (tracked) |
| `.env.local` | Your real local values. The dev server reads this automatically. | No (gitignored) |
| `.env.template` | A blank, founder-facing template (same variables, shorter notes). | Yes (tracked) |

**Never commit a `.env` or `.env.local` containing real secrets.** The
`.gitignore` already excludes them. If you accidentally commit a secret,
rotate it immediately — git history is permanent.

---

## 2. Variable reference

Each variable is marked **Public** (safe to expose to the browser, prefixed
`NEXT_PUBLIC_`) or **Secret** (server-only, never in `NEXT_PUBLIC_*`).

### 2.1 Security (auth) — REQUIRED always

| Variable | Public/Secret | Where to obtain | Local value | Vercel |
| --- | --- | --- | --- | --- |
| `JWT_SECRET` | Secret | Generate: `openssl rand -hex 32` | random 32+ chars | Project → Settings → Environment Variables |
| `OTP_SECRET` | Secret | Generate: `openssl rand -hex 32` | random 32+ chars | same |
| `SUPERADMIN_BOOTSTRAP_EMAIL` | Public-ish (not secret, not `NEXT_PUBLIC_`) | The founder email that may bootstrap the first super_admin | `contact@prabhat.online` | same |

`JWT_SECRET` signs session JWTs (candidate + admin). `OTP_SECRET` signs OTP
request IDs and the one-click unsubscribe tokens (job-alerts + newsletter).
Both MUST be ≥32 characters. If either is missing or too short, all auth
routes fail closed (500) — by design, never silently insecure.

### 2.2 Firebase client config — REQUIRED always (public-by-design)

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Firebase console → Project settings → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | `<project>.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | Firebase console → Web app |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Firebase console → Web app |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Public (optional) | Firebase console → Analytics |

These identify the Firebase project to the client SDK. They are public by
design (they're embedded in the browser bundle) — security is enforced by
Firestore/Storage rules + the Admin SDK, not by hiding these values.

### 2.3 Firebase Admin SDK — REQUIRED in production (optional locally)

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `FIREBASE_ADMIN_PROJECT_ID` | Secret | Firebase console → Project settings → Service accounts |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Secret | Same (service-account email) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Secret | Same (private key — paste with `\n` escapes) |

**Local dev:** you do NOT need these. Set `FIRESTORE_EMULATOR_HOST` instead
(§2.7) and the Admin SDK connects to the emulator without credentials.

**Production:** generate a service account key (JSON) from the Firebase console
→ Project settings → Service accounts → Generate new private key. Set the three
variables above from that JSON. The private key must have its newlines escaped
as `\n` (the JSON file already has them escaped; paste carefully).

### 2.4 Email / SMTP — optional (dev falls back to Mailpit)

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `SMTP_HOST` | Secret | Your SMTP provider (e.g. `smtp.resend.com`, `smtp.gmail.com`) |
| `SMTP_PORT` | Secret | `587` (STARTTLS) or `465` (TLS) |
| `SMTP_SECURE` | Secret | `true` for port 465, `false` for 587 |
| `SMTP_USER` | Secret | SMTP username (API key for Resend) |
| `SMTP_PASS` | Secret | SMTP password / API key |
| `SMTP_FROM` | Secret | Verified sender: `Paragonel <noreply@yourdomain.com>` |
| `COMPANY_INBOX` | Secret | Real company inbox for enquiry notifications |
| `APP_BASE_URL` | Public-ish | `http://localhost:3000` (dev) / `https://yourdomain.com` (prod) |

**Provider choice:** the app uses **Nodemailer over generic SMTP**. Resend,
AWS SES, SendGrid, or a self-hosted SMTP all work — pick ONE and configure its
SMTP credentials above. Do not configure multiple competing providers.

**Verified sender domain:** whichever provider you choose, you MUST verify the
sending domain (e.g. `yourdomain.com`) in the provider's dashboard (DNS TXT/CNAME
records). `SMTP_FROM` must use an address on a verified domain. Without domain
verification, the provider rejects outbound mail — the app reports `failed`
honestly, it does not fake success.

**Local dev:** leave `SMTP_HOST` empty and the app falls back to Mailpit
(`localhost:1025`) — generated emails are inspectable in Mailpit's web UI at
`http://localhost:8025` without reaching any real mailbox.

### 2.5 AI (Genkit / Google Gemini) — optional (chatbot + resume parse)

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `GEMINI_API_KEY` | Secret | Google AI Studio → Get API key (`https://aistudio.google.com/app/apikey`) |
| `GOOGLE_API_KEY` | Secret | Alternative — Genkit accepts either |

Required for: the Paragonel AI chatbot, resume parsing, and tech-news flows.
If empty, the chatbot returns an honest fallback message for every question
and resume parsing is skipped (the resume is still stored; the candidate fills
the profile manually). This is the current state of `.env.local` — the chatbot
is wired correctly but returns fallbacks until a key is provided.

### 2.6 CAPTCHA (Cloudflare Turnstile) — REQUIRED in production

| Variable | Public/Secret | Where to obtain |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Cloudflare dashboard → Turnstile → Add site |
| `TURNSTILE_SECRET_KEY` | Secret | Same (the secret key, server-only) |

Without these, production registration + login fail closed (the server cannot
verify the CAPTCHA). **Local dev** automatically uses Turnstile test mode
(always passes) when the keys are absent, so local auth works without them.

### 2.7 Local dev only (NEVER set in production)

| Variable | Purpose |
| --- | --- |
| `FIRESTORE_EMULATOR_HOST` | `localhost:8080` — routes Admin SDK to the emulator |
| `STORAGE_EMULATOR_HOST` | `localhost:9199` — routes Storage to the emulator |
| `MAILPIT_HOST` | `localhost` — Mailpit SMTP host (fallback when no SMTP_HOST) |
| `MAILPIT_SMTP_PORT` | `1025` — Mailpit SMTP port |

These are set automatically by `scripts/dev-supervisor.sh` for local dev. NEVER
set them in Vercel — they would point production traffic at nonexistent local
services.

---

## 3. External setup (cannot be done with environment variables alone)

Environment variables are necessary but NOT sufficient. The following must be
configured in the respective provider consoles:

### 3.1 Firebase project (production)

1. Create a Firebase project at `https://console.firebase.google.com`.
2. Add a Web app → copy the client config into the `NEXT_PUBLIC_FIREBASE_*` vars.
3. Enable Firestore (production mode) + deploy rules:
   `firebase deploy --only firestore:rules,firestore:indexes,storage`.
4. Create the Storage bucket ( Blaze plan required for Storage + signed URLs).
5. Generate a service-account key → set `FIREBASE_ADMIN_*` vars.
6. The Firestore rules in this repo (`firestore.rules`, `storage.rules`) deny
   ALL client access by default — every read/write goes through the Next.js
   API routes via the Admin SDK. Do not loosen them.

### 3.2 Email provider (production)

1. Pick ONE provider (Resend recommended — simple, generous free tier).
2. Verify the sending domain in the provider dashboard (add the DNS records
   they show you — typically SPF, DKIM, DMARC TXT/CNAME records).
3. Create an API key / SMTP credential → set `SMTP_USER` + `SMTP_PASS`.
4. Set `SMTP_FROM` to an address on the verified domain.
5. Set `COMPANY_INBOX` to a real inbox the founder monitors (enquiry
   notifications go here).

### 3.3 Cloudflare Turnstile (production)

1. Create a Turnstile widget at `https://dash.cloudflare.com` → Turnstile.
2. Copy the site key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. Copy the secret key → `TURNSTILE_SECRET_KEY`.

### 3.4 Google AI (Gemini) key

1. Get a key at `https://aistudio.google.com/app/apikey`.
2. Set `GEMINI_API_KEY`. The chatbot + resume parser start working immediately.

### 3.5 Vercel (production hosting)

1. Import the GitHub repo into Vercel.
2. Set every **Secret** + **Public** variable above in
   Project → Settings → Environment Variables (Production environment).
   Do NOT set the §2.7 local-dev vars.
3. Set `APP_BASE_URL` to the production URL.
4. Deploy. The startup env-validation summary appears in the Vercel function
   logs on cold start — check it for any `problems=` count > 0.
5. If Vercel Deployment Protection is enabled, set it to "Production only"
   (Preview protection blocks the founder from viewing preview deploy logs
   without SSO).

---

## 4. Local development quickstart

```bash
# 1. Install dependencies
npm install

# 2. Copy the template + fill in the required local values
cp .env.example .env.local
# Edit .env.local:
#   - JWT_SECRET / OTP_SECRET: generate with `openssl rand -hex 32`
#   - SUPERADMIN_BOOTSTRAP_EMAIL: contact@prabhat.online
#   - NEXT_PUBLIC_FIREBASE_*: from your Firebase web app (or dev project)
#   - GEMINI_API_KEY: optional — chatbot works only with a real key
#   - Leave SMTP_* empty to use Mailpit for local email

# 3. Start the supervised dev server (Firestore emulator + Next.js + health check)
bash scripts/dev-supervisor.sh
# → http://localhost:3000  (app)
# → http://localhost:8080  (Firestore emulator)
# → http://localhost:8025  (Mailpit web UI — inspect sent emails)

# 4. Bootstrap the first super_admin (one-time):
#    Visit /admin/bootstrap with SUPERADMIN_BOOTSTRAP_EMAIL set.
```

The startup env-validation logs a summary like:
```
[env-validation] mode=local-dev (emulator)  problems=3  checked=24
[env-validation] Missing or not-configured variables (values are NOT shown):
  - GEMINI_API_KEY [AI] status=empty len=1-7  → ...
  - TURNSTILE_SECRET_KEY [CAPTCHA] status=missing  → ...
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY [CAPTCHA] status=missing  → ...
```
This is expected in local dev — those features degrade honestly (chatbot
fallback, CAPTCHA test mode) rather than crash.

---

## 5. Verifying your configuration

After filling in variables, verify with:

```bash
# TypeScript + build (must pass with no errors)
npm run typecheck && npm run build

# Unit + integration tests (Firestore emulator must be running)
npm run test

# Boot the app + check the env-validation summary in the startup log
bash scripts/dev-supervisor.sh
# then in another terminal:
curl http://localhost:3000/api/health   # → 200 { ok: true, ... }
```

For production: after deploying to Vercel, check the function logs for the
`[env-validation]` line. `problems=0` means every required variable for the
production environment is configured.

---

## 6. Security rules (do not weaken)

- Every Firestore collection holding PII (`users`, `admins`, `candidates`,
  `jobApplications`, `leads`, `newsletterSubscribers`, `otpRequests`,
  `sessions`, `securityEvents`, `registrationChallenges`) is client-denied
  (`allow read, write: if false`). All access is via Admin-SDK API routes
  with JWT + ownership/role checks.
- Firebase Storage is fully client-denied. Resumes are accessible only via
  short-lived (5-minute) signed URLs issued by authenticated server routes.
- No plaintext secrets, OTPs, or passwords are stored in Firestore. OTPs are
  bcrypt-hashed; passwords are bcrypt-hashed; IPs are HMAC-hashed.

Do not loosen these rules to make something work. If a feature cannot work
under the current rules, the fix is a server route with proper authorization,
not a rule change.
