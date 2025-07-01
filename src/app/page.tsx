"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, LoaderCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { generateBlogPost, type BlogPostOutput } from '@/ai/flows/blogsmith-flow';

const formSchema = z.object({
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
});

export default function Home() {
  const [generatedPost, setGeneratedPost] = useState<BlogPostOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedPost(null);
    try {
      const post = await generateBlogPost({ topic: values.topic });
      setGeneratedPost(post);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "There was a problem generating the blog post. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-3xl font-bold">
            <Wand2 className="h-8 w-8 text-primary" />
            Blogsmith
          </CardTitle>
          <CardDescription>
            Enter a topic and let AI craft a unique blog post for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="e.g., 'The Future of Renewable Energy'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate
                  </>
                )}
              </Button>
            </form>
          </Form>

          {(isLoading || generatedPost) && (
             <Separator className="my-6" />
          )}

          <div className="space-y-4">
            {isLoading && (
              <div className="space-y-4">
                  <div className="flex justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-center text-muted-foreground">The AI is thinking... your post will appear here shortly.</p>
              </div>
            )}
            {generatedPost && (
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <h1>{generatedPost.title}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedPost.content}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
