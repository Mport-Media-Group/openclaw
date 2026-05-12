# AWS operator integration (read-only)

Scripts use the **`aws` CLI** when present—no AWS SDK in the OpenClaw root
package. Calls are **sequential**, **capped** (`--max-items` / `--limit`), and
never print secret values.

## Scripts

| Script                                                       | Purpose                                           |
| ------------------------------------------------------------ | ------------------------------------------------- |
| [health.mjs](health.mjs)                                     | Credential + region presence (set/unset).         |
| [sts-check.mjs](sts-check.mjs)                               | `sts get-caller-identity` (account/ARN metadata). |
| [ecs-list.mjs](ecs-list.mjs)                                 | Sample ECS cluster ARNs.                          |
| [ecr-list.mjs](ecr-list.mjs)                                 | Sample ECR repository names.                      |
| [cloudwatch-tail-scaffold.mjs](cloudwatch-tail-scaffold.mjs) | Sample log group names; tail is manual.           |
| [secrets-scaffold.mjs](secrets-scaffold.mjs)                 | Sample secret **names** only (no values).         |

## IAM (example)

Read-only operator posture: allow `sts:GetCallerIdentity`, `ecs:ListClusters`,
`ecr:DescribeRepositories`, `logs:DescribeLogGroups`, `secretsmanager:ListSecrets`
with resource constraints appropriate to your org. Deny `Put*`, `Delete*`,
`Create*` for automation roles where possible.

## Environment

Standard `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` (or
`AWS_DEFAULT_REGION`). Prefer short-lived credentials or SSO profiles outside
this repo.
