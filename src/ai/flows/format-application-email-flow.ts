
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
// Assuming ApplicationFormValues is correctly imported if needed for internal logic,
// but the flow input is defined by FormatApplicationEmailInputSchema.

const FormatApplicationEmailInputSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  resumeFileName: z.string().describe("The original file name of the resume."),
  resumeDataUri: z.string().describe("The resume file content as a Base64 data URI (for reference, not for direct email body inclusion)."),
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
  model: 'gemini-1.5-flash-latest',
  input: {schema: FormatApplicationEmailInputSchema},
  output: {schema: FormatApplicationEmailOutputSchema},
  prompt: `
You are an expert HR assistant at QuantumFusion Solutions. Your task is to format a job application into two emails:
1. A detailed email for the hiring manager (erprabhat72@gmail.com).
2. A confirmation email for the applicant.

**Applicant Details (Use this for both emails as needed):**
- Job Applied For: {{{jobTitle}}} (ID: {{{jobId}}})
- Name: {{{fullName}}}
- Email: {{{email}}}
- Phone: {{{phone}}}
{{#if linkedinProfile}}- LinkedIn: {{{linkedinProfile}}}{{/if}}
{{#if portfolioWebsite}}- Portfolio: {{{portfolioWebsite}}}{{/if}}
{{#if codingProfileUrl}}- Coding Profile: {{{codingProfileUrl}}}{{/if}}
- Resume Attached: {{{resumeFileName}}} (Do NOT include the resumeDataUri in email bodies)

- Education:
  - Qualification: {{{highestQualification}}}
  - Specialization: {{{specialization}}}
  - University: {{{university}}}
  - Passing Year: {{{passingYear}}}
  - Marks/CGPA: {{{marks}}}

- Skills:
  - Primary: {{{primarySkills}}}
  {{#if secondarySkills}}- Secondary: {{{secondarySkills}}}{{/if}}

- Work Experience:
  {{#if isFresher}}
  - Level: Fresher
  {{else}}
  - Level: Experienced
    {{#if companyName}}- Company: {{{companyName}}}{{/if}}
    {{#if jobTitleExperience}}- Role: {{{jobTitleExperience}}}{{/if}}
    {{#if fromDate}}- Period: {{{fromDate}}} to {{#if isCurrentlyWorking}}Present{{else}}{{{toDate}}}{{/if}}{{/if}}
    {{#if jobDescription}}- Responsibilities: {{{jobDescription}}}{{/if}}
  {{/if}}

- Additional Information:
  {{#if coverLetter}}- Cover Letter Snippet: {{{coverLetter}}}{{/if}}
  - Preferred Location: {{{preferredJobLocation}}}
  {{#if currentCTC}}- Current CTC: {{{currentCTC}}}{{/if}}
  - Expected Salary: {{{expectedSalary}}}
  - Notice Period: {{{noticePeriod}}}

- Declarations:
  - Accepted Terms: {{#if acceptTerms}}Yes{{/if}}
  - Notify for Similar Jobs: {{#if notifySimilarJobs}}Yes{{else}}No{{/if}}

**Instructions for Email to Hiring Manager (erprabhat72@gmail.com):**
1.  **Subject Line**: "Job Application: {{{jobTitle}}} - {{{fullName}}}"
2.  **Body**:
    - Start with "Dear Hiring Manager,".
    - Present all the applicant details listed above in a clear, well-structured, professional format. Use headings for sections.
    - Mention that the resume ("{{{resumeFileName}}}") is attached (or would be if this were a real email system).
    - End with "Sincerely,\nThe QuantumFusion Solutions Application System".

**Instructions for Confirmation Email to Applicant ({{{email}}}):**
1.  **Subject Line**: "Your Application for {{{jobTitle}}} at QuantumFusion Solutions Received"
2.  **Body**:
    - Start with "Dear {{{fullName}}},".
    - Thank them for applying for the "{{{jobTitle}}}" position.
    - Confirm that their application has been received.
    - Briefly mention, "Our hiring team will review your application and contact you if your profile matches our requirements."
    - Optionally, mention, "In the meantime, you can explore more about us at [Our Website Link - e.g., https://yourcompany.com] or follow us on [LinkedIn Link - e.g., https://linkedin.com/company/yourcompany]." (Use placeholders if actual links aren't available in context).
    - End with "Best regards,\nThe QuantumFusion Solutions Hiring Team".

Provide the output strictly in the specified JSON format.
`,
});

const formatApplicationEmailFlow = ai.defineFlow(
  {
    name: 'formatDetailedApplicationEmailFlow',
    inputSchema: FormatApplicationEmailInputSchema,
    outputSchema: FormatApplicationEmailOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.adminEmailBody || !output.adminEmailSubject || !output.applicantConfirmationBody || !output.applicantConfirmationSubject) {
      throw new Error("AI failed to generate complete email content.");
    }
    return output;
  }
);
