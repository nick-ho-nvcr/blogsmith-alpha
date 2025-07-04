'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isResponding: boolean;
}

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
            Blog Post Iteration
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
                     <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-accent hover:prose-a:text-accent/80" dangerouslySetInnerHTML={{ __html: message.content }} />
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
