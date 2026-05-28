#!/usr/bin/env node
// Print a Discord OAuth2 bot invite URL with the permissions matching our
// default `channels.discord.actions` block (read/write/react/thread; no
// moderation/roles/presence/channel-mgmt). Application ID is the bot's user
// id, looked up via /users/@me unless --app <id> is provided.

const args = process.argv.slice(2);
const appFlag = args.indexOf("--app");
let appId = appFlag >= 0 ? args[appFlag + 1] : null;

if (!appId) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) {
    process.stderr.write(
      "DISCORD_BOT_TOKEN unset and --app not provided. Set the token in ~/.openclaw/.env or pass --app <applicationId>.\n",
    );
    process.exit(2);
  }
  const r = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!r.ok) {
    process.stderr.write(`Failed /users/@me: ${r.status} ${r.statusText}\n`);
    process.exit(1);
  }
  appId = (await r.json()).id;
}

// Permission bits aligned with our default actions:
//   View Channels         0x0000000000000400
//   Send Messages         0x0000000000000800
//   Embed Links           0x0000000000004000
//   Attach Files          0x0000000000008000
//   Read Message History  0x0000000000010000
//   Add Reactions         0x0000000000000040
//   Use External Emojis   0x0000000000040000
//   Send Messages In Threads          0x0000004000000000
//   Create Public Threads             0x0000001000000000
//   Manage Threads                    0x0000000400000000
//   Use Application Commands          0x0000000080000000
const PERMS =
  0x400n |
  0x800n |
  0x4000n |
  0x8000n |
  0x10000n |
  0x40n |
  0x40000n |
  0x4000000000n |
  0x1000000000n |
  0x400000000n |
  0x80000000n;

const url = new URL("https://discord.com/api/oauth2/authorize");
url.searchParams.set("client_id", appId);
url.searchParams.set("scope", "bot applications.commands");
url.searchParams.set("permissions", PERMS.toString());

process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      applicationId: appId,
      permissions: PERMS.toString(),
      url: url.toString(),
      next: "Open this URL while logged into Discord as a server admin and pick the target server.",
    },
    null,
    2,
  )}\n`,
);
