import type { ChatResponse } from '@/lib/contracts';

type DifyRetrieverResource = {
  document_name?: string;
  segment?: string;
  score?: number;
  hit_count?: number;
  position?: number;
  dataset_id?: string;
  document_id?: string;
  segment_id?: string;
};

type DifyBlockingResponse = {
  conversation_id?: string;
  answer?: string;
  metadata?: {
    retriever_resources?: DifyRetrieverResource[];
  };
};

const DIFY_BASE_URL = (process.env.DIFY_BASE_URL ?? process.env.DIFY_API_BASE_URL ?? 'https://api.dify.ai/v1').replace(/\/$/, '');
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export function isDifyEnabled() {
  return Boolean(DIFY_API_KEY);
}

function mapCitations(resources: DifyRetrieverResource[] = []): ChatResponse['citations'] {
  return resources.slice(0, 4).map((r, i) => ({
    id: r.segment_id ?? `${r.document_id ?? 'doc'}-${i}`,
    title: r.document_name ?? `Source ${i + 1}`,
    sourceType: 'manual',
    href: '#',
    excerpt: (r.segment ?? '').slice(0, 180),
  }));
}

export async function chatWithDify(params: {
  message: string;
  userId: string;
  conversationId?: string;
  inputs?: Record<string, unknown>;
}): Promise<{ response: ChatResponse; conversationId?: string }> {
  if (!DIFY_API_KEY) throw new Error('DIFY_API_KEY missing');

  const res = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: params.inputs ?? {},
      query: params.message,
      response_mode: 'blocking',
      conversation_id: params.conversationId ?? '',
      user: params.userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify chat error ${res.status}: ${text}`);
  }

  const payload = (await res.json()) as DifyBlockingResponse;
  const answer = payload.answer?.trim() || "I don't know based on the available Kinetikos sources.";
  const citations = mapCitations(payload.metadata?.retriever_resources ?? []);

  return {
    response: {
      answer,
      grounded: citations.length > 0,
      citations,
      suggestedQuestions: [],
    },
    conversationId: payload.conversation_id,
  };
}
