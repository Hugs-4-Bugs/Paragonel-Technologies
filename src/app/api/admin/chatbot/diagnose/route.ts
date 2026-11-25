/**
 * GET /api/admin/chatbot/diagnose — runtime chatbot configuration diagnostic.
 *
 * Returns the chatbot's provider configuration state so an operator can verify
 * WHY the chatbot may be returning 503 fallbacks — WITHOUT ever exposing the
 * API key value. Returns: which env-var names are accepted, whether a key is
 * present (boolean only), the model id/ref, the bounded timeout, + the provider.
 *
 * Security:
 *   - Admin-only (verifyAdminPermission('security.audit') — super_admin/admin).
 *   - NEVER returns the key value, hash, or any substring of it.
 *   - presence-only (hasGeminiKey) so an operator can distinguish "key not set"
 *     from "key set but invalid/quota-exhausted" (the latter shows up as
 *     invalid_key/quota in the /api/chat 503 fallbackReason).
 */
import { NextResponse } from 'next/server';
import { verifyAdminPermission } from '@/lib/admin-auth';
import {
  GEMINI_PROVIDER,
  GEMINI_MODEL_ID,
  GEMINI_MODEL_REF,
  GEMINI_REQUEST_TIMEOUT_MS,
  hasGeminiKey,
  classifyProviderError,
} from '@/ai/models';
import { ai } from '@/ai/genkit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// A live provider ping can take a few seconds; allow up to 60s on Vercel Pro.
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = await verifyAdminPermission(request, 'security.audit.read');
  if (!auth.ok) {
    return auth.response;
  }

  // Presence-only checks. The key VALUE is never read, logged, or returned.
  const keyPresent = hasGeminiKey();
  const envVarsAccepted = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY'];
  // Which accepted env-var names are actually set (presence only — boolean per
  // name, never the value). Helps an operator see WHICH name the deployment
  // used without revealing the value.
  const envVarPresence: Record<string, boolean> = {};
  for (const name of envVarsAccepted) {
    const v = process.env[name];
    envVarPresence[name] = typeof v === 'string' && v.trim().length > 0;
  }

  return NextResponse.json({
    provider: GEMINI_PROVIDER,
    modelId: GEMINI_MODEL_ID,
    modelRef: GEMINI_MODEL_REF,
    requestTimeoutMs: GEMINI_REQUEST_TIMEOUT_MS,
    keyPresent, // boolean only — never the value
    envVarsAccepted,
    envVarPresence, // boolean per name — never the value
    diagnosis: keyPresent
      ? 'A Gemini API key is present. Run POST /api/admin/chatbot/diagnose to make a live provider call + verify the key value + model access. If /api/chat still returns 503, check the fallbackReason field (invalid_key = bad/expired key value, quota = rate limit exhausted, unsupported_model = key lacks access to gemini-flash-latest, timeout = provider stalled).'
      : 'NO Gemini API key is present (all accepted env-var names are empty/whitespace). Set a valid GOOGLE_API_KEY (or GEMINI_API_KEY) value in Vercel. The chatbot returns missing_key 503 until then.',
  });
}

/**
 * POST /api/admin/chatbot/diagnose — LIVE provider self-test.
 *
 * Makes a minimal, real Gemini call (a trivial prompt) with the configured
 * model + the runtime key, + returns: callSucceeded, responseSnippet (first
 * 120 chars of the model output — safe, model-generated text), errorCategory
 * (classifyProviderError), httpStatus where available, durationMs, + a
 * plain-English diagnosis. This is the ONLY way to verify end-to-end that the
 * chatbot can reach the provider + the model is accessible with the deployed
 * key — presence checks (GET) cannot distinguish a valid key from an
 * invalid/quota-exhausted one.
 *
 * Security:
 *   - Admin-only (verifyAdminPermission 'security.audit.read').
 *   - NEVER logs/returns the key value. Only the boolean outcome + the
 *     model-generated response snippet (a trivial echo, no PII).
 *   - The prompt is a fixed, non-sensitive string ("Reply with the single
 *     word: PONG") — no visitor data, no knowledge base.
 */
export async function POST(request: Request) {
  const auth = await verifyAdminPermission(request, 'security.audit.read');
  if (!auth.ok) return auth.response;

  if (!hasGeminiKey()) {
    return NextResponse.json({
      callSucceeded: false,
      errorCategory: 'missing_key',
      diagnosis: 'No Gemini API key is present. Set GOOGLE_API_KEY (or GEMINI_API_KEY) in the server environment before running the self-test.',
    }, { status: 200 });
  }

  const startedAt = Date.now();
  const timeoutMs = Math.min(GEMINI_REQUEST_TIMEOUT_MS, 20000); // cap the self-test at 20s
  try {
    // Minimal live call — uses the SAME Genkit ai instance + model ref as the
    // chatbot flow, so a success here proves the chatbot's provider path works.
    const resultPromise = ai.generate({
      model: GEMINI_MODEL_REF,
      prompt: 'Reply with exactly the single word: PONG',
      config: { temperature: 0, maxOutputTokens: 16 },
    });
    const timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Self-test timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    const result = await Promise.race([resultPromise, timeoutPromise]).catch(() => undefined) ?? undefined;
    // The race may reject — handle both cases explicitly.
    let timedOut = false;
    try {
      await Promise.race([
        Promise.resolve(result).then(() => {}),
        timeoutPromise,
      ]);
    } catch {
      timedOut = true;
    }
    const durationMs = Date.now() - startedAt;

    if (timedOut || !result) {
      return NextResponse.json({
        callSucceeded: false,
        errorCategory: 'timeout',
        durationMs,
        diagnosis: `The provider did not respond within ${timeoutMs}ms. This is consistent with a network egress block, a Vercel function timeout (Hobby caps at 10s — use Pro), or a stalled provider. The chatbot would return a 503 timeout fallback.`,
      }, { status: 200 });
    }

    const text = (result.text ?? '').slice(0, 120);
    return NextResponse.json({
      callSucceeded: true,
      responseSnippet: text || '(empty response)',
      modelId: GEMINI_MODEL_ID,
      durationMs,
      diagnosis: 'The provider returned a valid response. The chatbot provider path (Genkit → google-genai → Gemini) is operational. If /api/chat still 503s, the issue is in the flow\'s structured-output parsing or knowledge retrieval — check the [chat] cid=… logs.',
    }, { status: 200 });
  } catch (err) {
    const category = classifyProviderError(err);
    const status =
      (err as { status?: number; code?: number; cause?: { status?: number } })?.status ??
      (err as { code?: number })?.code ??
      (err as { cause?: { status?: number } })?.cause?.status;
    const durationMs = Date.now() - startedAt;
    return NextResponse.json({
      callSucceeded: false,
      errorCategory: category,
      httpStatus: status,
      durationMs,
      errorSignal: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      diagnosis:
        category === 'unsupported_model' ? `The configured model '${GEMINI_MODEL_ID}' is not accessible with this key. Set GEMINI_MODEL=gemini-2.0-flash-001 (a stable GA model) in Vercel + redeploy, OR use a key with access to gemini-flash-latest.` :
        category === 'invalid_key' ? 'The API key value is invalid/expired, or lacks permission. Generate a fresh key at Google AI Studio + update the GOOGLE_API_KEY value in Vercel.' :
        category === 'quota' ? 'The API key has exhausted its quota / hit a rate limit. Wait for the quota to reset, or enable billing on the Google AI project.' :
        category === 'timeout' ? `The provider call timed out after ${durationMs}ms. Check network egress + the Vercel function timeout (Hobby caps at 10s).` :
        'An unexpected provider error occurred. See errorSignal for the non-sensitive classification. Check the Vercel runtime logs.',
    }, { status: 200 });
  }
}
