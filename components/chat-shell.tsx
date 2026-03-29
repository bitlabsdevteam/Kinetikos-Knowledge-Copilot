'use client';

import { KeyboardEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import type { ChatMessage, ChatResponse } from '@/lib/contracts';
import { HOST_USER_EVENT_TYPE, isHostUserPayload } from '@/lib/host-user';

const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Welcome to Kinetikos Clinical Copilot. I only answer with evidence. If evidence is missing, I will say: 'I don't know based on the available Kinetikos sources.'",
    citations: [],
  },
];

const LOADING_STAGES = ['Thinking…', 'Grounding against internal sources…', 'Composing evidence-based answer…'];

function fallbackSuggestions(fromPrompt: string): string[] {
  const topic = fromPrompt.trim().slice(0, 80);
  return [
    `Can you summarize this in 3 key points?${topic ? ` (${topic})` : ''}`,
    'What are the risks, limitations, or contraindications?',
    'What should I ask next to validate this answer?',
  ];
}

function renderMessageText(text: string): ReactNode {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return <p>{text}</p>;

  const bulletLines = lines.filter((line) => /^([-*]|\d+\.)\s+/.test(line));
  const paragraphLines = lines.filter((line) => !/^([-*]|\d+\.)\s+/.test(line));

  return (
    <>
      {paragraphLines.length > 0 ? <p>{paragraphLines.join(' ')}</p> : null}
      {bulletLines.length > 0 ? (
        <ul>
          {bulletLines.map((line, idx) => (
            <li key={`${line}-${idx}`}>{line.replace(/^([-*]|\d+\.)\s+/, '')}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

type ChatShellProps = {
  showLogout?: boolean;
  onLogout?: () => void;
};

type HistorySummary = {
  sessionId: string;
  latestAt: string;
  preview: string;
};

export function ChatShell({ showLogout = false, onLogout }: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [enableInternetSearch, setEnableInternetSearch] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [difyConversationId, setDifyConversationId] = useState<string | undefined>();
  const [backendMode, setBackendMode] = useState<string>('dify');
  const [historyItems, setHistoryItems] = useState<HistorySummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('kinetikos_theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (!isHostUserPayload(event.data)) return;
      setUserId(event.data.userId);
      setUserDisplayName(event.data.displayName ?? null);
    };

    window.addEventListener('message', handleMessage);
    window.parent?.postMessage({ type: HOST_USER_EVENT_TYPE, status: 'ready' }, '*');
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!isSubmitting) return;
    const timer = setInterval(() => setLoadingStage((prev) => (prev + 1) % LOADING_STAGES.length), 1200);
    return () => clearInterval(timer);
  }, [isSubmitting]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('kinetikos_theme', theme);
  }, [theme]);

  useEffect(() => {
    const effectiveUserId = userId ?? `anon-${sessionId}`;
    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/history?userId=${encodeURIComponent(effectiveUserId)}&limit=20`);
        if (!res.ok) return;
        const payload = (await res.json()) as { conversations?: HistorySummary[] };
        if (active) setHistoryItems(payload.conversations ?? []);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [userId, sessionId]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isComposing && !isSubmitting,
    [input, isComposing, isSubmitting],
  );

  const sendMessage = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isComposing || isSubmitting) return;

    const nextUserMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const nextHistory = [...messages, nextUserMessage];

    setMessages(nextHistory);
    if (!preset) setInput('');
    setIsSubmitting(true);
    setError(null);
    setLoadingStage(0);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map(({ role, text: messageText }) => ({ role, text: messageText })),
          sessionId,
          userId: userId ?? undefined,
          userDisplayName: userDisplayName ?? undefined,
          enableInternetSearch,
          difyConversationId,
        }),
      });

      if (!response.ok) {
        const errPayload = (await response.json().catch(() => ({ error: 'chat request failed' }))) as {
          error?: string;
          backend?: string;
        };
        if (errPayload.backend) setBackendMode(errPayload.backend);
        throw new Error(errPayload.error || 'chat request failed');
      }

      const payload = (await response.json()) as ChatResponse;
      if (payload.backend) setBackendMode(payload.backend);
      if (payload.difyConversationId) setDifyConversationId(payload.difyConversationId);

      const safeSuggestions =
        payload.suggestedQuestions && payload.suggestedQuestions.length > 0
          ? payload.suggestedQuestions
          : fallbackSuggestions(text);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: payload.answer,
          citations: payload.citations,
          suggestedQuestions: safeSuggestions,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch a response. Check API configuration and connectivity.');
      setMessages((current) => current.filter((message) => message.id !== nextUserMessage.id));
      if (!preset) setInput(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewSession = async () => {
    const currentConversationId = difyConversationId;
    if (currentConversationId) {
      await fetch('/api/chat/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difyConversationId: currentConversationId }),
      }).catch(() => undefined);
    }

    setDifyConversationId(undefined);
    setSessionId(crypto.randomUUID());
    setMessages(starterMessages);
    setInput('');
    setError(null);
    setIsSubmitting(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const nativeEvent = event.nativeEvent as unknown as { isComposing?: boolean; keyCode?: number };
    const composing = isComposing || nativeEvent.isComposing || nativeEvent.keyCode === 229;

    if (event.key === 'Enter' && !event.shiftKey) {
      if (composing) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <main className="page-shell">
      <div className="ambient-orb ambient-orb-left" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-right" aria-hidden="true" />

      <header className="top-banner">
        <div>
          <p className="eyebrow">Kinetikos</p>
        </div>
        <nav className="top-banner-nav" aria-label="Account navigation">
          {showLogout ? (
            <button type="button" className="suggestion-chip" onClick={onLogout} disabled={!onLogout}>
              Logout
            </button>
          ) : (
            <>
              <a href="/login">Login</a>
              <a href="/onboarding">Register</a>
            </>
          )}
        </nav>
      </header>

      <section className="experience-frame">
        <aside className="info-rail">
          <div className="brand-block">
            <p className="eyebrow">Kinetikos</p>
            <h1>Clinical Agentic RAG</h1>
          </div>

          <div className="rail-card">
            <span className="rail-label">History</span>
            {historyLoading ? <p>Loading history…</p> : null}
            {!historyLoading && historyItems.length === 0 ? <p>No conversations yet.</p> : null}
            {historyItems.slice(0, 8).map((item) => (
              <button
                key={item.sessionId}
                type="button"
                className="suggestion-chip"
                onClick={async () => {
                  const effectiveUserId = userId ?? `anon-${sessionId}`;
                  const res = await fetch(
                    `/api/history/${encodeURIComponent(item.sessionId)}?userId=${encodeURIComponent(effectiveUserId)}`,
                  );
                  if (!res.ok) return;

                  const payload = (await res.json()) as {
                    sessionId: string;
                    difyConversationId?: string | null;
                    messages?: Array<{ role: 'user' | 'assistant'; text: string }>;
                  };

                  setSessionId(payload.sessionId);
                  setDifyConversationId(payload.difyConversationId ?? undefined);
                  setMessages([
                    ...starterMessages,
                    ...(payload.messages ?? []).map((m) => ({
                      id: crypto.randomUUID(),
                      role: m.role,
                      text: m.text,
                    })),
                  ]);
                }}
              >
                {item.preview}
              </button>
            ))}
          </div>

          <div className="rail-card">
            <span className="rail-label">Agent controls</span>
            <label className="toggle-row">
              <span>Enable Internet Search</span>
              <button
                type="button"
                className={`toggle ${enableInternetSearch ? 'toggle-on' : ''}`}
                onClick={() => setEnableInternetSearch((v) => !v)}
              >
                {enableInternetSearch ? 'ON' : 'OFF'}
              </button>
            </label>
            <p>OFF = internal vector DB only. ON = agent can call Perplexity search when internal evidence is insufficient.</p>
          </div>
        </aside>

        <section className="chat-panel">
          <header className="chat-panel-header">
            <div>
              <p className="panel-kicker">Grounded conversation</p>
              <h2>Ask clinical questions. Get source-bound answers.</h2>
            </div>
            <div className="status-cluster">
              <span className="status-dot" />
              <span>{enableInternetSearch ? 'Agentic RAG + Internet' : 'Agentic RAG Only'}</span>
              <span>backend: {backendMode}</span>
              <button type="button" className="suggestion-chip" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
                Theme: {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
              <button type="button" className="suggestion-chip" onClick={() => void startNewSession()} disabled={isSubmitting}>
                New Session
              </button>
            </div>
          </header>

          <div className="message-list">
            {messages.map((message) => (
              <article key={message.id} className={`message-card message-${message.role}`}>
                <div className="message-meta">
                  <span className="message-role">{message.role === 'assistant' ? 'AYA' : 'User'}</span>
                </div>
                <div className="message-text">{renderMessageText(message.text)}</div>

                {message.citations && message.citations.length > 0 ? (
                  <div className="citation-list">
                    <p className="suggestion-title">Sources</p>
                    {message.citations.map((citation) => {
                      const content = (
                        <>
                          <div className="citation-head">
                            <strong>{citation.title}</strong>
                            <span>{citation.sourceType}</span>
                          </div>
                          <p>{citation.excerpt}</p>
                        </>
                      );

                      if (citation.href && citation.href !== '#') {
                        return (
                          <a key={citation.id} className="citation-card" href={citation.href} target="_blank" rel="noreferrer">
                            {content}
                          </a>
                        );
                      }

                      return (
                        <div key={citation.id} className="citation-card citation-card-disabled">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {message.role === 'assistant' ? (
                  <div className="suggestion-list">
                    <p className="suggestion-title">Try to ask</p>
                    {(message.suggestedQuestions && message.suggestedQuestions.length > 0
                      ? message.suggestedQuestions
                      : fallbackSuggestions(message.text)
                    )
                      .slice(0, 3)
                      .map((q) => (
                        <button key={q} type="button" className="suggestion-chip" onClick={() => void sendMessage(q)}>
                          {q}
                        </button>
                      ))}
                  </div>
                ) : null}
              </article>
            ))}

            {isSubmitting ? (
              <div className="loading-state" aria-live="polite">
                <span className="loading-line" />
                <span>{LOADING_STAGES[loadingStage]}</span>
              </div>
            ) : null}
          </div>

          <footer className="composer-shell">
            <div className="composer-intro">
              <span className="rail-label">Prompt</span>
              <p>Agent decides tool calls. Unsupported answers return “I don&apos;t know.”</p>
            </div>

            <div className="composer">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="Example: What are high-protein meal preparation priorities for this week?"
                rows={5}
              />

              <div className="composer-actions">
                <div className="composer-hints">
                  <span>IME-safe input</span>
                  <span>Agentic tool calls</span>
                  <span>No-hallucination policy</span>
                </div>
                <button type="button" onClick={() => void sendMessage()} disabled={!canSend}>
                  {isSubmitting ? 'Responding…' : 'Send message'}
                </button>
              </div>
            </div>

            {error ? <p className="composer-error">{error}</p> : null}
          </footer>
        </section>
      </section>
    </main>
  );
}
