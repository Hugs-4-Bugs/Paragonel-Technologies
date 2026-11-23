/**
 * route-helpers.ts — small shared helpers for auth API routes.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { PasswordPolicyError } from './password';
import { passwordPolicyMessage } from './password';

/** Extract the client IP from a Next.js Request (x-forwarded-for or x-real-ip). */
export function getClientIp(request: Request): string | undefined {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return undefined;
}

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

/**
 * Parse + validate a JSON request body against a zod schema. Consolidates the
 * `try { await request.json() } catch { 400 }` + `schema.safeParse(body)`
 * pattern duplicated across routes. Returns a ready 400 response on a malformed
 * body or a schema violation (issues surfaced as human-readable messages, never
 * as raw internals). Never throws.
 */
export async function validateRequestBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<
  | { ok: true; data: z.infer<S> }
  | { ok: false; response: NextResponse }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Map a password policy error code to an HTTP 400 response. */
export function passwordPolicyResponse(err: PasswordPolicyError) {
  return jsonError(400, passwordPolicyMessage(err));
}

/** Is the request over HTTPS? Drives the cookie `secure` flag. */
export function isSecureRequest(request: Request): boolean {
  return request.url.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https';
}
