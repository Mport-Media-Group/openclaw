# Browser automation (operator)

This folder holds **human-in-the-loop** Playwright-oriented runbooks. OpenClaw’s
supported browser tooling lives in the bundled [extensions/browser](../../extensions/browser)
plugin (`playwright-core`).

## Install browsers (one machine)

From the OpenClaw repo root (after `pnpm install`):

```bash
pnpm exec playwright install chromium
```

Use a dedicated user data dir under `operator/browser-automation/.profiles/` (gitignored) for each surface.

## Site stubs (no autonomous social actions)

| Surface                | Policy                                                      |
| ---------------------- | ----------------------------------------------------------- |
| LinkedIn               | Drafts and research only; human sends connections/messages. |
| Zoho                   | OAuth app; no credential storage in this repo.              |
| GitHub / GitLab        | Prefer `gh` CLI + API tokens in OS keychain.                |
| Canva                  | OAuth per Canva developer docs.                             |
| AWS Console            | Prefer `awscli` + SSO; browser only for break-glass.        |
| IRIS Management Portal | Break-glass; vault credentials outside git.                 |

Implement flows as small scripts under `sites/` when you add them; keep sessions
out of version control.

## Optional public-page snippet

`node operator/browser-automation/public-page-snippet.mjs <url>` — headless
title + text excerpt for vendor marketing pages only when
`OPERATOR_INTEGRATION_PLAYWRIGHT=1` (one browser launch; `finally` closes).
Not for LinkedIn automation.
