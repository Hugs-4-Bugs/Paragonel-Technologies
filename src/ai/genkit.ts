
import { genkit as genkitCore } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkitCore({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-1.5-flash',
});
