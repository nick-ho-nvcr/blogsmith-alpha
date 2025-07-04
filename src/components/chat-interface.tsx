'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2, MessageSquareText, HelpCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Helper to parse the AI's sectioned response
const parseAssistantMessage = (content: string): { [key: string]: string } => {
  const sections: { [key: string]: string } = {};
  
  const headerRegex = /---- (Interaction|Query|Content) ----/;
  if (!headerRegex.test(content)) {
    return { content: content };
  }
  
  const splitRegex = /---- (Interaction|Query|Content) ----\n/g;
  const parts = content.split(splitRegex);
  
  for (let i = 1; i < parts.length; i += 2) {
    const sectionName = parts[i]?.toLowerCase().trim();
    const sectionContent = parts[i + 1]?.trim();
    if (sectionName && sectionContent) {
      sections[sectionName] = sectionContent;
    }
  }

  return sections;
};

// Helper to check if a string contains HTML tags
const isHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);

// Component to render the parsed assistant message
const AssistantMessage = ({ content }: { content: string }) => {
  const parsedMessage = React.useMemo(() => parseAssistantMessage(content), [content]);

  const sectionKeys = Object.keys(parsedMessage);

  const renderContent = (contentString: string) => {
    if (isHtml(contentString)) {
      // For HTML content, we render it directly.
      // NOTE: This assumes the HTML from the AI is trusted.
      return <div className="text-foreground/90" dangerouslySetInnerHTML={{ __html: contentString || '' }} />;
    }
    // For plain text, we preserve whitespace and newlines.
    return <p className="whitespace-pre-wrap text-foreground/90">{contentString}</p>;
  };

  if (sectionKeys.length === 0) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  if (sectionKeys.length === 1 && sectionKeys[0] === 'content' && parsedMessage.content) {
     return renderContent(parsedMessage.content);
  }

  return (
    <div className="space-y-4">
      {parsedMessage.interaction && (
        <section className="p-3 rounded-md border border-primary/20 bg-primary/5">
          <h4 className="flex items-center gap-2 mb-2 font-headline text-lg font-medium text-primary">
            <MessageSquareText className="h-5 w-5" />
            <span>Interaction</span>
          </h4>
          <p className="whitespace-pre-wrap text-foreground/90">{parsedMessage.interaction}</p>
        </section>
      )}
      {parsedMessage.query && (
        <section className="p-3 rounded-md border border-primary/20 bg-primary/5">
          <h4 className="flex items-center gap-2 mb-2 font-headline text-lg font-medium text-primary">
            <HelpCircle className="h-5 w-5" />
            <span>Query</span>
          </h4>
          <p className="whitespace-pre-wrap text-foreground/90">{parsedMessage.query}</p>
        </section>
      )}
      {parsedMessage.content && (
         <section className="p-3 rounded-md border border-primary/20 bg-primary/5">
            <h4 className="flex items-center gap-2 mb-2 font-headline text-lg font-medium text-primary">
                <FileText className="h-5 w-5" />
                <span>Content</span>
            </h4>
            {renderContent(parsedMessage.content)}
        </section>
      )}
    </div>
  );
};


export function ChatInterface({ messages, onSendMessage, isResponding }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
            {messages.map((message, index) => (
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
            ))}
             {isResponding && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
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
        <form onSubmit={handleSendMessage} className="mt-6 flex items-center gap-4 border-t pt-6">
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
