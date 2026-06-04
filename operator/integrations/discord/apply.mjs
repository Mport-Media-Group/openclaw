#!/usr/bin/env node
// Patches ~/.openclaw/openclaw.json `channels.discord` block with discovered
// IDs. Reads JSON discovery output (from discover.mjs) and resolves the right
// guild + text channel, then writes the config. Defaults to a dry-run diff;
// pass --write to actually mutate. Always writes a .bak alongside.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function flag(name, fallback = null) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}
const WRITE = args.includes("--write");

const cfgPath = flag("config", path.join(os.homedir(), ".openclaw", "openclaw.json"));
const guildId = flag("guild");
const channelIds = (flag("channels") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ownerId = flag("owner"); // King's Discord user id, for DM allowlist
const discoverPath = flag("from"); // optional discover.mjs JSON
const activity = flag("activity", "Watching DCB");

if (!guildId || channelIds.length === 0 || !ownerId) {
  process.stderr.write(
    `usage: apply.mjs --guild <id> --channels <id[,id...]> --owner <userId> [--from <discover.json>] [--activity "Watching DCB"] [--write]\n`,
  );
  process.exit(2);
}

let discovery = null;
if (discoverPath && fs.existsSync(discoverPath)) {
  discovery = JSON.parse(fs.readFileSync(discoverPath, "utf8"));
}

const guildEntry = discovery?.guilds?.find((g) => g.id === guildId);
const channelsMap = {};
for (const id of channelIds) {
  const meta = guildEntry?.channels?.find((c) => c.id === id);
  channelsMap[id] = meta ? { enabled: true } : { enabled: true };
}

const desired = {
  enabled: true,
  token: "${DISCORD_BOT_TOKEN}",
  dmPolicy: "allowlist",
  allowFrom: [ownerId],
  groupPolicy: "allowlist",
  guilds: {
    [guildId]: {
      slug: guildEntry?.name ?? undefined,
      requireMention: false,
      reactionNotifications: "own",
      channels: channelsMap,
    },
  },
  actions: {
    messages: true,
    reactions: true,
    threads: true,
    pins: true,
    search: true,
    polls: true,
    memberInfo: true,
    channelInfo: true,
    permissions: false,
    roles: false,
    moderation: false,
    presence: false,
    channels: false,
    voiceStatus: false,
    events: false,
    emojiUploads: false,
    stickerUploads: false,
  },
  activity,
  status: "online",
  activityType: 3,
};

const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
cfg.channels = cfg.channels ?? {};
const before = cfg.channels.discord ?? {};
cfg.channels.discord = desired;

const diff = {
  config: cfgPath,
  before,
  after: desired,
  bytesBefore: JSON.stringify(before).length,
  bytesAfter: JSON.stringify(desired).length,
};

if (!WRITE) {
  process.stdout.write(
    `${JSON.stringify({ ok: true, dryRun: true, ...diff, hint: "Re-run with --write to apply." }, null, 2)}\n`,
  );
  process.exit(0);
}

const backup = `${cfgPath}.bak.discord-${Date.now()}`;
fs.copyFileSync(cfgPath, backup);
fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify({ ok: true, written: true, backup, ...diff, next: "Restart the gateway to bind the bot." }, null, 2)}\n`,
);
