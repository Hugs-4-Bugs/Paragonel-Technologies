
'use server';
/**
 * @fileOverview Formats a job application into an email.
 *
 * - formatApplicationEmailFlow - A function that takes application details and formats an email.
 * - FormatApplicationEmailInput - The input type for the flow.
 * - FormatApplicationEmailOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormatApplicationEmailInputSchema = z.object({
  applicantName: z.string().describe("The full name of the applicant."),
  applicantEmail: z.string().email().describe("The email address of the applicant."),
  applicantPhone: z.string().optional().describe("The phone number of the applicant."),
  jobTitle: z.string().describe("The title of the job applied for."),
  jobId: z.string().describe("The ID of the job applied for."),
  resumeDataUri: z.string().describe("The resume file content as a Base64 data URI."),
  resumeFileName: z.string().describe("The original file name of the resume."),
  experienceLevel: z.enum(["fresher", "experienced"]).describe("The applicant's experience level."),
  workExperience: z.string().optional().describe("Details of the applicant's work experience (if applicable)."),
  coverLetter: z.string().optional().describe("The applicant's cover letter content (if provided)."),
  linkedinProfile: z.string().url().optional().describe("Link to the applicant's LinkedIn profile (if provided)."),
});
export type FormatApplicationEmailInput = z.infer<typeof FormatApplicationEmailInputSchema>;

const FormatApplicationEmailOutputSchema = z.object({
  emailSubject: z.string().describe("The subject line for the email."),
  emailBody: z.string().describe("The formatted body of the email."),
});
export type FormatApplicationEmailOutput = z.infer<typeof FormatApplicationEmailOutputSchema>;

export async function formatApplicationEmail(
  input: FormatApplicationEmailInput
): Promise<FormatApplicationEmailOutput> {
  return formatApplicationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatApplicationEmailPrompt',
  input: {schema: FormatApplicationEmailInputSchema},
  output: {schema: FormatApplicationEmailOutputSchema},
  prompt: `
You are an assistant tasked with formatting a job application into a professional email.
The email should be addressed to the hiring manager at erprabhat72@gmail.com.

Format the following application details into a clear and concise email.

Job Title Applied For: {{{jobTitle}}} (ID: {{{jobId}}})

Applicant Details:
- Name: {{{applicantName}}}
- Email: {{{applicantEmail}}}
{{#if applicantPhone}}- Phone: {{{applicantPhone}}}{{/if}}
{{#if linkedinProfile}}- LinkedIn: {{{linkedinProfile}}}{{/if}}

Experience Level: {{{experienceLevel}}}
{{#if workExperience}}
Work Experience:
{{{workExperience}}}
{{/if}}

{{#if coverLetter}}
Cover Letter:
{{{coverLetter}}}
{{/if}}

The applicant has attached their resume: "{{{resumeFileName}}}". (Represented by resumeDataUri: {{resumeDataUri}})

Generate an appropriate email subject line and body.
The subject should clearly state the job title and applicant's name.
The body should summarize the information professionally.
Start the body with "Dear Hiring Manager,".
End the body with "Sincerely,\nThe QuantumFusion Solutions Application System".
Do not include the resumeDataUri directly in the email body, but mention the resumeFileName.
`,
});

const formatApplicationEmailFlow = ai.defineFlow(
  {
    name: 'formatApplicationEmailFlow',
    inputSchema: FormatApplicationEmailInputSchema,
    outputSchema: FormatApplicationEmailOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate email content.");
    }
    return output;
  }
);
