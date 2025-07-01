
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  idea: z.string().min(10, { message: 'Please describe your blog post idea in at least 10 characters.' }).max(1000, { message: 'Idea cannot exceed 1000 characters.'}),
});

interface BlogGenerationFormProps {
  onSubmit: (data: { idea: string }) => Promise<void>;
  isGenerating: boolean;
  isEffectivelyDisabled?: boolean; // Added to explicitly disable for SSG
}

export function BlogGenerationForm({ onSubmit, isGenerating, isEffectivelyDisabled }: BlogGenerationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idea: '',
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    if (isEffectivelyDisabled) return;
    await onSubmit(values);
  }

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Craft Your Next Masterpiece</CardTitle>
        <CardDescription>
          Enter your blog post idea below. Our AI will use this, along with any selected sources, to generate a draft for you.
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
              name="idea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="idea" className="text-base font-medium">Blog Post Idea</FormLabel>
                  <FormControl>
                    <Textarea
                      id="idea"
                      placeholder="e.g., 'A beginner's guide to sustainable gardening in urban environments, focusing on balcony setups and easy-to-grow vegetables...'"
                      {...field}
                      rows={5}
                      className="text-base focus:ring-accent focus:border-accent"
                      aria-describedby="idea-description"
                      disabled={isEffectivelyDisabled || isGenerating}
                    />
                  </FormControl>
                  <p id="idea-description" className="text-sm text-muted-foreground">
                    Be as descriptive as possible for the best results.
                  </p>
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
