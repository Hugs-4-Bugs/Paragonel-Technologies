/**
 * POST /api/newsletter — secure server-side newsletter subscription (Phase 1B).
 *
 * Flow: input validation -> honeypot -> rate limit -> duplicate check against
 *       existing subscribers (Firestore Admin SDK) -> store.
 *
 * No email is sent (no established requirement for newsletter confirmation
 * email). The browser never writes to Firestore directly. Field set matches the
 * existing admin /admin/newsletter CRM (email, source, subscribedAt) plus a
 * deletedAt soft-delete flag.
 *
 * Status codes: 201 subscribed, 400 invalid, 409 already subscribed,
 *               429 rate-limited, 503 admin SDK not configured.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  newsletterSchema,
  getClientId,
  checkRateLimit,
} from '@/lib/submission-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Honeypot.
  if (typeof body === 'object' && body && 'website' in body && (body as any).website) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const clientId = getClientId(request);
  const rl = checkRateLimit('newsletter', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Subscription service unavailable.' }, { status: 503 });
  }

  // Duplicate check: existing active subscriber with the same email.
  try {
    const existing = await db
      .collection('newsletterSubscribers')
      .where('email', '==', data.email)
      .limit(1)
      .get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      const d = doc.data();
      if (d && d.deletedAt == null) {
        return NextResponse.json(
          { error: 'You are already subscribed.' },
          { status: 409 }
        );
      }
    }
  } catch (err) {
    console.error('[newsletter] dup-check failed:', err instanceof Error ? err.message : err);
    // Fail closed on uncertain state to avoid duplicates; surface 500.
    return NextResponse.json({ error: 'Could not verify subscription.' }, { status: 500 });
  }

  try {
    await db.collection('newsletterSubscribers').add({
      email: data.email,
      source: 'Website Footer',
      subscribedAt: new Date(),
      deletedAt: null,
    });
  } catch (err) {
    console.error('[newsletter] store failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not store subscription.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
