#!/usr/bin/env bash
# resume-dev.sh — one-command recovery after a Z.ai workspace/container recycle.
#
# The dev-supervisor survives recoverable next-dev crashes but CANNOT survive
# container destruction (a recycle wipes node_modules, .env.local, the emulator's
# in-memory data, and every process). This wrapper runs the three resume steps
# in order so recovery is a single command:
#
#   1. restore dependencies        (only if node_modules/next is missing)
#   2. regenerate .env.local        (only if missing — no secrets committed)
#   3. start the supervised dev server (preflight -> cleanup -> emulator -> dev -> health)
#
# Usage:  bash scripts/resume-dev.sh
# Idempotent: safe to re-run when the server is already up (it will not duplicate).

set -u
cd "$(dirname "$0")/.."

echo "[resume] cwd=$(pwd)"

# 1. dependencies
if [ ! -d "node_modules/next" ]; then
  echo "[resume] node_modules missing — running npm install --legacy-peer-deps"
  npm install --legacy-peer-deps || { echo "[resume] FATAL: npm install failed"; exit 2; }
else
  echo "[resume] node_modules present"
fi

# 2. .env.local (gitignored; regenerated locally only)
if [ ! -f ".env.local" ]; then
  echo "[resume] .env.local missing — generating via scripts/gen-env-local.js"
  node scripts/gen-env-local.js || { echo "[resume] FATAL: gen-env-local failed"; exit 2; }
else
  echo "[resume] .env.local present"
fi

# 3. supervised dev server (preflight checks again; cleanup kills any stale dup)
echo "[resume] starting dev-supervisor.sh"
exec bash scripts/dev-supervisor.sh
