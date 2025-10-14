
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The new plugin handles model resolution more reliably.
      // We'll let Genkit use the default model configured by the plugin.
    }),
  ],
});
