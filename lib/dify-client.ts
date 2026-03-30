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
  source_url?: string;
  url?: string;
  link?: string;
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

function safeDomain(href: string): string | undefined {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function isTrustedHttpUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function mapCitations(resources: DifyRetrieverResource[] = []): ChatResponse['citations'] {
  return resources.slice(0, 4).map((r, i) => {
    const trustedTitle = r.document_name?.trim();
    const candidateHref = r.source_url?.trim() || r.url?.trim() || r.link?.trim() || '';
    const citable = isTrustedHttpUrl(candidateHref);
    const href = citable ? candidateHref : '#';

    return {
      id: r.segment_id ?? `${r.document_id ?? 'doc'}-${i}`,
      title: trustedTitle && trustedTitle.length > 0 ? trustedTitle : `Document ${String(r.document_id ?? i).slice(0, 8)}`,
      sourceType: 'manual',
      href,
      excerpt: (r.segment ?? '').slice(0, 180),
      domain: citable ? safeDomain(href) : undefined,
      citable,
    };
  });
}

function sanitizeAnswerLinks(answer: string, citations: ChatResponse['citations']): string {
  const trusted = new Set(citations.map((c) => c.href).filter((href) => href && href !== '#'));
  if (trusted.size === 0) {
    return answer.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1');
  }

  return answer.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_match, label: string, url: string) => {
    return trusted.has(url) ? `[${label}](${url})` : label;
  });
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
  const rawAnswer = payload.answer?.trim() || "I don't know based on the available Kinetikos sources.";
  const citations = mapCitations(payload.metadata?.retriever_resources ?? []);
  const answer = sanitizeAnswerLinks(rawAnswer, citations);

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

export async function deleteDifyConversation(conversationId: string): Promise<void> {
  if (!DIFY_API_KEY) throw new Error('DIFY_API_KEY missing');

  const res = await fetch(`${DIFY_BASE_URL}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify delete conversation error ${res.status}: ${text}`);
  }
}
