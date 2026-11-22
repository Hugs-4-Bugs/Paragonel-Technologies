#!/usr/bin/env bash
# finalize-dev-session.sh — MANDATORY post-implementation finalization (Prompt 05G).
#
# Every implementation batch MUST end with this script (or the equivalent manual
# steps). It guarantees ONE authoritative local dev server is running + healthy
# before the task is declared complete, so the founder never has to ask "restart
# the server".
#
# What it does:
#   1. Verify repo root + that dependencies/env are present (recover if not).
#   2. Detect an existing HEALTHY authoritative server on :3000.
#      - If healthy: do NOT start a duplicate (avoids port conflicts / double
#        Next.js processes). Just verify the requested route.
#      - If unhealthy/absent: start scripts/resume-dev.sh (which restores deps
#        via `npm ci`, regenerates .env.local, starts the emulator + supervisor,
#        and waits for /api/health). The Firestore emulator is preserved.
#   3. Verify GET /api/health -> 200.
#   4. Verify the requested route (default /) -> 200.
#   5. Print a clear SUCCESS / FAILURE result + tail of the supervisor log.
#
# Usage:
#   bash scripts/finalize-dev-session.sh            # checks /
#   bash scripts/finalize-dev-session.sh /blog      # checks /blog
#
# Limitation: a userspace process cannot survive workspace/container destruction.
# If the workspace has been destroyed, this script (run in the NEW workspace)
# performs full recovery via resume-dev.sh. It never claims permanent hosting.

set -u
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
ROUTE="${1:-/}"
PORT=3000
HEALTH="http://localhost:${PORT}/api/health"
ROUTE_URL="http://localhost:${PORT}${ROUTE}"
LOG_DIR="${ROOT}/logs"
mkdir -p "$LOG_DIR"

ok()   { echo "[finalize] OK   $*"; }
warn() { echo "[finalize] WARN  $*"; }
fail() { echo "[finalize] FAIL  $*"; exit 1; }
info() { echo "[finalize]      $*"; }

echo "[finalize] repo root: $ROOT"
echo "[finalize] target route: $ROUTE"

# 1. dependencies + env (recover if missing — workspace may have been recycled)
if [ ! -d "node_modules/next" ] || [ ! -f ".env.local" ]; then
  warn "runtime missing (node_modules or .env.local absent) — full recovery via resume-dev.sh"
  bash scripts/resume-dev.sh > "$LOG_DIR/finalize-resume.log" 2>&1 &
  RESUME_PID=$!
  info "resume-dev.sh started (pid $RESUME_PID); waiting for health..."
else
  # 2. detect existing healthy authoritative server on :3000
  if curl -sf "$HEALTH" --max-time 5 >/dev/null 2>&1; then
    ok "existing healthy server detected on :${PORT} — not starting a duplicate"
  else
    warn "no healthy server on :${PORT} — starting resume-dev.sh (preserves emulator if up)"
    # resume-dev.sh execs the supervisor which blocks; run it in the background.
    nohup bash scripts/resume-dev.sh > "$LOG_DIR/finalize-resume.log" 2>&1 &
    RESUME_PID=$!
    info "resume-dev.sh started (pid $RESUME_PID); waiting for health..."
  fi
fi

# 3. wait for /api/health (max ~140s: emulator 30s + next dev 60s + buffer)
HEALTHY=0
for i in $(seq 1 28); do
  if curl -sf "$HEALTH" --max-time 6 >/dev/null 2>&1; then
    HEALTHY=1
    ok "/api/health -> 200 (attempt $i, ~$((i*5))s)"
    break
  fi
  sleep 5
done
[ "$HEALTHY" = "1" ] || fail "/api/health did not return 200 within ~140s. Tail of supervisor log:" && tail -20 "$LOG_DIR/supervisor.log" 2>/dev/null

# 4. verify the requested route
RC=$(curl -s -o /dev/null -w '%{http_code}' --max-time 40 "$ROUTE_URL")
[ "$RC" = "200" ] || fail "$ROUTE -> HTTP $RC (expected 200). Tail of supervisor log:" && tail -20 "$LOG_DIR/supervisor.log" 2>/dev/null
ok "$ROUTE -> HTTP 200"

# 5. confirm exactly one next-server process (no silent duplicates)
NEXT_COUNT=$(pgrep -fc 'next-server|next dev' 2>/dev/null || echo 0)
if [ "$NEXT_COUNT" -gt 1 ]; then
  warn "$NEXT_COUNT next processes running — investigate (supervisor should keep ONE)"
else
  ok "single authoritative next process ($NEXT_COUNT)"
fi

echo ""
echo "[finalize] ────────────────────────────────────────────────"
echo "[finalize]  SUCCESS — dev server healthy, $ROUTE -> 200"
echo "[finalize]  local preview: http://localhost:${PORT}${ROUTE}"
echo "[finalize]  durable preview: Vercel deployment on develop (separate)"
echo "[finalize] ────────────────────────────────────────────────"
