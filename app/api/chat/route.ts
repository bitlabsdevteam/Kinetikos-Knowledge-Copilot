import { NextResponse } from 'next/server';

import { validateAccessContext } from '@/lib/access-context';
import { evaluateAccessPolicy } from '@/lib/access-policy';
import type { ChatRequest } from '@/lib/contracts';
import { chatWithDify, isDifyEnabled } from '@/lib/dify-client';
import { resolveTenantContext } from '@/lib/tenant-context';
import { appendUsageLog } from '@/lib/usage-log';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest> & {
    tenantId?: string;
    difyConversationId?: string;
  };

  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const message = body.message.trim();
  const isJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(message);
  const sessionId = body.sessionId?.trim() || crypto.randomUUID();
  const userId = body.userId?.trim() || null;
  const effectiveUserId = userId ?? `anon-${sessionId}`;

  const accessValidation = validateAccessContext(body.accessContext);
  if (!accessValidation.ok) {
    return NextResponse.json({ error: accessValidation.error, code: 'invalid_access_context' }, { status: 400 });
  }

  const policy = evaluateAccessPolicy(accessValidation.value);
  if (!policy.allowed) {
    return NextResponse.json({ error: policy.reason, code: 'policy_denied' }, { status: 403 });
  }

  const difyConversationId = body.difyConversationId?.trim();
  const requestedTenantId = body.tenantId?.trim();
  const tenant = await resolveTenantContext({
    externalUserId: effectiveUserId,
    userDisplayName: body.userDisplayName?.trim() || null,
  });

  if (!tenant.tenantId) {
    return NextResponse.json({ error: 'tenant context resolution failed' }, { status: 503 });
  }

  if (requestedTenantId && requestedTenantId !== tenant.tenantId) {
    return NextResponse.json({ error: 'forbidden tenant override attempt' }, { status: 403 });
  }

  if (!isDifyEnabled()) {
    return NextResponse.json(
      {
        error: 'Dify is not configured in this deployment. Please set DIFY_API_KEY and DIFY_BASE_URL in Production env.',
        backend: 'dify-missing-config',
      },
      { status: 503 },
    );
  }

  let response: Awaited<ReturnType<typeof chatWithDify>>['response'];
  let conversationId: string | undefined;
  const backend = 'dify' as const;

  try {
    const result = await chatWithDify({
      message,
      userId: effectiveUserId,
      conversationId: difyConversationId,
      inputs: {
        enable_internet_search: Boolean(body.enableInternetSearch),
        session_id: sessionId,
        user_display_name: body.userDisplayName?.trim() || null,
        tenant_id: tenant.tenantId,
        preferred_language: isJapanese ? 'ja' : 'en',
      },
    });

    response = result.response;
    conversationId = result.conversationId;
  } catch (error) {
    const fallback = NextResponse.json({
      answer: "I don't know based on the available Kinetikos sources.",
      citations: [],
      grounded: false,
      suggestedQuestions: [],
      sessionId,
      sessionUserId: userId,
      difyConversationId,
      backend: 'dify-error',
      warning: error instanceof Error ? error.message : 'Dify request failed',
      tenantId: tenant.tenantId,
      access: {
        allowed: true,
        effectiveLimit: policy.effectiveLimit,
      },
    });
    fallback.headers.set('x-rag-backend', 'dify-error');
    return fallback;
  }

  await appendUsageLog({
    timestamp: new Date().toISOString(),
    sessionId,
    userId: userId ?? effectiveUserId,
    userDisplayName: body.userDisplayName?.trim() || null,
    tenantId: tenant.tenantId,
    message,
    answer: response.answer,
    grounded: response.grounded,
    citationIds: response.citations.map((citation) => citation.id),
    history: body.history?.map((h) => ({ role: h.role, text: h.text })) ?? [],
    difyConversationId: conversationId ?? difyConversationId ?? null,
  });

  const res = NextResponse.json({
    ...response,
    sessionId,
    sessionUserId: userId,
    difyConversationId: conversationId,
    backend,
    tenantId: tenant.tenantId,
    access: {
      allowed: true,
      effectiveLimit: policy.effectiveLimit,
    },
  });

  res.headers.set('x-rag-backend', backend);
  return res;
}
