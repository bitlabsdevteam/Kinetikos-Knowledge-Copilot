import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { ChatResponse } from '@/lib/contracts';

export type UsageLogEntry = {
  timestamp: string;
  sessionId: string;
  userId: string | null;
  tenantId: string;
  userDisplayName?: string | null;
  message: string;
  answer?: string;
  grounded: ChatResponse['grounded'];
  citationIds: string[];
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  difyConversationId?: string | null;
};

const dataDirectory = path.join(process.cwd(), 'data');
const usageLogPath = path.join(dataDirectory, 'usage-log.jsonl');

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function appendSupabaseConversationHistory(entry: UsageLogEntry) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[usage-log] Missing Supabase URL or key for conversation history insert.');
    return;
  }

  const payload = {
    tenant_id: entry.tenantId,
    session_id: entry.sessionId,
    user_id: entry.userId,
    user_display_name: entry.userDisplayName ?? null,
    user_message: entry.message,
    assistant_answer: entry.answer ?? null,
    grounded: entry.grounded,
    citation_ids: entry.citationIds,
    metadata: {
      timestamp: entry.timestamp,
      history: entry.history ?? [],
      dify_conversation_id: entry.difyConversationId ?? null,
    },
  };

  const candidates = [
    process.env.SUPABASE_CONVERSATION_TABLE,
    'customer_conversation_history',
    'custome_conversation_history',
    'History',
  ].filter(Boolean) as string[];

  let lastError = '';
  for (const table of candidates) {
    const encodedTable = encodeURIComponent(table);
    const response = await fetch(`${supabaseUrl}/rest/v1/${encodedTable}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) return;
    lastError = await response.text();
  }

  throw new Error(`supabase conversation history insert failed for [${candidates.join(', ')}]: ${lastError}`);
}

export async function appendUsageLog(entry: UsageLogEntry) {
  try {
    await appendSupabaseConversationHistory(entry);
  } catch (error) {
    console.warn('[usage-log] Supabase conversation log failed.', error);
  }

  try {
    await mkdir(dataDirectory, { recursive: true });
    await appendFile(usageLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.warn('[usage-log] Local file log failed.', error);
  }
}
