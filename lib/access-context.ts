import type { AccessContext } from '@/lib/contracts';

export function validateAccessContext(input: unknown): { ok: true; value: AccessContext } | { ok: false; error: string } {
  if (input == null) return { ok: true, value: {} };
  if (typeof input !== 'object') return { ok: false, error: 'accessContext must be an object' };

  const obj = input as Record<string, unknown>;

  if (obj.memberLevel != null && typeof obj.memberLevel !== 'string') {
    return { ok: false, error: 'accessContext.memberLevel must be string' };
  }

  if (obj.permissions != null && !Array.isArray(obj.permissions)) {
    return { ok: false, error: 'accessContext.permissions must be string[]' };
  }

  if (Array.isArray(obj.permissions) && obj.permissions.some((p) => typeof p !== 'string')) {
    return { ok: false, error: 'accessContext.permissions must be string[]' };
  }

  if (obj.usageCountToday != null && typeof obj.usageCountToday !== 'number') {
    return { ok: false, error: 'accessContext.usageCountToday must be number' };
  }

  if (obj.usageLimitOverride != null && typeof obj.usageLimitOverride !== 'number') {
    return { ok: false, error: 'accessContext.usageLimitOverride must be number' };
  }

  if (obj.source != null && obj.source !== 'craft-cms' && obj.source !== 'web' && obj.source !== 'unknown') {
    return { ok: false, error: 'accessContext.source must be craft-cms|web|unknown' };
  }

  if (obj.signature != null && typeof obj.signature !== 'string') {
    return { ok: false, error: 'accessContext.signature must be string' };
  }

  return {
    ok: true,
    value: {
      memberLevel: typeof obj.memberLevel === 'string' ? obj.memberLevel : undefined,
      permissions: Array.isArray(obj.permissions) ? (obj.permissions as string[]) : undefined,
      usageCountToday: typeof obj.usageCountToday === 'number' ? obj.usageCountToday : undefined,
      usageLimitOverride: typeof obj.usageLimitOverride === 'number' ? obj.usageLimitOverride : undefined,
      source: (obj.source as AccessContext['source']) ?? 'unknown',
      signature: typeof obj.signature === 'string' ? obj.signature : undefined,
    },
  };
}
