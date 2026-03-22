# SUPABASE_CHUNK_TABLES.md

## Purpose
Explain the Supabase table structure specifically for chunk storage, metadata, and vector retrieval.

## Core tables

### 1. `documents`
One row per uploaded source document.

Important fields:
- `id`
- `tenant_id`
- `source_file_name`
- `source_path`
- `document_title`
- `source_type`
- `language`
- `content_role`
- `ingestion_status`
- `page_count`
- `metadata`
- `created_at`
- `updated_at`

### Why it exists
This keeps document-level facts separate from chunk-level facts.

---

### 2. `document_chunks`
One row per retrieval-ready chunk.

Important fields:
- `id`
- `document_id`
- `tenant_id`
- `chunk_id`
- `chunk_index`
- `chapter_title`
- `section_title`
- `section_order`
- `chapter_order`
- `content_role`
- `page_start`
- `page_end`
- `token_count`
- `char_count`
- `text_content`
- `text_preview`
- `keywords`
- `topic_tags`
- `metadata`
- `embedding`
- `embedding_model`
- `created_at`
- `updated_at`

### Why it exists
This is the main retrieval table.
It stores the actual chunk text plus the vector plus retrieval metadata.

---

### 3. `ingestion_runs`
One row per ingestion pipeline execution.

Important fields:
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

### Why it exists
This helps debugging, observability, and reprocessing.

---

### 4. `retrieval_logs`
One row per user retrieval event.

Important fields:
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

### Why it exists
This supports quality analysis, retrieval debugging, and future tuning.

## Key schema principles
1. keep document data separate from chunk data
2. make chunk metadata rich enough for retrieval and citations
3. keep deterministic chunk ids
4. store vectors directly in pgvector
5. preserve chapter/section/page information
6. support hybrid retrieval and reranking later

## Minimal retrieval-ready chunk row
A retrieval-ready chunk must have at least:
- `document_id`
- `chunk_id`
- `chunk_index`
- `text_content`
- `page_start`
- `page_end`
- `metadata`
- `embedding`
- `embedding_model`

## Recommended metadata payload shape
```json
{
  "section_path": ["Week One", "An Introduction to Muscle Growth", "How to Achieve Muscle Growth"],
  "source_anchor": "page-3",
  "retrieval_priority": "normal",
  "is_front_matter": false,
  "is_actionable_guidance": false,
  "embedding_ready": true
}
```

## Best retrieval posture
Use this table model with:
- OpenAI `text-embedding-3-large`
- metadata-aware filtering
- hybrid retrieval
- reranking after first-pass retrieval
