type TenantContext = {
  tenantId: string;
  source: 'membership' | 'provisioned' | 'default';
};

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultTenant = process.env.RAG_DEFAULT_TENANT ?? 'global_kinetikos';

async function supabaseFetch(path: string, init?: RequestInit) {
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service role config missing');

  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(init?.headers ?? {}),
    },
  });
}

function toTenantKey(externalUserId: string) {
  const normalized = externalUserId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `u-${normalized}`.slice(0, 60);
}

async function findUserId(externalUserId: string): Promise<string | null> {
  const res = await supabaseFetch(`app_users?external_user_id=eq.${encodeURIComponent(externalUserId)}&select=id&limit=1`);
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

async function upsertUser(externalUserId: string, displayName?: string | null): Promise<string | null> {
  const res = await supabaseFetch('app_users?on_conflict=external_user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      {
        external_user_id: externalUserId,
        display_name: displayName ?? null,
      },
    ]),
  });

  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

async function findMembershipTenantId(userId: string): Promise<string | null> {
  const res = await supabaseFetch(`tenant_memberships?user_id=eq.${encodeURIComponent(userId)}&status=eq.active&select=tenant_id&limit=1`);
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ tenant_id: string }>;
  return rows[0]?.tenant_id ?? null;
}

async function upsertTenant(externalUserId: string): Promise<string | null> {
  const tenantKey = toTenantKey(externalUserId);
  const res = await supabaseFetch('tenants?on_conflict=tenant_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      {
        tenant_key: tenantKey,
        display_name: `Tenant ${externalUserId.slice(0, 8)}`,
      },
    ]),
  });

  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

async function upsertMembership(tenantId: string, userId: string) {
  await supabaseFetch('tenant_memberships?on_conflict=tenant_id,user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([
      {
        tenant_id: tenantId,
        user_id: userId,
        role: 'owner',
        member_level: 'basic',
        status: 'active',
      },
    ]),
  });
}

export async function resolveTenantContext(params: {
  externalUserId?: string | null;
  userDisplayName?: string | null;
}): Promise<TenantContext> {
  const externalUserId = params.externalUserId?.trim();
  if (!externalUserId || !supabaseUrl || !serviceRoleKey) {
    return { tenantId: defaultTenant, source: 'default' };
  }

  const existingUserId = await findUserId(externalUserId);
  const userId = existingUserId ?? (await upsertUser(externalUserId, params.userDisplayName));

  if (!userId) {
    return { tenantId: defaultTenant, source: 'default' };
  }

  const existingTenant = await findMembershipTenantId(userId);
  if (existingTenant) {
    return { tenantId: existingTenant, source: 'membership' };
  }

  const tenantId = await upsertTenant(externalUserId);
  if (!tenantId) {
    return { tenantId: defaultTenant, source: 'default' };
  }

  await upsertMembership(tenantId, userId);
  return { tenantId, source: 'provisioned' };
}
