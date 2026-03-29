import { NextResponse } from 'next/server';

import { resolveTenantContext } from '@/lib/tenant-context';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type HistoryRow = {
  user_message: string | null;
  assistant_answer: string | null;
  created_at?: string;
  metadata?: { timestamp?: string; dify_conversation_id?: string | null };
};

function rowTimestamp(row: HistoryRow) {
  return row.created_at ?? row.metadata?.timestamp ?? new Date(0).toISOString();
}

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 503 });
  }

  const { sessionId } = await params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId')?.trim();

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const tenant = await resolveTenantContext({ externalUserId: userId });
  const candidates = [process.env.SUPABASE_CONVERSATION_TABLE, 'customer_conversation_history', 'History'].filter(Boolean) as string[];

  let rows: HistoryRow[] = [];
  let lastError = '';

  for (const table of candidates) {
    const encodedTable = encodeURIComponent(table);
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${encodedTable}?tenant_id=eq.${encodeURIComponent(
        tenant.tenantId,
      )}&user_id=eq.${encodeURIComponent(userId)}&session_id=eq.${encodeURIComponent(
        sessionId,
      )}&select=user_message,assistant_answer,created_at,metadata&order=created_at.asc`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.ok) {
      rows = (await response.json()) as HistoryRow[];
      break;
    }

    lastError = await response.text();
  }

  if (!rows.length && lastError) {
    return NextResponse.json({ error: `history detail read failed: ${lastError}` }, { status: 502 });
  }

  const ordered = rows.sort((a, b) => (rowTimestamp(a) > rowTimestamp(b) ? 1 : -1));
  const messages: Array<{ role: 'user' | 'assistant'; text: string }> = [];

  for (const row of ordered) {
    if (row.user_message) messages.push({ role: 'user', text: row.user_message });
    if (row.assistant_answer) messages.push({ role: 'assistant', text: row.assistant_answer });
  }

  const last = ordered[ordered.length - 1];
  const difyConversationId = last?.metadata?.dify_conversation_id ?? null;

  return NextResponse.json({ sessionId, difyConversationId, messages });
}
