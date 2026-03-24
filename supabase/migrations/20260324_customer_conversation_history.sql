-- Store customer conversation history with user identity

create table if not exists customer_conversation_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'global_kinetikos',
  session_id text not null,
  user_id text,
  user_display_name text,
  user_message text not null,
  assistant_answer text,
  grounded boolean not null default false,
  citation_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cch_tenant_created_at on customer_conversation_history (tenant_id, created_at desc);
create index if not exists idx_cch_user_created_at on customer_conversation_history (user_id, created_at desc);
create index if not exists idx_cch_session_created_at on customer_conversation_history (session_id, created_at desc);
create index if not exists idx_cch_metadata on customer_conversation_history using gin (metadata);
