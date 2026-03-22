-- Kinetikos Knowledge Copilot - initial RAG schema migration
-- Run in Supabase SQL Editor or through a migration workflow.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'global_kinetikos',
  source_file_name text not null,
  source_path text,
  document_title text,
  source_type text not null,
  language text default 'ja',
  content_role text,
  ingestion_status text not null default 'pending',
  page_count integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_tenant on documents (tenant_id);
create index if not exists idx_documents_source_type on documents (source_type);
create index if not exists idx_documents_title on documents (document_title);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  tenant_id text not null default 'global_kinetikos',
  chunk_id text not null unique,
  chunk_index integer not null,
  chapter_title text,
  section_title text,
  section_order integer,
  chapter_order integer,
  content_role text,
  page_start integer,
  page_end integer,
  token_count integer,
  char_count integer,
  text_content text not null,
  text_preview text,
  keywords text[],
  topic_tags text[],
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(3072),
  embedding_model text not null default 'text-embedding-3-large',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chunks_document_id on document_chunks (document_id);
create index if not exists idx_chunks_tenant on document_chunks (tenant_id);
create index if not exists idx_chunks_content_role on document_chunks (content_role);
create index if not exists idx_chunks_chapter_title on document_chunks (chapter_title);
create index if not exists idx_chunks_section_title on document_chunks (section_title);
create index if not exists idx_chunks_page_range on document_chunks (page_start, page_end);
create index if not exists idx_chunks_metadata on document_chunks using gin (metadata);
create index if not exists idx_chunks_keywords on document_chunks using gin (keywords);
create index if not exists idx_chunks_topic_tags on document_chunks using gin (topic_tags);

create index if not exists idx_chunks_embedding_cosine
on document_chunks
using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'global_kinetikos',
  source_file_name text,
  source_type text,
  parser_name text,
  embedding_model text,
  chunking_strategy text,
  status text not null default 'started',
  total_chunks integer,
  inserted_chunks integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_ingestion_runs_tenant on ingestion_runs (tenant_id);
create index if not exists idx_ingestion_runs_status on ingestion_runs (status);

create table if not exists retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'global_kinetikos',
  user_id text,
  session_id text,
  query_text text not null,
  normalized_query text,
  retrieval_mode text not null default 'hybrid',
  top_k integer,
  selected_chunk_ids text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_retrieval_logs_tenant on retrieval_logs (tenant_id);
create index if not exists idx_retrieval_logs_user on retrieval_logs (user_id);
create index if not exists idx_retrieval_logs_session on retrieval_logs (session_id);

create or replace function match_document_chunks (
  query_embedding vector(3072),
  match_count int default 8,
  filter_tenant text default 'global_kinetikos'
)
returns table (
  id uuid,
  document_id uuid,
  chunk_id text,
  chapter_title text,
  section_title text,
  page_start integer,
  page_end integer,
  text_content text,
  metadata jsonb,
  similarity float
)
language sql
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_id,
    dc.chapter_title,
    dc.section_title,
    dc.page_start,
    dc.page_end,
    dc.text_content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.tenant_id = filter_tenant
    and dc.embedding is not null
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
