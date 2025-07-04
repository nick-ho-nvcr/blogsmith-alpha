
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import type { Source, Message, Conversation, StoredConversation } from '@/types';
import { BlogReferences } from '@/components/blog-references';
import { BlogGenerationForm, type FormValues } from '@/components/blog-generation-form';
import { ChatInterface } from '@/components/chat-interface';
import { AppHeader } from '@/components/app-header';
import { AuthErrorDisplay } from '@/components/auth-error-display';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';


interface ApiSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
}

export default function Home() {
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDelete, setIsLoadingDelete] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
        const stored = sessionStorage.getItem('conversations');
        if (stored) {
            const storedConversations: StoredConversation[] = JSON.parse(stored);
            setConversations(storedConversations.map(c => ({...c, isGenerating: false})));
        }
    } catch (error) {
        console.error("Failed to load conversations from session storage", error);
        sessionStorage.removeItem('conversations');
    }
  }, []);

  useEffect(() => {
      try {
          if (conversations.length > 0) {
              const conversationsToStore: StoredConversation[] = conversations.map(({ isGenerating, ...rest }) => rest);
              sessionStorage.setItem('conversations', JSON.stringify(conversationsToStore));
          } else {
              sessionStorage.removeItem('conversations');
          }
      } catch (error) {
          console.error("Failed to save conversations to session storage", error);
      }
  }, [conversations]);


  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const response = await fetch('https://quarto.nvcr.ai/api/blogs', {
          credentials: 'omit',
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
        credentials: 'include',
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

  const handleGeneratePost = async (data: FormValues) => {
    const tempId = `temp-${Date.now()}`;
    const selectedSourcesForPost = sources.filter((s) => selectedSourceIds.includes(s.id));
    
    const newConversation: Conversation = {
      id: tempId,
      topic: data.topic,
      messages: [{ role: 'assistant', content: '' }],
      isGenerating: true,
      formValues: data,
      selectedSources: selectedSourcesForPost,
    };
    setConversations(prev => [newConversation, ...prev]);

    const references = selectedSourcesForPost
      .map((source, index) => `${index + 1}. ${source.title}\n${source.content || source.snippet}`)
      .join('\n\n');
    
    const apiPayload = {
      inputs: {
        topic: data.topic,
        word_per_post: data.wordPerPost,
        books_to_promote: data.books_to_promote.map(book => book.value).join('\n'),
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
            body: JSON.stringify(apiPayload),
            credentials: 'omit',
            headers: {
              'Content-Type': 'application/json',
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZGIzN2UyOC0xYjk5LTRiNDItYWRmYy04YWI3ZDUxYzIyNzEiLCJhdWQiOiIiLCJleHAiOjE3NTE3NTE4NzcsImlhdCI6MTc1MTU3OTA3NywiZW1haWwiOiJjYXNAbm91dmVsbGVjcmVhdGlvbnMuYWkiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6InN1cGFiYXNlX2FkbWluIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTE1NzkwNzd9XSwic2Vzc2lvbl9pZCI6IjI4MGYxZTE5LWM2MjItNGFlMy1hMzJmLTJhYTdmNWY1NTA2YSIsImlzX2Fub255bW91cyI6ZmFsc2V9.PlQZWHbcCsv-pPdjL4oT9Mds3QSCaFcnrIOD8gJ7j1I",
              "X-Session-Id": "2676be630e97cc10"
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        if (!response.body) {
          throw new Error("Response body is null");
        }

        let fullContent = '';
        await processStream(response.body.getReader(), (parsed) => {
          if (parsed.event === 'message' && parsed.message) {
              fullContent += parsed.message;
              setConversations(prev => prev.map(c => {
                  if (c.id === tempId) {
                      const updatedMessages = [...c.messages];
                      updatedMessages[0] = { role: 'assistant', content: fullContent };
                      return { ...c, messages: updatedMessages };
                  }
                  return c;
              }));
          } else if (parsed.event === 'message_end' && parsed.conversation_id) {
            setConversations(prev => prev.map(c => 
                c.id === tempId ? { ...c, id: parsed.conversation_id, isGenerating: false } : c
            ));
            toast({ title: 'Blog Post Generated!', description: 'Your new blog post is ready. You can ask for edits below.' });
          }
        });
    } catch (error: any) {
        setConversations(prev => prev.filter(c => c.id !== tempId));
        toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    }
  };

  const handleSendMessage = async (message: string, conversationId: string) => {
    setConversations(prev => prev.map(c => 
        c.id === conversationId 
        ? { ...c, messages: [...c.messages, { role: 'user', content: message }], isGenerating: true } 
        : c
    ));
    
    try {
      const response = await fetch('https://quarto.nvcr.ai/api/blogsmith/chat', {
          method: 'POST',
          body: JSON.stringify({
              inputs: {},
              query: message,
              conversation_id: conversationId,
          }),
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZGIzN2UyOC0xYjk5LTRiNDItYWRmYy04YWI3ZDUxYzIyNzEiLCJhdWQiOiIiLCJleHAiOjE3NTE3NTE4NzcsImlhdCI6MTc1MTU3OTA3NywiZW1haWwiOiJjYXNAbm91dmVsbGVjcmVhdGlvbnMuYWkiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6InN1cGFiYXNlX2FkbWluIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTE1NzkwNzd9XSwic2Vzc2lvbl9pZCI6IjI4MGYxZTE5LWM2MjItNGFlMy1hMzJmLTJhYTdmNWY1NTA2YSIsImlzX2Fub255bW91cyI6ZmFsc2V9.PlQZWHbcCsv-pPdjL4oT9Mds3QSCaFcnrIOD8gJ7j1I",
            "X-Session-Id": "2676be630e97cc10"
          },
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error("Response body is null");
      }

      let isFirstChunk = true;
      let fullContent = '';
      
      await processStream(response.body.getReader(), (parsed) => {
        if (parsed.event === 'message' && parsed.message) {
            if (isFirstChunk) {
                setConversations(prev => prev.map(c => 
                    c.id === conversationId 
                    ? { ...c, messages: [...c.messages, { role: 'assistant', content: '' }] }
                    : c
                ));
                isFirstChunk = false;
            }
            fullContent += parsed.message;
            setConversations(prev => prev.map(c => {
                if (c.id === conversationId) {
                    const newMessages = [...c.messages];
                    newMessages[newMessages.length - 1] = { role: 'assistant', content: fullContent };
                    return { ...c, messages: newMessages };
                }
                return c;
            }));
        }
      });
      
    } catch (error: any) {
        const errorMessage = `<p>There was an issue with the response. Details: ${error.message}</p>`;
        setConversations(prev => prev.map(c => {
           if (c.id === conversationId) {
             const newMessages = [...c.messages, {role: 'assistant', content: errorMessage}];
             return {...c, messages: newMessages};
           }
           return c;
        }));
        toast({ variant: 'destructive', title: 'Response Failed', description: error.message });
    } finally {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, isGenerating: false } : c));
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    toast({ title: "Conversation Removed" });
  };
  
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
  const isGenerating = conversations.some(c => c.isGenerating);

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
            <BlogReferences
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              onSelect={handleSelectSource}
              onDelete={handleDeleteSource}
              isLoadingDelete={isLoadingDelete}
              onToggleSelectAll={handleToggleSelectAll}
              areAllSourcesSelected={areAllSourcesSelected}
            />

            <BlogGenerationForm
              onSubmit={handleGeneratePost}
              isGenerating={isGenerating}
            />
            {conversations.length > 0 && (
              <div className="space-y-8 mt-12">
                <h2 className="text-3xl font-headline tracking-tight text-primary">Generated Ideas</h2>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {conversations.map(convo => (
                    <AccordionItem value={convo.id} key={convo.id} className="border-none">
                      <Card className="shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm w-full">
                        <AccordionTrigger className="p-0 w-full hover:no-underline [&>svg]:mx-6">
                            <CardHeader className="flex flex-row items-center justify-between w-full">
                                <CardTitle className="font-headline text-2xl">{convo.topic}</CardTitle>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        handleDeleteConversation(convo.id);
                                    }} 
                                    aria-label="Delete conversation"
                                >
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </Button>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent>
                             <Card className="mb-6 p-4 border-dashed bg-muted/30">
                                <CardHeader className="p-2">
                                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        Generation Details
                                    </CardTitle>
                                    <CardDescription>
                                        This idea was generated using the following settings and sources.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-2 text-sm space-y-3">
                                    <p><strong>Word Count:</strong> {convo.formValues.wordPerPost}</p>
                                    <p><strong>Post Type:</strong> {convo.formValues.postType}</p>
                                    <p><strong>Tone:</strong> {convo.formValues.tone}</p>
                                    <div>
                                        <strong>Books to Promote:</strong>
                                        <ul className="list-disc list-inside">
                                            {convo.formValues.books_to_promote.map(book => <li key={book.value}>{book.value}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1"><strong>Selected Sources:</strong></h4>
                                        <div className="flex flex-wrap gap-2">
                                        {convo.selectedSources.length > 0 ? convo.selectedSources.map(source => (
                                            <Badge key={source.id} variant="secondary">{source.title}</Badge>
                                        )) : <p className="text-muted-foreground">No sources were selected.</p>}
                                        </div>
                                    </div>
                                </CardContent>
                             </Card>
                            <ChatInterface 
                              messages={convo.messages} 
                              onSendMessage={(message) => handleSendMessage(message, convo.id)}
                              isResponding={convo.isGenerating} 
                            />
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
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
