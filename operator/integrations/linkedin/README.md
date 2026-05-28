# LinkedIn operator notes

- No mass automation, scraping loops, or autonomous connection campaigns.
- Use browser profiles under `operator/browser-automation/` for drafts only; human approves sends.
- `executive-ops` sets `browser.linkedinDraftsOnly: true` by default.
- Sasha intake + three blocking decisions: `~/.openclaw/workspace-sasha/content-program/` (`INTAKE.md`, `DECISIONS.md`).
- Optional token: `LINKEDIN_ACCESS_TOKEN` in `~/.openclaw/.env` (API path only). Health: `node operator/integrations/linkedin/health.mjs`.
