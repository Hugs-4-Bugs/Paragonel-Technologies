
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
    .describe('An array of job titles the user has shown interest in.'),
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
  prompt: `You are a content curator for QuantumFusion Solutions, an innovative IT company specializing in AI, Cloud, DevOps, and SaaS.
Based on the job titles a user has shown interest in, your task is to generate 3-4 relevant and engaging recommendations for blog posts, articles, or case studies that would appeal to them.
The recommendations should be related to our company's work and expertise.

The user is interested in the following roles: {{#each jobTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Generate a list of compelling, one-sentence recommendations. For example, if the user viewed "AI Specialist", you could suggest: "Read our case study on how we built a predictive analytics engine for a top e-commerce client."

It is critical that you ALWAYS generate 3-4 recommendations. Do not return an empty list. Create plausible and interesting titles, even if they are fictional.
`,
});

const recommendRelatedContentFlow = ai.defineFlow(
  {
    name: 'recommendRelatedContentFlow',
    inputSchema: RecommendRelatedContentInputSchema,
    outputSchema: RecommendRelatedContentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // If output is null or recommendations array is missing, return a default/fallback.
    if (!output || !output.recommendations) {
        console.warn("AI failed to generate recommendations. Returning empty array.");
        return { recommendations: [] };
    }
    return output;
  }
);
