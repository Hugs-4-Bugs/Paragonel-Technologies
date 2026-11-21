#!/usr/bin/env bash
# dev-supervisor.sh — Phase 3 P0-A2: persistent, supervised Next.js dev server.
#
# Root cause being addressed: the Z.ai preview shows a black loading screen
# because the `next dev` process is terminated when the workspace/turn ends
# and nothing is bound to the preview port. This supervisor keeps ONE
# authoritative dev server alive WITHIN a continuous execution, with:
#   - stale-process / port cleanup (no duplicate servers)
#   - Firebase Firestore emulator (local data only)
#   - bounded restart with exponential backoff (no silent restart loops)
#   - health-check polling via /api/health
#   - stdout/stderr logging to logs/dev-server.log
#
# IMPORTANT (honest limitation): no userspace supervisor (pm2/nohup/this
# script) can survive Z.ai workspace CONTAINER DESTRUCTION. If the workspace
# is recycled, re-run this script. See docs/RUNTIME.md for the resume procedure.

set -u
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
FIRESTORE_PORT=8080
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/dev-server.log"
EMULATOR_LOG="$LOG_DIR/firestore-emulator.log"
mkdir -p "$LOG_DIR"

# Bounded restart policy: at most MAX_RESTARTS within WINDOW_SECONDS.
MAX_RESTARTS=5
WINDOW_SECONDS=300
restart_count=0
window_start=$(date +%s)

log() { printf '[supervisor %s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$LOG_FILE" >&2; }

# Pre-flight: fail fast with a clear message instead of looping to the restart
# cap when the workspace was recycled and node_modules / .env.local are gone.
# (fuser is also absent on this image — port cleanup below uses ss instead.)
preflight() {
  if [ ! -d "node_modules/next" ]; then
    log "FATAL: node_modules missing (workspace recycled). Run: bash scripts/resume-dev.sh"
    exit 2
  fi
  if [ ! -f ".env.local" ]; then
    log "WARN: .env.local missing — admin auth will 503 and client firebase config may throw. Regenerate it (see docs/RUNTIME.md). Continuing."
  fi
}

# Resolve the PID listening on a TCP port using ss (fuser is unavailable on this
# image). Returns the first PID on stdout, empty if none/free.
port_pid() {
  local port="$1"
  ss -ltnp 2>/dev/null | grep -E ":${port}\b" \
    | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2
}

cleanup_stale() {
  log "cleanup: killing stale next / firebase processes on ports $PORT / $FIRESTORE_PORT"
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "next-server" 2>/dev/null || true
  pkill -f "firebase emulators" 2>/dev/null || true
  # free the ports if anything still holds them (ss-based; fuser is not installed)
  for p in "$PORT" "$FIRESTORE_PORT"; do
    local pid
    pid=$(port_pid "$p")
    [ -n "$pid" ] && { log "port $p held by pid $pid — killing"; kill "$pid" 2>/dev/null || true; }
  done
  sleep 2
}

start_emulator() {
  if curl -sf "http://localhost:$FIRESTORE_PORT/" -o /dev/null --max-time 2 2>/dev/null; then
    log "firestore emulator already running on $FIRESTORE_PORT"
    return 0
  fi
  log "starting firestore emulator on $FIRESTORE_PORT"
  nohup node_modules/.bin/firebase emulators:start --only firestore --project paragonel-dev \
    > "$EMULATOR_LOG" 2>&1 &
  local i
  for i in $(seq 1 30); do
    curl -sf "http://localhost:$FIRESTORE_PORT/" -o /dev/null --max-time 2 2>/dev/null && { log "emulator ready (${i}s)"; return 0; }
    sleep 1
  done
  log "ERROR: emulator did not become ready in 30s — continuing anyway (static fallbacks apply)"
  return 1
}

health_ok() {
  curl -sf "http://localhost:$PORT/api/health" -o /dev/null --max-time 5 2>/dev/null
}

start_dev() {
  log "starting next dev on port $PORT (turbopack)"
  PORT="$PORT" npm run dev >> "$LOG_FILE" 2>&1 &
  local dev_pid=$!
  log "next dev pid=$dev_pid — waiting for /api/health (up to 90s)"
  local i
  for i in $(seq 1 90); do
    if health_ok; then log "dev server healthy (${i}s) — supervising until exit"; break; fi
    # if the process died already, stop waiting
    if ! kill -0 "$dev_pid" 2>/dev/null; then log "next dev exited before health check"; return 1; fi
    sleep 1
  done
  if ! health_ok; then log "ERROR: dev server did not pass health check in 90s"; return 1; fi

  # BLOCK here until the dev server process actually exits. This is the key
  # fix: the previous version returned immediately after health passed, so the
  # main loop mistook a healthy, still-running server for a crash and restarted
  # it in a backoff loop. By waiting on dev_pid we only return when it really
  # exits — which is the only condition that should trigger a restart.
  wait "$dev_pid"
  local rc=$?
  log "next dev (pid=$dev_pid) exited with rc=$rc"
  return "$rc"
}

# --- main ---
preflight
cleanup_stale
start_emulator || true

while true; do
  now=$(date +%s)
  # reset the restart window if we have been up longer than the window
  if [ $((now - window_start)) -gt $WINDOW_SECONDS ]; then
    restart_count=0
    window_start=$now
  fi

  if [ "$restart_count" -ge "$MAX_RESTARTS" ]; then
    log "FATAL: exceeded $MAX_RESTARTS restarts in ${WINDOW_SECONDS}s — stopping to avoid a silent restart loop. Inspect $LOG_FILE."
    exit 1
  fi

  start_dev
  # start_dev blocks until the dev server exits; reaching here means it crashed.
  log "dev server exited — counting as crash for restart-budget purposes"
  restart_count=$((restart_count + 1))
  backoff=$(( 2 ** restart_count ))
  [ "$backoff" -gt 30 ] && backoff=30
  log "restart #$restart_count in ${backoff}s (backoff)"
  sleep "$backoff"
  cleanup_stale
  start_emulator || true
done
