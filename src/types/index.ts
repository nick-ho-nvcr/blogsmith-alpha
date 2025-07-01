export interface Source {
  id: string;
  title: string;
  link: string;
  snippet: string;
}

export interface GeneratedBlogPost {
  title: string;
  content: string; // HTML content
}
