#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Moodboard dev — persistent mode (auto-restart on exit)"
while true; do
  echo "[$(date -Iseconds)] Starting Vite on port 5173..."
  npm run dev -- --host --port 5173 --strictPort || true
  echo "[$(date -Iseconds)] Vite stopped. Restarting in 2s..."
  sleep 2
done
