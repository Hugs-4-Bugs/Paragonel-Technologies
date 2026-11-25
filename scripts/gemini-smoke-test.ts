/**
 * gemini-smoke-test.ts — real provider integration test for the configured
 * Gemini model (Defect 1 §6).
 *
 * Sends a minimal generate request to the model selected in src/ai/models.ts
 * (gemini-flash-latest by default, or GEMINI_MODEL) + verifies a valid text
 * response. Distinguishes:
 *   - missing API key → reports blocked + the exact command to run after
 *     supplying the key (does NOT pretend success).
 *   - real provider call → success (prints a short response snippet) or
 *     failure (prints the classified reason: invalid_key / unsupported_model /
 *     quota / timeout / provider_error).
 *
 * NEVER reports a mocked test as a successful real Gemini call.
 *
 * Usage:
 *   # If the key is in your shell environment:
 *   GEMINI_API_KEY=... npx tsx scripts/gemini-smoke-test.ts
 *   # Or if it is in .env.local, the Next dev server / this script reads it via
 *   # the same process.env path (load it first):
 *   node -e "require('fs').readFileSync('.env.local','utf8').split('\n').forEach(l=>{const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]=m[2]})" # (illustrative)
 *
 * Exit 0 = real call succeeded; non-zero = blocked or failed (reason printed).
 */
import { ai } from '../src/ai/genkit';
import {
  GEMINI_MODEL_ID,
  GEMINI_MODEL_REF,
  GEMINI_REQUEST_TIMEOUT_MS,
  hasGeminiKey,
  classifyProviderError,
  reasonLabel,
} from '../src/ai/models';

async function main() {
  console.log('[smoke] model:', GEMINI_MODEL_ID, '| ref:', GEMINI_MODEL_REF);
  console.log('[smoke] timeout:', GEMINI_REQUEST_TIMEOUT_MS, 'ms');
  console.log('[smoke] api key present:', hasGeminiKey());

  if (!hasGeminiKey()) {
    console.error(
      '\n[smoke] BLOCKED — no GEMINI_API_KEY (or GOOGLE_API_KEY fallback) in this environment.',
      '\n[smoke] This is NOT a failure of the code; it means real provider verification',
      '\n[smoke] cannot run here. To verify with the founder\'s configured key, run:',
      '\n[smoke]   GEMINI_API_KEY=<your-key> npx tsx scripts/gemini-smoke-test.ts',
    );
    process.exit(2);
  }

  const startedAt = Date.now();
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Gemini request timed out after ${GEMINI_REQUEST_TIMEOUT_MS}ms`)),
        GEMINI_REQUEST_TIMEOUT_MS,
      );
    });
    const genPromise = ai.generate({
      prompt: 'Reply with exactly the two words: PARAGONEL OK',
      model: GEMINI_MODEL_REF,
    });
    const { text } = await Promise.race([genPromise, timeoutPromise]);
    const snippet = (text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    console.log(`\n[smoke] SUCCESS — real Gemini call returned in ${Date.now() - startedAt}ms.`);
    console.log('[smoke] response snippet:', JSON.stringify(snippet));
    if (!snippet) {
      console.error('[smoke] WARNING — response text was empty (model returned no text).');
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    const reason = classifyProviderError(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n[smoke] FAILED — real Gemini call did not succeed (${Date.now() - startedAt}ms).`);
    console.error('[smoke] classified reason:', reasonLabel(reason));
    // Print a short, non-sensitive slice of the error message (no key ever).
    console.error('[smoke] error (truncated, non-sensitive):', msg.slice(0, 200));
    if (reason === 'unsupported_model') {
      console.error(
        '[smoke] HINT — the model id is not served for this key. Try pinning a GA model:',
        '\n[smoke]   GEMINI_MODEL=gemini-2.0-flash GEMINI_API_KEY=<key> npx tsx scripts/gemini-smoke-test.ts',
      );
    }
    if (reason === 'invalid_key' || reason === 'missing_key') {
      console.error('[smoke] HINT — verify the key at https://aistudio.google.com/app/apikey + that the Generative Language API is enabled.');
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('[smoke] unexpected error:', e);
  process.exit(1);
});
