/**
 * route-helpers.ts — small shared helpers for auth API routes.
 */
import { NextResponse } from 'next/server';
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

/** Map a password policy error code to an HTTP 400 response. */
export function passwordPolicyResponse(err: PasswordPolicyError) {
  return jsonError(400, passwordPolicyMessage(err));
}

/** Is the request over HTTPS? Drives the cookie `secure` flag. */
export function isSecureRequest(request: Request): boolean {
  return request.url.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https';
}
