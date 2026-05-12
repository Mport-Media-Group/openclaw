# Local verification (OpenClaw core)

Run on your machine after a successful `pnpm install` (Node **22.16+** matches
repo `engines`; see root `package.json`).

```bash
cd /path/to/openclaw
pnpm install
pnpm openclaw doctor
pnpm test extensions/operator-stack
```

Ollama: configure the bundled Ollama provider per
[Ollama plugin](https://docs.openclaw.ai/plugins/reference/ollama) and pull small
tags (for example `qwen2.5:3b`) to match `operator/configs/models.json`.
