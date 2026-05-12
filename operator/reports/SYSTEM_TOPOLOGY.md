# System topology

```mermaid
flowchart TB
  subgraph host [operator_host]
    Node[Node.js_22_plus]
    PNPM[pnpm_workspace_root]
    OC[openclaw_CLI]
    Ollama[Ollama_optional]
    AwsCli[aws_CLI_optional]
  end
  subgraph repo [openclaw_repo]
    ExtOS[extensions_operator_stack]
    OpRun[operator_runtime_mjs]
    OpMem[operator_memory_JSONL]
    OpSasha[operator_sasha_gates]
    OpGH[operator_workflows_github]
    OpAws[operator_integrations_aws]
    OpIris[operator_intersystems]
    OpDash[operator_dashboard_npm]
  end
  subgraph data [operator_data_gitignored]
    Rep[operator_reports]
    MemData[operator_memory_data]
  end
  PNPM --> OC
  OC --> ExtOS
  OpRun --> OpMem
  OpSasha --> OpRun
  OpSasha --> OpMem
  OpGH --> Rep
  OpGH --> MemData
  OpAws --> AwsCli
  OpIris --> host
  OpDash --> Rep
  Ollama --> OpRun
```

- **Gateway** remains authoritative for model routing; `operator/runtime` is hints and diagnostics only.
- **Dashboard** reads copied JSON snapshots under `operator/dashboard/public/data/` (no live gateway socket).
