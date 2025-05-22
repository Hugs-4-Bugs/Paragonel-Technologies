
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-job-description.ts';
import '@/ai/flows/recommend-related-content.ts';
import '@/ai/flows/fetch-tech-news.ts';
import '@/ai/flows/company-qna-flow.ts';
