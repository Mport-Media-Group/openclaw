# Discord integration scripts

Minimal helpers to bring the Discord channel bot online without typing JSON by
hand. Pairs with `channels.discord` in `~/.openclaw/openclaw.json` and the
`@openclaw/discord` plugin.

## What you (Michael) must do by hand

These can't be automated — Discord requires a logged-in human:

1. Open <https://discord.com/developers/applications>, click **New Application**,
   name it (e.g. `Sasha`).
2. **Bot** tab → **Reset Token** → copy.
3. Paste into `~/.openclaw/.env`:
   ```
   DISCORD_BOT_TOKEN=…
   ```
4. Run `invite-url.mjs` to get the OAuth2 URL, open it, pick the target server,
   authorize.

## What the scripts do

```bash
# 1. Confirm token works and grab bot identity
node operator/integrations/discord/health.mjs

# 2. After the bot is invited to ≥1 server, list guilds + channels
node operator/integrations/discord/discover.mjs --out /tmp/discord-discover.json

# 3. Build the invite link (uses token to look up appId, or pass --app)
node operator/integrations/discord/invite-url.mjs

# 4. Patch ~/.openclaw/openclaw.json (dry-run first, then --write)
node operator/integrations/discord/apply.mjs \
  --guild  <GUILD_ID> \
  --channels <CHANNEL_ID[,CHANNEL_ID...]> \
  --owner  <YOUR_DISCORD_USER_ID> \
  --from   /tmp/discord-discover.json \
  --activity "Watching DCB"
# inspect, then:
node operator/integrations/discord/apply.mjs ... --write
```

## Default permission posture

The `apply.mjs` block sets:

- `dmPolicy: "allowlist"` with `--owner` as the only allowed DM sender.
- `groupPolicy: "allowlist"` — only configured guild channels respond.
- `actions`: messages/reactions/threads/pins/search/polls/info on; roles,
  moderation, presence, channels, voice, events, uploads **off**. Flip
  individually as needed.
- `activityType: 3` (Watching), text "Watching DCB" by default.

## Restart

After `apply.mjs --write`, restart the OpenClaw gateway so the new bot binding
takes effect.

## Related

- `extensions/discord/` — plugin source.
- `skills/discord/SKILL.md` — agent-facing usage of the `message` tool.
- `src/config/types.discord.ts` — full config schema.
