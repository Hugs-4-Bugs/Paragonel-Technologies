'use server';
/**
 * @fileOverview A QuantumFusion Solutions Q&A AI agent.
 *
 * - companyQnaFlow - A function that answers questions about QuantumFusion Solutions.
 * - CompanyQnaInput - The input type for the companyQnaFlow function.
 * - CompanyQnaOutput - The return type for the companyQnaFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompanyQnaInputSchema = z.object({
  question: z.string().describe('The user question about QuantumFusion Solutions.'),
});
export type CompanyQnaInput = z.infer<typeof CompanyQnaInputSchema>;

const CompanyQnaOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type CompanyQnaOutput = z.infer<typeof CompanyQnaOutputSchema>;

export async function companyQnaFlow(input: CompanyQnaInput): Promise<CompanyQnaOutput> {
  return companyQnaFlowInternal(input);
}

const prompt = ai.definePrompt({
  name: 'companyQnaPrompt',
  model: 'googleai/gemini-pro',
  input: {schema: CompanyQnaInputSchema},
  output: {schema: CompanyQnaOutputSchema},
  prompt: `You are a helpful and knowledgeable assistant for QuantumFusion Solutions, an innovative IT company focused on AI, Cloud Computing, DevOps, and SaaS Platforms.
The company's mission is to deliver transformative IT solutions that drive innovation, efficiency, and sustainable growth. Their vision is to be the leading catalyst in clients' digital transformation journeys.
Key services include:
- AI Solutions: Covering machine learning, Natural Language Processing (NLP), and computer vision.
- Cloud Infrastructure: Including cloud migration, management, and cloud-native development on platforms like AWS, Azure, and GCP.
- DevOps Automation: Focusing on CI/CD pipelines, Infrastructure as Code (IaC), and automated testing.
- SaaS Platforms: Offering end-to-end development of Software-as-a-Service applications.
The company was founded by Prabhat Kumar.
The company's official LinkedIn page is: https://www.linkedin.com/company/106575838/admin/inbox/thread/2-OTQ5ODNjNjAtNDE0Yi00YTI3LWI5YTEtOGI5ZmQ0ZDNkMTAwXzEwMA==/

When providing a link, please use Markdown format, for example: [Our Careers Page](/careers) or [QuantumFusion Solutions LinkedIn](https://www.linkedin.com/company/106575838/admin/inbox/thread/2-OTQ5ODNjNjAtNDE0Yi00YTI3LWI5YTEtOGI5ZmQ0ZDNkMTAwXzEwMA==/).

Answer the following user question concisely and professionally based on the information about QuantumFusion Solutions.
If the question is about careers or job openings, mention that they can find more information on the [Careers page](/careers) of the website or on the company's [LinkedIn profile](https://www.linkedin.com/company/106575838/admin/inbox/thread/2-OTQ5ODNjNjAtNDE0Yi00YTI3LWI5YTEtOGI5ZmQ0ZDNkMTAwXzEwMA==/).
If the question is unrelated to the company or its services, politely state that you can only answer questions about QuantumFusion Solutions.

User Question: {{{question}}}

Answer:`,
});

const companyQnaFlowInternal = ai.defineFlow(
  {
    name: 'companyQnaFlowInternal',
    inputSchema: CompanyQnaInputSchema,
    outputSchema: CompanyQnaOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output || !output.answer) {
        return { answer: "I'm sorry, I'm having a bit of trouble processing that. QuantumFusion Solutions offers top-tier AI, Cloud, and SaaS solutions. You can check our [Services](/services) or [Careers](/careers) pages for more info!" };
      }
      return output;
    } catch (error) {
      console.error("AI Flow Error:", error);
      return { answer: "I'm currently updating my knowledge base. QuantumFusion Solutions specializes in AI, Cloud, and DevOps. Please visit our [Contact Page](/contact) if you have specific inquiries!" };
    }
  }
);
