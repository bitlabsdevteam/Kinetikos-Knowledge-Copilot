import { NextResponse } from 'next/server';

import type { ChatRequest } from '@/lib/contracts';
import { answerFromRAG } from '@/lib/rag';
import { chatWithDify, isDifyEnabled } from '@/lib/dify-client';
import { appendUsageLog } from '@/lib/usage-log';

const MAX_HISTORY_ITEMS = 10;

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest>;

  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const message = body.message.trim();
  const sessionId = body.sessionId?.trim() || crypto.randomUUID();
  const userId = body.userId?.trim() || null;
  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (entry): entry is NonNullable<ChatRequest['history']>[number] =>
            !!entry &&
            (entry.role === 'user' || entry.role === 'assistant') &&
            typeof entry.text === 'string' &&
            entry.text.trim().length > 0,
        )
        .slice(-MAX_HISTORY_ITEMS)
        .map((entry) => ({
          role: entry.role,
          text: entry.text.trim(),
        }))
    : [];

  const difyUserId = userId ?? `anon-${sessionId}`;
  const difyConversationId = (body as { difyConversationId?: string }).difyConversationId?.trim();

  const { response, conversationId, backend } = isDifyEnabled()
    ? await chatWithDify({
        message,
        userId: difyUserId,
        conversationId: difyConversationId,
        inputs: {
          enable_internet_search: Boolean(body.enableInternetSearch),
          session_id: sessionId,
          user_display_name: body.userDisplayName?.trim() || null,
        },
      }).then((r) => ({ ...r, backend: 'dify' as const }))
    : {
        response: await answerFromRAG({
          message,
          history,
          enableInternetSearch: Boolean(body.enableInternetSearch),
        }),
        conversationId: undefined,
        backend: 'local-rag' as const,
      };

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
