
'use server';
/**
 * @fileOverview Formats a detailed job application into an email for admin and a confirmation email for the applicant.
 *
 * - formatApplicationEmailFlow - A function that takes detailed application data and formats emails.
 * - FormatApplicationEmailInput - The input type for the flow.
 * - FormatApplicationEmailOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormatApplicationEmailInputSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  resumeFileName: z.string().describe("The original file name of the resume."),
  resumeDataUri: z.string().describe("The resume file content as a Base64 data URI."),
  linkedinProfile: z.string().url().optional().or(z.literal('')),
  portfolioWebsite: z.string().url().optional().or(z.literal('')),
  codingProfileUrl: z.string().url().optional().or(z.literal('')),

  highestQualification: z.string(),
  specialization: z.string(),
  university: z.string(),
  passingYear: z.string(),
  marks: z.string(),

  primarySkills: z.string(),
  secondarySkills: z.string().optional(),

  isFresher: z.boolean(),
  companyName: z.string().optional(),
  jobTitleExperience: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  isCurrentlyWorking: z.boolean().optional(),
  jobDescription: z.string().optional(),
  
  coverLetter: z.string().optional(),
  preferredJobLocation: z.string(),
  currentCTC: z.string().optional(),
  expectedSalary: z.string(),
  noticePeriod: z.string(),

  acceptTerms: z.boolean(),
  notifySimilarJobs: z.boolean(),

  jobId: z.string(),
  jobTitle: z.string(),
});

export type FormatApplicationEmailInput = z.infer<typeof FormatApplicationEmailInputSchema>;

const FormatApplicationEmailOutputSchema = z.object({
  adminEmailSubject: z.string().describe("The subject line for the email to the admin/hiring manager."),
  adminEmailBody: z.string().describe("The formatted body of the email to the admin/hiring manager."),
  applicantConfirmationSubject: z.string().describe("The subject line for the confirmation email to the applicant."),
  applicantConfirmationBody: z.string().describe("The formatted body of the confirmation email to the applicant."),
});
export type FormatApplicationEmailOutput = z.infer<typeof FormatApplicationEmailOutputSchema>;

export async function formatApplicationEmail(
  input: FormatApplicationEmailInput
): Promise<FormatApplicationEmailOutput> {
  return formatApplicationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatDetailedApplicationEmailPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: FormatApplicationEmailInputSchema},
  output: {schema: FormatApplicationEmailOutputSchema},
  prompt: `
You are an expert HR assistant at Paragonel. Your task is to format a job application into two emails:
1. A detailed email for the hiring manager (erprabhat72@gmail.com).
2. A confirmation email for the applicant.

**Applicant Details:**
- Job: {{{jobTitle}}} (ID: {{{jobId}}})
- Name: {{{fullName}}}
- Email: {{{email}}}
- Phone: {{{phone}}}
- Education: {{{highestQualification}}} ({{{passingYear}}})
- Primary Skills: {{{primarySkills}}}

**Instructions:**
1.  **Hiring Manager Email**: Detailed, professional, listing all skills and experience.
2.  **Applicant Confirmation**: Friendly, confirming receipt, and mentioning next steps.
`,
});

const formatApplicationEmailFlow = ai.defineFlow(
  {
    name: 'formatDetailedApplicationEmailFlow',
    inputSchema: FormatApplicationEmailInputSchema,
    outputSchema: FormatApplicationEmailOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) throw new Error("AI output failure");
      return output;
    } catch (error) {
      console.error("formatApplicationEmail AI Error:", error);
      return {
        adminEmailSubject: `New Job Application: ${input.jobTitle} - ${input.fullName}`,
        adminEmailBody: `New application received for ${input.jobTitle}. Name: ${input.fullName}, Email: ${input.email}. Please review in the dashboard.`,
        applicantConfirmationSubject: `Application Received: ${input.jobTitle} at Paragonel`,
        applicantConfirmationBody: `Dear ${input.fullName}, thank you for your application. Our team will review your profile shortly.`,
      };
    }
  }
);
