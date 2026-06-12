'use server';
/**
 * @fileOverview A Genkit flow to check for a job match based on user skills and generate a notification email.
 *
 * - generateJobMatchEmail - Checks if a user's skills match a job's requirements and formats an email.
 * - GenerateJobMatchEmailInput - The input type for the flow.
 * - GenerateJobMatchEmailOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { dummyJobs, type Job } from '@/lib/data';
import type { UserProfile } from '@/types';

const GenerateJobMatchEmailInputSchema = z.object({
  jobId: z.string().describe('The ID of the job to check against.'),
  userId: z.string().describe("The ID of the user whose skills will be checked."),
});
export type GenerateJobMatchEmailInput = z.infer<typeof GenerateJobMatchEmailInputSchema>;

const GenerateJobMatchEmailOutputSchema = z.object({
  shouldNotify: z.boolean().describe('Whether the user should be notified (skills match).'),
  recipientEmail: z.string().email().optional().describe("The user's email if notification is to be sent."),
  emailSubject: z.string().optional().describe('The subject line for the notification email.'),
  emailBody: z.string().optional().describe('The body of the notification email.'),
});
export type GenerateJobMatchEmailOutput = z.infer<typeof GenerateJobMatchEmailOutputSchema>;

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) {
    console.error("Firebase DB is not initialized. Cannot fetch user profile.");
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    console.warn(`User profile not found for userId: ${userId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching user profile for userId ${userId}:`, error);
    return null;
  }
}

function findJobById(jobId: string): Job | undefined {
  return dummyJobs.find(job => job.id === jobId);
}

const emailFormattingPrompt = ai.definePrompt({
    name: 'formatJobMatchEmailPrompt',
    model: 'googleai/gemini-2.0-flash',
    input: { schema: z.object({
        jobTitle: z.string(),
        jobCompany: z.string(),
        jobLocation: z.string(),
        jobUrl: z.string(),
        userFullName: z.string(),
        matchedSkills: z.array(z.string()).optional(),
    })},
    output: { schema: z.object({
        subject: z.string(),
        body: z.string(),
    })},
    prompt: `
You are an expert HR assistant at QuantumFusion Solutions.
A job opening has been identified that matches a user's skills. Format a friendly and professional email notification.

Job Title: {{{jobTitle}}}
Company: {{{jobCompany}}}
Location: {{{jobLocation}}}
User's Full Name: {{{userFullName}}}
{{#if matchedSkills}}
This job seems like a good fit for your skills, including: {{#each matchedSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}

Email Subject: New Opportunity at {{{jobCompany}}}: {{{jobTitle}}}

Email Body:
Dear {{{userFullName}}},

We found a new job opportunity at {{{jobCompany}}} that might be a great fit for your skills:

Position: {{{jobTitle}}}
Location: {{{jobLocation}}}

{{#if matchedSkills}}
This role aligns well with your expertise in areas like {{#each matchedSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}

We encourage you to learn more and apply if you're interested!

[View Job & Apply Now]({{{jobUrl}}})

Best regards,
The QuantumFusion Solutions Talent Team
`,
});


export async function generateJobMatchEmail(
  input: GenerateJobMatchEmailInput
): Promise<GenerateJobMatchEmailOutput> {
  const job = findJobById(input.jobId);
  if (!job) {
    console.warn(`Job not found for jobId: ${input.jobId}`);
    return { shouldNotify: false };
  }

  const userProfile = await fetchUserProfile(input.userId);
  if (!userProfile || !userProfile.skills || userProfile.skills.length === 0) {
    console.warn(`User profile or skills not found for userId: ${input.userId}`);
    return { shouldNotify: false };
  }

  const jobRequiredSkills = job.requiredSkills.map(skill => skill.toLowerCase().trim());
  const userSkills = userProfile.skills.map(skill => skill.toLowerCase().trim());

  if (jobRequiredSkills.length === 0) {
    console.warn(`Job ${input.jobId} has no required skills defined.`);
    return { shouldNotify: false };
  }

  const matchedSkillCount = jobRequiredSkills.filter(reqSkill =>
    userSkills.includes(reqSkill)
  ).length;

  const matchPercentage = (matchedSkillCount / jobRequiredSkills.length) * 100;

  if (matchPercentage >= 70) {
    const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-quantumfusion-site.com';
    const jobUrl = `${siteBaseUrl}/careers`;

    try {
        const {output: emailContent} = await emailFormattingPrompt({
            jobTitle: job.title,
            jobCompany: job.company,
            jobLocation: job.location,
            jobUrl: jobUrl,
            userFullName: userProfile.fullName,
            matchedSkills: jobRequiredSkills.filter(reqSkill => userSkills.includes(reqSkill)).slice(0,3)
        });

        if (emailContent && emailContent.subject && emailContent.body) {
            return {
                shouldNotify: true,
                recipientEmail: userProfile.email,
                emailSubject: emailContent.subject,
                emailBody: emailContent.body,
            };
        } else {
             console.error(`Failed to generate email content for job ${input.jobId} and user ${input.userId}`);
             return { shouldNotify: false };
        }

    } catch (error) {
        console.error('Error formatting job match email with AI:', error);
        return { shouldNotify: false };
    }

  }

  return { shouldNotify: false };
}

const generateJobMatchEmailFlow = ai.defineFlow(
  {
    name: 'generateJobMatchEmailFlow',
    inputSchema: GenerateJobMatchEmailInputSchema,
    outputSchema: GenerateJobMatchEmailOutputSchema,
  },
  generateJobMatchEmail
);
