export type AccessContext = {
  memberLevel?: string | null;
  permissions?: string[];
  usageCountToday?: number;
  usageLimitOverride?: number | null;
};

export type AccessDecision =
  | { allowed: true; reason: 'ok'; effectiveLimit: number }
  | { allowed: false; reason: string; effectiveLimit: number };

const DEFAULT_LIMITS: Record<string, number> = {
  basic: 30,
  pro: 200,
  enterprise: 5000,
};

function normalizeLevel(level?: string | null) {
  return (level ?? 'basic').toLowerCase();
}

export function evaluateAccessPolicy(ctx: AccessContext): AccessDecision {
  const level = normalizeLevel(ctx.memberLevel);
  const permissions = new Set((ctx.permissions ?? []).map((p) => p.toLowerCase()));
  const effectiveLimit = ctx.usageLimitOverride ?? DEFAULT_LIMITS[level] ?? DEFAULT_LIMITS.basic;
  const usage = ctx.usageCountToday ?? 0;

  if (permissions.has('rag:deny')) {
    return { allowed: false, reason: 'access denied by permission policy', effectiveLimit };
  }

  if (!permissions.has('rag:chat') && level === 'basic') {
    return { allowed: false, reason: 'missing rag:chat permission for basic member', effectiveLimit };
  }

  if (usage >= effectiveLimit) {
    return { allowed: false, reason: `usage limit reached (${usage}/${effectiveLimit})`, effectiveLimit };
  }

  return { allowed: true, reason: 'ok', effectiveLimit };
}
