
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
  model: 'googleai/gemini-1.5-flash-latest',
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

    CORE INTENTS & KNOWLEDGE (Source of Truth):
    1. FOUNDER: Prabhat Sharma (Founder & Principal Engineer).
    2. PRODUCTS: AcquisitionOS (AI CRM), SystemFoundry (Arch Simulator), CodeGuard AI (Cost Intelligence).
    3. SERVICES: AI Solutions, Cloud Strategy, DevOps Automation, Custom SaaS.
    4. LOCATION: HSR Layout, Bangalore, 560102.
    5. CONTACT: contact@quantumfusion.in, +91 72500 63206.
    6. MISSION: Eliminate the gap between problem and solution with precision engineering.
    7. TECH STACK: Java (Spring Boot), Python, React, Next.js, AWS, GCP, Firebase.

    FULL KNOWLEDGE BASE:
    ${JSON.stringify(knowledge)}

    INSTRUCTIONS:
    - Respond using professional yet approachable language.
    - Use Markdown for formatting (bolding, lists, and links).
    - If asked about the founder, explicitly mention Prabhat Sharma and his engineering background.
    - INTENT DETECTION:
       - If the user asks for a specific page (e.g., "go to careers", "contact page"), set intent to 'navigate' and provide the correct relative URL.
       - If the user asks about job openings or joining the team, set intent to 'careers'.
       - For general questions, set intent to 'qna'.

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
    return {
      answer: "I'm here to assist you! It looks like I had a momentary connection issue. You can manually explore our [Services](/services), view our [Portfolio](/portfolio), or check for [Open Roles](/careers). How else can I help you today?",
      intent: 'error'
    };
  }
}
