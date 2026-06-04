#!/usr/bin/env bash
# Run this script ON each remote PC (not the gateway Mac).
# Prereq: gateway Mac on LAN at 192.168.1.182:18789 with bind=lan.
set -euo pipefail

GATEWAY_HOST="${OPENCLAW_GATEWAY_HOST:-192.168.1.182}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
DISPLAY_NAME="${1:-$(hostname -s)}"

if [[ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]]; then
  echo "Set OPENCLAW_GATEWAY_TOKEN (copy from gateway Mac ~/.openclaw/.env or openclaw.json gateway.auth.token)"
  exit 1
fi

if ! command -v openclaw >/dev/null 2>&1; then
  echo "Install OpenClaw CLI first (Node 22+, then npm i -g from openclaw repo)."
  exit 1
fi

echo "==> Installing node host: $DISPLAY_NAME -> ${GATEWAY_HOST}:${GATEWAY_PORT}"
openclaw node install --host "$GATEWAY_HOST" --port "$GATEWAY_PORT" --display-name "$DISPLAY_NAME"
openclaw node start
sleep 3
openclaw node status

echo ""
echo "==> On the gateway Mac, approve pairing:"
echo "    openclaw devices list"
echo "    openclaw devices approve <requestId>"
echo "    openclaw nodes status"
echo "    openclaw nodes rename --node <id> --name \"$DISPLAY_NAME\""
