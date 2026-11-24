/**
 * paragonel-ai-flow-mocked.test.ts — the model-SUCCESS path of paragonelAIFlow
 * (Prompt §8.5). The existing tests fast-fail at the missing-key gate; this file
 * mocks @/ai/genkit so ai.definePrompt returns a controllable callable, letting
 * us exercise the model-call try-block (paragonel-ai-flow.ts:386-471) for the
 * first time: grounded answer, unknown_company_fact, invalid_output, timeout,
 * quota, invalid_key, unsupported_model, citation validation, answer sanitization,
 * + no-secret-leak.
 *
 * NOT a live-Gemini verification (Prompt §8.6): mocks only.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { promptMock } = vi.hoisted(() => ({ promptMock: vi.fn() }));
vi.mock('@/ai/genkit', () => ({
  ai: { definePrompt: vi.fn(() => promptMock) },
}));

import { paragonelAIFlow } from '@/ai/flows/paragonel-ai-flow';
import type { ParagonelAIInput } from '@/ai/flows/paragonel-ai-flow';

const CTX = [
  {
    title: 'Paragonel — Company Overview',
    content: 'Paragonel Technologies is an engineering services company.',
    category: 'company',
    canonicalPath: '/about',
  },
];

const mkInput = (question: string): ParagonelAIInput => ({
  question,
  retrievedContext: CTX,
});

const qnaOutput = (answer: string, citations: { title: string; path: string }[] = [{ title: 'About', path: '/about' }]) => ({
  answer,
  citations,
  needsClarification: false,
  intent: 'qna' as const,
  enquiryCategory: null,
});

describe('paragonelAIFlow — model-success path (mocked Genkit)', () => {
  const origKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key-present'; // pass the hasGeminiKey gate
    promptMock.mockReset();
  });
  afterEach(() => {
    if (origKey !== undefined) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it('returns a grounded answer (intent=qna) with citations + no fallbackReason', async () => {
    promptMock.mockResolvedValue({
      output: qnaOutput('Paragonel is an engineering services company. [Learn more](/about)'),
    });
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.intent).toBe('qna');
    expect(out.answer).toContain('Paragonel');
    expect(out.citations).toEqual([{ title: 'About', path: '/about' }]);
    expect(out.fallbackReason).toBeUndefined();
    expect(out.needsClarification).toBe(false);
  });

  it('tags unknown_company_fact (the HTTP 200 honest path) when the model returns intent=fallback', async () => {
    promptMock.mockResolvedValue({
      output: {
        answer: "I don't have verified information about that yet.",
        citations: [{ title: 'Contact', path: '/contact' }],
        needsClarification: false,
        intent: 'fallback',
        enquiryCategory: null,
      },
    });
    const out = await paragonelAIFlow(mkInput('What is Paragonel secret roadmap?'));
    expect(out.intent).toBe('fallback');
    expect(out.fallbackReason).toBe('unknown_company_fact');
    expect(out.answer).toContain("don't have verified information");
  });

  it('returns invalid_output when the model returns null', async () => {
    promptMock.mockResolvedValue({ output: null });
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('invalid_output');
    expect(out.intent).toBe('fallback');
  });

  it('classifies a timeout error (the 25s race rejects)', async () => {
    promptMock.mockRejectedValue(new Error('Gemini request timed out after 25000ms'));
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('timeout');
  });

  it('classifies a quota error (429)', async () => {
    const e = new Error('rate limit exceeded');
    (e as { status?: number }).status = 429;
    promptMock.mockRejectedValue(e);
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('quota');
  });

  it('classifies an invalid-key error (401)', async () => {
    const e = new Error('API key not valid');
    (e as { status?: number }).status = 401;
    promptMock.mockRejectedValue(e);
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('invalid_key');
  });

  it('classifies an unsupported-model error (404)', async () => {
    const e = new Error('model not found');
    (e as { status?: number }).status = 404;
    promptMock.mockRejectedValue(e);
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('unsupported_model');
  });

  it('classifies a generic provider error (500)', async () => {
    const e = new Error('internal');
    (e as { status?: number }).status = 500;
    promptMock.mockRejectedValue(e);
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('provider_error');
  });

  it('validates citations — drops external URLs + protocol-relative, keeps internal paths', async () => {
    promptMock.mockResolvedValue({
      output: qnaOutput('See /about.', [
        { title: 'About', path: '/about' },
        { title: 'Evil', path: 'https://evil.com' },
        { title: 'Bad', path: '//evil.com' },
      ]),
    });
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.citations).toEqual([{ title: 'About', path: '/about' }]);
  });

  it('sanitizes the answer body — strips raw external URLs + invalid markdown links, keeps internal links', async () => {
    promptMock.mockResolvedValue({
      output: qnaOutput(
        'Visit https://evil.com or [click](https://evil.com) for more. See [about](/about).',
      ),
    });
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.answer).not.toContain('https://evil.com');
    expect(out.answer).toContain('[about](/about)');
  });

  it('never exposes the raw provider error / secrets in the answer', async () => {
    promptMock.mockRejectedValue(new Error('SECRET api_key=AIzaXYZ stack trace leak'));
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.answer).not.toContain('SECRET');
    expect(out.answer).not.toContain('AIzaXYZ');
    expect(out.fallbackReason).toBe('provider_error');
  });

  it('still fast-fails missing_key when no key is configured (Batch 13 contract preserved)', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
    const out = await paragonelAIFlow(mkInput('What does Paragonel do?'));
    expect(out.fallbackReason).toBe('missing_key');
    expect(promptMock).not.toHaveBeenCalled(); // never reached the model call
  });
});
