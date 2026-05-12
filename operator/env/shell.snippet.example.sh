# Copy relevant lines into ~/.zshrc (do not commit real secrets).

# Ollama: keep one model loaded on constrained hardware
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1

# Python sidecars (optional)
export PYTHONUNBUFFERED=1

# Operator stack root (absolute path to this repo's operator/ directory)
# export OPENCLAW_OPERATOR_STACK_ROOT="$HOME/openclaw/operator"

# Optional: GitHub PAT for github_rate_limit tool and future Git automation
# export GITHUB_TOKEN=""

# Custom operator scripts only (not read by OpenClaw core)
# export DCB_OPERATOR_ENV=development
