import type { FormValues } from '@/components/blog-generation-form';

export interface Source {
  id: string;
  title: string;
  link: string;
  snippet: string;
  content: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string; // HTML content for assistant
}

export interface Conversation {
  id: string; // Dify conversation_id, starts as a temporary ID
  topic: string;
  messages: Message[];
  isGenerating: boolean;
  formValues: FormValues;
  selectedSources: Source[];
}

export type StoredConversation = Omit<Conversation, 'isGenerating'>;
