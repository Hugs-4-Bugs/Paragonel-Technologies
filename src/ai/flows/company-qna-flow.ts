
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
});
export type CompanyQnaInput = z.infer<typeof CompanyQnaInputSchema>;

const CompanyQnaOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
  intent: z.string().describe('The detected intent of the user (e.g., qna, navigate, careers).'),
  navigationLink: z.string().optional().describe('A link to a page on the website if relevant.'),
});
export type CompanyQnaOutput = z.infer<typeof CompanyQnaOutputSchema>;

export async function companyQnaFlow(input: CompanyQnaInput): Promise<CompanyQnaOutput> {
  try {
    const { output } = await ai.generate({
      output: { schema: CompanyQnaOutputSchema },
      prompt: `You are QuantumAI, the intelligent assistant for QuantumFusion Solutions.
Your goal is to help users explore the website, learn about the company, and answer any questions.

COMPANY KNOWLEDGE BASE:
${JSON.stringify(knowledge, null, 2)}

INSTRUCTIONS:
1. Use the provided company knowledge as your ground truth.
2. If the user asks for a specific page (e.g., "show careers", "go to contact"), detect the 'navigate' intent and provide the relative URL (e.g., "/careers").
3. If the user asks about jobs, openings, or hiring, detect 'careers' intent.
4. Always be professional, modern, and helpful.
5. Use Markdown for links in your text response.
6. If the question is unrelated to the company, politely explain that you are specialized in QuantumFusion Solutions.

User Question: ${input.question}

Respond with the answer, intent, and optional navigationLink.`,
    });
    
    if (!output) throw new Error("No output from AI");
    return output;
  } catch (error: any) {
    console.error("companyQnaFlow Error:", error);
    return {
      answer: "I'm here to help! It seems I had a brief technical hiccup. Please try asking your question again, or you can explore our [Services](/services) and [Careers](/careers) manually.",
      intent: 'error'
    };
  }
}
