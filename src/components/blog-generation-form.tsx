
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, PlusCircle, Trash2 } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(10, { message: 'Topic must be at least 10 characters.' }).max(200, { message: 'Topic cannot exceed 200 characters.' }),
  wordPerPost: z.string().min(1, { message: "Word count is required." }),
  postType: z.string().min(1, { message: 'Post type is required.' }).max(500, { message: 'Post type cannot exceed 500 characters.' }),
  tone: z.string().min(1, { message: 'Tone is required.' }).max(500, { message: 'Tone cannot exceed 500 characters.' }),
  books_to_promote: z.array(z.object({ value: z.string().url({ message: 'Please enter a valid URL.' }) })).min(1, { message: 'At least one book to promote is required.' }),
});

export type FormValues = z.infer<typeof formSchema>;

interface BlogGenerationFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isGenerating: boolean;
}

export function BlogGenerationForm({ onSubmit, isGenerating }: BlogGenerationFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: 'why math game is important for kid development',
      wordPerPost: '500-1000',
      postType: 'Can be listicles, roundups, curated content, article/research recommendations and how-to guides.',
      tone: 'A conversational and semi-professional tone that engages with the reader on a personal level.',
      books_to_promote: [{ value: 'https://www.quarto.com/books/9780760397947/super-fun-math-games-for-kids' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "books_to_promote"
  });

  async function handleSubmit(values: FormValues) {
    await onSubmit(values);
  }

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Craft Your Next Masterpiece</CardTitle>
        <CardDescription>
          Enter your blog post details below. Our AI will use this, along with any selected sources, to generate a draft for you.
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
                      disabled={isGenerating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="wordPerPost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="wordPerPost" className="text-base font-medium">Word Count</FormLabel>
                  <FormControl>
                    <Input
                      id="wordPerPost"
                      placeholder="e.g., 500-1000"
                      {...field}
                      className="text-base focus:ring-accent focus:border-accent"
                      disabled={isGenerating}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a target word count range for the post.
                  </FormDescription>
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
                      disabled={isGenerating}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the structure of the post, e.g., listicle, how-to guide, or roundup.
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
                      disabled={isGenerating}
                    />
                  </FormControl>
                   <FormDescription>
                    Describe the desired tone of voice for the article.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel className="text-base font-medium">Books to Promote</FormLabel>
              <FormDescription>Add one or more book URLs to promote in the post.</FormDescription>
              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`books_to_promote.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/book-link"
                            className="text-base focus:ring-accent focus:border-accent"
                            disabled={isGenerating}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1 || isGenerating}
                          aria-label="Remove book URL"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ value: "" })}
                disabled={isGenerating}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Book URL
              </Button>
               {form.formState.errors.books_to_promote && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.books_to_promote.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={isGenerating} 
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Generate Next Blog Post"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Next Blog Post
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
