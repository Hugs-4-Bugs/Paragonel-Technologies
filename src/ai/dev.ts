
import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-related-content.ts';
import '@/ai/flows/fetch-tech-news.ts';
import '@/ai/flows/analyze-resume-flow.ts';
import '@/ai/flows/format-application-email-flow.ts';
// Removed: generate-job-match-email-flow.ts — dead code. It used the CLIENT
// Firebase SDK to read the locked `users` collection (denied by firestore.rules
// at runtime) + read `dummyJobs` instead of live data, and no route imported it.
