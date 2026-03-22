# EMBEDDING_PIPELINE_PSEUDOCODE.md

## Goal
Define the ingestion and embedding flow for Kinetikos Knowledge Copilot using section-aware chunking, OpenAI embeddings, and Supabase vector storage.

## High-level pipeline
```text
for each source document:
  register ingestion run
  extract text with page awareness
  detect structure (title, chapter, section, front matter)
  create section-aware semantic blocks
  split oversized blocks with light overlap
  build chunk metadata
  embed each chunk
  store chunks + vectors in Supabase
  mark ingestion run complete
```

## Detailed pseudocode
```text
function ingest_document(file_path, tenant_id):
    run_id = create_ingestion_run(status="started")

    raw_pages = extract_pdf_pages(file_path)
    document_info = detect_document_metadata(raw_pages)
    document_id = upsert_document_record(document_info)

    sections = detect_sections(raw_pages)
    semantic_blocks = []

    for section in sections:
        blocks = group_paragraphs_into_semantic_units(section)
        semantic_blocks.extend(blocks)

    chunks = []

    for block in semantic_blocks:
        if is_front_matter(block):
            chunks.extend(handle_front_matter(block))
        else if exceeds_soft_max(block):
            chunks.extend(split_with_light_overlap(block))
        else:
            chunks.append(block)

    final_chunks = []

    for index, chunk in enumerate(chunks):
        normalized_text = normalize_text(chunk.text)
        metadata = build_chunk_metadata(
            document_id=document_id,
            tenant_id=tenant_id,
            chapter_title=chunk.chapter_title,
            section_title=chunk.section_title,
            page_start=chunk.page_start,
            page_end=chunk.page_end,
            content_role=chunk.content_role,
            topic_tags=derive_topic_tags(chunk),
            keywords=derive_keywords(chunk),
            chunk_index=index
        )

        final_chunks.append({
            "chunk_id": make_chunk_id(document_id, index),
            "text": normalized_text,
            "metadata": metadata
        })

    embeddings = []

    for batch in batch_chunks(final_chunks, batch_size_by_token_budget):
        vectors = openai_embed(batch.texts, model="text-embedding-3-large")
        for item, vector in zip(batch.items, vectors):
            embeddings.append({
                "chunk": item,
                "embedding": vector
            })

    upsert_chunks_and_vectors(embeddings)
    finalize_ingestion_run(run_id, status="completed")
```

## Helper logic
### extract_pdf_pages
- preserve page numbers
- preserve text order
- preserve title/headings when detectable

### detect_sections
- use heading patterns
- use typography/spacing cues if available
- identify front matter separately

### group_paragraphs_into_semantic_units
- keep one idea together
- avoid splitting instructions from labels
- preserve chapter/section lineage

### split_with_light_overlap
- split only when chunk is too broad
- overlap 10-15% when continuity matters
- do not create tiny fragments

### normalize_text
- remove extraction junk
- preserve human meaning
- preserve section labels and list structure where useful

### derive_topic_tags / keywords
- lightweight enrichment only
- do not over-generate noisy tags

### upsert_chunks_and_vectors
- insert document chunks
- write pgvector embeddings
- preserve deterministic chunk ids

## Retrieval assumptions supported by this pipeline
- hybrid retrieval
- metadata filtering
- reranking
- citation rendering
- follow-up question continuity

## Non-goals
- one-size-fits-all chunking
- dumping full pages as chunks
- using Perplexity as the parser
```
