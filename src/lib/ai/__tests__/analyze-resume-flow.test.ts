/**
 * analyze-resume-flow.test.ts — provider-unavailable handling for the resume
 * parser (Batch 2 Task 4).
 *
 * Verifies the parser fails CLOSED with a classified `ResumeAnalysisError`
 * when the Gemini key is absent (never calls the model, never fabricates an
 * extraction), and that the error carries its `reason` for honest surfacing.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { analyzeResume, ResumeAnalysisError } from '@/ai/flows/analyze-resume-flow';

const ORIG_GEMINI = process.env.GEMINI_API_KEY;
const ORIG_GOOGLE = process.env.GOOGLE_API_KEY;

afterEach(() => {
  if (ORIG_GEMINI === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = ORIG_GEMINI;
  if (ORIG_GOOGLE === undefined) delete process.env.GOOGLE_API_KEY;
  else process.env.GOOGLE_API_KEY = ORIG_GOOGLE;
});

describe('ResumeAnalysisError', () => {
  it('is an Error carrying the classified reason + name', () => {
    const e = new ResumeAnalysisError('timeout', 'timed out');
    expect(e).toBeInstanceOf(Error);
    expect(e.reason).toBe('timeout');
    expect(e.message).toBe('timed out');
    expect(e.name).toBe('ResumeAnalysisError');
  });
});

describe('analyzeResume — provider-unavailable fail-closed', () => {
  it('throws ResumeAnalysisError(missing_key) when no Gemini key is configured (never calls the model)', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    const p = analyzeResume({ rawText: 'Jane Doe — Engineer with 5 years of React.' });
    await expect(p).rejects.toBeInstanceOf(ResumeAnalysisError);
    await expect(p).rejects.toMatchObject({ reason: 'missing_key' });
  });

  it('does not fabricate an extraction on missing key (rejects, never resolves with a fake output)', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    let resolved = false;
    try {
      await analyzeResume({ rawText: 'x' });
      resolved = true;
    } catch {
      resolved = false;
    }
    expect(resolved).toBe(false);
  });
});
