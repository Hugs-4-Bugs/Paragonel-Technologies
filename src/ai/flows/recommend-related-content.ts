// RecommendRelatedContent story implementation.
'use server';
/**
 * @fileOverview Recommends blog posts or case studies related to jobs a user has viewed.
 *
 * - recommendRelatedContent - A function that recommends related content.
 * - RecommendRelatedContentInput - The input type for the recommendRelatedContent function.
 * - RecommendRelatedContentOutput - The return type for the recommendRelatedContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendRelatedContentInputSchema = z.object({
  jobTitles: z
    .array(z.string())
    .describe('An array of job titles the user has viewed.'),
});
export type RecommendRelatedContentInput = z.infer<
  typeof RecommendRelatedContentInputSchema
>;

const RecommendRelatedContentOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of recommended blog posts or case studies.'),
});
export type RecommendRelatedContentOutput = z.infer<
  typeof RecommendRelatedContentOutputSchema
>;

export async function recommendRelatedContent(
  input: RecommendRelatedContentInput
): Promise<RecommendRelatedContentOutput> {
  return recommendRelatedContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendRelatedContentPrompt',
  input: {schema: RecommendRelatedContentInputSchema},
  output: {schema: RecommendRelatedContentOutputSchema},
  prompt: `You are a content curator for a job platform. Based on the job titles the user has viewed, recommend blog posts or case studies that might be of interest to them.

Job Titles: {{jobTitles}}

Recommendations:`,
});

const recommendRelatedContentFlow = ai.defineFlow(
  {
    name: 'recommendRelatedContentFlow',
    inputSchema: RecommendRelatedContentInputSchema,
    outputSchema: RecommendRelatedContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the output is not null and conforms to the schema, otherwise return empty array.
    if (!output || !output.recommendations) {
      return { recommendations: [] };
    }
    return output;
  }
);