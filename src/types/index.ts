
import type { z } from 'zod';

// We can't import the type directly from the form component due to dependency cycles.
// So, we define a base schema here that can be extended.
const bookSchema = z.object({ value: z.string() });
export const baseFormSchema = z.object({
  topic: z.string(),
  description: z.string().optional(),
  wordPerPost: z.string(),
  postType: z.string(),
  tone: z.string(),
  books_to_promote: z.array(bookSchema).optional(),
});

export type FormValues = z.infer<typeof baseFormSchema>;


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

export interface GeneratedIdea {
    id: string;
    content: string;
    formValues: FormValues;
    selectedSources: Source[];
    isLoading?: boolean;
    isGeneratingPost?: boolean;
    conversationId?: string;
}
