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
import { getKnowledgeBase, retrieve } from '@/lib/ai/knowledge-retrieval';
import { paragonelAIFlow } from '@/ai/flows/paragonel-ai-flow';
import { ENQUIRY_CATEGORIES } from '@/lib/ai/lead-qualification';
import { isProviderFailure } from '@/ai/models';
import { redactReason } from '@/lib/job-alerts/dedup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Bounded platform timeout. The in-process Gemini race
// (GEMINI_REQUEST_TIMEOUT_MS, 25s) fires first + returns a classified 503; this
// is the platform-level backstop so a stalled provider cannot hold the
// function until the deploy-region default.
export const maxDuration = 30;

const CapturedFieldsSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().max(254).optional(),
  company: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  businessProblem: z.string().max(2000).optional(),
  requiredService: z.string().max(500).optional(),
  projectDescription: z.string().max(2000).optional(),
  scope: z.string().max(1000).optional(),
  budget: z.string().max(200).optional(),
  timeline: z.string().max(200).optional(),
  preferredContact: z.string().max(100).optional(),
  additionalInfo: z.string().max(2000).optional(),
});

const QualificationStateSchema = z.object({
  active: z.boolean(),
  category: z.enum(ENQUIRY_CATEGORIES).nullable(),
  captured: CapturedFieldsSchema.default({}),
  stage: z.enum(['collecting', 'reviewing', 'submitted', 'cancelled']),
});

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
  qualificationState: QualificationStateSchema.optional(),
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
  const { message, history, qualificationState } = parsed.data;
  const sessionId = parsed.data.sessionId || randomHex(16);
  // Server-generated correlation ID — threaded through the flow (logging) +
  // returned to the client so a failed chat can be matched to a server log
  // entry. NEVER derived from the message/PII (it is an opaque server UUID).
  const correlationId = randomHex(16);
  console.log(`[chat] cid=${correlationId} session=${sessionId} q_len=${message.length}`);

  // 2. Rate limit (per client; in-memory, process-local — see §10 limitation note).
  const clientId = getClientId(request);
  const rl = checkRateLimit('chat', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Please slow down and try again shortly.', correlationId },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // 3. Retrieve relevant knowledge (server-side, pub/perm-filtered).
  let retrieved: ReturnType<typeof retrieve> = [];
  try {
    const base = await getKnowledgeBase();
    retrieved = retrieve(message, base, 5);
  } catch (err) {
    console.error('[chat] knowledge retrieval failed:', redactReason(err));
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
      qualificationState,
    }, { correlationId });

    // Honest HTTP status: a provider failure (missing/invalid key, unsupported
    // model, quota, timeout) is a retryable 503 — the UI shows the message +
    // a Retry button. An honest "I don't have verified info" answer (model
    // returned intent=fallback for an unknown Paragonel fact) is a 200 — a
    // legitimate answer, not an error. Never disguise provider failure as a
    // successful AI answer. The correlationId is returned so a failed chat can
    // be matched to the server log entry ([chat] cid=… / logChatDiagnostics).
    const isFailure = isProviderFailure(result.fallbackReason);
    return NextResponse.json(
      {
        answer: result.answer,
        citations: result.citations,
        needsClarification: result.needsClarification,
        intent: result.intent,
        enquiryCategory: result.enquiryCategory,
        capturedFields: result.capturedFields,
        readyForReview: result.readyForReview,
        fallbackReason: result.fallbackReason,
        retryable: isFailure,
        sessionId,
        correlationId,
      },
      { status: isFailure ? 503 : 200 },
    );
  } catch (err) {
    // Unexpected route-level error (never expose internals/stack/credentials).
    // Non-sensitive signal only; the flow's own classification handles the
    // common provider failures above.
    console.error(`[chat] cid=${correlationId} route error:`, redactReason(err));
    return NextResponse.json(
      {
        answer: "I'm having trouble responding right now. Please try again in a moment, or reach the Paragonel team via the Contact page.",
        citations: [{ title: 'Contact Paragonel', path: '/contact' }],
        needsClarification: false,
        intent: 'fallback',
        enquiryCategory: null,
        fallbackReason: 'provider_error',
        retryable: true,
        sessionId,
        correlationId,
      },
      { status: 503 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
