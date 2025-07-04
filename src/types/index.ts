export interface Source {
  id: string;
  title: string;
  link: string;
  snippet: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string; // HTML content for assistant
}
