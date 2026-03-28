import { expect, test } from '@playwright/test';

import { resolveTenantContext } from '@/lib/tenant-context';

const originalFetch = global.fetch;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
});

test.afterEach(() => {
  global.fetch = originalFetch;
  process.env.SUPABASE_URL = originalSupabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
});

test('v3 tenant resolver: returns default tenant when no external user id', async () => {
  const result = await resolveTenantContext({ externalUserId: null });
  expect(result.tenantId).toBeTruthy();
  expect(result.source).toBe('default');
});

test('v3 tenant resolver: returns membership tenant when membership exists', async () => {
  const responses = [
    [{ id: 'user-123' }],
    [{ tenant_id: 'tenant-abc' }],
  ];

  global.fetch = (async () => {
    const payload = responses.shift() ?? [];
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await resolveTenantContext({ externalUserId: 'user-xyz' });
  expect(result).toEqual({ tenantId: 'tenant-abc', source: 'membership' });
});

test('v3 tenant resolver: provisions tenant when membership missing', async () => {
  const responses = [
    [{ id: 'user-777' }], // app_users select
    [], // tenant_memberships select (none)
    [{ id: 'tenant-new' }], // tenants upsert
    [], // tenant_memberships upsert
  ];

  global.fetch = (async () => {
    const payload = responses.shift() ?? [];
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const result = await resolveTenantContext({ externalUserId: 'new-user' });
  expect(result).toEqual({ tenantId: 'tenant-new', source: 'provisioned' });
});
