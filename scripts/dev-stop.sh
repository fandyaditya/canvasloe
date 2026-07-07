#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PIDFILE=".dev-server.pid"

if [[ ! -f "$PIDFILE" ]]; then
  echo "No pid file — dev server may not be running."
  exit 0
fi

pid=$(cat "$PIDFILE")
if kill -0 "$pid" 2>/dev/null; then
  kill "$pid" 2>/dev/null || true
  # persist script is a bash loop; also kill child vite
  pkill -P "$pid" 2>/dev/null || true
  echo "Stopped dev server (pid $pid)"
else
  echo "Dev server was not running."
fi
rm -f "$PIDFILE"
