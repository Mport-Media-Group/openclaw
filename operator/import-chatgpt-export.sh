#!/usr/bin/env bash
# Import a ChatGPT data export into Sasha's memory wiki (searchable via wiki_search).
set -euo pipefail

INBOX="${HOME}/.openclaw/imports/chatgpt/inbox"
EXPORT_PATH="${1:-}"

if [[ -z "${EXPORT_PATH}" ]]; then
  if [[ -f "${INBOX}/conversations.json" ]]; then
    EXPORT_PATH="${INBOX}"
  else
    newest=$(find "${INBOX}" -maxdepth 2 -name conversations.json 2>/dev/null | head -1)
    if [[ -n "${newest}" ]]; then
      EXPORT_PATH="$(dirname "${newest}")"
    fi
  fi
fi

if [[ -z "${EXPORT_PATH}" ]] || [[ ! -f "${EXPORT_PATH}/conversations.json" && ! -f "${EXPORT_PATH}" ]]; then
  echo "Usage: $0 [path-to-export-dir-or-conversations.json]"
  echo ""
  echo "1. In ChatGPT: Settings → Data controls → Export data → confirm email"
  echo "2. Unzip the download into: ${INBOX}/"
  echo "3. Re-run this script"
  exit 1
fi

echo "==> Dry run"
openclaw wiki chatgpt import --export "${EXPORT_PATH}" --dry-run

echo ""
read -r -p "Apply import to wiki vault? [y/N] " ans
if [[ "${ans}" =~ ^[Yy]$ ]]; then
  openclaw wiki chatgpt import --export "${EXPORT_PATH}"
  openclaw wiki compile
  echo "==> Done. Sasha can use wiki_search / wiki_get on imported chats."
else
  echo "Skipped apply. Run without prompt: openclaw wiki chatgpt import --export \"${EXPORT_PATH}\""
fi
