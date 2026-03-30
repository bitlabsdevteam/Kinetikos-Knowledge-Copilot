import { createHmac, timingSafeEqual } from 'node:crypto';

type MemberTokenClaims = {
  user_id?: string;
  tenant_id?: string;
  member_level?: string;
  scopes?: string[];
  usage_count_today?: number;
  usage_limit?: number;
  exp?: number;
};

export type ResolvedMemberContext = {
  userId: string;
  tenantId: string;
  memberLevel?: string;
  scopes: string[];
  usageCountToday?: number;
  usageLimitOverride?: number;
};

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function normalizeToken(token: string): string {
  return token.trim().replace(/^Bearer\s+/i, '').trim();
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  const direct = request.headers.get('x-kinetikos-access-token');
  const candidate = auth || direct;
  if (!candidate) return null;
  return normalizeToken(candidate);
}

export function readMemberContextFromRequest(request: Request): ResolvedMemberContext | null {
  const token = getTokenFromRequest(request);
  const secret = process.env.CRAFT_MEMBER_TOKEN_SECRET;
  if (!token || !secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const signed = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac('sha256', secret).update(signed).digest();
  const providedSig = Buffer.from(signatureB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  if (providedSig.length !== expectedSig.length || !timingSafeEqual(providedSig, expectedSig)) {
    return null;
  }

  let claims: MemberTokenClaims;
  try {
    claims = JSON.parse(base64UrlDecode(payloadB64)) as MemberTokenClaims;
  } catch {
    return null;
  }

  if (!claims.user_id || !claims.tenant_id) return null;
  if (typeof claims.exp === 'number' && Date.now() / 1000 > claims.exp) return null;

  return {
    userId: claims.user_id,
    tenantId: claims.tenant_id,
    memberLevel: claims.member_level,
    scopes: Array.isArray(claims.scopes) ? claims.scopes : [],
    usageCountToday: typeof claims.usage_count_today === 'number' ? claims.usage_count_today : undefined,
    usageLimitOverride: typeof claims.usage_limit === 'number' ? claims.usage_limit : undefined,
  };
}
