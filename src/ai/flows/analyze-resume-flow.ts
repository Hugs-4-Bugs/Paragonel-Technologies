
'use server';
/**
 * @fileOverview QuantumAI Resume Analysis Flow.
 * Extracts structured data from a resume data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z.string().describe('Base64 data URI of the resume file (PDF/DOCX).'),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  skills: z.array(z.string()),
  experienceYears: z.number(),
  education: z.string(),
  technologies: z.array(z.string()),
  summary: z.string(),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: AnalyzeResumeInputSchema },
  output: { schema: AnalyzeResumeOutputSchema },
  prompt: `You are an expert HR recruitment specialist.
Analyze the following resume and extract all relevant candidate information.

Resume Content: {{media url=resumeDataUri}}

Extract:
- Full Name
- Email Address
- Phone Number
- Key Skills (array)
- Total Years of Experience (number)
- Highest Education Degree
- Technical Stack/Technologies (array)
- A brief 2-sentence summary of the candidate's profile.`,
});

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  const { output } = await prompt(input);
  return output!;
}
