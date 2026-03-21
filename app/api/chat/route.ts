import { NextResponse } from 'next/server';

import type { ChatRequest } from '@/lib/contracts';
import { answerFromKnowledgeBase } from '@/lib/mock-knowledge';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest>;

  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const response = answerFromKnowledgeBase(body.message.trim());

  return NextResponse.json(response);
}
