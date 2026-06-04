#!/usr/bin/env node
// Discord readiness probe. Reports token set/unset and (if set) bot identity
// from /users/@me. Never logs the token value.

const token = process.env.DISCORD_BOT_TOKEN?.trim();

if (!token) {
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: false,
        service: "discord",
        token: "unset",
        nextStep:
          "Create the bot at https://discord.com/developers/applications, reset the token, then set DISCORD_BOT_TOKEN in ~/.openclaw/.env",
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

try {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: false,
          service: "discord",
          token: "set",
          httpStatus: res.status,
          hint:
            res.status === 401
              ? "Token invalid or revoked — reset in Developer Portal and update .env"
              : "Discord API rejected the request",
        },
        null,
        2,
      )}\n`,
    );
    process.exit(0);
  }
  const me = await res.json();
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        service: "discord",
        token: "set",
        bot: {
          id: me.id,
          applicationId: me.id,
          username: me.username,
          discriminator: me.discriminator,
          verified: me.verified ?? null,
          flags: me.public_flags ?? null,
        },
      },
      null,
      2,
    )}\n`,
  );
} catch (err) {
  process.stdout.write(
    `${JSON.stringify(
      { ok: false, service: "discord", token: "set", error: String(err?.message ?? err) },
      null,
      2,
    )}\n`,
  );
  process.exit(1);
}
