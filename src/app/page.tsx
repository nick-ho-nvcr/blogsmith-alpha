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
  handleGeneratePost: (data: { topic: string; postType: string; tone: string; books_to_promote?: string | undefined; }) => Promise<void>;
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

      {isGenerating && isGenerationFeatureEnabled && (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-accent/50 rounded-xl bg-accent/5 min-h-[200px]">
          <Loader2 className="h-16 w-16 text-accent animate-spin mb-6" />
          <h3 className="text-2xl font-headline text-accent mb-2">Generating Your Blog Post...</h3>
          <p className="text-muted-foreground max-w-md">
            Our AI is hard at work crafting your content. This might take a few moments. Please wait.
          </p>
        </div>
      )}
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
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZGIzN2UyOC0xYjk5LTRiNDItYWRmYy04YWI3ZDUxYzIyNzEiLCJhdWQiOiIiLCJleHAiOjE3NTE1NzcyOTUsImlhdCI6MTc1MTQwNDQ5NSwiZW1haWwiOiJjYXNAbm91dmVsbGVjcmVhdGlvbnMuYWkiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6InN1cGFiYXNlX2FkbWluIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTE0MDQ0OTV9XSwic2Vzc2lvbl9pZCI6ImY1NTQ1NzE5LTM2ZWEtNDBkNy04M2JkLTEzMjZmMmRhYjMxMCIsImlzX2Fub255bW91cyI6ZmFsc2V9.lwra3S4q3H6Gg6piYEYM5640RRWnXh5lVuDxhFjKJ9A",
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

  const handleGeneratePost = async (data: { topic: string; postType: string; tone: string; books_to_promote?: string }) => {
    setIsGenerating(true);
    setGeneratedPost(null);
    const selectedSourcesForPost = sources.filter((s) => selectedSourceIds.includes(s.id));

    // This is a placeholder for the generation logic.
    // If Dify or another service is called, it needs its own auth mechanism (e.g. API Key).
    // This example simulates a successful generation after a delay.
    try {
      console.log('Simulating blog post generation with:', {
        ...data,
        selectedSources: selectedSourcesForPost,
      });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      const mockPost = {
        title: `Generated Post: ${data.topic}`,
        content: `<p>This is a simulated blog post about "<strong>${data.topic}</strong>".</p><p>It was inspired by <strong>${selectedSourcesForPost.length} sources</strong> and is written in a <em>${data.tone || 'neutral'}</em> tone.</p>${data.books_to_promote ? `<p>It also promotes this book: <a href="${data.books_to_promote}" target="_blank" rel="noopener noreferrer">${data.books_to_promote}</a></p>` : ''}`,
      };
      setGeneratedPost(mockPost);
      toast({ title: 'Blog Post Generated!', description: 'Your new blog post is ready below.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generation Error', description: error.message });
      setGeneratedPost({ title: 'Generation Error', content: `<p>${error.message}</p>` });
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
