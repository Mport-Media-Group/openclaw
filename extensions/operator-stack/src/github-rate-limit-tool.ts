import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { jsonResult } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";

const GithubRateLimitSchema = Type.Object({}, { additionalProperties: false });

export function createGithubRateLimitTool(_api: OpenClawPluginApi) {
  return {
    name: "github_rate_limit",
    label: "GitHub rate limit",
    description:
      "GET https://api.github.com/rate_limit. Uses GITHUB_TOKEN or GH_TOKEN when set for higher authenticated limits.",
    parameters: GithubRateLimitSchema,
    execute: async () => {
      const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || "";
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("https://api.github.com/rate_limit", { headers });
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = { raw: text };
      }
      return jsonResult({
        ok: res.ok,
        status: res.status,
        rateLimit: body,
      });
    },
  };
}
