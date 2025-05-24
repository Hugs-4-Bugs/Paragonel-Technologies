
import { config } from 'dotenv';
config();

// import '@/ai/flows/summarize-job-description.ts'; // Removed unused flow
import '@/ai/flows/recommend-related-content.ts';
import '@/ai/flows/fetch-tech-news.ts';
import '@/ai/flows/company-qna-flow.ts';
import '@/ai/flows/format-application-email-flow.ts';
import '@/ai/flows/generate-job-match-email-flow.ts'; // Added new flow
