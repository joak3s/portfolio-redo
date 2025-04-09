/**
 * Type definitions for the RAG Chat system
 */

export interface ChatMessage {
  id?: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ConversationSession {
  id?: string;
  session_key?: string;
  title?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  chat_history?: ChatMessage[];
}

export interface ChatAnalytics {
  id?: string;
  query: string;
  response: string;
  session_id?: string;
  user_id?: string;
  search_results?: any[];
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  content_id: string;
  content_type: string;
  similarity: number;
  content: any;
}

export interface ChatSystemConfig {
  maxContextItems?: number;
  similarityThreshold?: number;
  historyLimit?: number;
  model?: string;
  temperature?: number;
  useHybridSearch?: boolean;
  showSearchMetrics?: boolean;
  persistConversations?: boolean;
}

export interface SearchResult<T = any> {
  content: T;
  content_id: string;
  content_type: string;
  similarity: number;
  content_summary?: string;
  metadata?: Record<string, any>;
} 