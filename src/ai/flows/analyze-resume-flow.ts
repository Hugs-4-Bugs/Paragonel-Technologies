'use server';
/**
 * @fileOverview QuantumAI V2 Resume Analysis Flow.
 * Extracts deep structured data from a resume for high-precision job matching.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z.string().describe('Base64 data URI of the resume file.'),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  name: z.string().describe('Full name.'),
  email: z.string().email(),
  phone: z.string(),
  location: z.string().describe('City and state/country.'),
  experienceYears: z.number().describe('Total years of professional experience.'),
  skills: z.array(z.string()).describe('Technical skills and frameworks.'),
  certifications: z.array(z.string()).optional(),
  education: z.string().describe('Highest degree.'),
  projects: z.array(z.string()).describe('Key projects or accomplishments.'),
  previousCompanies: z.array(z.string()).describe('List of past employers.'),
  domain: z.string().describe('Primary professional domain (e.g., DevOps, Frontend, Java Backend).'),
  seniority: z.enum(['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Executive']).describe('Career level.'),
  summary: z.string().describe('A high-level professional summary.'),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeResumePromptV2',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AnalyzeResumeInputSchema },
  output: { schema: AnalyzeResumeOutputSchema },
  prompt: `
    You are the Lead Recruitment Agent for QuantumFusion Solutions.
    Analyze the provided resume and extract a high-precision candidate profile.

    Resume Content: {{media url=resumeDataUri}}

    INSTRUCTIONS:
    - Extract ALL technical skills mentioned.
    - Calculate "experienceYears" precisely based on dates.
    - Identify the primary "domain" based on their strongest skills and history.
    - Determine "seniority" based on their roles and years of experience.
    - If a field is missing, provide a logical best guess based on context.
    - Be extremely professional and ensure data integrity for HR processing.
  `,
});

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("AI returned empty data");
    return output;
  } catch (error: any) {
    console.error("analyzeResume Error:", error);
    throw new Error("Failed to parse resume. Ensure it is a valid PDF/DOCX.");
  }
}
