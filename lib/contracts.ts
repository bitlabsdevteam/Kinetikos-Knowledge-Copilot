export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  citations?: Citation[];
  suggestedQuestions?: string[];
};

export type Citation = {
  id: string;
  title: string;
  sourceType: 'article' | 'video' | 'manual';
  href: string;
  excerpt: string;
};

export type ChatHistoryEntry = Pick<ChatMessage, 'role' | 'text'>;

export type ChatRequest = {
  message: string;
  history: ChatHistoryEntry[];
  enableInternetSearch?: boolean;
  sessionId?: string;
  userId?: string;
  userDisplayName?: string;
};

export type ChatResponse = {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  suggestedQuestions?: string[];
  sessionId?: string;
  sessionUserId?: string | null;
  difyConversationId?: string;
  backend?: string;
};
