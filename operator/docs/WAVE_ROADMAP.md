# Implementation waves (thermal-aware)

| Wave   | Focus             | Exit criteria                                                           |
| ------ | ----------------- | ----------------------------------------------------------------------- |
| **W0** | Toolchain         | Node 22+, `pnpm install`, `openclaw doctor` clean                       |
| **W1** | Ollama            | Small tags pulled; OpenClaw Ollama provider configured                  |
| **W2** | Multi-agent       | Workspaces + `openclaw agents` bindings for DCB vs personal             |
| **W3** | Pilot integration | `operator-stack` plugin + one vendor OAuth/PAT pattern (GitHub first)   |
| **W4** | Memory            | `MEMORY.md` + daily notes; evaluate memory-wiki / LanceDB before Chroma |
| **W5** | Dashboard         | Read-only sidecar: status, logs tail, queue (outside core `ui/`)        |
| **W6** | IRIS + AWS        | After W3: HL7/FHIR helpers, small AWS control plane, no heavy local ECS |

## Vendor sequence (after W3 template)

1. **GitHub / GitLab** — PAT, PR/issue tools, CI visibility
2. **Zoho** — OAuth, CRM + mail scoped modules
3. **Hugging Face** — token, model discovery, optional endpoint fallback
4. **AWS** — CLI + Secrets Manager; prefer Lambda/S3 over laptop-bound Docker
5. **Canva** — design API, brand kit assets
6. **LinkedIn** — Playwright drafts only, human send
7. **InterSystems IRIS** — REST/FHIR; portal automation last and gated

Keep **heavy Docker and always-on ECS** off the Intel laptop; run them in cloud CI or a remote box.
