#!/usr/bin/env node
// Discord discovery. Once the bot is invited to one or more guilds, this lists
// guilds + text channels + first-seen owner so we can fill the openclaw.json
// `channels.discord` block. Writes JSON to stdout; --out <path> mirrors to file.

const token = process.env.DISCORD_BOT_TOKEN?.trim();
if (!token) {
  process.stderr.write("DISCORD_BOT_TOKEN unset. Run health.mjs first.\n");
  process.exit(2);
}

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

const api = "https://discord.com/api/v10";
const headers = { Authorization: `Bot ${token}` };

async function req(path) {
  const r = await fetch(`${api}${path}`, { headers });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${r.statusText}`);
  return r.json();
}

// Text-ish channel types we care about for the bot to live in.
// 0=GuildText, 5=Announcement, 15=Forum, 11=PublicThread, 12=PrivateThread
const TEXTISH = new Set([0, 5, 15]);

const me = await req("/users/@me");
const guilds = await req("/users/@me/guilds");

const enriched = [];
for (const g of guilds) {
  let channels = [];
  let owner = null;
  try {
    const full = await req(`/guilds/${g.id}`);
    owner = full.owner_id ?? null;
    const ch = await req(`/guilds/${g.id}/channels`);
    channels = ch
      .filter((c) => TEXTISH.has(c.type))
      .map((c) => ({ id: c.id, name: c.name, type: c.type, parentId: c.parent_id ?? null }));
  } catch (err) {
    channels = [{ error: String(err?.message ?? err) }];
  }
  enriched.push({
    id: g.id,
    name: g.name,
    ownerId: owner,
    botPermissions: g.permissions ?? null,
    channels,
  });
}

const out = {
  ok: true,
  service: "discord",
  bot: { id: me.id, username: me.username },
  guilds: enriched,
  hint:
    enriched.length === 0
      ? "Bot is not in any guild yet. Run invite-url.mjs and open the URL while logged into Discord as a server admin."
      : "Pick guildId + channelId and pass to apply.mjs",
};

const json = JSON.stringify(out, null, 2);
process.stdout.write(`${json}\n`);
if (outPath) {
  const fs = await import("node:fs");
  fs.writeFileSync(outPath, `${json}\n`);
}
