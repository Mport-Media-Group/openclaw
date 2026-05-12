# Host setup (Intel Mac operator console)

## Toolchain

- **Node.js 22+** and **pnpm** (OpenClaw uses `pnpm install`; see repo root `AGENTS.md`).
- **Xcode Command Line Tools**: `xcode-select --install`
- **Homebrew** packages (adjust for your machine):

```bash
brew install git node python jq ffmpeg watchman tmux htop gh ollama
brew install --cask docker cursor
```

On macOS, Docker is usually **`brew install --cask docker`** (Docker Desktop), not `brew install docker`.

## Ollama (lightweight)

If `ollama` is missing and you use Homebrew on macOS: `brew install ollama` (optional on other hosts).

Start the daemon in a separate terminal: `ollama serve`, then pull minimal tags:

```bash
bash operator/scripts/ollama-pull-minimal.sh
```

Validate reachability, tags, and one tiny inference per model (sequential, bounded retries):

```bash
node operator/runtime/ollama-health.mjs
# writes operator/reports/ollama-health-out.json (gitignored)
```

Recommended exports (add to `~/.zshrc` or use `env/shell.snippet.example.sh`):

```bash
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1
```

## OpenClaw configuration (not a fake `OPENCLAW_ENV`)

OpenClaw does **not** treat `OPENCLAW_ENV=production` as a supported product switch.
Use **`openclaw.json`** for gateway and agent settings, and documented `OPENCLAW_*`
variables where applicable (for example gateway token patterns described in
gateway auth docs).

For **operator-only** scripts, use a separate prefix such as `DCB_OPERATOR_ENV`
so it is obvious what is custom.

## Operator stack path

Point tools at this directory (absolute path):

```bash
export OPENCLAW_OPERATOR_STACK_ROOT="$HOME/openclaw/operator"
```

Or set `plugins.entries["operator-stack"].config.stackRoot` in `openclaw.json`.

## Verify

```bash
cd /path/to/openclaw
pnpm install
pnpm openclaw doctor
```
