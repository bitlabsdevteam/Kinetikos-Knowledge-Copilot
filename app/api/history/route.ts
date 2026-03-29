import { NextResponse } from 'next/server';

import { resolveTenantContext } from '@/lib/tenant-context';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type HistoryRow = {
  session_id: string;
  user_message: string | null;
  assistant_answer: string | null;
  created_at?: string;
  metadata?: { timestamp?: string };
};

function toTimestamp(row: HistoryRow): string {
  return row.created_at ?? row.metadata?.timestamp ?? new Date(0).toISOString();
}

export async function GET(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 503 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId')?.trim();
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);

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
      )}&user_id=eq.${encodeURIComponent(userId)}&select=session_id,user_message,assistant_answer,created_at,metadata&order=created_at.desc&limit=${limit}`,
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
    return NextResponse.json({ error: `history read failed: ${lastError}` }, { status: 502 });
  }

  const bySession = new Map<string, { sessionId: string; latestAt: string; preview: string }>();
  for (const row of rows) {
    const latestAt = toTimestamp(row);
    const preview = row.user_message?.trim() || row.assistant_answer?.trim() || 'Conversation';
    const existing = bySession.get(row.session_id);
    if (!existing || latestAt > existing.latestAt) {
      bySession.set(row.session_id, {
        sessionId: row.session_id,
        latestAt,
        preview: preview.slice(0, 120),
      });
    }
  }

  const conversations = [...bySession.values()].sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));

  return NextResponse.json({ tenantId: tenant.tenantId, conversations });
}
