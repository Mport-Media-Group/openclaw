# Unresolved issues

1. **Ollama**: Until `ollama` is on `PATH` and `ollama serve` is running, `ollama_model_probe` / `ollama-health.mjs` stay advisory failures (`ECONNREFUSED` / `fetch failed` captured in JSON).
2. **`blockExoticSubdeps: false`**: Still required for WhatsApp/Baileys; revisit when upstream ships registry-only libsignal.
3. **Chroma / embeddings**: `operator/memory/embeddings.mjs` is a RAM-safe stub; real vectors need a sidecar and explicit enable flags.
4. **Per-vendor OAuth**: Zoho, Canva, LinkedIn need registered apps and human-in-the-loop policies beyond env detection.
5. **InterSystems**: Production and HL7 queue metrics need vault-backed endpoints; scaffolds return env diagnostics only.
6. **GitHub Dependabot**: Alerts endpoint returns **403/404** without correct token scope—snapshot documents the skip.
7. **Dashboard npm audit**: Standalone `operator/dashboard` may report moderate upstream advisories; review before exposing the dev server.
