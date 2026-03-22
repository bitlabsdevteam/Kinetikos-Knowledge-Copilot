# SUPABASE_MIGRATION_WORKFLOW.md

## Goal
Apply the Kinetikos Knowledge Copilot RAG schema to the live Supabase database safely and consistently.

## Exact SQL to run in Supabase
Use this file:

- `supabase/migrations/20260322_init_rag_schema.sql`

You can paste its full contents directly into:
- **Supabase Dashboard → SQL Editor**

and run it.

## Fastest path
1. Open Supabase project
2. Go to **SQL Editor**
3. Open `supabase/migrations/20260322_init_rag_schema.sql`
4. Copy all SQL
5. Paste into SQL Editor
6. Run
7. Verify tables exist:
   - `documents`
   - `document_chunks`
   - `ingestion_runs`
   - `retrieval_logs`

## Better engineering path for Kaito
Use a migration-first workflow.

### Recommended workflow
1. keep every schema change in `supabase/migrations/`
2. use timestamped migration files
3. review schema changes before applying
4. apply to Supabase in order
5. verify resulting tables/indexes/functions
6. commit migrations to repo immediately

## Minimal verification after applying migration
Check that these exist:
- extension `vector`
- extension `pgcrypto`
- table `documents`
- table `document_chunks`
- table `ingestion_runs`
- table `retrieval_logs`
- function `match_document_chunks`
- HNSW halfvec-based index on `document_chunks.embedding`

## Important note for OpenAI 3072-d embeddings
If you use `text-embedding-3-large`, the index must not be created as `ivfflat` on `vector(3072)`.
Use:
- `using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)`

Reason:
- indexed raw `vector` columns are limited to 2000 dimensions
- `halfvec` supports up to 4000 dimensions

## Recommended first DB smoke test
After migration:
1. insert one test row into `documents`
2. insert one test row into `document_chunks` with a placeholder vector
3. confirm retrieval query path can read the row
4. confirm app can see the table structure without SQL errors

## Rule for Kaito
For future schema changes:
- do not edit live DB manually without reflecting the change in a migration file
- keep migration files in repo
- use the `supabase-postgres-best-practices` skill when changing schema, indexes, or query design

## Blunt conclusion
Right now the schema is ready.
To make it real, the next action is simply:
- run `supabase/migrations/20260322_init_rag_schema.sql` in Supabase SQL Editor
