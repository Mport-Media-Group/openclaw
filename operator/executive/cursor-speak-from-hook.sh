#!/usr/bin/env bash
# Cursor afterAgentResponse hook: speak assistant replies with the male operator voice.
# Invoked from ~/.cursor/hooks.json (user hook) or openclaw .cursor/hooks.json.
set -euo pipefail

OPENCLAW_ROOT="${OPENCLAW_ROOT:-/Users/NewUser/openclaw}"
SPEAK_SCRIPT="${OPENCLAW_ROOT}/operator/executive/speak-voice.mjs"
LOG_FILE="${CURSOR_SPEAK_LOG:-${HOME}/.cursor/hooks/cursor-speak.log}"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >>"$LOG_FILE" 2>/dev/null || true
}

if [[ "${CURSOR_VOICE_DISABLED:-}" == "1" ]]; then
  exit 0
fi

if [[ ! -f "$SPEAK_SCRIPT" ]]; then
  INPUT_JSON="$(cat)"
  if command -v node >/dev/null 2>&1; then
    ROOT_FROM_HOOK="$(
      printf '%s' "$INPUT_JSON" | node -e "
        const i = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        const roots = Array.isArray(i.workspace_roots) ? i.workspace_roots : [];
        for (const r of roots) {
          const p = require('path').join(r, 'operator/executive/speak-voice.mjs');
          if (require('fs').existsSync(p)) process.stdout.write(r);
        }
      " 2>/dev/null || true
    )"
    if [[ -n "$ROOT_FROM_HOOK" ]]; then
      OPENCLAW_ROOT="$ROOT_FROM_HOOK"
      SPEAK_SCRIPT="${OPENCLAW_ROOT}/operator/executive/speak-voice.mjs"
    fi
  fi
fi

if [[ ! -f "$SPEAK_SCRIPT" ]]; then
  log "skip: speak-voice.mjs not found at ${SPEAK_SCRIPT}"
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  log "skip: node not on PATH"
  exit 0
fi

INPUT_JSON="$(cat)"
TEXT="$(
  printf '%s' "$INPUT_JSON" | node -e "
    const i = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    let t = typeof i.text === 'string' ? i.text : '';
    t = t.replace(/\`\`\`[\\s\\S]*?\`\`\`/g, ' ');
    t = t.replace(/\`[^\`]+\`/g, ' ');
    t = t.replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '\$1');
    t = t.replace(/[#*_~>|]/g, ' ');
    t = t.replace(/\\s+/g, ' ').trim();
    if (t.length > 520) t = t.slice(0, 520).trim() + '…';
    process.stdout.write(t);
  " 2>/dev/null || true
)"

if [[ -z "${TEXT// }" ]]; then
  exit 0
fi

if node "$SPEAK_SCRIPT" --voice male "$TEXT" >>"$LOG_FILE" 2>&1; then
  log "ok: spoke ${#TEXT} chars"
else
  log "fail: speak-voice exited non-zero"
fi

exit 0
