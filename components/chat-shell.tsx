'use client';

import { KeyboardEvent, useEffect, useMemo, useState } from 'react';

import type { ChatMessage, ChatResponse } from '@/lib/contracts';
import { HOST_USER_EVENT_TYPE, isHostUserPayload } from '@/lib/host-user';

const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'こんにちは。Kinetikos Knowledge Copilot へようこそ。必要な情報だけを静かに整理し、根拠が確認できる内容に絞って日本語でご案内します。',
    citations: [
      {
        id: 'demo-citation',
        title: 'Grounded Answering Policy',
        sourceType: 'manual',
        excerpt: '回答は信頼できるソースに基づく内容のみを返し、十分な根拠がなければ曖昧さを明示します。',
        href: '#',
      },
    ],
  },
];

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (!isHostUserPayload(event.data)) {
        return;
      }

      setUserId(event.data.userId);
      setUserDisplayName(event.data.displayName ?? null);
    };

    window.addEventListener('message', handleMessage);
    window.parent?.postMessage({ type: HOST_USER_EVENT_TYPE, status: 'ready' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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
          userId: userId ?? undefined,
          userDisplayName: userDisplayName ?? undefined,
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
      setError('応答の取得に失敗しました。API 接続と設定を確認してください。');
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
      <div className="ambient-orb ambient-orb-left" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-right" aria-hidden="true" />

      <section className="experience-frame">
        <aside className="info-rail">
          <div className="brand-block">
            <p className="eyebrow">Kinetikos</p>
            <h1>Knowledge Copilot</h1>
            <p className="subtitle">
              Japanese-first grounded RAG experience for premium educational guidance.
            </p>
          </div>

          <div className="rail-card">
            <span className="rail-label">Session</span>
            <div className={`session-pill ${userId ? 'session-pill-live' : 'session-pill-pending'}`}>
              {userId ? 'User linked' : 'Awaiting host user'}
            </div>
            <p>
              {userId
                ? `${userDisplayName ?? userId} として利用ログを紐づけます。`
                : '埋め込み元から userId を受け取ると、利用ログと会話履歴を紐づけます。'}
            </p>
          </div>

          <div className="rail-card">
            <span className="rail-label">Design intent</span>
            <ul className="principle-list">
              <li>Grounded answers only</li>
              <li>Clean citations with source clarity</li>
              <li>Japanese-native chat behavior</li>
              <li>Premium, calm, high-trust interface</li>
            </ul>
          </div>

          <div className="rail-card rail-card-accent">
            <span className="rail-label">Interaction note</span>
            <p>
              Enter sends the message only when IME composition is complete. Shift + Enter creates a
              new line.
            </p>
          </div>
        </aside>

        <section className="chat-panel">
          <header className="chat-panel-header">
            <div>
              <p className="panel-kicker">Grounded conversation</p>
              <h2>Ask in Japanese. Receive traceable answers.</h2>
            </div>
            <div className="status-cluster">
              <span className="status-dot" />
              <span>Knowledge-backed mode</span>
            </div>
          </header>

          <div className="message-list">
            {messages.map((message) => (
              <article key={message.id} className={`message-card message-${message.role}`}>
                <div className="message-meta">
                  <span className="message-role">{message.role === 'assistant' ? 'Copilot' : 'You'}</span>
                  <span className="message-divider" />
                  <span className="message-tone">
                    {message.role === 'assistant' ? 'Grounded synthesis' : 'Prompt'}
                  </span>
                </div>
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
                        <div className="citation-head">
                          <strong>{citation.title}</strong>
                          <span>{citation.sourceType}</span>
                        </div>
                        <p>{citation.excerpt}</p>
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {isSubmitting ? (
              <div className="loading-state" aria-live="polite">
                <span className="loading-line" />
                <span>根拠を確認しながら回答を整理しています…</span>
              </div>
            ) : null}
          </div>

          <footer className="composer-shell">
            <div className="composer-intro">
              <span className="rail-label">Prompt</span>
              <p>Ask naturally. The assistant should synthesize only what it can support with evidence.</p>
            </div>

            <div className="composer">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="例: このプログラムで筋肥大を優先する場合、最初に意識すべきポイントを整理して教えてください。"
                rows={5}
              />

              <div className="composer-actions">
                <div className="composer-hints">
                  <span>IME-safe input</span>
                  <span>Grounded citations</span>
                  <span>Follow-up memory</span>
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
