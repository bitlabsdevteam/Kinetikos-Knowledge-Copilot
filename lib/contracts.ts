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
  domain?: string;
  citable?: boolean;
};

export type ChatHistoryEntry = Pick<ChatMessage, 'role' | 'text'>;

export type AccessContext = {
  memberLevel?: string;
  permissions?: string[];
  usageCountToday?: number;
  usageLimitOverride?: number;
  source?: 'craft-cms' | 'web' | 'unknown';
  signature?: string;
};

export type ChatRequest = {
  message: string;
  history: ChatHistoryEntry[];
  enableInternetSearch?: boolean;
  desiredLanguage?: 'ja' | 'en';
  sessionId?: string;
  userId?: string;
  userDisplayName?: string;
  difyConversationId?: string;
  accessContext?: AccessContext;
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
  warning?: string;
};
