
'use server';
/**
 * @fileOverview Fetches or generates recent tech news related to specified domains.
 *
 * - fetchTechNews - A function that provides recent tech news summaries.
 * - FetchTechNewsInput - The input type for the fetchTechNews function.
 * - FetchTechNewsOutput - The return type for the fetchTechNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  link: z.string().optional().describe('A URL to the full news article.'), // Removed .url() here
  publishedDate: z.string().optional().describe('An estimated publication date (e.g., "2 days ago", "2024-08-15").'),
});

const FetchTechNewsOutputSchema = z.object({
  newsItems: z
    .array(NewsItemSchema)
    .describe('An array of tech news items.'),
});
export type FetchTechNewsOutput = z.infer<typeof FetchTechNewsOutputSchema>;

export async function fetchTechNews(
  input: FetchTechNewsInput
): Promise<FetchTechNewsOutput> {
  return fetchTechNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fetchTechNewsPrompt',
  input: {schema: FetchTechNewsInputSchema},
  output: {schema: FetchTechNewsOutputSchema},
  prompt: `You are a tech news curator. Generate {{count}} recent and plausible news headlines and short summaries related to the following technology domains: {{#each domains}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

For each news item, provide:
1.  A compelling title.
2.  A concise summary (1-2 sentences).
3.  A fictional but plausible source name (e.g., "TechNova Insights", "Future Systems Journal").
4.  A placeholder URL (e.g., "https://example.com/news/item-{{@index}}").
5.  An estimated recent publication date (e.g., "Yesterday", "August 25, 2024").

Ensure the news sounds current and relevant to professionals in the tech industry. Focus on breakthroughs, significant updates, or major trends.
`,
});

const fetchTechNewsFlow = ai.defineFlow(
  {
    name: 'fetchTechNewsFlow',
    inputSchema: FetchTechNewsInputSchema,
    outputSchema: FetchTechNewsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Ensure the output is not null and conforms to the schema, otherwise return empty array.
    if (!output || !output.newsItems) {
      return { newsItems: [] };
    }
    return output;
  }
);
