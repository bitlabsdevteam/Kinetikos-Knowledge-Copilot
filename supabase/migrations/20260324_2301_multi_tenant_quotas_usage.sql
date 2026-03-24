-- Multi-tenant quotas and usage counters

create table if not exists tenant_quotas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quota_key text not null,
  hard_limit bigint not null,
  soft_limit bigint,
  reset_period text not null default 'monthly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quota_key)
);

create table if not exists usage_counters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  metric_key text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  metric_value bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, metric_key, period_start, period_end)
);

create index if not exists idx_usage_counters_tenant_metric_period
  on usage_counters(tenant_id, metric_key, period_start desc);
