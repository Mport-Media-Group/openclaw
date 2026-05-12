# Next phase recommendations

## Hardware

- Prefer **16GB+** or cloud VM for primary gateway; keep 8GB Intel machines as consoles with **sequential** operator scripts only.

## Cloud

- Always-on gateway on a small Linux VM; secrets in KMS / OpenClaw credential store patterns.

## Software

1. OAuth-backed Zoho or GitHub app using `operator-stack` patterns.
2. Replace broad `blockExoticSubdeps: false` with narrower allowlists when Baileys chain allows.
3. **Operator dashboard**: optional hardening (auth proxy) if served beyond localhost; run `npm audit` in `operator/dashboard` after `npm install`.
4. Wire **Chroma** or bundled memory plugins before enabling `OPERATOR_EMBEDDINGS_ENABLED=1` for real vectors.

## Security

- Dependabot REST requires **`security_events`** scope; expect graceful skips without it.
- AWS list scripts return metadata only; deny destructive IAM on automation roles.
- LinkedIn: **drafts-only**; no headless scraping (`public-page-snippet` is for public marketing pages only).
