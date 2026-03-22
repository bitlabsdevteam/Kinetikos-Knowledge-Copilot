# INGESTION_NOTES.md

## Best extraction tool path for the current PDF workflow
For PDF ingestion and chunk preparation, use this practical tool order:

1. **Structured local PDF parser first**
   - preferred: Python-based PDF extraction (page-aware)
   - goal: preserve page numbers, headings, and document order

2. **Chunking logic in custom preprocessing layer**
   - section-aware semantic grouping
   - metadata attachment
   - chunk quality checks

3. **Perplexity for deep research, not raw PDF extraction**
   - use Perplexity to research best chunking strategies, metadata patterns, reranking choices, transcript segmentation patterns, and retrieval optimization decisions
   - do not treat Perplexity as the primary PDF parser

## Best practice
- use a deterministic parser for extraction
- use Perplexity for reasoning and strategy
- store vectors in Supabase
- keep chunking policy content-type aware

## Initial extraction recommendation for Kaito
- PDF parser: Python page-aware extraction
- chunking: section-aware semantic chunking
- embeddings: OpenAI text-embedding-3-large
- vector storage: Supabase pgvector
- retrieval: hybrid + metadata-aware + reranking
