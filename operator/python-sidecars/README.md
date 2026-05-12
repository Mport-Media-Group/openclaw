# Python sidecars (optional)

Create a local venv **outside** tracked paths (gitignored):

```bash
cd operator/python-sidecars
python3 -m venv .venv
source .venv/bin/activate
pip install chromadb sentence-transformers fastapi uvicorn python-dotenv
```

Use sidecars for Chroma, OCR helpers, or FastAPI glue. Wire them into OpenClaw
via HTTP tools in a dedicated plugin, not by replacing the main `pnpm` runtime.
