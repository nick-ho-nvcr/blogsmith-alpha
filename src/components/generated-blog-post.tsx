'use client';

import type { GeneratedBlogPost as BlogPostType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface GeneratedBlogPostProps {
  post: BlogPostType;
}

export function GeneratedBlogPost({ post }: GeneratedBlogPostProps) {
  return (
    <Card className="mt-8 shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center space-x-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          <CardTitle className="font-headline text-3xl tracking-tight text-primary">{post.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 prose prose-lg max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-accent hover:prose-a:text-accent/80">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </CardContent>
    </Card>
  );
}
