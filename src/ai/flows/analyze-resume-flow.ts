
'use server';
/**
 * @fileOverview QuantumAI Resume Analysis Flow.
 * Extracts structured data from a resume data URI using multi-modal analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z.string().describe('Base64 data URI of the resume file (PDF/DOCX/Image).'),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  name: z.string().describe('The candidate\'s full name.'),
  email: z.string().email().describe('The candidate\'s email address.'),
  phone: z.string().describe('The candidate\'s phone number.'),
  skills: z.array(z.string()).describe('An array of technical and soft skills.'),
  experienceYears: z.number().describe('Total years of professional experience.'),
  education: z.string().describe('Highest degree or educational institution.'),
  technologies: z.array(z.string()).describe('Specific tools, frameworks, and languages.'),
  summary: z.string().describe('A 2-sentence professional summary.'),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AnalyzeResumeInputSchema },
  output: { schema: AnalyzeResumeOutputSchema },
  prompt: `
    You are an elite HR recruitment assistant for QuantumFusion Solutions.
    Analyze the provided resume file and extract comprehensive candidate data.

    Resume Content: {{media url=resumeDataUri}}

    INSTRUCTIONS:
    - If the name is not explicitly clear, look for the largest header text.
    - Carefully parse experience dates to calculate "Total Years of Experience" as a numeric value.
    - Extract ALL technical skills into the skills and technologies arrays.
    - Be professional and ensure high precision in data extraction.
  `,
});

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("AI returned empty data for resume analysis");
    return output;
  } catch (error: any) {
    console.error("analyzeResume Error:", error);
    throw new Error("Resume analysis failed. Please try a different file format (PDF is preferred).");
  }
}
