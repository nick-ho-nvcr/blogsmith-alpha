
'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2, MessageSquareText, HelpCircle, FileText, Expand, Wand2, PencilLine, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


// Helper to parse the AI's sectioned response
const parseAssistantMessage = (content: string): { [key: string]: string } => {
  const sections: { [key: string]: string } = {};
  const splitRegex = /----\s*(Interaction|Idea|Content)\s*----(?:\r?\n)?/g;
  
  // First, handle content that might appear before any section header
  const initialSplit = content.split(splitRegex);
  const firstChunk = initialSplit[0]?.trim();
  if (firstChunk) {
    sections.interaction = firstChunk;
  }
  
  // Process the rest of the message for defined sections
  for (let i = 1; i < initialSplit.length; i += 2) {
    const sectionName = initialSplit[i]?.toLowerCase().trim();
    const sectionContent = initialSplit[i + 1]?.trim();
    if (sectionName && sectionContent) {
      sections[sectionName] = (sections[sectionName] || '') + sectionContent;
    }
  }

  // If after all that, we have no sections, treat the whole thing as content.
  if (Object.keys(sections).length === 0) {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      return { content: trimmedContent };
    }
    return {};
  }

  return sections;
};

// Component to render the parsed assistant message
const AssistantMessage = ({ content }: { content: string }) => {
  const [isIdeaDialogOpen, setIdeaDialogOpen] = React.useState(false);
  const [isContentDialogOpen, setContentDialogOpen] = React.useState(false);
  
  const parsedMessage = React.useMemo(() => parseAssistantMessage(content), [content]);

  const hasHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);

  if (Object.keys(parsedMessage).length === 0) {
    return null; // Don't render empty messages
  }

  return (
    <div className="space-y-4">
      {parsedMessage.interaction && (
        <section className="p-3 rounded-md border border-primary/20 bg-primary/5">
          <h4 className="flex items-center gap-2 mb-2 font-headline text-lg font-medium text-primary">
            <MessageSquareText className="h-5 w-5" />
            <span>Interaction</span>
          </h4>
          <div className="text-foreground/90 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: parsedMessage.interaction }} />
        </section>
      )}

      {parsedMessage.idea && (
         <Dialog open={isIdeaDialogOpen} onOpenChange={setIdeaDialogOpen}>
          <DialogTrigger asChild>
            <section className="p-3 rounded-md border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
              <h4 className="flex items-center gap-2 mb-2 font-headline text-lg font-medium text-primary">
                <HelpCircle className="h-5 w-5" />
                <span>Idea</span>
                <div className="ml-auto h-6 w-6 flex items-center justify-center text-muted-foreground">
                  <Expand className="h-4 w-4" />
                  <span className="sr-only">Enlarge Idea</span>
                </div>
              </h4>
              <div className="text-foreground/90 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: parsedMessage.idea }} />
            </section>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                <HelpCircle className="h-6 w-6" />
                Idea
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="text-foreground/90 prose max-w-none dark:prose-invert py-4" dangerouslySetInnerHTML={{ __html: parsedMessage.idea }} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {parsedMessage.content && (
        <Dialog open={isContentDialogOpen} onOpenChange={setContentDialogOpen}>
          <DialogTrigger asChild>
            <section className="p-3 rounded-md border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
              <h4 className="flex items-center gap-2 mb-2 font-headline text-lg font-medium text-primary">
                <FileText className="h-5 w-5" />
                <span>Content</span>
                <div className="ml-auto h-6 w-6 flex items-center justify-center text-muted-foreground">
                  <Expand className="h-4 w-4" />
                  <span className="sr-only">Enlarge Content</span>
                </div>
              </h4>
               {hasHtml(parsedMessage.content) ? (
                  <div className="text-foreground/90 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: parsedMessage.content }} />
                ) : (
                  <div className="text-foreground/90 whitespace-pre-wrap">{parsedMessage.content}</div>
                )}
            </section>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                <FileText className="h-6 w-6" />
                Content
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
               {hasHtml(parsedMessage.content) ? (
                <div className="text-foreground/90 prose max-w-none dark:prose-invert py-4" dangerouslySetInnerHTML={{ __html: parsedMessage.content }} />
              ) : (
                <div className="text-foreground/90 whitespace-pre-wrap py-4">{parsedMessage.content}</div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};


export function ChatInterface({ messages, onSendMessage, isResponding }: {
    messages: Message[];
    onSendMessage: (message: string) => Promise<void>;
    isResponding: boolean;
}) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const lastAssistantMessage = React.useMemo(() => 
    messages.filter(m => m.role === 'assistant').pop(), 
    [messages]
  );
  
  const parsedLastMessage = React.useMemo(() => 
    lastAssistantMessage ? parseAssistantMessage(lastAssistantMessage.content) : {}, 
    [lastAssistantMessage]
  );

  const showWriteContentButton = !!parsedLastMessage.idea;
  const showCopyContentButton = !!parsedLastMessage.content;

  useEffect(() => {
    // A more robust way to scroll to bottom.
    const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      setTimeout(() => {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }, 100);
    }
  }, [messages, isResponding]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;
    const messageToSend = input.trim();
    setInput('');
    await onSendMessage(messageToSend);
  };
  
  const handleWriteContent = () => {
    onSendMessage("This is a great idea. Please write the full blog post content based on this idea.");
  };

  const handleCopyContent = () => {
    if (parsedLastMessage.content) {
      navigator.clipboard.writeText(parsedLastMessage.content).then(() => {
        toast({
          title: "Content Copied!",
          description: "The post content has been copied to your clipboard.",
        })
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
          variant: 'destructive',
          title: "Copy Failed",
          description: "Could not copy content to clipboard.",
        })
      });
    }
  };


  return (
    <Card className="mt-8 shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm w-full">
      <CardHeader>
        <CardTitle className="font-headline text-3xl tracking-tight text-primary flex items-center gap-3">
            <Bot />
            Blog Post Smith
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => {
              if (message.role === 'assistant' && message.content.trim() === '') {
                return null;
              }

              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg p-4 shadow-md',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' ? (
                       <AssistantMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                   
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
             {isResponding && messages.length > 0 && (messages[messages.length - 1].role === 'user' || messages[messages.length - 1].content.trim() === '') && (
                <div className="flex items-start gap-4 justify-start">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-4 flex items-center space-x-2 shadow-md">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                </div>
             )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-start gap-2">
            <Button variant="outline" asChild>
              <a href="#blog-generation-form">
                <Wand2 />
                Generate Another Idea
              </a>
            </Button>
            
            {showWriteContentButton && (
                <Button variant="outline" onClick={handleWriteContent} disabled={isResponding}>
                    <PencilLine />
                    Write Full Post
                </Button>
            )}

            {showCopyContentButton && (
                <Button variant="outline" onClick={handleCopyContent}>
                    <Copy />
                    Copy Content
                </Button>
            )}
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Make the tone more professional.' or 'Add a section about the history of math games.'"
            className="flex-1 text-base focus:ring-accent focus:border-accent"
            rows={2}
            disabled={isResponding}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit" size="lg" disabled={isResponding || !input.trim()} className="bg-accent hover:bg-accent/90">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
