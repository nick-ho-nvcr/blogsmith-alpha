'use server';
/**
 * @fileOverview A blog post generation AI flow.
 *
 * - generateBlogPost - A function that handles the blog post generation.
 * - BlogPostInput - The input type for the generateBlogPost function.
 * - BlogPostOutput - The return type for the generateBlogPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const BlogPostInputSchema = z.object({
  topic: z.string().describe('The topic for the blog post.'),
});
export type BlogPostInput = z.infer<typeof BlogPostInputSchema>;

const BlogPostOutputSchema = z.object({
  title: z.string().describe('The generated title for the blog post.'),
  content: z.string().describe('The generated content of the blog post, in Markdown format.'),
});
export type BlogPostOutput = z.infer<typeof BlogPostOutputSchema>;

export async function generateBlogPost(input: BlogPostInput): Promise<BlogPostOutput> {
  return blogsmithFlow(input);
}

const prompt = ai.definePrompt({
  name: 'blogsmithPrompt',
  input: {schema: BlogPostInputSchema},
  output: {schema: BlogPostOutputSchema},
  prompt: `You are an expert content creator specializing in writing engaging and informative blog posts.

  Your task is to generate a blog post based on the provided topic. The post should have a clear title and well-structured content in Markdown format.

  Topic: {{{topic}}}`,
});

const blogsmithFlow = ai.defineFlow(
  {
    name: 'blogsmithFlow',
    inputSchema: BlogPostInputSchema,
    outputSchema: BlogPostOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
