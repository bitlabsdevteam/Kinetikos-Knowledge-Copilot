import type { ChatHistoryEntry, ChatResponse, Citation } from '@/lib/contracts';

type MatchChunkRow = {
  chunk_id: string;
  text_content: string;
  metadata?: Record<string, unknown>;
  page_start?: number | null;
  similarity?: number;
};

type AgentInput = {
  message: string;
  history?: ChatHistoryEntry[];
  enableInternetSearch?: boolean;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PRIMARY_MODEL = process.env.OPENAI_CHAT_MODEL ?? 'gpt-5.4';
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAG_DEFAULT_TENANT = process.env.RAG_DEFAULT_TENANT ?? 'global_kinetikos';
const TOP_K = Number(process.env.RAG_RETRIEVAL_TOP_K ?? 6);

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL ?? 'sonar';

const REFUSAL_MESSAGE = "I don't know based on the available Kinetikos sources.";

function toCitation(row: MatchChunkRow, index: number): Citation {
  const sourceFileName = String(row.metadata?.source_file_name ?? row.metadata?.source ?? `source-${index + 1}`);
  const sourceTypeRaw = String(row.metadata?.source_type ?? row.metadata?.type ?? 'manual').toLowerCase();
  const sourceType: Citation['sourceType'] = sourceTypeRaw.includes('video')
    ? 'video'
    : sourceTypeRaw.includes('article')
      ? 'article'
      : 'manual';

  return {
    id: row.chunk_id || `chunk-${index}`,
    title: sourceFileName,
    sourceType,
    href: '#',
    excerpt: `${row.page_start ? `p.${row.page_start}` : 'n/a'} · ${row.text_content.slice(0, 160)}`,
  };
}

async function createEmbedding(input: string): Promise<number[]> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input }),
  });

  if (!response.ok) throw new Error(`embedding failed ${response.status}`);
  const payload = (await response.json()) as { data?: Array<{ embedding: number[] }> };
  const emb = payload.data?.[0]?.embedding;
  if (!emb) throw new Error('embedding missing');
  return emb;
}

async function ragSearch(query: string): Promise<MatchChunkRow[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  const emb = await createEmbedding(query);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_document_chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query_embedding: emb,
      match_count: TOP_K,
      filter_tenant: RAG_DEFAULT_TENANT,
    }),
  });

  if (!response.ok) return [];
  const rows = (await response.json()) as MatchChunkRow[];
  return Array.isArray(rows) ? rows : [];
}

async function perplexitySearch(query: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) return 'Perplexity API key is missing.';

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [{ role: 'user', content: query }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) return `Perplexity search failed (${response.status}).`;
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content?.trim() ?? 'No internet result returned.';
}

async function openaiChat(messages: unknown[], tools?: unknown[]) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_PRIMARY_MODEL,
      temperature: 0,
      messages,
      tools,
      tool_choice: tools ? 'auto' : undefined,
    }),
  });

  if (!response.ok) throw new Error(`openai chat failed ${response.status}`);
  return response.json();
}

async function geminiFallback(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) return REFUSAL_MESSAGE;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0 },
      }),
    },
  );

  if (!response.ok) return REFUSAL_MESSAGE;
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || REFUSAL_MESSAGE;
}

function defaultSuggestions(topic: string): string[] {
  return [
    `What are the first practical steps for ${topic}?`,
    `Can you summarize this into a daily checklist?`,
    'What should I avoid to reduce mistakes?',
  ];
}

export async function answerFromRAG({ message, history = [], enableInternetSearch = false }: AgentInput): Promise<ChatResponse> {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'rag_search',
        description: 'Search internal Kinetikos vector database.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    },
    ...(enableInternetSearch
      ? [
          {
            type: 'function',
            function: {
              name: 'internet_search',
              description: 'Search on the internet via Perplexity API when internal KB is not enough.',
              parameters: {
                type: 'object',
                properties: { query: { type: 'string' } },
                required: ['query'],
              },
            },
          },
        ]
      : []),
  ];

  const messages: Array<Record<string, unknown>> = [
    {
      role: 'system',
      content:
        "You are an agentic hospital knowledge assistant. Decide when to call tools. Prefer rag_search first. Use internet_search only when internal retrieval is insufficient and internet mode is enabled. Never hallucinate. If evidence is insufficient, output exactly: I don't know based on the available Kinetikos sources.",
    },
    {
      role: 'user',
      content: `Question: ${message}\nRecent context: ${history
        .slice(-4)
        .map((h) => `${h.role}: ${h.text}`)
        .join(' | ')}`,
    },
  ];

  let ragRows: MatchChunkRow[] = [];
  let finalAnswer = REFUSAL_MESSAGE;

  try {
    for (let i = 0; i < 3; i += 1) {
      const payload = (await openaiChat(messages, tools)) as {
        choices?: Array<{
          message?: {
            content?: string;
            tool_calls?: Array<{
              id: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
        }>;
      };

      const msg = payload.choices?.[0]?.message;
      const toolCalls = msg?.tool_calls ?? [];

      if (toolCalls.length === 0) {
        finalAnswer = msg?.content?.trim() || REFUSAL_MESSAGE;
        break;
      }

      messages.push({ role: 'assistant', content: msg?.content ?? '', tool_calls: toolCalls });

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function?.name;
        const args = JSON.parse(toolCall.function?.arguments || '{}') as { query?: string };
        const query = args.query || message;

        if (toolName === 'rag_search') {
          ragRows = await ragSearch(query);
          const toolResult = ragRows.length
            ? ragRows
                .slice(0, TOP_K)
                .map((r, idx) => `[${idx + 1}] ${r.text_content}`)
                .join('\n\n')
            : 'NO_MATCH';

          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });
          continue;
        }

        if (toolName === 'internet_search') {
          const internetResult = await perplexitySearch(query);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: internetResult });
        }
      }
    }
  } catch {
    finalAnswer = await geminiFallback(
      `Answer this with strict grounding. If unsupported, say exactly: ${REFUSAL_MESSAGE}. Question: ${message}`,
    );
  }

  const normalized = finalAnswer.trim().toLowerCase();
  const grounded =
    normalized !== REFUSAL_MESSAGE.toLowerCase() &&
    !normalized.startsWith("i don't know") &&
    !normalized.startsWith('i do not know');

  return {
    grounded,
    answer: grounded ? finalAnswer : REFUSAL_MESSAGE,
    citations: grounded ? ragRows.slice(0, 3).map(toCitation) : [],
    suggestedQuestions: grounded ? defaultSuggestions(message.toLowerCase()) : [],
  };
}
