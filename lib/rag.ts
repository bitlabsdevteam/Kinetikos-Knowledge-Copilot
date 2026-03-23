import type { ChatHistoryEntry, ChatResponse, Citation } from '@/lib/contracts';

type MatchChunkRow = {
  chunk_id: string;
  text_content: string;
  metadata?: Record<string, unknown>;
  page_start?: number | null;
  page_end?: number | null;
  similarity?: number;
};

type RAGInput = {
  message: string;
  history?: ChatHistoryEntry[];
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large';
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini';
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAG_DEFAULT_TENANT = process.env.RAG_DEFAULT_TENANT ?? 'global_kinetikos';

const TOP_K = Number(process.env.RAG_RETRIEVAL_TOP_K ?? 6);
const MIN_GROUNDED_MATCHES = 1;

const REFUSAL_MESSAGE = "I don't know based on the available Kinetikos sources.";

function mapSourceType(sourceTypeRaw: unknown): Citation['sourceType'] {
  const value = String(sourceTypeRaw ?? '').toLowerCase();
  if (value.includes('video')) return 'video';
  if (value.includes('article')) return 'article';
  return 'manual';
}

function buildCitation(row: MatchChunkRow, index: number): Citation {
  const sourceFileName = String(row.metadata?.source_file_name ?? row.metadata?.source ?? `source-${index + 1}`);
  const sourceType = mapSourceType(row.metadata?.source_type ?? row.metadata?.type);
  const pageLabel = row.page_start ? `p.${row.page_start}` : 'n/a';

  return {
    id: row.chunk_id || `chunk-${index}`,
    title: sourceFileName,
    sourceType,
    href: '#',
    excerpt: `${pageLabel} · ${row.text_content.slice(0, 180)}`,
  };
}

async function createEmbedding(input: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`embedding request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { data?: Array<{ embedding: number[] }> };
  const embedding = payload.data?.[0]?.embedding;

  if (!embedding || embedding.length === 0) {
    throw new Error('embedding payload missing vector');
  }

  return embedding;
}

async function retrieveRelevantChunks(queryEmbedding: number[]): Promise<MatchChunkRow[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are missing');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_document_chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query_embedding: queryEmbedding,
      match_count: TOP_K,
      filter_tenant: RAG_DEFAULT_TENANT,
    }),
  });

  if (!response.ok) {
    throw new Error(`supabase match rpc failed: ${response.status}`);
  }

  const rows = (await response.json()) as MatchChunkRow[];
  return Array.isArray(rows) ? rows : [];
}

async function groundedSynthesis(question: string, chunks: MatchChunkRow[], history: ChatHistoryEntry[]) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const contextBlock = chunks
    .slice(0, TOP_K)
    .map((chunk, idx) => {
      const source = String(chunk.metadata?.source_file_name ?? chunk.metadata?.source ?? `source-${idx + 1}`);
      const page = chunk.page_start ? `p.${chunk.page_start}` : 'n/a';
      return `[${idx + 1}] ${source} (${page})\n${chunk.text_content}`;
    })
    .join('\n\n');

  const recentTurns = history.slice(-4).map((turn) => `${turn.role.toUpperCase()}: ${turn.text}`).join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a strict grounded assistant. Use ONLY provided context. If context is insufficient, answer exactly: "I don\'t know based on the available Kinetikos sources." Do not fabricate.',
        },
        {
          role: 'user',
          content: `Question:\n${question}\n\nRecent conversation:\n${recentTurns || 'N/A'}\n\nContext:\n${contextBlock}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`chat completion failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() || REFUSAL_MESSAGE;
}

export async function answerFromRAG({ message, history = [] }: RAGInput): Promise<ChatResponse> {
  try {
    const queryEmbedding = await createEmbedding(message);
    const chunks = await retrieveRelevantChunks(queryEmbedding);

    if (chunks.length < MIN_GROUNDED_MATCHES) {
      return { grounded: false, answer: REFUSAL_MESSAGE, citations: [] };
    }

    const answer = await groundedSynthesis(message, chunks, history);
    const normalized = answer.trim().toLowerCase();
    const grounded =
      normalized !== REFUSAL_MESSAGE.toLowerCase() &&
      !normalized.startsWith("i don't know") &&
      !normalized.startsWith('i do not know');

    return {
      grounded,
      answer,
      citations: grounded ? chunks.slice(0, 3).map(buildCitation) : [],
    };
  } catch {
    return {
      grounded: false,
      answer: REFUSAL_MESSAGE,
      citations: [],
    };
  }
}
