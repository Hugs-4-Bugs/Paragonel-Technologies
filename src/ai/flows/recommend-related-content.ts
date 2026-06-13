'use server';
/**
 * @fileOverview Recommends blog posts or case studies related to jobs a user has viewed.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  model: 'googleai/gemini-2.0-flash',
  input: { schema: RecommendRelatedContentInputSchema },
  output: { schema: RecommendRelatedContentOutputSchema },
  prompt: `You are a content curator for QuantumFusion Solutions, an innovative IT company specializing in AI, Cloud, DevOps, and SaaS.
Based on the job titles a user has shown interest in, your task is to generate 3 relevant and engaging recommendations for blog posts, articles, or case studies from our website that would appeal to them.
The recommendations should be related to our company's work and expertise.

The user is interested in the following roles: {{#each jobTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Generate a list of exactly 3 compelling, one-sentence recommendations.
Example: "Read our case study on how we built a predictive analytics engine for a top e-commerce client."
`,
});

const recommendRelatedContentFlow = ai.defineFlow(
  {
    name: 'recommendRelatedContentFlow',
    inputSchema: RecommendRelatedContentInputSchema,
    outputSchema: RecommendRelatedContentOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.recommendations || output.recommendations.length === 0) {
        throw new Error("Empty recommendations");
      }
      return output;
    } catch (error) {
      console.error("recommendRelatedContent AI Error:", error);
      return {
        recommendations: [
          "Discover how we integrated machine learning to revolutionize talent acquisition workflows.",
          "Case Study: Scaling global infrastructure for a FinTech leader using hybrid cloud strategies.",
          "Expert Guide: Mastering automated testing in modern SaaS development environments."
        ]
      };
    }
  }
);
