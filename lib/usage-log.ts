import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

import type { ChatResponse } from '@/lib/contracts';

export type UsageLogEntry = {
  timestamp: string;
  sessionId: string;
  userId: string | null;
  userDisplayName?: string | null;
  message: string;
  answer?: string;
  grounded: ChatResponse['grounded'];
  citationIds: string[];
};

const dataDirectory = path.join(process.cwd(), 'data');
const usageLogPath = path.join(dataDirectory, 'usage-log.jsonl');

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function appendSupabaseConversationHistory(entry: UsageLogEntry) {
  if (!supabaseUrl || !serviceRoleKey) return;

  const payload = {
    tenant_id: process.env.RAG_DEFAULT_TENANT ?? 'global_kinetikos',
    session_id: entry.sessionId,
    user_id: entry.userId,
    user_display_name: entry.userDisplayName ?? null,
    user_message: entry.message,
    assistant_answer: entry.answer ?? null,
    grounded: entry.grounded,
    citation_ids: entry.citationIds,
    metadata: { timestamp: entry.timestamp },
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/customer_conversation_history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`supabase conversation history insert failed: ${response.status} ${errorText}`);
  }
}

export async function appendUsageLog(entry: UsageLogEntry) {
  try {
    await mkdir(dataDirectory, { recursive: true });
    await appendFile(usageLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
    await appendSupabaseConversationHistory(entry);
  } catch (error) {
    console.warn('[usage-log] Skipping log write.', error);
  }
}
