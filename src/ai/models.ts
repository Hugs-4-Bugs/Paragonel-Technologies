/**
 * models.ts — centralized Gemini model + API-key configuration (Defect 1 fix).
 *
 * ONE source of truth for the model id + key presence + provider-error
 * classification. All Genkit flows import GEMINI_MODEL_REF from here instead of
 * hardcoding 'googleai/gemini-1.5-flash-latest' (which Google sunset — the 1.5
 * family was retired; the current alias is gemini-flash-latest).
 *
 * Authoritative source: https://genkit.dev/docs/js/integrations/google-genai
 *   "The current auto-updating Flash alias is gemini-flash-latest."
 *   gemini-1.5-flash-latest is not listed / appears to predate this plugin
 *   generation — Google migrated affected models to Gemini 2.0 Flash by
 *   2025-09-24.
 *
 * The model is configurable via the server-side GEMINI_MODEL env var (default
 * gemini-flash-latest). The API key is NEVER exposed to the browser + NEVER
 * logged — only its presence is checked.
 */

export const GEMINI_PROVIDER = 'googleai';

/**
 * The model id (without the provider prefix). Configurable via GEMINI_MODEL so
 * the founder can pin to a specific GA model (e.g. gemini-2.0-flash) if their
 * key lacks access to the latest. Defaults to gemini-flash-latest (documented
 * current alias, auto-updates to stay current).
 */
export const GEMINI_MODEL_ID =
  (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) || 'gemini-flash-latest';

/** Full Genkit model reference (provider/model). Imported by every flow. */
export const GEMINI_MODEL_REF = `${GEMINI_PROVIDER}/${GEMINI_MODEL_ID}`;

/** Bounded request timeout (ms). Prevents the loading state from hanging
 *  forever if the provider stalls. Configurable; default 25s. */
export const GEMINI_REQUEST_TIMEOUT_MS =
  Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) > 0
    ? Number(process.env.GEMINI_REQUEST_TIMEOUT_MS)
    : 25000;

/** Is a Gemini API key present (non-empty)? Presence-only; never logs the value.
 *  GEMINI_API_KEY is primary; GOOGLE_API_KEY is a documented fallback. */
export function hasGeminiKey(): boolean {
  const k = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return typeof k === 'string' && k.trim().length > 0;
}

/** Honest fallback classification — distinguishes provider failures (retryable,
 *  HTTP 503) from a legitimate "I don't have verified info" answer (HTTP 200). */
export type FallbackReason =
  | 'missing_key' // no API key configured → 503
  | 'invalid_key' // 401/403 from provider → 503
  | 'unsupported_model' // 404 model not found/deprecated → 503
  | 'quota' // 429 rate limit / quota exhausted → 503
  | 'timeout' // request exceeded the bounded timeout → 503
  | 'invalid_output' // model returned null/malformed structured output → 503
  | 'provider_error' // other provider-side failure (5xx, network) → 503
  | 'unknown_company_fact'; // model successfully answered "I don't have verified
// info" for an unknown Paragonel fact → 200 (honest, not an error)

/** Is this fallback reason a retryable provider failure (→ HTTP 503)? */
export function isProviderFailure(reason: FallbackReason | undefined): boolean {
  return (
    reason !== undefined &&
    reason !== 'unknown_company_fact'
  );
}

/**
 * Classify a thrown provider/genkit error into a FallbackReason. Inspects the
 * error message + any status/code field. Never logs the key; uses only
 * non-sensitive signal text. Exported for unit testing.
 */
export function classifyProviderError(err: unknown): FallbackReason {
  if (!hasGeminiKey()) return 'missing_key';
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const status =
    (err as { status?: number; code?: number; cause?: { status?: number } })?.status ??
    (err as { status?: number; code?: number })?.code ??
    (err as { cause?: { status?: number } })?.cause?.status;

  // Order matters: most specific first.
  if (status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('does not exist') || msg.includes('not supported')) {
    return 'unsupported_model';
  }
  if (status === 401 || status === 403 || msg.includes('api key not valid') || msg.includes('api_key_not_valid') || msg.includes('permission_denied') || msg.includes('unauthorized') || msg.includes('forbidden')) {
    return 'invalid_key';
  }
  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('resource_exhausted') || msg.includes('resource has been exhausted')) {
    return 'quota';
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('deadline') || msg.includes('aborted') || msg.includes('cancelled') || msg.includes('canceled')) {
    return 'timeout';
  }
  if (msg.includes('api key not provided') || msg.includes('api_key not provided') || msg.includes('no api key')) {
    return 'missing_key';
  }
  return 'provider_error';
}

/** A short, safe, non-sensitive diagnostic label for a FallbackReason (for logs). */
export function reasonLabel(reason: FallbackReason | undefined): string {
  return reason ?? 'ok';
}
