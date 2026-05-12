#!/usr/bin/env bash
# Pull only small models (Intel 8GB). Run after `ollama serve` is available.
set -euo pipefail
export OLLAMA_NUM_PARALLEL="${OLLAMA_NUM_PARALLEL:-1}"
export OLLAMA_MAX_LOADED_MODELS="${OLLAMA_MAX_LOADED_MODELS:-1}"
for m in qwen2.5:3b deepseek-coder:1.3b gemma:2b; do
  echo "Pulling $m ..."
  ollama pull "$m"
done
echo "Done. Keep only one model loaded at a time when possible."
