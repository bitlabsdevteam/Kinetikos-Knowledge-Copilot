# EMBEDDING_STRATEGY.md - Initial PDF Embedding Plan

## Scope
This document defines the initial embedding strategy for the first PDF-based Kinetikos RAG development inputs.

Current sample PDFs analyzed:
- `mbg---7a08a49c-14c2-4351-88ce-c1b0bf30f9f8.pdf`
- `building-Muscle-Made-easy---b673c34e-cd07-4ef7-8fbb-d8f7752b0a37.pdf`

## Observed document pattern
These PDFs are not random unstructured scans.
They are mostly **manual / ebook / guided instructional content** with:
- clear chapter/section titles
- short conceptual blocks
- procedural advice
- list-style guidance
- structured progression through topics

This means the best chunking strategy is **section-aware semantic chunking**, not naive fixed-size splitting.

## Recommended chunking strategy

### Primary strategy
Use **hierarchical section-aware semantic chunking**.

### Rule set
1. detect document title
2. detect chapter / section headings
3. preserve subsection blocks under the nearest heading
4. split only when a section becomes too large for retrieval precision
5. keep small related paragraphs together when they express one idea
6. preserve source/page/section metadata for citation rendering

## Why this is the right strategy for these PDFs
Because the content is educational and explanatory:
- users may ask conceptual questions
- users may ask section-specific follow-ups
- citations should feel human-readable
- headings are meaningful retrieval anchors

If we split purely by token windows, we risk:
- breaking definitions away from explanations
- separating actionable steps from context
- weakening citation quality
- reducing answer coherence

## Chunking policy by content type in these PDFs

### Type A — Table of contents / front matter
Examples:
- title page
- table of contents
- introduction / what to expect

Policy:
- keep front matter separate from main body chunks
- do not let TOC pages dominate retrieval
- tag as `content_role: front_matter`
- use only when the user asks about structure, overview, or chapter map

### Type B — Conceptual chapter content
Examples:
- Why muscle matters
- tension, reps, recovery, progression
- health/longevity explanations

Policy:
- chunk by heading + paragraph group
- target one self-contained idea per chunk
- light overlap only when adjacent paragraphs are tightly connected
- tag with chapter title and conceptual topic

### Type C — Actionable routines / exercise plans / weekly guidelines
Examples:
- weekly exercise guidance
- sets/reps routines
- nutrition rules
- practical steps and checklists

Policy:
- preserve the full procedure block together when possible
- do not split tables/checklists from their labels if avoidable
- tag as `content_role: actionable_guidance`
- preserve page numbers carefully for citation

## Suggested chunk size policy
These are starting heuristics, not rigid laws.

### Recommended targets
- preferred chunk size: **500-900 tokens** equivalent
- soft minimum: **250-350 tokens**
- soft maximum before splitting: **1000-1200 tokens**
- overlap: **10-15%** only when section continuity matters

### Split logic
Split when:
- a section covers multiple distinct sub-ideas
- the chunk becomes too broad for precise retrieval
- citation readability would be weakened by chunk size

Do not split when:
- a short section expresses one complete thought
- a routine/checklist would lose meaning if divided
- the page content is already naturally concise

## Metadata schema
Each chunk should include at least:
- `document_id`
- `document_title`
- `source_file_name`
- `source_type` = `pdf_manual`
- `chapter_title`
- `section_title`
- `content_role` (`front_matter`, `conceptual`, `actionable_guidance`, `routine`, etc.)
- `page_start`
- `page_end`
- `chunk_index`
- `chunk_id`
- `language`
- `topic_tags`
- `embedding_model`
- `created_at`

Optional but useful:
- `section_order`
- `chapter_order`
- `keywords`
- `summary`

## Retrieval behavior implications
This chunking strategy supports:
- conceptual Q&A
- chapter-aware follow-up questions
- routine/how-to retrieval
- citation-friendly source rendering
- better reranking because metadata is richer

## Indexing recommendations
- exclude or down-rank table of contents chunks in general retrieval
- preserve chapter titles as searchable metadata
- enrich chunks with lightweight topic tags where practical
- support hybrid retrieval: vector + keyword + metadata filters

## Initial implementation recommendation for Kaito
For the first embedding pass on PDFs like these:
1. extract text page by page
2. identify titles/headings/section boundaries
3. group content into section-aware semantic blocks
4. split oversized sections into subchunks with light overlap
5. attach rich metadata
6. embed with OpenAI `text-embedding-3-large`
7. store for hybrid retrieval and citation rendering

## Blunt conclusion
For these PDFs, the correct first strategy is:

**section-aware semantic chunking with metadata-rich hierarchical structure**

Not:
- naive fixed-size chunking
- paragraph-only splitting
- giant page dumps
- one-policy-fits-all embedding
