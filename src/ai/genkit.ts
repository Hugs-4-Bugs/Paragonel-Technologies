
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Explicitly set a default model to prevent errors.
      // 'gemini-pro' is a stable and reliable choice.
      defaultModel: 'gemini-pro',
    }),
  ],
});
