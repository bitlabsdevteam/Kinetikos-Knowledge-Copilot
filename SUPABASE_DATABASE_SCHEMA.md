# SUPABASE_DATABASE_SCHEMA.md

## Purpose
This document explains the database design for Kinetikos Knowledge Copilot in Supabase.

The goal is not just to store vectors.
The database must support:
- document ingestion
- chunk metadata
- vector retrieval
- citation rendering
- user/session usage logging
- future filtering and reranking improvements

## Design principles
1. keep document-level data separate from chunk-level data
2. store rich metadata with every chunk
3. keep vectors close to retrieval-ready chunk rows
4. preserve citation anchors like page/chapter/section
5. support future multi-tenant readiness
6. make ingestion and retrieval observable

## Main schema components

### 1. `documents`
Stores one row per source document.

#### Why this table exists
A PDF/manual/article should not be duplicated across every chunk row as the primary record.
This table acts as the canonical source record.

#### Key columns
- `id` — primary key
- `tenant_id` — namespace for future multi-tenant use
- `source_file_name` — original uploaded file name
- `source_path` — optional storage path or object key
- `document_title` — human-readable title
- `source_type` — e.g. `pdf_manual`, `transcript`, `article`
- `language` — e.g. `ja`, `en`
- `content_role` — optional high-level role
- `ingestion_status` — pending / processing / completed / failed
- `page_count` — useful for citations and QA
- `metadata` — flexible document-level JSON
- `created_at`, `updated_at`

#### Example use cases
- list all uploaded manuals
- reprocess one document
- display source titles in citations
- track document ingestion status

---

### 2. `document_chunks`
Stores one row per retrieval-ready chunk plus its embedding vector.

#### Why this table exists
This is the heart of the RAG system.
Each row represents a semantically meaningful chunk that can be embedded, retrieved, cited, filtered, and reranked.

#### Key columns
- `id` — primary key
- `document_id` — foreign key to `documents`
- `tenant_id`
- `chunk_id` — deterministic external chunk identifier
- `chunk_index` — order within the document
- `chapter_title`
- `section_title`
- `section_order`
- `chapter_order`
- `content_role`
- `page_start`, `page_end`
- `token_count`, `char_count`
- `text_content` — full chunk text
- `text_preview` — shortened preview for UI/debugging
- `keywords` — optional extracted keyword array
- `topic_tags` — optional semantic topic tags
- `metadata` — JSON for section path, source anchors, priority flags, etc.
- `embedding` — pgvector column
- `embedding_model` — e.g. `text-embedding-3-large`
- `created_at`, `updated_at`

#### Why vectors live here
The vector belongs to the retrieval-ready chunk.
Keeping them together makes semantic search and citation reconstruction simpler.

#### Example use cases
- top-k similarity search
- metadata filtering
- section-aware citation rendering
- retrieval debugging
- future reranking input generation

---

### 3. `ingestion_runs`
Stores one row per ingestion execution.

#### Why this table exists
Ingestion needs observability.
When extraction or embedding fails, we need a record of what happened.

#### Key columns
- `id`
- `tenant_id`
- `source_file_name`
- `source_type`
- `parser_name`
- `embedding_model`
- `chunking_strategy`
- `status`
- `total_chunks`
- `inserted_chunks`
- `error_message`
- `metadata`
- `created_at`
- `completed_at`

#### Example use cases
- see which ingestion run failed
- compare chunk counts across strategies
- audit which parser/embedding model was used

---

### 4. `retrieval_logs`
Stores one row per retrieval event.

#### Why this table exists
This supports retrieval quality analysis and product analytics.

#### Key columns
- `id`
- `tenant_id`
- `user_id`
- `session_id`
- `query_text`
- `normalized_query`
- `retrieval_mode`
- `top_k`
- `selected_chunk_ids`
- `metadata`
- `created_at`

#### Example use cases
- inspect what chunks were chosen for a user query
- improve retrieval quality
- analyze follow-up query behavior
- support future evaluation dashboards

---

## Relationship design
```text
documents (1) ────────< document_chunks (many)

documents (1) ────────< ingestion_runs (many over time)

retrieval_logs references selected chunk ids logically at query time
```

## Why this schema is strong
### It supports grounded RAG well because:
- chunks retain source lineage
- citations can be reconstructed from metadata
- document-level and chunk-level concerns are separated
- vectors are stored where retrieval actually happens
- ingestion is observable
- user retrieval behavior can be analyzed later

## Citation design support
For citation-friendly answers, chunks must preserve:
- `document_title`
- `chapter_title`
- `section_title`
- `page_start`
- `page_end`
- `source_anchor` inside metadata if needed

That is why metadata is not optional noise — it is part of the product UX.

## Multi-tenant readiness
Even though the MVP is effectively single-tenant now, the schema keeps:
- `tenant_id`
- namespaced content assumptions
- metadata tags

This avoids a painful redesign later.

## Recommended indexing posture
### Standard relational indexes
Use indexes on:
- `tenant_id`
- `document_id`
- `source_type`
- `chapter_title`
- `section_title`
- page ranges

### JSON/array indexes
Use GIN indexes on:
- `metadata`
- `keywords`
- `topic_tags`

### Vector index
For `text-embedding-3-large` (3072 dimensions), do **not** use `ivfflat` directly on the raw `vector(3072)` column.
Use an **HNSW index on a halfvec cast** instead:
- `using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)`

This is required because indexed raw `vector` columns are limited to 2000 dimensions, while `halfvec` supports up to 4000 dimensions.

## Blunt conclusion
This Supabase design is built to support:
- practical RAG ingestion
- retrieval quality
- vector search
- human-readable citations
- future analytics and iteration

It is not just a vector dump.
It is a retrieval-ready product database design.
