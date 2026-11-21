# Runtime & Preview — Paragonel Technologies

This documents the **four distinct environments** for Paragonel and exactly what
survives a Z.ai workspace/turn boundary. The single most important fact:

> **A local `next dev` process is NOT durable hosting.** It dies when the Z.ai
> workspace/turn ends. The website the founder can open at any time — without an
> active Z.ai execution — is the **Vercel deployment**, not the local process.

## A. Local Z.ai development server (NOT durable)

`scripts/dev-supervisor.sh` keeps ONE authoritative `next dev --turbopack` alive
**only while the Z.ai workspace/turn is active**. It is for development, not for
hosting the site.

```bash
cd /home/z/my-project/paragonel-technologies
bash scripts/dev-supervisor.sh
```

It: runs a **pre-flight** (fails fast with a clear message if `node_modules` is
missing, warns if `.env.local` is missing — instead of looping to the restart
cap); cleans stale processes/ports with **`ss`** (this image has no `fuser`);
starts the Firebase Firestore emulator on `:8080`; starts `next dev` on `:3000`;
polls `GET /api/health` (`200 {ok:true,…}`) until alive; then **blocks
supervising the process**. On a crash it restarts with exponential backoff
(2 s, 4 s, …, cap 30 s), max **5 restarts per 300 s** — then **halts** rather
than silently looping. Logs: `logs/dev-server.log`, `logs/firestore-emulator.log`,
`logs/supervisor.log`.

**This survives recoverable process crashes. It does NOT survive workspace
recycling.** After a recycle, `node_modules` and `.env.local` are typically gone
(the git repo + committed code survive). Full recovery, in order:

```bash
cd /home/z/my-project/paragonel-technologies
# 1. restore dependencies (if node_modules is missing — supervisor preflight enforces this)
[ -d node_modules/next ] || npm install
# 2. regenerate the gitignored .env.local (JWT_SECRET + bcrypt hash + emulator host +
#    dev-placeholder firebase public vars). No secrets are committed; this script is
#    the recovery path for .env.local. Committed in the repo (portable; resolves the
#    repo root from __dirname).
node scripts/gen-env-local.js
# 3. start the supervised dev server (preflight -> cleanup -> emulator -> next dev -> health)
bash scripts/dev-supervisor.sh
```

Then re-seed the emulator (emulator data is in-memory):

```bash
JAR=$(mktemp); curl -s -c "$JAR" -X POST http://localhost:3000/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"TestAdmin123!"'} >/dev/null
COOKIE=$(grep -oE 'qf_admin_token[[:space:]]+[^[:space:]]+' "$JAR" | awk '{print $2}')
curl -s -H "Cookie: qf_admin_token=$COOKIE" -X POST http://localhost:3000/api/admin/seed
rm -f "$JAR"
```

`scripts/gen-env-local.js` writes `.env.local` with mode `0600`: a strong random
`JWT_SECRET` (64 chars), `ADMIN_EMAIL=admin@example.com`, a bcrypt hash of the dev
password `TestAdmin123!` (literal `$` escaped as `\$` so dotenv-expand does not
mangle `$2a`/`$10`/`$<rest>`), `FIRESTORE_EMULATOR_HOST=localhost:8080`, and
NON-EMPTY dev-placeholder `NEXT_PUBLIC_FIREBASE_*` values (so
`src/firebase/config.ts` does not throw at module load). `SMTP_*` are left empty
— real SMTP credentials are the founder's to provide for the SMTP-OTP auth phase.

## B. Z.ai workspace / session lifecycle

- Background processes (the supervisor included) **do not survive the end of a
  turn or a workspace recycle.** This is the root cause of the "black loading
  screen" Z.ai preview: when the workspace recycles, `next dev` is terminated,
  nothing binds to `:3000`, and the Z.ai preview proxy has nothing to forward
  to.
- There is **no Z.ai-supported persistent application/session hosting** that
  outlives the workspace. PM2/nohup cannot survive container destruction.
- The Z.ai preview proxies to `http://localhost:3000`. A `200` from localhost or
  a running PID proves the local process is up — **not** that the founder can
  reach the site after the workspace ends.
- **What survives a turn boundary:** the git repository (under
  `/home/z/my-project/`), committed code, and the **Vercel deployments** (C/D).
- **What does not:** every process, the Firestore emulator's in-memory data,
  and the `localhost:3000` preview.

## C. Independent Vercel Preview deployment (durable — develop)

This is the durable preview of the latest `develop` code. It is created
**automatically by the GitHub ↔ Vercel integration on every push to `develop`**
— no local process required, survives workspace recycling.

- Vercel project: `hugs4bugs-projects/paragonel-technologies`.
- Environment: **Preview**. Branch: `develop`.
- Build status is posted back to GitHub as a commit status
  (`Vercel → success`) and a GitHub Deployment (`environment=Preview`).

**Find the latest Preview URL** (no Vercel token needed — uses the GitHub API):

```bash
# latest deployment on develop
DEPID=$(curl -s -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/Hugs-4-Bugs/Paragonel-Technologies/deployments?per_page=1" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
curl -s -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/Hugs-4-Bugs/Paragonel-Technologies/deployments/$DEPID/statuses?per_page=1" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['environment_url'])"
```

The URL looks like
`https://paragonel-technologies-<hash>-hugs4bugs-projects.vercel.app`.

### ⚠️ Blocker: the Preview is gated (Vercel Authentication)

Vercel **Deployment Protection** is enabled, so the Preview redirects anonymous
visitors to `https://vercel.com/login`. **Vercel project team members** (the
founder) can open it after logging into Vercel; anonymous visitors cannot.

This sandbox has **no Vercel token** (`vercel whoami` → Logged out), so the
agent **cannot disable Deployment Protection or create a public alias** from
here. That is the precise blocker for an *anonymous*-public develop preview.

**One-step fix (founder, in the Vercel dashboard):**
Vercel → Project `paragonel-technologies` → **Settings → Security → Deployment
Protection** → set "Vercel Authentication" to **Production only** (or off). The
develop Preview then becomes anonymously accessible at the URL above. (Or
provide a Vercel token and the agent can do it via the Vercel REST API
`PATCH /v9/projects/{id}`.)

## D. Production deployment (public — master)

- URL: **https://paragonel.vercel.app/** — publicly accessible, durable, renders
  the real application (verified: HTTP 200, no auth gate, h1
  "Paragonel Technologies").
- Branch: **`master`** (the GitHub Deployments API confirms Production
  deployments come from `master`, e.g. `d3ddcc9` — **not** `develop`). `develop`
  deploys to Preview only.
- **Do not** promote `develop` to production or merge into `master` without an
  explicit, verified release decision. `master`/`main` must not be touched from
  the agent.
- Production uses real Firestore / Vercel environment variables — **not** the
  local emulator and **not** `.env.local`.

## Quick reference — which URL for what

| Need | URL | Durable? | Public? |
|---|---|---|---|
| Open the live website now (anyone) | https://paragonel.vercel.app/ | ✅ | ✅ (master code) |
| See latest `develop` code (Vercel team) | Preview URL from §C | ✅ | gated (log in to Vercel) |
| Local editing / dev crashes | http://localhost:3000 (supervisor) | ❌ (turn-bound) | localhost only |

## Admin CMS credentials (LOCAL DEV ONLY)

`.env.local` (gitignored) sets `ADMIN_PASSWORD_HASH` — a bcrypt hash of the dev
password `TestAdmin123!`, email `admin@example.com` (from `.env`). Dev-only;
production uses Vercel env vars. The bcrypt hash contains literal `$`; in
`.env.local` each `$` is escaped as `\$` (else `@next/env`/dotenv-expand mangles
`$QloZY…` into an empty variable). Do not un-escape.

## Do not

- Do not treat the local supervisor as permanent hosting — it is not.
- Do not run two `next dev` instances on `:3000`.
- Do not commit `.env.local` (gitignored via `.env*`).
- Do not disable the supervisor's restart cap; a halt means a real error.
- Do not promote `develop` to production or touch `master`/`main`.
- Do not assume the develop Preview is anonymous-public until Deployment
  Protection is changed.
