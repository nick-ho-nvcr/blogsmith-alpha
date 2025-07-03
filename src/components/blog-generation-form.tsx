
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(10, { message: 'Topic must be at least 10 characters.' }).max(200, { message: 'Topic cannot exceed 200 characters.' }),
  postType: z.string().max(500, { message: 'Post type cannot exceed 500 characters.' }),
  tone: z.string().max(500, { message: 'Tone cannot exceed 500 characters.' }),
  books_to_promote: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogGenerationFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isGenerating: boolean;
  isEffectivelyDisabled?: boolean;
}

export function BlogGenerationForm({ onSubmit, isGenerating, isEffectivelyDisabled }: BlogGenerationFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: 'why math game is important for kid development',
      postType: '',
      tone: '',
      books_to_promote: 'https://www.quarto.com/books/9780760397947/super-fun-math-games-for-kids',
    },
  });

  async function handleSubmit(values: FormValues) {
    if (isEffectivelyDisabled) return;
    await onSubmit(values);
  }

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Craft Your Next Masterpiece</CardTitle>
        <CardDescription>
          Enter your blog post details below. Our AI will use this, along with any selected sources, to generate a draft for you.
          {isEffectivelyDisabled && (
            <span className="block text-sm text-destructive mt-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Blog generation is disabled for static site export. A backend API is required for this feature.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="topic" className="text-base font-medium">Topic</FormLabel>
                  <FormControl>
                    <Input
                      id="topic"
                      placeholder="e.g., 'The importance of creative play for child development'"
                      {...field}
                      className="text-base focus:ring-accent focus:border-accent"
                      disabled={isEffectivelyDisabled || isGenerating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="postType" className="text-base font-medium">Post Type</FormLabel>
                  <FormControl>
                    <Textarea
                      id="postType"
                      placeholder="e.g., Listicles, how-to guides, roundups..."
                      {...field}
                      rows={3}
                      className="text-base focus:ring-accent focus:border-accent"
                      disabled={isEffectivelyDisabled || isGenerating}
                    />
                  </FormControl>
                  <FormDescription>
                    Default can be listicles, roundups, curated content, article/research recommendations and how-to guides.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="tone" className="text-base font-medium">Tone of Voice</FormLabel>
                  <FormControl>
                    <Textarea
                      id="tone"
                      placeholder="e.g., Conversational, professional, humorous..."
                      {...field}
                      rows={3}
                      className="text-base focus:ring-accent focus:border-accent"
                      disabled={isEffectivelyDisabled || isGenerating}
                    />
                  </FormControl>
                   <FormDescription>
                    Default is a conversational and semi-professional tone that engages with the reader on a personal level.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="books_to_promote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="books_to_promote" className="text-base font-medium">Book to Promote (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="books_to_promote"
                      placeholder="https://example.com/book-link"
                      {...field}
                      className="text-base focus:ring-accent focus:border-accent"
                      disabled={isEffectivelyDisabled || isGenerating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isGenerating || isEffectivelyDisabled} 
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title={isEffectivelyDisabled ? "Blog generation is disabled for static site export." : "Generate Blog Post"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Blog Post
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
