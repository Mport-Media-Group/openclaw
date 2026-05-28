#!/usr/bin/env bash
# Install and start OpenClaw gateway for Sasha without Cursor.
# See operator/RUN-STANDALONE.md
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> OpenClaw standalone (Sasha)"
echo "    Repo: $REPO_ROOT"

if [[ ! -f "$REPO_ROOT/dist/index.js" ]]; then
  echo "==> Building (first time)..."
  pnpm build
fi

if ! command -v openclaw >/dev/null 2>&1; then
  echo "==> Installing global openclaw CLI..."
  npm install -g .
fi

echo "==> CLI: $(openclaw --version)"

echo "==> Installing / refreshing gateway LaunchAgent..."
openclaw gateway install
openclaw gateway restart
sleep 3

openclaw gateway status | head -22
echo ""
openclaw channels status --probe
echo ""
openclaw models status | head -12

DASHBOARD="http://127.0.0.1:18789/"
echo ""
echo "==> Dashboard: $DASHBOARD"
echo "==> Discord: message @Sasha (bot connected when probe shows OK)"
echo "==> Logs: openclaw logs --follow"

if [[ "$(uname -s)" == "Darwin" ]]; then
  open "$DASHBOARD" 2>/dev/null || true
fi
