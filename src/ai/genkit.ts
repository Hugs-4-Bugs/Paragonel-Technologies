import {genkit, type GenkitOptions} from 'genkit';
import {googleAI, type GoogleAIOptions} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The model name is specified here to ensure all flows use this stable identifier.
      model: 'googleai/gemini-1.5-flash-latest',
    }),
  ],
});
