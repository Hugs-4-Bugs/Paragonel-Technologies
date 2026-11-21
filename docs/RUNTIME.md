# Runtime & Preview — Paragonel Technologies (local dev)

This documents how the local development server is kept alive, how to inspect
logs, how recovery works, what happens when the Z.ai workspace is recycled,
and how to restore the browser preview. It is the durable companion to
`scripts/dev-supervisor.sh`.

## Root cause of the "black loading screen" preview

The Z.ai preview displays a black loading screen when **no `next dev` process
is bound to the preview port (3000)**. In this environment the root cause is
**workspace/preview lifecycle**, not a crash, memory exhaustion, or port
conflict:

- Background processes started in one execution do **not** survive the end of
  the turn / a workspace recycle. When the workspace is recycled, the `next dev`
  process is terminated (the log ends with `Shutting down all Genkit
  servers...`) and nothing listens on port 3000, so the preview proxy has
  nothing to forward to.
- Memory is not the constraint (≈4 GB total, typically >2 GB free). Port
  conflicts and duplicate servers are prevented by the supervisor's cleanup
  step.

**Honest limitation:** no userspace supervisor (`pm2`, `nohup`, or this script)
can survive Z.ai **container destruction**. The mechanism below keeps ONE
authoritative server alive and self-healing **within a continuous execution**,
and gives a one-command resume after a recycle.

## How to start the application

```bash
cd /home/z/my-project/paragonel-technologies
bash scripts/dev-supervisor.sh
```

This single command:
1. Cleans any stale `next dev` / `next-server` / Firebase emulator processes
   and frees ports 3000 and 8080 (no duplicate servers).
2. Starts the Firebase Firestore emulator on `localhost:8080` (local data
   only; production uses real Firestore).
3. Starts `next dev --turbopack` on port 3000.
4. Polls `http://localhost:3000/api/health` until the server is confirmed
   alive, then **blocks supervising the process** until it exits.

Run it in a background terminal (or via the shell's background mechanism) so it
stays alive while you work.

## How persistence works

- **One authoritative server.** The supervisor kills stale `next dev` /
  emulator processes before starting, so there is never a duplicate.
- **Bounded restart with exponential backoff.** If `next dev` exits, the
  supervisor restarts it after a backoff (2 s, 4 s, 8 s, … capped at 30 s).
  It allows at most **5 restarts per 300 s window**; if exceeded, it **stops**
  rather than silently looping — so a real application error is never hidden by
  an infinite restart loop.
- **Health-check endpoint.** `GET /api/health` returns `200 {ok:true,...}`
  when the Next.js process is alive and routing works. The supervisor polls
  this to confirm recovery (not just port-binding).
- **Logging.** All stdout/stderr is appended to `logs/dev-server.log`; the
  Firebase emulator logs to `logs/firestore-emulator.log`; supervisor
  lifecycle messages are interleaved in `logs/dev-server.log`.

## How to inspect logs

```bash
# Supervisor + Next.js stdout/stderr (the main log)
tail -f logs/dev-server.log

# Firebase Firestore emulator
tail -f logs/firestore-emulator.log

# Quick health check
curl -s http://localhost:3000/api/health | jq .
```

## How recovery works

1. If `next dev` crashes (non-zero exit), the supervisor counts one restart,
   waits the backoff, cleans stale processes, restarts the emulator if needed,
   and starts `next dev` again.
2. It re-confirms `/api/health` before considering the server healthy.
3. After 5 crashes in 300 s it halts and logs `FATAL: exceeded MAX_RESTARTS…`
   — inspect `logs/dev-server.log` for the application error, fix it, then
   re-run the supervisor.

## What happens after workspace recycling

If the Z.ai workspace is **recycled/destroyed** (e.g. between sessions), every
process — including the supervisor — is gone. The preview will be black again.
This is expected and unavoidable for userspace processes. To restore:

1. Reopen the workspace.
2. Run:
   ```bash
   cd /home/z/my-project/paragonel-technologies
   bash scripts/dev-supervisor.sh
   ```
3. Wait for `dev server healthy` in `logs/dev-server.log` (typically 5–15 s).
4. Re-seed the local Firestore (emulator data is in-memory and does not
   survive a recycle):
   ```bash
   JAR=$(mktemp); curl -s -c "$JAR" -X POST http://localhost:3000/api/admin/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"admin@example.com","password":"TestAdmin123!"'} >/dev/null
   COOKIE=$(grep -oE 'qf_admin_token[[:space:]]+[^[:space:]]+' "$JAR" | awk '{print $2}')
   curl -s -H "Cookie: qf_admin_token=$COOKIE" -X POST http://localhost:3000/api/admin/seed
   rm -f "$JAR"
   ```
5. Refresh the Z.ai preview.

## How to restore the preview

The Z.ai preview proxies to `http://localhost:3000`. If the preview is black:

```bash
curl -s http://localhost:3000/api/health   # 200 + JSON = server alive
```

- **200** → the server is up; the issue is the preview proxy. Refresh the
  preview / re-open the workspace tab. If it stays black, restart the
  supervisor (one command, above).
- **connection refused** → no server. Run the supervisor.

## Admin CMS credentials (LOCAL DEV ONLY)

`.env.local` (gitignored) sets `ADMIN_PASSWORD_HASH` — a bcrypt hash of the
local test password `TestAdmin123!`, with email `admin@example.com` (from
`.env`). **These are dev-only credentials; never reuse in production.**
Production uses Vercel environment variables.

Note: the bcrypt hash contains literal `$` characters. In `.env.local` each `$`
is escaped as `\$` because `@next/env` (dotenv-expand) otherwise treats
`$QloZY…` as a variable reference and mangles the hash. Do not un-escape them.

## Production vs local

- **Local dev**: `next dev` + Firestore emulator + the supervisor. Not deployed.
- **Production**: Vercel builds `develop` on push and deploys to
  `paragonel.vercel.app`. Vercel and the local dev preview are **independent
  environments** — a local server crash never affects production, and a Vercel
  deploy does not require the local server.

## Do not

- Do not run two `next dev` instances on port 3000 (the supervisor prevents
  this; do not start a second one manually).
- Do not commit `.env.local` (it is gitignored via `.env*`).
- Do not assume the supervisor survives container destruction — re-run it.
- Do not silence the restart cap; a halt means there is a real error to fix.
