/**
 * POST /api/newsletter — secure server-side newsletter subscription (Phase 1B + Phase 7).
 *
 * Flow: input validation -> honeypot -> rate limit -> duplicate check against
 *       existing active subscribers (Firestore Admin SDK) -> store -> send a
 *       branded confirmation email with a one-click unsubscribe link.
 *
 * Phase 7 changes: a branded confirmation email is now sent immediately after
 * the subscription is stored (previously "No email is sent"). The email includes
 * a signed one-click unsubscribe link bound to the subscriber's address. The
 * email status (sent/skipped/failed) is recorded on the subscriber document for
 * diagnosis; a failed email NEVER discards the stored subscription.
 *
 * Suppression: the duplicate check refuses a re-subscribe while an ACTIVE
 * subscription exists (deletedAt == null). The unsubscribe route sets deletedAt,
 * which any future campaign send MUST filter on (campaign send is not yet built).
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
import { sendNewsletterConfirmation } from '@/lib/email';
import { newsletterUnsubscribeUrl } from '@/lib/newsletter/unsubscribe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Honeypot.
  if (typeof body === 'object' && body && 'website' in body && (body as { website?: string }).website) {
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

  let ref;
  try {
    ref = await db.collection('newsletterSubscribers').add({
      email: data.email,
      source: 'Website Footer',
      subscribedAt: new Date(),
      deletedAt: null,
    });
  } catch (err) {
    console.error('[newsletter] store failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not store subscription.' }, { status: 500 });
  }

  // Send the branded confirmation email with a one-click unsubscribe link.
  // Best-effort: a failed email never discards the stored subscription. The
  // status is recorded on the subscriber doc for diagnosis/retry.
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const unsubUrl = newsletterUnsubscribeUrl(data.email, baseUrl);
  const confirmation = await sendNewsletterConfirmation({
    to: data.email,
    unsubscribeUrl: unsubUrl,
  });
  try {
    await ref.update({
      confirmationEmail: { status: confirmation.status, detail: confirmation.detail || null, at: new Date() },
    });
  } catch {
    // Non-fatal: the subscription is already stored; this is diagnostic only.
  }

  return NextResponse.json(
    { success: true, notification: confirmation.status },
    { status: 201 }
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
