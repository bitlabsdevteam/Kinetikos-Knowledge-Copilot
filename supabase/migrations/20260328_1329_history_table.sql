-- v4 fallback history table
create table if not exists "History" (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  session_id text not null,
  user_id text,
  user_display_name text,
  user_message text,
  assistant_answer text,
  grounded boolean not null default false,
  citation_ids jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_history_tenant_session on "History"(tenant_id, session_id);
create index if not exists idx_history_user_created on "History"(user_id, created_at desc);
