'use client';

import { KeyboardEvent, useMemo, useState } from 'react';

import type { ChatMessage, ChatResponse } from '@/lib/contracts';

const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'こんにちは。Kinetikos Knowledge Copilot の grounded chat thin slice です。現在はモック知識ベース経由で、根拠がある時だけ引用付きで回答します。',
  },
];

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isComposing && !isSubmitting,
    [input, isComposing, isSubmitting],
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isComposing || isSubmitting) return;

    const nextUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };

    const nextHistory = [...messages, nextUserMessage];

    setMessages(nextHistory);
    setInput('');
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map(({ role, text: messageText }) => ({ role, text: messageText })),
        }),
      });

      if (!response.ok) {
        throw new Error('chat request failed');
      }

      const payload = (await response.json()) as ChatResponse;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: payload.answer,
          citations: payload.citations,
        },
      ]);
    } catch {
      setError('応答の取得に失敗しました。API 接続を確認してください。');
      setMessages((current) => current.filter((message) => message.id !== nextUserMessage.id));
      setInput(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (isComposing) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <main className="page-shell">
      <section className="chat-card">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Kinetikos</p>
            <h1>Knowledge Copilot</h1>
            <p className="subtitle">Japanese-first grounded RAG MVP scaffold</p>
          </div>
        </header>

        <div className="message-list">
          {messages.map((message) => (
            <article key={message.id} className={`message message-${message.role}`}>
              <span className="message-role">{message.role === 'assistant' ? 'AI' : 'You'}</span>
              <p>{message.text}</p>
              {message.citations && message.citations.length > 0 ? (
                <div className="citation-list">
                  {message.citations.map((citation) => (
                    <a
                      key={citation.id}
                      className="citation-card"
                      href={citation.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <strong>{citation.title}</strong>
                      <span>{citation.sourceType}</span>
                      <p>{citation.excerpt}</p>
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {isSubmitting ? <div className="loading-state">回答を整理しています…</div> : null}
        </div>

        <footer className="composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="日本語で質問してください…"
            rows={4}
          />
          <div className="composer-actions">
            <span className="composer-hint">IME-safe Enter handling is enabled.</span>
            <button type="button" onClick={() => void sendMessage()} disabled={!canSend}>
              {isSubmitting ? 'Sending…' : 'Send'}
            </button>
          </div>
          {error ? <p className="composer-error">{error}</p> : null}
        </footer>
      </section>
    </main>
  );
}
