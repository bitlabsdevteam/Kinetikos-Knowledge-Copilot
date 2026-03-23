#!/usr/bin/env python3
"""
Ingest a PDF into Supabase RAG tables:
- documents
- document_chunks
- ingestion_runs

Usage:
  python3 scripts/ingest/ingest_pdf_to_supabase.py \
    --pdf data/manuals/human-nutrition-text.pdf \
    --source-type manual_pdf \
    --title "Human Nutrition"
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple

import fitz  # PyMuPDF
import tiktoken
from dotenv import load_dotenv
from openai import OpenAI
from supabase import Client, create_client
from tqdm import tqdm


# -----------------------------
# Config
# -----------------------------

DEFAULT_EMBEDDING_MODEL = "text-embedding-3-large"  # 3072 dims (matches schema)
DEFAULT_BATCH_EMBED = 64
DEFAULT_CHUNK_TARGET_TOKENS = 700
DEFAULT_CHUNK_MAX_TOKENS = 1000
DEFAULT_CHUNK_OVERLAP_TOKENS = 120
DEFAULT_MIN_CHUNK_TOKENS = 120


@dataclass
class Chunk:
    chunk_id: str
    chunk_index: int
    text_content: str
    token_count: int
    char_count: int
    page_start: int
    page_end: int


def clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"-\s*\n\s*", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def split_sentences_ja_en(text: str) -> List[str]:
    # Japanese + English punctuation-aware sentence splitting
    parts = re.split(r"(?<=[。！？.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def token_len(enc: tiktoken.Encoding, text: str) -> int:
    return len(enc.encode(text))


def build_chunks(
    *,
    source_path: str,
    page_texts: List[Tuple[int, str]],
    enc: tiktoken.Encoding,
    target_tokens: int,
    max_tokens: int,
    overlap_tokens: int,
    min_tokens: int,
) -> List[Chunk]:
    # Flatten into sentence records with page references
    records: List[Tuple[int, str, int]] = []
    for page_no, text in page_texts:
        sents = split_sentences_ja_en(clean_text(text))
        for sent in sents:
            tlen = token_len(enc, sent)
            if tlen > 0:
                records.append((page_no, sent, tlen))

    chunks: List[Chunk] = []
    i = 0
    chunk_index = 0

    while i < len(records):
        cur_tokens = 0
        start = i
        end = i

        while end < len(records) and cur_tokens + records[end][2] <= target_tokens:
            cur_tokens += records[end][2]
            end += 1

        # ensure at least one sentence if first is very long
        if end == start:
            cur_tokens = min(records[end][2], max_tokens)
            end += 1

        # hard cap guard
        while cur_tokens > max_tokens and end > start + 1:
            end -= 1
            cur_tokens -= records[end][2]

        text_content = " ".join(r[1] for r in records[start:end]).strip()
        if not text_content:
            i += 1
            continue

        tcount = token_len(enc, text_content)
        if tcount >= min_tokens:
            page_start = records[start][0]
            page_end = records[end - 1][0]
            raw_id = f"{source_path}|{chunk_index}|{text_content}"
            chunk_id = hashlib.sha1(raw_id.encode("utf-8")).hexdigest()
            chunks.append(
                Chunk(
                    chunk_id=chunk_id,
                    chunk_index=chunk_index,
                    text_content=text_content,
                    token_count=tcount,
                    char_count=len(text_content),
                    page_start=page_start,
                    page_end=page_end,
                )
            )
            chunk_index += 1

        # overlap by token budget
        back_tokens = 0
        back_idx = end
        while back_idx > start and back_tokens < overlap_tokens:
            back_idx -= 1
            back_tokens += records[back_idx][2]
        i = max(back_idx, start + 1)

    return chunks


def read_pdf_pages(pdf_path: Path) -> List[Tuple[int, str]]:
    doc = fitz.open(pdf_path)
    out: List[Tuple[int, str]] = []
    try:
        for i in range(len(doc)):
            page_text = doc[i].get_text("text") or ""
            out.append((i + 1, page_text))
    finally:
        doc.close()
    return out


def ensure_document(
    sb: Client,
    *,
    tenant_id: str,
    source_file_name: str,
    source_path: str,
    source_type: str,
    title: str | None,
    page_count: int,
) -> str:
    found = (
        sb.table("documents")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("source_file_name", source_file_name)
        .limit(1)
        .execute()
    )

    if found.data:
        doc_id = found.data[0]["id"]
        (
            sb.table("documents")
            .update(
                {
                    "source_path": source_path,
                    "source_type": source_type,
                    "document_title": title,
                    "ingestion_status": "processing",
                    "page_count": page_count,
                }
            )
            .eq("id", doc_id)
            .execute()
        )
        return doc_id

    created = (
        sb.table("documents")
        .insert(
            {
                "tenant_id": tenant_id,
                "source_file_name": source_file_name,
                "source_path": source_path,
                "document_title": title,
                "source_type": source_type,
                "ingestion_status": "processing",
                "page_count": page_count,
            }
        )
        .execute()
    )
    return created.data[0]["id"]


def embed_texts(client: OpenAI, model: str, texts: List[str], batch_size: int) -> List[List[float]]:
    vectors: List[List[float]] = []
    for i in tqdm(range(0, len(texts), batch_size), desc="Embedding"):
        batch = texts[i : i + batch_size]
        resp = client.embeddings.create(model=model, input=batch)
        vectors.extend([d.embedding for d in resp.data])
    return vectors


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, help="Path to PDF")
    parser.add_argument("--source-type", default="manual_pdf")
    parser.add_argument("--title", default=None)
    parser.add_argument("--batch-embed", type=int, default=DEFAULT_BATCH_EMBED)
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    openai_key = os.environ["OPENAI_API_KEY"]

    if not supabase_url:
        raise RuntimeError("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in environment")
    tenant_id = os.getenv("TENANT_ID", "global_kinetikos")
    embedding_model = os.getenv("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    sb = create_client(supabase_url, supabase_key)
    oa = OpenAI(api_key=openai_key)
    enc = tiktoken.get_encoding("cl100k_base")

    run = (
        sb.table("ingestion_runs")
        .insert(
            {
                "tenant_id": tenant_id,
                "source_file_name": pdf_path.name,
                "source_type": args.source_type,
                "parser_name": "pymupdf+sentence-chunker",
                "embedding_model": embedding_model,
                "chunking_strategy": "semantic_sentence_token_target",
                "status": "started",
            }
        )
        .execute()
    )
    run_id = run.data[0]["id"]

    try:
        page_texts = read_pdf_pages(pdf_path)
        document_id = ensure_document(
            sb,
            tenant_id=tenant_id,
            source_file_name=pdf_path.name,
            source_path=str(pdf_path),
            source_type=args.source_type,
            title=args.title,
            page_count=len(page_texts),
        )

        chunks = build_chunks(
            source_path=str(pdf_path),
            page_texts=page_texts,
            enc=enc,
            target_tokens=DEFAULT_CHUNK_TARGET_TOKENS,
            max_tokens=DEFAULT_CHUNK_MAX_TOKENS,
            overlap_tokens=DEFAULT_CHUNK_OVERLAP_TOKENS,
            min_tokens=DEFAULT_MIN_CHUNK_TOKENS,
        )

        if not chunks:
            raise RuntimeError("No chunks generated. Check source file/text extraction.")

        vectors = embed_texts(
            client=oa,
            model=embedding_model,
            texts=[c.text_content for c in chunks],
            batch_size=args.batch_embed,
        )

        rows = []
        for c, vec in zip(chunks, vectors):
            rows.append(
                {
                    "document_id": document_id,
                    "tenant_id": tenant_id,
                    "chunk_id": c.chunk_id,
                    "chunk_index": c.chunk_index,
                    "page_start": c.page_start,
                    "page_end": c.page_end,
                    "token_count": c.token_count,
                    "char_count": c.char_count,
                    "text_content": c.text_content,
                    "text_preview": c.text_content[:220],
                    "content_role": "body",
                    "metadata": {
                        "source_file_name": pdf_path.name,
                        "source_type": args.source_type,
                    },
                    "embedding": vec,
                    "embedding_model": embedding_model,
                }
            )

        # delete old chunks for this document to avoid stale residues
        sb.table("document_chunks").delete().eq("document_id", document_id).execute()

        for i in tqdm(range(0, len(rows), 200), desc="Uploading"):
            batch = rows[i : i + 200]
            sb.table("document_chunks").upsert(batch, on_conflict="chunk_id").execute()

        sb.table("documents").update({"ingestion_status": "done"}).eq("id", document_id).execute()
        (
            sb.table("ingestion_runs")
            .update(
                {
                    "status": "completed",
                    "total_chunks": len(chunks),
                    "inserted_chunks": len(chunks),
                }
            )
            .eq("id", run_id)
            .execute()
        )

        print(f"✅ Done. document_id={document_id}, chunks={len(chunks)}")

    except Exception as e:
        sb.table("documents").update({"ingestion_status": "failed"}).eq(
            "source_file_name", pdf_path.name
        ).execute()
        (
            sb.table("ingestion_runs")
            .update({"status": "failed", "error_message": str(e)})
            .eq("id", run_id)
            .execute()
        )
        raise


if __name__ == "__main__":
    main()
