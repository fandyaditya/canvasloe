#!/usr/bin/env bash
# Start moodboard dev server detached from the terminal (survives shell close).
# Logs: .dev-server.log  PID: .dev-server.pid

set -euo pipefail
cd "$(dirname "$0")/.."
LOG=".dev-server.log"
PIDFILE=".dev-server.pid"

if [[ -f "$PIDFILE" ]]; then
  old_pid=$(cat "$PIDFILE")
  if kill -0 "$old_pid" 2>/dev/null; then
    echo "Dev server already running (pid $old_pid). Log: $LOG"
    exit 0
  fi
fi

nohup bash scripts/dev-persist.sh >>"$LOG" 2>&1 &
echo $! >"$PIDFILE"
disown 2>/dev/null || true

sleep 2
if curl -sf -o /dev/null http://localhost:5173/; then
  echo "Dev server started (pid $(cat "$PIDFILE"))"
  echo "  Local:  http://localhost:5173/"
  echo "  Log:    $LOG"
else
  echo "Starting... check $LOG if port 5173 is not up yet."
fi
