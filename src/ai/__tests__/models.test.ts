/**
 * models.test.ts — Gemini key presence + model/timeout resolution (Batch 5 Task 2).
 *
 * The fail-closed contract: when no Gemini key is configured, hasGeminiKey()
 * returns false → the chat route returns an honest classified 503 + the resume
 * parser throws ResumeAnalysisError('missing_key') (resume stored, parse
 * skipped). This test locks that contract + the model/timeout defaults +
 * the three accepted env-var names (GEMINI_API_KEY, GOOGLE_API_KEY,
 * GOOGLE_GENAI_API_KEY — the last is the Genkit plugin's third accepted name;
 * the gate must accept it so a deployment setting only that name does not
 * fast-fail with 'missing_key').
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('hasGeminiKey (fail-closed)', () => {
  const origGemini = process.env.GEMINI_API_KEY;
  const origGoogle = process.env.GOOGLE_API_KEY;
  const origGenai = process.env.GOOGLE_GENAI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
  });

  afterEach(() => {
    if (origGemini !== undefined) process.env.GEMINI_API_KEY = origGemini;
    else delete process.env.GEMINI_API_KEY;
    if (origGoogle !== undefined) process.env.GOOGLE_API_KEY = origGoogle;
    else delete process.env.GOOGLE_API_KEY;
    if (origGenai !== undefined) process.env.GOOGLE_GENAI_API_KEY = origGenai;
    else delete process.env.GOOGLE_GENAI_API_KEY;
  });

  it('returns false when no key is configured (fail-closed)', async () => {
    const { hasGeminiKey } = await import('../models');
    expect(hasGeminiKey()).toBe(false);
  });

  it('returns false for a whitespace-only key (fail-closed)', async () => {
    process.env.GEMINI_API_KEY = '   ';
    const { hasGeminiKey } = await import('../models');
    expect(hasGeminiKey()).toBe(false);
  });

  it('returns true when GEMINI_API_KEY is present', async () => {
    process.env.GEMINI_API_KEY = 'test-key-present';
    const { hasGeminiKey } = await import('../models');
    expect(hasGeminiKey()).toBe(true);
  });

  it('returns true via the GOOGLE_API_KEY fallback when GEMINI_API_KEY is unset', async () => {
    process.env.GOOGLE_API_KEY = 'google-key-present';
    const { hasGeminiKey } = await import('../models');
    expect(hasGeminiKey()).toBe(true);
  });

  it('returns true via GOOGLE_GENAI_API_KEY (Genkit plugin accepts it; the gate must too)', async () => {
    // Closes the Paragonel-AI outage: a deployment setting ONLY
    // GOOGLE_GENAI_API_KEY would pass the plugin's key resolution but fail the
    // gate → fast-fail 'missing_key' → the "knowledge service" error.
    process.env.GOOGLE_GENAI_API_KEY = 'genai-key-present';
    const { hasGeminiKey } = await import('../models');
    expect(hasGeminiKey()).toBe(true);
  });

  it('prefers GEMINI_API_KEY when all three are set (all satisfy presence)', async () => {
    process.env.GEMINI_API_KEY = 'primary';
    process.env.GOOGLE_API_KEY = 'fallback';
    process.env.GOOGLE_GENAI_API_KEY = 'genai';
    const { hasGeminiKey } = await import('../models');
    expect(hasGeminiKey()).toBe(true);
  });
});

describe('GEMINI_MODEL_ID + GEMINI_REQUEST_TIMEOUT_MS resolution', () => {
  const origModel = process.env.GEMINI_MODEL;
  const origTimeout = process.env.GEMINI_REQUEST_TIMEOUT_MS;

  afterEach(() => {
    vi.resetModules();
    if (origModel !== undefined) process.env.GEMINI_MODEL = origModel;
    else delete process.env.GEMINI_MODEL;
    if (origTimeout !== undefined) process.env.GEMINI_REQUEST_TIMEOUT_MS = origTimeout;
    else delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
  });

  it('GEMINI_MODEL_ID defaults to gemini-flash-latest when unset', async () => {
    delete process.env.GEMINI_MODEL;
    const { GEMINI_MODEL_ID } = await import('../models');
    expect(GEMINI_MODEL_ID).toBe('gemini-flash-latest');
  });

  it('GEMINI_MODEL_ID respects the env var (trimmed)', async () => {
    process.env.GEMINI_MODEL = '  gemini-2.0-flash  ';
    const { GEMINI_MODEL_ID } = await import('../models');
    expect(GEMINI_MODEL_ID).toBe('gemini-2.0-flash');
  });

  it('GEMINI_REQUEST_TIMEOUT_MS defaults to 25000 when unset', async () => {
    delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
    const { GEMINI_REQUEST_TIMEOUT_MS } = await import('../models');
    expect(GEMINI_REQUEST_TIMEOUT_MS).toBe(25000);
  });

  it('GEMINI_REQUEST_TIMEOUT_MS respects a positive env value', async () => {
    process.env.GEMINI_REQUEST_TIMEOUT_MS = '15000';
    const { GEMINI_REQUEST_TIMEOUT_MS } = await import('../models');
    expect(GEMINI_REQUEST_TIMEOUT_MS).toBe(15000);
  });

  it('GEMINI_REQUEST_TIMEOUT_MS falls back to 25000 for a non-positive value', async () => {
    process.env.GEMINI_REQUEST_TIMEOUT_MS = '0';
    const { GEMINI_REQUEST_TIMEOUT_MS } = await import('../models');
    expect(GEMINI_REQUEST_TIMEOUT_MS).toBe(25000);
  });

  it('GEMINI_MODEL_REF is provider/model', async () => {
    delete process.env.GEMINI_MODEL;
    const { GEMINI_MODEL_REF, GEMINI_PROVIDER } = await import('../models');
    expect(GEMINI_PROVIDER).toBe('googleai');
    expect(GEMINI_MODEL_REF).toBe('googleai/gemini-flash-latest');
  });
});

describe('classifyProviderError — honest provider-error classification', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
  });

  it('returns missing_key when no key is configured (even if the error is unrelated)', async () => {
    const { classifyProviderError } = await import('../models');
    expect(classifyProviderError(new Error('anything'))).toBe('missing_key');
  });

  it('classifies a 404 / "not found" as unsupported_model (sunset model detection)', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const { classifyProviderError } = await import('../models');
    expect(classifyProviderError(Object.assign(new Error('model not found'), { status: 404 }))).toBe('unsupported_model');
    expect(classifyProviderError(new Error('404 not found'))).toBe('unsupported_model');
    expect(classifyProviderError(new Error('does not exist'))).toBe('unsupported_model');
  });

  it('classifies 401/403 / "api key not valid" as invalid_key', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const { classifyProviderError } = await import('../models');
    expect(classifyProviderError(Object.assign(new Error('bad'), { status: 401 }))).toBe('invalid_key');
    expect(classifyProviderError(Object.assign(new Error('bad'), { status: 403 }))).toBe('invalid_key');
    expect(classifyProviderError(new Error('API key not valid'))).toBe('invalid_key');
    expect(classifyProviderError(new Error('permission_denied'))).toBe('invalid_key');
  });

  it('classifies 429 / "quota" as quota', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const { classifyProviderError } = await import('../models');
    expect(classifyProviderError(Object.assign(new Error('bad'), { status: 429 }))).toBe('quota');
    expect(classifyProviderError(new Error('resource_exhausted'))).toBe('quota');
    expect(classifyProviderError(new Error('rate limit exceeded'))).toBe('quota');
  });

  it('classifies timeout-like messages as timeout', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const { classifyProviderError } = await import('../models');
    expect(classifyProviderError(new Error('request timed out'))).toBe('timeout');
    expect(classifyProviderError(new Error('deadline exceeded'))).toBe('timeout');
    expect(classifyProviderError(new Error('aborted'))).toBe('timeout');
  });

  it('falls back to provider_error for unknown 5xx/network errors', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';
    const { classifyProviderError } = await import('../models');
    expect(classifyProviderError(new Error('internal server error'))).toBe('provider_error');
    expect(classifyProviderError(Object.assign(new Error('oops'), { status: 500 }))).toBe('provider_error');
  });

  it('NEVER exposes the key value in the classification output (reason label only)', async () => {
    process.env.GOOGLE_API_KEY = 'AIza-NEVER_LEAK_THIS_SECRET';
    const { classifyProviderError } = await import('../models');
    const reason = classifyProviderError(new Error('some error'));
    expect(typeof reason).toBe('string');
    expect(reason).not.toContain('NEVER_LEAK');
    expect(reason).not.toContain('AIza');
  });
});

describe('isProviderFailure + reasonLabel', () => {
  it('treats all provider failures as retryable EXCEPT unknown_company_fact (honest 200 answer)', async () => {
    const { isProviderFailure } = await import('../models');
    const failures = ['missing_key', 'invalid_key', 'unsupported_model', 'quota', 'timeout', 'invalid_output', 'provider_error'] as const;
    for (const f of failures) expect(isProviderFailure(f)).toBe(true);
    expect(isProviderFailure('unknown_company_fact')).toBe(false);
    expect(isProviderFailure(undefined)).toBe(false);
  });

  it('reasonLabel returns the reason or "ok"', async () => {
    const { reasonLabel } = await import('../models');
    expect(reasonLabel('quota')).toBe('quota');
    expect(reasonLabel(undefined)).toBe('ok');
  });
});
