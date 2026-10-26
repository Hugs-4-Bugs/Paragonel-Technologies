
'use server';
/**
 * @fileOverview Fetches or generates recent tech news related to specified domains.
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
  publishedDate: z.string().optional().describe('An estimated publication date (e.g., "Yesterday", "2 days ago").'),
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
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: FetchTechNewsInputSchema },
  output: { schema: FetchTechNewsOutputSchema },
  prompt: `You are a tech news curator for Paragonel, an IT company specializing in AI, Cloud, DevOps, and SaaS.
Your task is to generate {{count}} recent and plausible news headlines and short summaries related to our core domains: {{#each domains}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

The news should be highly relevant to our business and clients. Focus on breakthroughs, significant company partnerships (fictional or real), or major industry trends that impact our services.

For each news item, you MUST provide:
1.  A compelling title.
2.  A concise summary (1-2 sentences).
3.  A fictional but plausible source name (e.g., "QuantumLeap Insights", "Future Systems Journal", "DevOps Weekly").
4.  A placeholder URL (e.g., "https://example.com/news/item-{{@index}}").
5.  An estimated recent publication date (e.g., "Yesterday", "2 days ago").

It is critical that you ALWAYS generate exactly {{count}} news items.
`,
});

const fetchTechNewsFlow = ai.defineFlow(
  {
    name: 'fetchTechNewsFlow',
    inputSchema: FetchTechNewsInputSchema,
    outputSchema: FetchTechNewsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.newsItems || output.newsItems.length === 0) {
        throw new Error("Empty AI output");
      }
      return output;
    } catch (error) {
      console.error("fetchTechNews AI Error:", error);
      return {
        newsItems: [
          {
            title: "Paragonel Announces New AI-Powered DevOps Framework",
            summary: "Our latest framework integrates generative AI to automate complex CI/CD workflows, reducing deployment times by up to 40%.",
            source: "Paragonel Press",
            link: "/services/devops-automation",
            publishedDate: "Today"
          },
          {
            title: "The Rise of Specialized SaaS: Why Multi-Tenant Architecture is Evolving",
            summary: "Industry experts discuss how scalable SaaS platforms are moving towards deeper customization while maintaining core security.",
            source: "Tech Insights Daily",
            link: "/services/saas-platforms",
            publishedDate: "Yesterday"
          },
          {
            title: "Cloud Migration Trends: Navigating the Hybrid Cloud Landscape in 2025",
            summary: "A deep dive into how businesses are leveraging AWS and Azure to create resilient and scalable global infrastructures.",
            source: "Cloud Weekly",
            link: "/services/cloud-infrastructure",
            publishedDate: "2 days ago"
          }
        ]
      };
    }
  }
);
