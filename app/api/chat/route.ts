import { NextResponse } from 'next/server';

import type { ChatRequest } from '@/lib/contracts';
import { answerFromKnowledgeBase } from '@/lib/mock-knowledge';
import { appendUsageLog } from '@/lib/usage-log';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest>;

  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const message = body.message.trim();
  const userId = body.userId?.trim() || null;
  const response = answerFromKnowledgeBase(message);

  await appendUsageLog({
    timestamp: new Date().toISOString(),
    userId,
    message,
    grounded: response.grounded,
    citationIds: response.citations.map((citation) => citation.id),
  });

  return NextResponse.json({
    ...response,
    sessionUserId: userId,
  });
}
