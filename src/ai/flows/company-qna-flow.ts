'use server';
/**
 * @fileOverview ParagonelAI V2 Smart Q&A Flow.
 * Prioritizes resume analysis for all career-related queries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import knowledge from '@/data/company-knowledge.json';

const CompanyQnaInputSchema = z.object({
  question: z.string().describe('The user question.'),
});
export type CompanyQnaInput = z.infer<typeof CompanyQnaInputSchema>;

const CompanyQnaOutputSchema = z.object({
  answer: z.string(),
  intent: z.enum(['qna', 'navigate', 'careers', 'error']),
  navigationLink: z.string().optional(),
});
export type CompanyQnaOutput = z.infer<typeof CompanyQnaOutputSchema>;

const qnaPrompt = ai.definePrompt({
  name: 'companyQnaPromptV2',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: CompanyQnaInputSchema },
  output: { schema: CompanyQnaOutputSchema },
  prompt: `
    You are ParagonelAI, the recruitment and company agent for Paragonel.

    CRITICAL RULES:
    1. For ANY career, job, or hiring query: Set intent to 'careers' and explain that you need their resume FIRST to provide accurate matches.
    2. Do NOT list specific jobs yet.
    3. For general info, use the knowledge base.

    KNOWLEDGE:
    ${JSON.stringify(knowledge)}

    USER: {{question}}
  `,
});

export async function companyQnaFlow(input: CompanyQnaInput): Promise<CompanyQnaOutput> {
  const query = input.question.toLowerCase();

  if (query.includes('job') || query.includes('career') || query.includes('hiring') || query.includes('opening') || query.includes('work with you')) {
    return {
      answer: "I'd love to help you find the perfect role at Paragonel! To give you the most accurate recommendations and match your skills to our live openings, I need to analyze your profile first.",
      intent: 'careers'
    };
  }

  try {
    const { output } = await qnaPrompt(input);
    return output!;
  } catch {
    return {
      answer: "I'm here to help! You can explore our [Services](/services) or [Open Roles](/careers). How else can I assist?",
      intent: 'qna'
    };
  }
}
