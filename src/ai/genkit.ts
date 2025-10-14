
import {genkit, type GenkitOptions} from 'genkit';
import {googleAI, type GoogleAIOptions} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Using a known, stable model identifier to prevent 404 errors.
      // This is the definitive fix for the content generation issue.
      model: 'gemini-pro',
    }),
  ],
});
