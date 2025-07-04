
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import type { Source, Message } from '@/types';
import { BlogReferences } from '@/components/blog-references';
import { BlogGenerationForm } from '@/components/blog-generation-form';
import { ChatInterface } from '@/components/chat-interface';
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
  content: string;
}

function PageContent({
  sources,
  selectedSourceIds,
  setSelectedSourceIds,
  isLoadingSources,
  handleDeleteSource,
  isLoadingDelete,
  handleGeneratePost,
  isResponding,
  isGenerationFeatureEnabled,
}: {
  sources: Source[];
  selectedSourceIds: string[];
  setSelectedSourceIds: React.Dispatch<React.SetStateAction<string[]>>;
  isLoadingSources: boolean;
  handleDeleteSource: (id: string) => Promise<void>;
  isLoadingDelete: string | null;
  handleGeneratePost: (data: { topic: string; postType: string; tone: string; books_to_promote: string[]; wordPerPost: string; }) => Promise<void>;
  isResponding: boolean;
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
        isGenerating={isResponding}
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
  const [isResponding, setIsResponding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
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
            "X-Session-Id": "2676be630e97cc10"
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
            content: item.content,
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
  
  const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, onChunk: (chunk: any) => void) => {
    const decoder = new TextDecoder();
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
                    onChunk(parsed);
                } catch (e) {
                    console.warn("Could not parse stream chunk: ", e);
                }
            }
        }
    }
  };

  const handleGeneratePost = async (data: { topic: string; postType: string; tone: string; books_to_promote: string[]; wordPerPost: string; }) => {
    setIsResponding(true);
    setMessages([]);
    setConversationId(null);
    
    const selectedSourcesForPost = sources.filter((s) => selectedSourceIds.includes(s.id));

    const references = selectedSourcesForPost
      .map((source, index) => `${index + 1}. ${source.title}\n${source.content || source.snippet}`)
      .join('\n\n');
    
    const apiPayload = {
      inputs: {
        topic: data.topic,
        word_per_post: data.wordPerPost,
        books_to_promote: data.books_to_promote,
        post_type: data.postType,
        tone: data.tone,
        references: references,
      },
      query: 'start',
      conversation_id: '',
    };


    try {
        const response = await fetch('https://quarto.nvcr.ai/api/blogsmith/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        if (!response.body) {
          throw new Error("Response body is null");
        }

        let fullContent = '';
        let firstChunk = true;
        setMessages([{ role: 'assistant', content: '' }]);

        await processStream(response.body.getReader(), (parsed) => {
          if (firstChunk && parsed.conversation_id) {
            setConversationId(parsed.conversation_id);
            firstChunk = false;
          }
          if (parsed.event === 'agent_message' && parsed.answer) {
              fullContent += parsed.answer;
              setMessages(prev => [{ ...prev[0], content: fullContent }]);
          }
        });

        toast({ title: 'Blog Post Generated!', description: 'Your new blog post is ready. You can ask for edits below.' });
    } catch (error: any) {
        const errorMessage = `<p>There was an issue generating the post. Details: ${error.message}</p>`;
        setMessages([{ role: 'assistant', content: errorMessage }]);
        toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
        setIsResponding(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!conversationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active conversation.' });
      return;
    }
    
    setIsResponding(true);
    const newUserMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, newUserMessage]);
    
    try {
      const response = await fetch('https://quarto.nvcr.ai/api/blogsmith/chat', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              inputs: {},
              query: message,
              conversation_id: conversationId,
          }),
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error("Response body is null");
      }

      let fullContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      await processStream(response.body.getReader(), (parsed) => {
        if (parsed.event === 'agent_message' && parsed.answer) {
            fullContent += parsed.answer;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: fullContent };
                return newMessages;
            });
        }
      });
      
    } catch (error: any) {
        const errorMessage = `<p>There was an issue with the response. Details: ${error.message}</p>`;
        setMessages(prev => {
           const newMessages = [...prev];
           newMessages[newMessages.length - 1] = { role: 'assistant', content: errorMessage };
           return newMessages;
        });
        toast({ variant: 'destructive', title: 'Response Failed', description: error.message });
    } finally {
        setIsResponding(false);
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
              isResponding={isResponding}
              isGenerationFeatureEnabled={isGenerationFeatureEnabled}
            />
            {messages.length > 0 && (
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage}
                isResponding={isResponding} 
              />
            )}
          </>
        )}
      </main>
      <footer className="text-center py-8 mt-12 border-t border-primary/20">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Nouvelle Creations. All rights reserved.</p>
      </footer>
    </Suspense>
  );
}
