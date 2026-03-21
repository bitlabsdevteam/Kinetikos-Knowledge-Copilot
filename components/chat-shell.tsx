'use client';

import { KeyboardEvent, useMemo, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const starterMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'こんにちは。Kinetikos Knowledge Copilot の初期UIです。ここから Dify 連携、引用表示、会話メモリ、ログ連携を実装していきます。',
  },
];

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !isComposing, [input, isComposing]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isComposing) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'プレースホルダー応答です。次に Dify API と grounded citations を接続します。',
      },
    ]);
    setInput('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (isComposing) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      sendMessage();
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
            </article>
          ))}
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
            <button type="button" onClick={sendMessage} disabled={!canSend}>
              Send
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
