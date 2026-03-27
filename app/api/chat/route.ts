import { NextResponse } from 'next/server';

import type { ChatRequest } from '@/lib/contracts';
import { chatWithDify, isDifyEnabled } from '@/lib/dify-client';
import { appendUsageLog } from '@/lib/usage-log';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest>;

  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const message = body.message.trim();
  const sessionId = body.sessionId?.trim() || crypto.randomUUID();
  const userId = body.userId?.trim() || null;
  const difyUserId = userId ?? `anon-${sessionId}`;
  const difyConversationId = (body as { difyConversationId?: string }).difyConversationId?.trim();

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
      userId: difyUserId,
      conversationId: difyConversationId,
      inputs: {
        enable_internet_search: Boolean(body.enableInternetSearch),
        session_id: sessionId,
        user_display_name: body.userDisplayName?.trim() || null,
      },
    });
    response = result.response;
    conversationId = result.conversationId;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Dify request failed',
        backend,
      },
      { status: 502 },
    );
  }

  await appendUsageLog({
    timestamp: new Date().toISOString(),
    sessionId,
    userId,
    userDisplayName: body.userDisplayName?.trim() || null,
    message,
    answer: response.answer,
    grounded: response.grounded,
    citationIds: response.citations.map((citation) => citation.id),
  });

  const res = NextResponse.json({
    ...response,
    sessionId,
    sessionUserId: userId,
    difyConversationId: conversationId,
    backend,
  });
  res.headers.set('x-rag-backend', backend);
  return res;
}
