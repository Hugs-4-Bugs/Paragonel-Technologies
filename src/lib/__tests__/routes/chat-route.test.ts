/**
 * chat-route.test.ts — POST /api/chat (Prompt §8.5). Locks the route's 503-vs-200
 * classification, fallbackReason propagation, retryable flag, + 400 on bad body.
 * Mocks the flow + knowledge retrieval (no live Gemini, no Firestore).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { flowMock } = vi.hoisted(() => ({ flowMock: vi.fn() }));
vi.mock('@/ai/flows/paragonel-ai-flow', () => ({
  paragonelAIFlow: flowMock,
}));
vi.mock('@/lib/ai/knowledge-retrieval', () => ({
  getKnowledgeBase: vi.fn().mockResolvedValue([]),
  retrieve: vi.fn().mockReturnValue([]),
}));

import { POST } from '@/app/api/chat/route';
import type { ParagonelAIOutput } from '@/ai/flows/paragonel-ai-flow';

const okOutput = (answer: string): ParagonelAIOutput => ({
  answer,
  citations: [{ title: 'About', path: '/about' }],
  needsClarification: false,
  intent: 'qna',
  enquiryCategory: null,
});

const fallbackOutput = (reason: NonNullable<ParagonelAIOutput['fallbackReason']>): ParagonelAIOutput => ({
  answer: 'fallback message',
  citations: [{ title: 'Contact', path: '/contact' }],
  needsClarification: false,
  intent: 'fallback',
  enquiryCategory: null,
  fallbackReason: reason,
});

function chatReq(body: unknown): Request {
  return new Request('https://paragonel.example.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/chat (mocked flow)', () => {
  beforeEach(() => {
    flowMock.mockReset();
  });

  it('200 + answer when the flow returns a grounded qna answer', async () => {
    flowMock.mockResolvedValue(okOutput('Paragonel is an engineering services company.'));
    const res = await POST(chatReq({ message: 'What does Paragonel do?' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer).toContain('Paragonel');
    expect(data.intent).toBe('qna');
    expect(data.retryable).toBe(false);
    expect(data.fallbackReason).toBeUndefined();
  });

  it('200 + retryable:false when the flow returns unknown_company_fact (honest, not an error)', async () => {
    flowMock.mockResolvedValue(fallbackOutput('unknown_company_fact'));
    const res = await POST(chatReq({ message: 'What is the secret roadmap?' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallbackReason).toBe('unknown_company_fact');
    expect(data.retryable).toBe(false);
  });

  it('503 + retryable:true for a missing_key provider failure', async () => {
    flowMock.mockResolvedValue(fallbackOutput('missing_key'));
    const res = await POST(chatReq({ message: 'What does Paragonel do?' }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.fallbackReason).toBe('missing_key');
    expect(data.retryable).toBe(true);
  });

  it('503 + retryable:true for a timeout', async () => {
    flowMock.mockResolvedValue(fallbackOutput('timeout'));
    const res = await POST(chatReq({ message: 'What does Paragonel do?' }));
    expect(res.status).toBe(503);
    expect((await res.json()).fallbackReason).toBe('timeout');
  });

  it('503 for quota / invalid_key / unsupported_model / provider_error / invalid_output', async () => {
    for (const reason of ['quota', 'invalid_key', 'unsupported_model', 'provider_error', 'invalid_output'] as const) {
      flowMock.mockResolvedValue(fallbackOutput(reason));
      const res = await POST(chatReq({ message: 'q' }));
      expect(res.status).toBe(503);
      expect((await res.json()).fallbackReason).toBe(reason);
    }
  });

  it('400 on an invalid body (empty message)', async () => {
    const res = await POST(chatReq({ message: '' }));
    expect(res.status).toBe(400);
  });

  it('400 on invalid JSON', async () => {
    const res = await POST(chatReq('{not json'));
    expect(res.status).toBe(400);
  });

  it('propagates sessionId + generates one when absent', async () => {
    flowMock.mockResolvedValue(okOutput('answer'));
    const res = await POST(chatReq({ message: 'hi', sessionId: 'abc123' }));
    const data = await res.json();
    expect(data.sessionId).toBe('abc123');
  });
});
