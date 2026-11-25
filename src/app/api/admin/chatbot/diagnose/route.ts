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
} from '@/ai/models';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      ? 'A Gemini API key is present. If /api/chat still returns 503, check the fallbackReason field (invalid_key = bad/expired key value, quota = rate limit exhausted, unsupported_model = key lacks access to gemini-flash-latest, timeout = provider stalled).'
      : 'NO Gemini API key is present (all accepted env-var names are empty/whitespace). Set a valid GOOGLE_API_KEY (or GEMINI_API_KEY) value in Vercel. The chatbot returns missing_key 503 until then.',
  });
}
