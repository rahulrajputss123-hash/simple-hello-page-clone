#!/bin/bash
# Launches the CashGPT (TanStack Start) dev server for the Emergent preview.
# Loads /app/.env into the process environment so server functions can read
# process.env (Gemini + Supabase keys), then serves on port 3000 (ingress target).
set -e

if [ -f /app/.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /app/.env
  set +a
fi

export PATH="/root/.bun/bin:$PATH"
cd /app
# Run vite under the bun runtime (`--bun`): bun provides a global WebSocket,
# which supabase-js realtime requires (Node 20 lacks it and breaks auth server fns).
exec bun --bun run dev --port 3000
