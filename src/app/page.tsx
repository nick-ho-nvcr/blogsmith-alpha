
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import type { Source, GeneratedBlogPost } from '@/types';
import { BlogReferences } from '@/components/blog-references';
import { BlogGenerationForm } from '@/components/blog-generation-form';
import { GeneratedBlogPost as GeneratedBlogPostDisplay } from '@/components/generated-blog-post';
import { AppHeader } from '@/components/app-header';
import { AuthErrorDisplay } from '@/components/auth-error-display';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ApiSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
}

function PageContent({
  sources,
  selectedSourceIds,
  setSelectedSourceIds,
  isLoadingSources,
  handleDeleteSource,
  isLoadingDelete,
  handleGeneratePost,
  isGenerating,
  isGenerationFeatureEnabled,
}: {
  sources: Source[];
  selectedSourceIds: string[];
  setSelectedSourceIds: React.Dispatch<React.SetStateAction<string[]>>;
  isLoadingSources: boolean;
  handleDeleteSource: (id: string) => Promise<void>;
  isLoadingDelete: string | null;
  handleGeneratePost: (data: { topic: string; postType: string; tone: string; books_to_promote: string[]; }) => Promise<void>;
  isGenerating: boolean;
  isGenerationFeatureEnabled: boolean;
}) {
  const handleSelectSource = (id: string, selected: boolean) => {
    setSelectedSourceIds((prev) =>
      selected ? [...prev, id] : prev.filter((sourceId) => sourceId !== id)
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedSourceIds.length === sources.length && sources.length > 0) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(sources.map((s) => s.id));
    }
  };

  const areAllSourcesSelected = sources.length > 0 && selectedSourceIds.length === sources.length;

  return (
    <>
      {isLoadingSources ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-lg rounded-xl">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-8 w-10 ml-auto" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <BlogReferences
          sources={sources}
          selectedSourceIds={selectedSourceIds}
          onSelect={handleSelectSource}
          onDelete={handleDeleteSource}
          isLoadingDelete={isLoadingDelete}
          onToggleSelectAll={handleToggleSelectAll}
          areAllSourcesSelected={areAllSourcesSelected}
        />
      )}

      <BlogGenerationForm
        onSubmit={handleGeneratePost}
        isGenerating={isGenerating}
        isEffectivelyDisabled={!isGenerationFeatureEnabled}
      />
    </>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDelete, setIsLoadingDelete] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedBlogPost | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const response = await fetch('https://quarto.nvcr.ai/api/blogs', {
          // todo revert cred
          credentials: 'omit', // Crucial for sending HttpOnly cookies cross-domain
          headers: {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZGIzN2UyOC0xYjk5LTRiNDItYWRmYy04YWI3ZDUxYzIyNzEiLCJhdWQiOiIiLCJleHAiOjE3NTE3NTE4NzcsImlhdCI6MTc1MTU3OTA3NywiZW1haWwiOiJjYXNAbm91dmVsbGVjcmVhdGlvbnMuYWkiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6InN1cGFiYXNlX2FkbWluIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTE1NzkwNzd9XSwic2Vzc2lvbl9pZCI6IjI4MGYxZTE5LWM2MjItNGFlMy1hMzJmLTJhYTdmNWY1NTA2YSIsImlzX2Fub255bW91cyI6ZmFsc2V9.PlQZWHbcCsv-pPdjL4oT9Mds3QSCaFcnrIOD8gJ7j1I",
            "X-Session-Id": "1234"
          },

        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message + `(Status: ${response.status})`;
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const fetchedSources: Source[] = result.data.map((item: ApiSource) => ({
            id: item.id,
            title: item.title,
            link: item.url,
            snippet: item.excerpt,
          }));
          setSources(fetchedSources);
          setSelectedSourceIds(fetchedSources.map((s) => s.id));
          setAuthError(null);
        } else {
          throw new Error(result.message || 'API returned an unexpected data structure.');
        }
      } catch (error: any) {
        setAuthError(`Please ensure you are logged in via the Chrome Extension. Error: ${error.message}`);
        setSources([]);
      } finally {
        setIsLoadingSources(false);
      }
    };

    fetchSources();
  }, []);

  const handleDeleteSource = async (id: string) => {
    setIsLoadingDelete(id);
    try {
      const response = await fetch(`https://quarto.nvcr.ai/api/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Crucial for sending HttpOnly cookies cross-domain
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete source. (Status: ${response.status})`);
      }
      
      const updatedSources = sources.filter((source) => source.id !== id);
      setSources(updatedSources);
      setSelectedSourceIds((prev) => prev.filter((sourceId) => sourceId !== id));
      toast({ title: 'Source Removed', description: 'The reference has been removed.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsLoadingDelete(null);
    }
  };

  const handleGeneratePost = async (data: { topic: string; postType: string; tone: string; books_to_promote: string[] }) => {
    setIsGenerating(true);
    setGeneratedPost({ title: `Generating: ${data.topic}`, content: "" });
    const selectedSourcesForPost = sources.filter((s) => selectedSourceIds.includes(s.id));

    const prompt = `
Generate a blog post in HTML format based on the following details.

**Topic**: ${data.topic}

**Desired Post Type/Structure**: ${data.postType || 'A standard article with an introduction, body, and conclusion.'}

**Tone of Voice**: ${data.tone || 'Conversational and semi-professional.'}

**Promotional Links to Include**: 
${data.books_to_promote.map(book => `- ${book}`).join('\n')}
Please seamlessly integrate these links into the content where relevant.

**Reference Material**:
Use the following sources for information and inspiration.
${selectedSourcesForPost.length > 0 ? selectedSourcesForPost.map(source => `
- Title: ${source.title}
  URL: ${source.link}
  Snippet: ${source.snippet}
`).join('') : 'No specific sources provided.'}

Your response should be ONLY the raw HTML for the blog post content. Start directly with the first HTML tag (e.g., an <h1> for the title). Do not include markdown fences (\`\`\`html) or any text outside of the HTML itself.
`;

    try {
        const response = await fetch('https://dify.nvcr.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer app-N3dqM0zTq5Crck2Q0ZLefRnA',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: {},
                query: prompt,
                response_mode: 'streaming',
                user: 'nouvelle-blogsmith-user',
                conversation_id: '',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let leftover = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = leftover + decoder.decode(value);
            const lines = chunk.split('\n\n');
            
            leftover = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6);
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.event === 'agent_message' && parsed.answer) {
                            fullContent += parsed.answer;
                            
                            let postTitle = `Generating: ${data.topic}`;
                            let postContent = fullContent;
                    
                            const titleMatch = fullContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
                            if (titleMatch && titleMatch[1]) {
                                postTitle = titleMatch[1];
                                postContent = fullContent.replace(/<h1[^>]*>.*?<\/h1>/i, '');
                            }
                            
                            setGeneratedPost({ title: postTitle, content: postContent });
                        }
                    } catch (e) {
                        console.warn("Could not parse stream chunk: ", e);
                    }
                }
            }
        }

        toast({ title: 'Blog Post Generated!', description: 'Your new blog post is ready below.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        setGeneratedPost({ title: 'Generation Error', content: `<p>There was an issue generating the post. Details: ${error.message}</p>` });
    } finally {
        setIsGenerating(false);
    }
  };


  const isGenerationFeatureEnabled = true;

  if (isLoadingSources) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Fetching sources...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AppHeader />
      <main className="container mx-auto px-4 py-8 space-y-12 min-h-screen">
        {authError ? (
          <AuthErrorDisplay error={authError} />
        ) : (
          <>
            <PageContent
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              setSelectedSourceIds={setSelectedSourceIds}
              isLoadingSources={isLoadingSources}
              handleDeleteSource={handleDeleteSource}
              isLoadingDelete={isLoadingDelete}
              handleGeneratePost={handleGeneratePost}
              isGenerating={isGenerating}
              isGenerationFeatureEnabled={isGenerationFeatureEnabled}
            />
            {generatedPost && <GeneratedBlogPostDisplay post={generatedPost} />}
          </>
        )}
      </main>
      <footer className="text-center py-8 mt-12 border-t border-primary/20">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Nouvelle Creations. All rights reserved.</p>
      </footer>
    </Suspense>
  );
}
