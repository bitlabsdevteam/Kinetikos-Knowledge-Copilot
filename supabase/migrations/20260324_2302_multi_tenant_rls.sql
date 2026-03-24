-- Multi-tenant RLS policy scaffold
-- NOTE: app.current_tenant must be set in DB session before queries.

-- Enable RLS on tenant-scoped tables
alter table tenants enable row level security;
alter table tenant_memberships enable row level security;
alter table tenant_feature_flags enable row level security;
alter table tenant_knowledge_scopes enable row level security;
alter table tenant_quotas enable row level security;
alter table usage_counters enable row level security;

-- Existing RAG tables with tenant scope
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table retrieval_logs enable row level security;
alter table customer_conversation_history enable row level security;
alter table ingestion_runs enable row level security;

-- Drop/recreate policies for compatibility with Postgres versions

drop policy if exists p_tenant_memberships_isolation on tenant_memberships;
create policy p_tenant_memberships_isolation on tenant_memberships
for all
using (tenant_id::text = current_setting('app.current_tenant', true))
with check (tenant_id::text = current_setting('app.current_tenant', true));

drop policy if exists p_feature_flags_isolation on tenant_feature_flags;
create policy p_feature_flags_isolation on tenant_feature_flags
for all
using (tenant_id::text = current_setting('app.current_tenant', true))
with check (tenant_id::text = current_setting('app.current_tenant', true));

drop policy if exists p_knowledge_scopes_isolation on tenant_knowledge_scopes;
create policy p_knowledge_scopes_isolation on tenant_knowledge_scopes
for all
using (tenant_id::text = current_setting('app.current_tenant', true))
with check (tenant_id::text = current_setting('app.current_tenant', true));

drop policy if exists p_tenant_quotas_isolation on tenant_quotas;
create policy p_tenant_quotas_isolation on tenant_quotas
for all
using (tenant_id::text = current_setting('app.current_tenant', true))
with check (tenant_id::text = current_setting('app.current_tenant', true));

drop policy if exists p_usage_counters_isolation on usage_counters;
create policy p_usage_counters_isolation on usage_counters
for all
using (tenant_id::text = current_setting('app.current_tenant', true))
with check (tenant_id::text = current_setting('app.current_tenant', true));

-- Existing text tenant_id columns in current schema

drop policy if exists p_documents_isolation on documents;
create policy p_documents_isolation on documents
for all
using (tenant_id = current_setting('app.current_tenant', true))
with check (tenant_id = current_setting('app.current_tenant', true));

drop policy if exists p_document_chunks_isolation on document_chunks;
create policy p_document_chunks_isolation on document_chunks
for all
using (tenant_id = current_setting('app.current_tenant', true))
with check (tenant_id = current_setting('app.current_tenant', true));

drop policy if exists p_retrieval_logs_isolation on retrieval_logs;
create policy p_retrieval_logs_isolation on retrieval_logs
for all
using (tenant_id = current_setting('app.current_tenant', true))
with check (tenant_id = current_setting('app.current_tenant', true));

drop policy if exists p_customer_conversation_history_isolation on customer_conversation_history;
create policy p_customer_conversation_history_isolation on customer_conversation_history
for all
using (tenant_id = current_setting('app.current_tenant', true))
with check (tenant_id = current_setting('app.current_tenant', true));

drop policy if exists p_ingestion_runs_isolation on ingestion_runs;
create policy p_ingestion_runs_isolation on ingestion_runs
for all
using (tenant_id = current_setting('app.current_tenant', true))
with check (tenant_id = current_setting('app.current_tenant', true));
