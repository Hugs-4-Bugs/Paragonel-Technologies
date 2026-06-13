'use server';
/**
 * @fileOverview QuantumAI Smart Q&A Flow.
 * Answers questions about the company using the knowledge base and handles navigation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import knowledge from '@/data/company-knowledge.json';

const CompanyQnaInputSchema = z.object({
  question: z.string().describe('The user question about QuantumFusion Solutions.'),
  context: z.object({
    userName: z.string().optional(),
    currentPath: z.string().optional(),
  }).optional(),
});
export type CompanyQnaInput = z.infer<typeof CompanyQnaInputSchema>;

const CompanyQnaOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
  intent: z.string().describe('The detected intent of the user (e.g., qna, navigate, careers).'),
  navigationLink: z.string().optional().describe('A link to a page on the website if relevant.'),
});
export type CompanyQnaOutput = z.infer<typeof CompanyQnaOutputSchema>;

const prompt = ai.definePrompt({
  name: 'companyQnaPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: CompanyQnaInputSchema },
  output: { schema: CompanyQnaOutputSchema },
  prompt: `You are QuantumAI, the intelligent assistant for QuantumFusion Solutions.
Your goal is to help users explore the website, learn about the company, and answer any questions.

COMPANY KNOWLEDGE:
{{{json knowledge}}}

INSTRUCTIONS:
1. Use the provided knowledge base as your ground truth.
2. If the user asks for a page (e.g., "show careers", "go to contact"), detect the 'navigate' intent and provide the relative URL from the knowledge base.
3. If the user asks about jobs, openings, or hiring, detect 'careers' intent.
4. Always be professional, modern, and helpful.
5. Use Markdown for links in the text if you aren't providing a specific navigationLink field.
6. If the question is unrelated to the company, politely explain that you are specialized in QuantumFusion Solutions.

User Question: {{{question}}}

Answer with intent and navigationLink if applicable.`,
});

export async function companyQnaFlow(input: CompanyQnaInput): Promise<CompanyQnaOutput> {
  try {
    const { output } = await prompt({ ...input, knowledge });
    if (!output) throw new Error("No output from AI");
    return output;
  } catch (error: any) {
    console.error("companyQnaFlow Error:", error);
    return {
      answer: "I'm currently experiencing high demand. Please try again in a moment, or feel free to explore our [Services](/services) and [Careers](/careers) pages manually.",
      intent: 'error'
    };
  }
}
