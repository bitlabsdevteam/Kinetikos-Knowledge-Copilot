export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  citations?: Citation[];
};

export type Citation = {
  id: string;
  title: string;
  sourceType: 'article' | 'video' | 'manual';
  href: string;
  excerpt: string;
};

export type ChatRequest = {
  message: string;
  history: Array<Pick<ChatMessage, 'role' | 'text'>>;
  userId?: string;
  userDisplayName?: string;
};

export type ChatResponse = {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  sessionUserId?: string | null;
};
