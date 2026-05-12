#!/usr/bin/env node
/**
 * LinkedIn: drafts-only, no scraping loops, no mass automation (operator policy).
 */
const token = process.env.LINKEDIN_ACCESS_TOKEN?.trim() ? "set" : "unset";
process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      service: "linkedin",
      accessToken: token,
      policy: "drafts_and_manual_send_only",
      automation: "disabled_by_operator_policy",
      playwright: "do_not_use_for_Linkedin_automation",
    },
    null,
    2,
  )}\n`,
);
