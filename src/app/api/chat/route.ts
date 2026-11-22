/**
 * POST /api/chat — Paragonel AI knowledge assistant endpoint (Prompt 05O §5–10).
 *
 * Flow: validate body → rate limit → retrieve knowledge → call grounded flow →
 *       return answer + citations + sessionId.
 *
 * Security (hardened on the 05N baseline):
 *   - Zod validation (message length, history bounds, sessionId format).
 *   - Rate limiting per client (reuses submission-security; in-memory,
 *     process-local — documented limitation on stateless multi-instance deploys).
 *   - Server-generated sessionId (the visitor can send one back for continuity;
 *     the server does NOT store conversations — history is sent by the client,
 *     so there is no server-side retention or cross-visitor leak).
 *   - Prompt-injection defense: the flow sanitizes untrusted content (retrieved
 *     + visitor message) and the system prompt instructs the model to treat
 *     them as data, not instructions.
 *   - Safe error messages (no stack traces, secrets, or internal config).
 *   - The model API key (GEMINI_API_KEY) stays server-side (Genkit plugin);
 *     it is never imported into client code or returned in responses.
 *
 * Conversation context + retention (§7):
 *   - The client sends the last ≤8 turns as `history`. The server does not
 *     persist conversations — no Firestore, no cookies, no server-side session
 *     store for chat. The sessionId is a stateless correlation handle the
 *     client keeps; it carries no PII and is not stored server-side.
 *   - Raw visitor messages are NOT logged (only short non-sensitive error
 *     codes are logged on failure). No persistent visitor profiling.
 *
 * Status codes: 200 ok, 400 invalid, 429 rate-limited, 503 service unavailable.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomHex } from '@/lib/auth/crypto-utils';
import { getClientId, checkRateLimit } from '@/lib/submission-security';
import { getKnowledgeBase, retrieve, sanitizeUntrusted } from '@/lib/ai/knowledge-retrieval';
import { paragonelAIFlow } from '@/ai/flows/paragonel-ai-flow';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message too long (max 2000 characters)'),
  sessionId: z
    .string()
    .regex(/^[a-f0-9]{1,64}$/i, 'Invalid session id')
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      }),
    )
    .max(8, 'Too many history turns')
    .optional(),
});

export async function POST(request: Request) {
  // 1. Parse + validate.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const { message, history } = parsed.data;
  const sessionId = parsed.data.sessionId || randomHex(16);

  // 2. Rate limit (per client; in-memory, process-local — see §10 limitation note).
  const clientId = getClientId(request);
  const rl = checkRateLimit('chat', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // 3. Retrieve relevant knowledge (server-side, pub/perm-filtered).
  let retrieved: ReturnType<typeof retrieve> = [];
  try {
    const base = await getKnowledgeBase();
    retrieved = retrieve(message, base, 5);
  } catch (err) {
    console.error('[chat] knowledge retrieval failed:', err instanceof Error ? err.message : 'unknown');
    // Continue with empty context — the flow returns a safe fallback.
  }

  // 4. Call the grounded flow (handles provider timeout/quota/fallback).
  try {
    const result = await paragonelAIFlow({
      question: message,
      history: history?.map((t) => ({ role: t.role, content: t.content })),
      retrievedContext: retrieved.map((r) => ({
        title: r.entry.title,
        content: r.entry.content,
        category: r.entry.category,
        canonicalPath: r.entry.canonicalPath,
      })),
    });

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      needsClarification: result.needsClarification,
      sessionId,
    });
  } catch (err) {
    // The flow has its own fallback, but guard the route too (never expose internals).
    console.error('[chat] flow failed:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json(
      {
        answer: "I'm having trouble responding right now. Please try again in a moment, or reach the Paragonel team via the Contact page.",
        citations: [{ title: 'Contact Paragonel', path: '/contact' }],
        needsClarification: false,
        sessionId,
      },
      { status: 200 }, // 200 with a fallback answer — the UI shows the message, not an error.
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
