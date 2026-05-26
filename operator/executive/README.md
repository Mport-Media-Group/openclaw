# Executive runtime probes

Low-overhead local probes for the Executive OS foundation.

Run:

```bash
node operator/executive/runtime-health.mjs
```

The script reports:

- machine pressure signals that are cheap to sample locally
- GitHub, Cursor, 1Password, and Supabase contract readiness
- browser profile roots and later-stage Canva/LinkedIn/DCB staging signals
- policy reminders for human-gated browser and outbound actions

It writes `operator/reports/executive-runtime-health.json` and also prints the
same JSON to stdout.
