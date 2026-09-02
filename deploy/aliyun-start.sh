#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not installed."
  exit 1
fi

mkdir -p logs

if [ ! -d node_modules ]; then
  npm install --omit=dev
fi

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-8787}"

nohup node server/server.mjs > logs/server.log 2> logs/server.err.log &
echo $! > logs/server.pid

echo "ZenBazi server started on port ${PORT}"
echo "PID: $(cat logs/server.pid)"
