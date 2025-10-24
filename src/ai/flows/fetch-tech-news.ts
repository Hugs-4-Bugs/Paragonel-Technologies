
// 'use server';
// /**
//  * @fileOverview Fetches or generates recent tech news related to specified domains.
//  *
//  * - fetchTechNews - A function that provides recent tech news summaries.
//  * - FetchTechNewsInput - The input type for the fetchTechNews function.
//  * - FetchTechNewsOutput - The return type for the fetchTechNews function.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const FetchTechNewsInputSchema = z.object({
//   domains: z
//     .array(z.string())
//     .describe('An array of technology domains to fetch news for (e.g., AI, Cloud Computing).'),
//   count: z.number().optional().default(3).describe('Number of news items to return.'),
// });
// export type FetchTechNewsInput = z.infer<typeof FetchTechNewsInputSchema>;

// const NewsItemSchema = z.object({
//   title: z.string().describe('The headline of the news item.'),
//   summary: z.string().describe('A brief summary of the news item.'),
//   source: z.string().optional().describe('The source of the news (e.g., TechCrunch, Reuters).'),
//   link: z.string().optional().describe('A URL to the full news article.'),
//   publishedDate: z.string().optional().describe('An estimated publication date (e.g., "2 days ago", "2024-08-15").'),
// });

// const FetchTechNewsOutputSchema = z.object({
//   newsItems: z
//     .array(NewsItemSchema)
//     .describe('An array of tech news items.'),
// });
// export type FetchTechNewsOutput = z.infer<typeof FetchTechNewsOutputSchema>;

// export async function fetchTechNews(
//   input: FetchTechNewsInput
// ): Promise<FetchTechNewsOutput> {
//   return fetchTechNewsFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'fetchTechNewsPrompt',
//   // model: 'googleai/gemini-pro',
//   model: "models/gemini-1.5-pro",
//   input: {schema: FetchTechNewsInputSchema},
//   output: {schema: FetchTechNewsOutputSchema},
//   prompt: `You are a tech news curator for QuantumFusion Solutions, an IT company specializing in AI, Cloud, DevOps, and SaaS.
// Your task is to generate {{count}} recent and plausible news headlines and short summaries related to our core domains: {{#each domains}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

// The news should be highly relevant to our business and clients. Focus on breakthroughs, significant company partnerships (fictional or real), or major industry trends that impact our services.

// For each news item, you MUST provide:
// 1.  A compelling title.
// 2.  A concise summary (1-2 sentences).
// 3.  A fictional but plausible source name (e.g., "QuantumLeap Insights", "Future Systems Journal", "DevOps Weekly").
// 4.  A placeholder URL (e.g., "https://example.com/news/item-{{@index}}").
// 5.  An estimated recent publication date (e.g., "Yesterday", "August 25, 2024").

// It is critical that you ALWAYS generate the requested number of news items. Do not return an empty list.
// `,
// });

// const fetchTechNewsFlow = ai.defineFlow(
//   {
//     name: 'fetchTechNewsFlow',
//     inputSchema: FetchTechNewsInputSchema,
//     outputSchema: FetchTechNewsOutputSchema,
//   },
//   async (input) => {
//     const {output} = await prompt(input);
//     if (!output || !output.newsItems) {
//         console.warn("AI failed to generate tech news. Returning empty array.");
//         return { newsItems: [] };
//     }
//     return output;
//   }
// );











'use server';
/**
 * @fileOverview Fetches or generates recent tech news related to specified domains.
 *
 * - fetchTechNews - A function that provides recent tech news summaries.
 * - FetchTechNewsInput - The input type for the fetchTechNews function.
 * - FetchTechNewsOutput - The return type for the fetchTechNews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FetchTechNewsInputSchema = z.object({
  domains: z
    .array(z.string())
    .describe('An array of technology domains to fetch news for (e.g., AI, Cloud Computing).'),
  count: z.number().optional().default(3).describe('Number of news items to return.'),
});
export type FetchTechNewsInput = z.infer<typeof FetchTechNewsInputSchema>;

const NewsItemSchema = z.object({
  title: z.string().describe('The headline of the news item.'),
  summary: z.string().describe('A brief summary of the news item.'),
  source: z.string().optional().describe('The source of the news (e.g., TechCrunch, Reuters).'),
  link: z.string().optional().describe('A URL to the full news article.'),
  publishedDate: z.string().optional().describe('An estimated publication date (e.g., "2 days ago", "2024-08-15").'),
});

const FetchTechNewsOutputSchema = z.object({
  newsItems: z.array(NewsItemSchema).describe('An array of tech news items.'),
});
export type FetchTechNewsOutput = z.infer<typeof FetchTechNewsOutputSchema>;

/**
 * Main exported function for fetching tech news.
 */
export async function fetchTechNews(
  input: FetchTechNewsInput
): Promise<FetchTechNewsOutput> {
  return fetchTechNewsFlow(input);
}

/**
 * Prompt definition using Gemini 1.5 Pro via Genkit GoogleAI plugin.
 */
const prompt = ai.definePrompt({
  name: 'fetchTechNewsPrompt',
  model: 'googleai/gemini-1.5-pro', // ✅ Correct model for Genkit
  input: { schema: FetchTechNewsInputSchema },
  output: { schema: FetchTechNewsOutputSchema },
  prompt: `You are a tech news curator for QuantumFusion Solutions, an IT company specializing in AI, Cloud, DevOps, and SaaS.
Your task is to generate {{count}} recent and plausible news headlines and short summaries related to our core domains: {{#each domains}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

The news should be highly relevant to our business and clients. Focus on breakthroughs, significant company partnerships (fictional or real), or major industry trends that impact our services.

For each news item, you MUST provide:
1.  A compelling title.
2.  A concise summary (1-2 sentences).
3.  A fictional but plausible source name (e.g., "QuantumLeap Insights", "Future Systems Journal", "DevOps Weekly").
4.  A placeholder URL (e.g., "https://example.com/news/item-{{@index}}").
5.  An estimated recent publication date (e.g., "Yesterday", "August 25, 2024").

It is critical that you ALWAYS generate the requested number of news items. Do not return an empty list.`,
});

/**
 * Flow that executes the prompt and ensures safe fallback behavior.
 */
const fetchTechNewsFlow = ai.defineFlow(
  {
    name: 'fetchTechNewsFlow',
    inputSchema: FetchTechNewsInputSchema,
    outputSchema: FetchTechNewsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.newsItems) {
        console.warn('AI failed to generate tech news. Returning empty array.');
        return { newsItems: [] };
      }
      return output;
    } catch (error) {
      console.error('Error generating tech news:', error);
      return { newsItems: [] };
    }
  }
);
