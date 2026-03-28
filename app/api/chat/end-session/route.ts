import { NextResponse } from 'next/server';

import { deleteDifyConversation, isDifyEnabled } from '@/lib/dify-client';

export async function POST(request: Request) {
  if (!isDifyEnabled()) {
    return NextResponse.json({ ok: false, error: 'Dify is not configured.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { difyConversationId?: string };
  const difyConversationId = body.difyConversationId?.trim();

  if (!difyConversationId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await deleteDifyConversation(difyConversationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to delete Dify conversation.' },
      { status: 502 },
    );
  }
}
