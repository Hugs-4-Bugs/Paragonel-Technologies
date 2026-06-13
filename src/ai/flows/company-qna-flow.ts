
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
  intent: z.enum(['qna', 'navigate', 'careers', 'error']).describe('The detected intent of the user.'),
  navigationLink: z.string().optional().describe('A relative URL if the intent is navigate.'),
});
export type CompanyQnaOutput = z.infer<typeof CompanyQnaOutputSchema>;

// Define a structured prompt for better reliability
const qnaPrompt = ai.definePrompt({
  name: 'companyQnaPrompt',
  input: { schema: CompanyQnaInputSchema },
  output: { schema: CompanyQnaOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `
    You are QuantumAI, the official intelligent assistant for QuantumFusion Solutions.
    Your goal is to be a professional, helpful, and ultra-modern representative of the company.

    COMPANY KNOWLEDGE BASE:
    ${JSON.stringify(knowledge)}

    INSTRUCTIONS:
    1. Use the provided Knowledge Base as your source of truth.
    2. Respond using professional yet approachable language.
    3. Use Markdown for formatting (bolding, lists, and links).
    4. INTENT DETECTION:
       - If the user asks for a specific page (e.g., "go to careers", "show me services", "contact page"), set intent to 'navigate' and provide the correct relative URL from the knowledge base.
       - If the user asks about job openings or joining the team, set intent to 'careers'.
       - For general questions, set intent to 'qna'.
    5. If the user's question is completely unrelated to the company or its domains (AI, Cloud, SaaS), politely guide them back to company-related topics.

    USER QUESTION: {{question}}
    
    RESPONSE FORMAT: Always return a valid JSON object matching the requested schema.
  `,
});

export async function companyQnaFlow(input: CompanyQnaInput): Promise<CompanyQnaOutput> {
  try {
    const { output } = await qnaPrompt(input);
    
    if (!output) {
      throw new Error("AI returned empty output");
    }
    
    return output;
  } catch (error: any) {
    console.error("companyQnaFlow Error Details:", error);
    // Provide a more helpful but still professional fallback
    return {
      answer: "I'm here to assist you! It looks like I had a momentary connection issue. You can manually explore our [Services](/services), view our [Portfolio](/portfolio), or check for [Open Roles](/careers). How else can I help you today?",
      intent: 'error'
    };
  }
}
