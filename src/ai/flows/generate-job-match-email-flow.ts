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
    if (docSnap.exists()) return docSnap.data() as UserProfile;
    return null;
  } catch (error) {
    console.error("fetchUserProfile Error:", error);
    return null;
  }
}

function findJobById(jobId: string): Job | undefined {
  return dummyJobs.find(job => job.id === jobId);
}

const emailFormattingPrompt = ai.definePrompt({
    name: 'formatJobMatchEmailPrompt',
    model: 'googleai/gemini-pro',
    input: { schema: z.object({
        jobTitle: z.string(),
        jobCompany: z.string(),
        jobLocation: z.string(),
        jobUrl: z.string(),
        userFullName: z.string(),
    })},
    output: { schema: z.object({
        subject: z.string(),
        body: z.string(),
    })},
    prompt: `
A job opening matches a user's skills. Format a friendly notification email.
Job: {{{jobTitle}}} at {{{jobCompany}}}
User: {{{userFullName}}}
`,
});


export async function generateJobMatchEmail(
  input: GenerateJobMatchEmailInput
): Promise<GenerateJobMatchEmailOutput> {
  const job = findJobById(input.jobId);
  const userProfile = await fetchUserProfile(input.userId);

  if (!job || !userProfile || !userProfile.skills) return { shouldNotify: false };

  const jobRequiredSkills = job.requiredSkills.map(s => s.toLowerCase());
  const userSkills = userProfile.skills.map(s => s.toLowerCase());
  const matchedSkillCount = jobRequiredSkills.filter(s => userSkills.includes(s)).length;
  const matchPercentage = (matchedSkillCount / jobRequiredSkills.length) * 100;

  if (matchPercentage >= 70) {
    try {
        const {output} = await emailFormattingPrompt({
            jobTitle: job.title,
            jobCompany: job.company,
            jobLocation: job.location,
            jobUrl: '/careers',
            userFullName: userProfile.fullName,
        });

        return {
            shouldNotify: true,
            recipientEmail: userProfile.email,
            emailSubject: output?.subject || `Job Opportunity: ${job.title}`,
            emailBody: output?.body || `Hello ${userProfile.fullName}, we found a role for you!`,
        };
    } catch (error) {
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