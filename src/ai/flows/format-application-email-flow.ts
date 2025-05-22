
'use server';
/**
 * @fileOverview Formats a detailed job application into an email.
 *
 * - formatApplicationEmailFlow - A function that takes detailed application data and formats an email.
 * - FormatApplicationEmailInput - The input type for the flow.
 * - FormatApplicationEmailOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ApplicationFormValues } from '@/types'; // Assuming this type has all fields

// Define Zod schema based on the extended ApplicationFormValues
// This needs to precisely match the structure of data passed from the frontend.
const FormatApplicationEmailInputSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  resumeFileName: z.string().describe("The original file name of the resume."),
  resumeDataUri: z.string().describe("The resume file content as a Base64 data URI."), // For AI context, not direct email body
  linkedinProfile: z.string().url().optional().or(z.literal('')),
  portfolioWebsite: z.string().url().optional().or(z.literal('')),

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

  jobId: z.string(), // ID of the job applied for
  jobTitle: z.string(), // Title of the job applied for
});

// Ensure this type matches the schema above and ApplicationFormValues
export type FormatApplicationEmailInput = z.infer<typeof FormatApplicationEmailInputSchema>;

const FormatApplicationEmailOutputSchema = z.object({
  emailSubject: z.string().describe("The subject line for the email."),
  emailBody: z.string().describe("The formatted body of the email, suitable for sending."),
});
export type FormatApplicationEmailOutput = z.infer<typeof FormatApplicationEmailOutputSchema>;

export async function formatApplicationEmail(
  input: FormatApplicationEmailInput
): Promise<FormatApplicationEmailOutput> {
  // Ensure any transformations needed from ApplicationFormValues to FormatApplicationEmailInput happen before this call if they differ.
  // For now, assuming they match directly based on the spread in ApplyJobModal.
  return formatApplicationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatDetailedApplicationEmailPrompt',
  input: {schema: FormatApplicationEmailInputSchema},
  output: {schema: FormatApplicationEmailOutputSchema},
  prompt: `
You are an expert HR assistant at QuantumFusion Solutions, tasked with formatting a job application into a professional email.
The email should be prepared to be sent to the hiring manager at erprabhat72@gmail.com.

Format the following comprehensive application details into a clear, concise, and well-structured email.

**Job Applied For:**
- Title: {{{jobTitle}}}
- ID: {{{jobId}}}

**Applicant Personal Information:**
- Name: {{{fullName}}}
- Email: {{{email}}}
- Phone: {{{phone}}}
{{#if linkedinProfile}}- LinkedIn: {{{linkedinProfile}}}{{/if}}
{{#if portfolioWebsite}}- Portfolio: {{{portfolioWebsite}}}{{/if}}
- Resume Attached: {{{resumeFileName}}} (Represented by resumeDataUri, do NOT include the data URI itself in the email body)

**Education Details:**
- Highest Qualification: {{{highestQualification}}}
- Specialization/Branch: {{{specialization}}}
- University/College: {{{university}}}
- Passing Year: {{{passingYear}}}
- Marks/Percentage/CGPA: {{{marks}}}

**Skills:**
- Primary Skills: {{{primarySkills}}}
{{#if secondarySkills}}- Secondary Skills: {{{secondarySkills}}}{{/if}}

**Work Experience:**
{{#if isFresher}}
- Experience Level: Fresher
{{else}}
- Experience Level: Experienced
  - Company Name: {{{companyName}}}
  - Job Title/Designation: {{{jobTitleExperience}}}
  - Period: {{{fromDate}}} to {{#if isCurrentlyWorking}}Present{{else}}{{{toDate}}}{{/if}}
  - Roles & Responsibilities: {{{jobDescription}}}
{{/if}}

**Additional Information:**
{{#if coverLetter}}
- Cover Letter Snippet (if long, summarize or state it's attached/available):
{{{coverLetter}}}
{{else}}
- Cover Letter: Not provided
{{/if}}
- Preferred Job Location: {{{preferredJobLocation}}}
{{#if currentCTC}}- Current CTC: {{{currentCTC}}}{{/if}}
- Expected Salary: {{{expectedSalary}}}
- Notice Period: {{{noticePeriod}}}

**Declarations:**
- Accepted Terms & Conditions: {{#if acceptTerms}}Yes{{else}}No (This should ideally be Yes for submission){{/if}}
- Notify for Similar Jobs: {{#if notifySimilarJobs}}Yes{{else}}No{{/if}}

**Email Generation Guidelines:**
1.  Create a concise and informative Subject Line including the Job Title and Applicant's Name.
2.  The email body should start with "Dear Hiring Manager,".
3.  Present all the above information in a clean, readable, and professional format. Use clear headings for sections.
4.  End the email body with "Sincerely,\nThe QuantumFusion Solutions Application System".
5.  Do NOT include the resumeDataUri in the email body text. Only mention the resumeFileName.
`,
});

const formatApplicationEmailFlow = ai.defineFlow(
  {
    name: 'formatDetailedApplicationEmailFlow', // Ensure flow name is distinct if old one exists
    inputSchema: FormatApplicationEmailInputSchema,
    outputSchema: FormatApplicationEmailOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.emailBody || !output.emailSubject) {
      // Fallback or error handling
      console.error("AI failed to generate complete email content for application:", input.fullName, "for job:", input.jobTitle);
      return { 
        emailSubject: `Application Received: ${input.jobTitle} - ${input.fullName} (Error in AI Formatting)`,
        emailBody: `Error: The AI failed to format the application details for ${input.fullName} (Email: ${input.email}) for the position of ${input.jobTitle}. Please review the raw data if available or contact support.`
      };
    }
    return output;
  }
);
