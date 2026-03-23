# PDF Ingestion (Chunks + Vectors -> Supabase)

This folder contains a production-lean Python ingestion script aligned with this repo schema:
- `documents`
- `document_chunks`
- `ingestion_runs`

## 1) Install deps

```bash
cd scripts/ingest
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2) Environment

```bash
cp .env.example .env
# fill keys in .env
```

Required vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TENANT_ID` (optional, default `global_kinetikos`)
- `EMBEDDING_MODEL` (optional, default `text-embedding-3-large`)

## 3) Run

```bash
python3 ingest_pdf_to_supabase.py \
  --pdf ../../data/human-nutrition-text.pdf \
  --source-type manual_pdf \
  --title "Human Nutrition"
```

## What it does

1. Reads PDF page-by-page with PyMuPDF
2. Cleans text and splits JA/EN sentences
3. Builds semantic chunks (token-targeted + overlap)
4. Creates OpenAI embeddings in batches
5. Writes to `document_chunks` with rich metadata and page anchors
6. Tracks ingestion in `ingestion_runs`

## Notes

- Uses `text-embedding-3-large` by default because schema is `vector(3072)`.
- `chunk_id` is deterministic (`sha1(source + index + text)`) for stable re-ingestion.
- Existing chunks for the same document are deleted before insert to avoid stale rows.
