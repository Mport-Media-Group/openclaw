import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createGithubRateLimitTool } from "./src/github-rate-limit-tool.js";
import { createOperatorModelsTool } from "./src/operator-models-tool.js";
import { createOperatorStackReadTool } from "./src/operator-read-tool.js";

export default definePluginEntry({
  id: "operator-stack",
  name: "Operator stack",
  description:
    "Enterprise operator helpers: read files under a stack root, summarize models.json, GitHub rate_limit.",
  register(api) {
    api.registerTool((ctx) => createOperatorStackReadTool(api, ctx), {
      name: "operator_stack_read",
    });
    api.registerTool((ctx) => createOperatorModelsTool(api, ctx), {
      name: "operator_stack_models",
    });
    api.registerTool(() => createGithubRateLimitTool(api), {
      name: "github_rate_limit",
    });
  },
});
