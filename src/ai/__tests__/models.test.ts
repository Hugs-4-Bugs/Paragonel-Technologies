/**
 * models.test.ts — Gemini key presence + model/timeout resolution (Batch 5 Task 2).
 *
 * The fail-closed contract: when no Gemini key is configured, hasGeminiKey()
 * returns false → the chat route returns an honest classified 503 + the resume
 * parser throws ResumeAnalysisError('missing_key') (resume stored, parse
 * skipped). This test locks that contract + the model/timeout defaults.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('hasGeminiKey (fail-closed)', () => {
  const origGemini = process.env.GEMINI_API_KEY;
  const origGoogle = process.env.GOOGLE_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  afterEach(() => {
    if (origGemini !== undefined) process.env.GEMINI_API_KEY = origGemini;
    else delete process.env.GEMINI_API_KEY;
    if (origGoogle !== undefined) process.env.GOOGLE_API_KEY = origGoogle;
    else delete process.env.GOOGLE_API_KEY;
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

  it('prefers GEMINI_API_KEY when both are set (both satisfy presence)', async () => {
    process.env.GEMINI_API_KEY = 'primary';
    process.env.GOOGLE_API_KEY = 'fallback';
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
