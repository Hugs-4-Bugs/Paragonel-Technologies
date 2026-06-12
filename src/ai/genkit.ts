<<<<<<< HEAD
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
=======
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
>>>>>>> 1cfe9cb (2026-06-12 10:12:17.551 [info] > git cat-file -s 8a30d35393b82a2a349f2b1)

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});