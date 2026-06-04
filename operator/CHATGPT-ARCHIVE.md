# ChatGPT archive for Sasha

## What is possible

| Capability                              | Supported?         | How                                                                                                             |
| --------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Search past ChatGPT **conversations**   | Yes (after export) | `memory-wiki` + `openclaw wiki chatgpt import`                                                                  |
| Live login to chatgpt.com               | **No**             | No official API for chat history / Projects                                                                     |
| ChatGPT **Projects** files              | Partial            | Included in export zip only if OpenAI ships them in your export; ingest extra files with `openclaw wiki ingest` |
| Use ChatGPT **subscription** for models | Separate           | Codex OAuth / OpenAI API keys (already in OpenClaw)                                                             |

## Setup (done on gateway Mac)

- Plugin: `memory-wiki` enabled
- Vault: `~/.openclaw/wiki-vault`
- Import inbox: `~/.openclaw/imports/chatgpt/inbox/`

## King: finish import

1. https://chatgpt.com → Settings → Data controls → **Export data**
2. Download zip from email → unzip so `conversations.json` is under `~/.openclaw/imports/chatgpt/inbox/`
3. Run:

```bash
~/openclaw/operator/import-chatgpt-export.sh
openclaw gateway restart
```

4. Ask Sasha: _"Search my ChatGPT archive for AgentEcos architecture discussions"_

## Refresh

Re-export from ChatGPT periodically; re-run the import script (dry-run first).

## Rollback

```bash
openclaw wiki chatgpt rollback <run-id>
```
