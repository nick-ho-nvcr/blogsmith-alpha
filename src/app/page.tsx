
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import type { Source, Message, Conversation, StoredConversation, GeneratedIdea, FormValues } from '@/types';
import { BlogReferences } from '@/components/blog-references';
import { BlogGenerationForm } from '@/components/blog-generation-form';
import { ChatInterface } from '@/components/chat-interface';
import { AppHeader } from '@/components/app-header';
import { AuthErrorDisplay } from '@/components/auth-error-display';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, Settings, Expand, Wand2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AccordionHeader } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';


interface ApiSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
}

// Helper to create a summary from the content
const createSummary = (htmlContent: string, wordLimit: number = 10): string => {
  if (!htmlContent) return 'New Idea';
  const textContent = htmlContent.replace(/<[^>]*>/g, ' '); // Strip HTML tags
  const words = textContent.trim().split(/\s+/);
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  return textContent;
};


export default function Home() {
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDelete, setIsLoadingDelete] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>();
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);

  useEffect(() => {
    try {
        const stored = sessionStorage.getItem('conversations');
        if (stored) {
            const storedConversations: StoredConversation[] = JSON.parse(stored);
            setConversations(storedConversations.map(c => ({...c, isGenerating: false})));
        }
        const storedIdeas = sessionStorage.getItem('generatedIdeas');
        if (storedIdeas) {
            setGeneratedIdeas(JSON.parse(storedIdeas));
        }
    } catch (error) {
        console.error("Failed to load data from session storage", error);
        sessionStorage.removeItem('conversations');
        sessionStorage.removeItem('generatedIdeas');
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
          if (generatedIdeas.length > 0) {
            const ideasToStore = generatedIdeas.filter(idea => !idea.isLoading && !idea.isGeneratingPost);
            if (ideasToStore.length > 0) {
              sessionStorage.setItem('generatedIdeas', JSON.stringify(ideasToStore));
            } else {
              sessionStorage.removeItem('generatedIdeas');
            }
          } else {
              sessionStorage.removeItem('generatedIdeas');
          }
      } catch (error) {
          console.error("Failed to save data to session storage", error);
      }
  }, [conversations, generatedIdeas]);


  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const response = await fetch('https://quarto.nvcr.ai/api/blogs', {
          credentials: 'omit',
          headers: {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWRiOTFmZC0yOWFjLTQ4MzEtYjgyMC1hYTNkMTcwNzdlMjQiLCJhdWQiOiIiLCJleHAiOjE3NTMxNjkyMDYsImlhdCI6MTc1Mjk5NjQwNiwiZW1haWwiOiJuaWNrLmhvQG5vdXZlbGxlY3JlYXRpb25zLmFpIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2lLbVVqU19WNjU4dTdNQUJ6QUJnR3pPY1lETUlReUo1dzB6SS1qZmdYR1VzaHFBPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6Im5vdXZlbGxlY3JlYXRpb25zLmFpIn0sImVtYWlsIjoibmljay5ob0Bub3V2ZWxsZWNyZWF0aW9ucy5haSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJOaWNrIEhvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5pY2sgSG8iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaUttVWpTX1Y2NTh1N01BQnpBQmdHek9jWURNSVF5SjV3MHpJLWpmZ1hHVXNocUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSIsInN1YiI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSJ9LCJyb2xlIjoic3VwYWJhc2VfYWRtaW4iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1Mjk5NjQwNn1dLCJzZXNzaW9uX2lkIjoiZTg3Zjk0NDktMmVkMC00ZDQ4LTk5ZDItYTM1NzgyMDhmODgyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.544ZFU_7zFyoYYMLkcHQRU4ooHz25hE1FUqJDoC9Eh4",
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

  const handleGenerateIdeas = async (data: FormValues) => {
    setIsGeneratingIdeas(true);
    
    try {
      sessionStorage.setItem('formValues', JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save form data to session storage", error);
    }
    
    const selectedSourcesForPost = sources.filter((s) => selectedSourceIds.includes(s.id));
    
    // Create placeholder ideas
    const placeholderIdeas: GeneratedIdea[] = Array.from({ length: 3 }, (_, i) => ({
      id: `placeholder-${Date.now()}-${i}`,
      content: '',
      formValues: data,
      selectedSources: selectedSourcesForPost,
      isLoading: true,
    }));
    setGeneratedIdeas(prev => [...placeholderIdeas, ...prev.filter(idea => !idea.isLoading)]);

    const references = selectedSourcesForPost
      .map((source, index) => `${index + 1}. ${source.title}\n${source.content || source.snippet}`)
      .join('\n\n');
    
    const apiPayload = {
      inputs: {
        topic: data.topic,
        description: data.description || '',
        word_per_post: data.wordPerPost,
        books_to_promote: data.books_to_promote?.map(book => book.value).join('\n'),
        post_type: data.postType,
        tone: data.tone,
        references: references,
      },
      query: 'start',
    };

    try {
      const response = await fetch('https://quarto.nvcr.ai/api/blogsmith/ideas/create', {
        method: 'POST',
        body: JSON.stringify(apiPayload),
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWRiOTFmZC0yOWFjLTQ4MzEtYjgyMC1hYTNkMTcwNzdlMjQiLCJhdWQiOiIiLCJleHAiOjE3NTMxNjkyMDYsImlhdCI6MTc1Mjk5NjQwNiwiZW1haWwiOiJuaWNrLmhvQG5vdXZlbGxlY3JlYXRpb25zLmFpIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2lLbVVqU19WNjU4dTdNQUJ6QUJnR3pPY1lETUlReUo1dzB6SS1qZmdYR1VzaHFBPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6Im5vdXZlbGxlY3JlYXRpb25zLmFpIn0sImVtYWlsIjoibmljay5ob0Bub3V2ZWxsZWNyZWF0aW9ucy5haSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJOaWNrIEhvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5pY2sgSG8iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaUttVWpTX1Y2NTh1N01BQnpBQmdHek9jWURNSVF5SjV3MHpJLWpmZ1hHVXNocUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSIsInN1YiI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSJ9LCJyb2xlIjoic3VwYWJhc2VfYWRtaW4iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1Mjk5NjQwNn1dLCJzZXNzaW9uX2lkIjoiZTg3Zjk0NDktMmVkMC00ZDQ4LTk5ZDItYTM1NzgyMDhmODgyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.544ZFU_7zFyoYYMLkcHQRU4ooHz25hE1FUqJDoC9Eh4",
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
        }
      });
      
      const ideas = fullContent.split(/----\s*idea\s*----/i)
        .map(idea => idea.trim())
        .filter(idea => idea);

      const newIdeas: GeneratedIdea[] = ideas.map((ideaContent, index) => {
        return {
          id: `temp-idea-${Date.now()}-${index}`,
          content: ideaContent,
          formValues: data,
          selectedSources: selectedSourcesForPost,
        };
      });

      setGeneratedIdeas(prev => {
          const updatedIdeas = [...prev];
          let newIdeaIndex = 0;
          for (let i = 0; i < updatedIdeas.length; i++) {
              if (updatedIdeas[i].isLoading && newIdeaIndex < newIdeas.length) {
                  // Replace placeholder with new idea, keeping original placeholder ID for key stability
                  updatedIdeas[i] = { ...newIdeas[newIdeaIndex], id: updatedIdeas[i].id, isLoading: false };
                  newIdeaIndex++;
              }
          }
           // Filter out any remaining placeholders if API returns fewer ideas than placeholders
          return updatedIdeas.filter(idea => !idea.isLoading || newIdeas.find(ni => ni.id === idea.id));
      });
      toast({ title: 'Ideas Generated!', description: `We've created ${newIdeas.length} new ideas for you.` });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Idea Generation Failed', description: error.message });
      setGeneratedIdeas(prev => prev.filter(idea => !idea.isLoading)); // remove placeholders on error
    } finally {
      setIsGeneratingIdeas(false);
    }
  };


  const handleGeneratePostFromIdea = async (idea: GeneratedIdea) => {
    // Mark this specific idea as generating a post
    setGeneratedIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, isGeneratingPost: true } : i));
    
    const tempId = `temp-${Date.now()}`;
    const { formValues, selectedSources, content: ideaContent } = idea;

    const newConversation: Conversation = {
      id: tempId,
      topic: createSummary(idea.content, 10),
      messages: [{ role: 'assistant', content: '' }],
      isGenerating: true,
      formValues: formValues,
      selectedSources: selectedSources,
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveAccordionItem(tempId);

    const references = selectedSources
      .map((source, index) => `${index + 1}. URL: ${source.link}\nTitle: ${source.title}\nContent: ${source.content || source.snippet}`)
      .join('\n\n');
    
    const apiPayload = {
      inputs: {
        topic: formValues.topic,
        description: formValues.description || '',
        word_per_post: formValues.wordPerPost,
        books_to_promote: formValues.books_to_promote?.map(book => book.value).join('\n'),
        post_type: formValues.postType,
        tone: formValues.tone,
        references: references,
        blog_idea: ideaContent, // Pass the idea content
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
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWRiOTFmZC0yOWFjLTQ4MzEtYjgyMC1hYTNkMTcwNzdlMjQiLCJhdWQiOiIiLCJleHAiOjE3NTMxNjkyMDYsImlhdCI6MTc1Mjk5NjQwNiwiZW1haWwiOiJuaWNrLmhvQG5vdXZlbGxlY3JlYXRpb25zLmFpIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2lLbVVqU19WNjU4dTdNQUJ6QUJnR3pPY1lETUlReUo1dzB6SS1qZmdYR1VzaHFBPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6Im5vdXZlbGxlY3JlYXRpb25zLmFpIn0sImVtYWlsIjoibmljay5ob0Bub3V2ZWxsZWNyZWF0aW9ucy5haSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJOaWNrIEhvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5pY2sgSG8iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaUttVWpTX1Y2NTh1N01BQnpBQmdHek9jWURNSVF5SjV3MHpJLWpmZ1hHVXNocUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSIsInN1YiI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSJ9LCJyb2xlIjoic3VwYWJhc2VfYWRtaW4iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1Mjk5NjQwNn1dLCJzZXNzaW9uX2lkIjoiZTg3Zjk0NDktMmVkMC00ZDQ4LTk5ZDItYTM1NzgyMDhmODgyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.544ZFU_7zFyoYYMLkcHQRU4ooHz25hE1FUqJDoC9Eh4",
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
        let finalConversationId = '';
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
            finalConversationId = parsed.conversation_id;
            setConversations(prev => prev.map(c => 
                c.id === tempId ? { ...c, id: parsed.conversation_id, isGenerating: false } : c
            ));
            setActiveAccordionItem(parsed.conversation_id);
            setGeneratedIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, conversationId: parsed.conversation_id, isGeneratingPost: false } : i));
            toast({ title: 'Blog Post Generated!', description: 'Your new blog post is ready. You can ask for edits below.' });
          }
        });
        
         if (finalConversationId) {
            const element = document.getElementById(`conversation-section`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

    } catch (error: any) {
        setConversations(prev => prev.filter(c => c.id !== tempId));
        toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
        // Unmark the idea as generating
        setGeneratedIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, isGeneratingPost: false } : i));
    }
  };

  const handleSendMessage = async (message: string, conversationId: string) => {
    setConversations(prev => prev.map(c => 
        c.id === conversationId 
        ? { ...c, messages: [...c.messages, { role: 'user', content: message }], isGenerating: true } 
        : c
    ));

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    const idea = generatedIdeas.find(i => i.conversationId === conversationId);
    
    try {
      const response = await fetch('https://quarto.nvcr.ai/api/blogsmith/chat', {
          method: 'POST',
          body: JSON.stringify({
              inputs: {
                ...conversation.formValues,
                books_to_promote: conversation.formValues.books_to_promote?.map(b => b.value).join('\n'),
                blog_idea: idea?.content || '',
              },
              query: message,
              conversation_id: conversationId,
          }),
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWRiOTFmZC0yOWFjLTQ4MzEtYjgyMC1hYTNkMTcwNzdlMjQiLCJhdWQiOiIiLCJleHAiOjE3NTMxNjkyMDYsImlhdCI6MTc1Mjk5NjQwNiwiZW1haWwiOiJuaWNrLmhvQG5vdXZlbGxlY3JlYXRpb25zLmFpIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2lLbVVqU19WNjU4dTdNQUJ6QUJnR3pPY1lETUlReUo1dzB6SS1qZmdYR1VzaHFBPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6Im5vdXZlbGxlY3JlYXRpb25zLmFpIn0sImVtYWlsIjoibmljay5ob0Bub3V2ZWxsZWNyZWF0aW9ucy5haSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJOaWNrIEhvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5pY2sgSG8iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaUttVWpTX1Y2NTh1N01BQnpBQmdHek9jWURNSVF5SjV3MHpJLWpmZ1hHVXNocUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSIsInN1YiI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSJ9LCJyb2xlIjoic3VwYWJhc2VfYWRtaW4iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1Mjk5NjQwNn1dLCJzZXNzaW9uX2lkIjoiZTg3Zjk0NDktMmVkMC00ZDQ4LTk5ZDItYTM1NzgyMDhmODgyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.544ZFU_7zFyoYYMLkcHQRU4ooHz25hE1FUqJDoC9Eh4",
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
    // Also reset the idea that was linked to this conversation
    setGeneratedIdeas(prev => prev.map(idea => idea.conversationId === id ? {...idea, conversationId: undefined} : idea));
    if (activeAccordionItem === id) {
      setActiveAccordionItem(undefined);
    }
    toast({ title: "Conversation Removed" });
  };
  
  const handleDeleteIdea = (id: string) => {
    setGeneratedIdeas(prev => prev.filter(idea => idea.id !== id));
    toast({ title: "Idea Removed" });
  };
  
  const handleViewContent = (conversationId?: string) => {
    if (conversationId) {
      setActiveAccordionItem(conversationId);
      const element = document.getElementById(`conversation-section`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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
  const isGeneratingPost = conversations.some(c => c.isGenerating) || generatedIdeas.some(i => i.isGeneratingPost);
  const isGenerating = isGeneratingPost || isGeneratingIdeas;

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

            <div id="blog-generation-form" className="scroll-mt-20">
              <BlogGenerationForm
                onGenerateIdeas={handleGenerateIdeas}
                isGeneratingIdeas={isGeneratingIdeas || isGeneratingPost}
              />
            </div>
            
            {generatedIdeas.length > 0 && (
              <div className="space-y-8 mt-12">
                <h2 className="text-3xl font-headline tracking-tight text-primary">Generated Ideas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedIdeas.map(idea => (
                     <Dialog key={idea.id}>
                        <Card className="shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm w-full flex flex-col group/item hover:bg-primary/5 transition-colors">
                          {idea.isLoading ? (
                            <div className="p-6 space-y-4">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          ) : (
                            <>
                              <DialogTrigger asChild>
                                  <div className="cursor-pointer w-full h-full p-6">
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="font-headline text-xl">
                                          <p>{createSummary(idea.content, 10)}</p>
                                      </CardTitle>
                                      <div className="flex items-center gap-1 -mt-2 -mr-2">
                                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                                            <Expand className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} aria-label="View generation details">
                                                <Settings className="h-5 w-5 text-muted-foreground" />
                                              </Button>
                                          </DialogTrigger>
                                          <DialogContent className="sm:max-w-2xl">
                                            <DialogHeader>
                                              <DialogTitle>Generation Details</DialogTitle>
                                              <DialogDescription>
                                                These are the settings used to generate this idea.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <Card className="p-4 border-dashed bg-muted/30">
                                              <CardContent className="p-2 text-sm space-y-3">
                                                <p><strong>Topic:</strong> {idea.formValues.topic}</p>
                                                {idea.formValues.description && <p><strong>Description:</strong> {idea.formValues.description}</p>}
                                                <p><strong>Word Count:</strong> {idea.formValues.wordPerPost}</p>
                                                <p><strong>Post Type:</strong> {idea.formValues.postType}</p>
                                                <p><strong>Tone:</strong> {idea.formValues.tone}</p>
                                                <div>
                                                    <strong>Books to Promote:</strong>
                                                    <ul className="list-disc list-inside ml-4">
                                                        {idea.formValues.books_to_promote && idea.formValues.books_to_promote.length > 0 ? 
                                                            idea.formValues.books_to_promote.map(book => <li key={book.value} className="break-all">{book.value}</li>) :
                                                            <li className="text-muted-foreground list-none">No books were promoted.</li>
                                                        }
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-1"><strong>Selected Sources:</strong></h4>
                                                    <div className="flex flex-wrap gap-2">
                                                    {idea.selectedSources.length > 0 ? idea.selectedSources.map(source => (
                                                        <Badge key={source.id} variant="secondary">{source.title}</Badge>
                                                    )) : <p className="text-muted-foreground">No sources were selected.</p>}
                                                    </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          </DialogContent>
                                       </Dialog>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteIdea(idea.id); }}
                                            aria-label="Delete idea"
                                            disabled={idea.isGeneratingPost}
                                        >
                                            <Trash2 className="h-5 w-5 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                              </DialogTrigger>
                             <CardFooter className="flex-col items-start gap-4 mt-auto p-4 border-t bg-card">
                                {idea.conversationId ? (
                                    <Button onClick={() => handleViewContent(idea.conversationId)} className="w-full bg-primary hover:bg-primary/90 mt-2">
                                        <LinkIcon className="mr-2 h-5 w-5" />
                                        View Content
                                    </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleGeneratePostFromIdea(idea)}
                                    disabled={isGeneratingIdeas || !!idea.isGeneratingPost}
                                    className="w-full bg-accent hover:bg-accent/90 mt-2"
                                  >
                                    {idea.isGeneratingPost ? (
                                      <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        <Wand2 className="mr-2 h-5 w-5" />
                                        Generate Post
                                      </>
                                    )}
                                  </Button>
                                )}
                             </CardFooter>
                            </>
                          )}
                        </Card>
                        {!idea.isLoading && (
                          <DialogContent className="sm:max-w-5xl">
                              <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                                  Blog Post Idea
                              </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[70vh] pr-6">
                              <div className="text-foreground/90 prose max-w-none dark:prose-invert py-4" dangerouslySetInnerHTML={{ __html: idea.content }} />
                              </ScrollArea>
                          </DialogContent>
                        )}
                    </Dialog>
                  ))}
                </div>
              </div>
            )}

            {conversations.length > 0 && (
              <div className="space-y-8 mt-12 scroll-mt-20" id="conversation-section">
                <h2 className="text-3xl font-headline tracking-tight text-primary">Generated Content</h2>
                <Accordion 
                  type="single" 
                  collapsible 
                  className="w-full space-y-4"
                  value={activeAccordionItem}
                  onValueChange={setActiveAccordionItem}
                >
                  {conversations.map(convo => (
                    <AccordionItem value={convo.id} key={convo.id} className="border-none">
                      <Card className="shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm w-full">
                        <AccordionHeader className="flex w-full items-center p-0">
                          <AccordionTrigger className="flex-1 p-6 text-left">
                              <CardTitle className="font-headline text-2xl -webkit-fill-available">{convo.topic}</CardTitle>
                          </AccordionTrigger>
                          <div className="pr-4 flex items-center">
                              {convo.formValues && convo.selectedSources && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                     <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} aria-label="View generation details">
                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                     </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Generation Details</DialogTitle>
                                      <DialogDescription>
                                        These are the settings used to generate this post.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Card className="p-4 border-dashed bg-muted/30">
                                      <CardContent className="p-2 text-sm space-y-3">
                                          <p><strong>Topic:</strong> {convo.formValues.topic}</p>
                                          {convo.formValues.description && <p><strong>Description:</strong> {convo.formValues.description}</p>}
                                          <p><strong>Word Count:</strong> {convo.formValues.wordPerPost}</p>
                                          <p><strong>Post Type:</strong> {convo.formValues.postType}</p>
                                          <p><strong>Tone:</strong> {convo.formValues.tone}</p>
                                          <div>
                                              <strong>Books to Promote:</strong>
                                              <ul className="list-disc list-inside ml-4">
                                                  {convo.formValues.books_to_promote && convo.formValues.books_to_promote.length > 0 ? 
                                                      convo.formValues.books_to_promote.map(book => <li key={book.value} className="break-all">{book.value}</li>) :
                                                      <li className="text-muted-foreground list-none">No books were promoted.</li>
                                                  }
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
                                  </DialogContent>
                                </Dialog>
                              )}
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
                          </div>
                        </AccordionHeader>
                        <AccordionContent>
                          <CardContent>
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
      <footer className="text-center py-4 mt-8 border-t border-primary/20">
        <div className="container mx-auto flex justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Nouvelle Creations. All rights reserved.</p>
            <p>v1.0.3</p>
        </div>
      </footer>
    </Suspense>
  );
}

    

    
