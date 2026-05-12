# Operator dashboard (standalone)

Lightweight **Vite + React** UI for viewing operator health JSON. Kept **out of**
the root `pnpm` workspace: use **`npm install`** here so dependencies stay under
`operator/dashboard/node_modules/` (root `pnpm install` will not add these).

## Setup

```bash
cd operator/dashboard
npm install
```

Generate health JSON from the repo root (examples):

```bash
node operator/sasha/runtime-health.mjs
node operator/memory/memory-health.mjs
node operator/runtime/ollama-health.mjs
node operator/intersystems/runtime-health.mjs
```

Copy JSON into `public/data/` (runs automatically before `npm run dev`):

```bash
npm run predev
npm run dev
```

Open the URL Vite prints (default port **5179**). Refresh is manual or on a
**45s** interval—no WebSockets.

## Notes

- Missing files show as empty/`_error` in panels until you run the CLIs above.
- Keep this dashboard **local**; do not expose without authentication on shared networks.
