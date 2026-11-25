
import { genkit as genkitCore } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { GEMINI_MODEL_REF, GEMINI_MODEL_ID, hasGeminiKey } from './models';

export const ai = genkitCore({
  plugins: [
    googleAI(),
  ],
  model: GEMINI_MODEL_REF,
});

// One non-sensitive init log so an operator can confirm which model is active
// + whether a key is present (presence only — the value is never printed).
if (typeof console !== 'undefined') {
  console.log(
    `[genkit] initialized — model: ${GEMINI_MODEL_ID} (ref ${GEMINI_MODEL_REF}), api key present: ${hasGeminiKey()}`,
  );
}

