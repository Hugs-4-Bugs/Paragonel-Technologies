/**
 * POST /api/newsletter — secure server-side newsletter subscription with double
 * opt-in (Batch 2 Task 5).
 *
 * Flow: input validation -> honeypot -> rate limit -> TRANSACTIONAL duplicate
 *       check + create as 'pending' -> send a signed confirmation email with a
 *       one-click confirm link (and an unsubscribe link) -> record email status.
 *
 * Double opt-in: the subscriber is created with `status:'pending'` and a
 * confirmation email is sent carrying an HMAC-signed confirm link
 * (`/api/newsletter/confirm?token=`). The subscription is NOT active until the
 * subscriber clicks that link (verified by `/api/newsletter/confirm`). This:
 *   - prevents abuse/forged subscriptions (the owner of the inbox must confirm);
 *   - prevents duplicate CONFIRMATION SENDS — a re-POST while 'pending' returns
 *     202 without re-sending (the rate limiter caps the POST frequency);
 *   - prevents duplicate SUBSCRIPTIONS — the dup-check + insert run inside a
 *     single Firestore transaction (no TOCTOU race).
 *
 * Suppression: an ACTIVE subscription (deletedAt == null, status == 'active')
 * refuses re-subscribe with 409. Unsubscribe soft-deletes (preserves consent
 * evidence); a re-subscribe after unsubscribe creates a fresh 'pending' doc.
 *
 * Status codes: 201 subscribed-pending, 202 already-pending, 400 invalid,
 *               409 already-subscribed, 429 rate-limited, 503 unavailable.
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
import { newsletterConfirmUrl } from '@/lib/newsletter/confirm-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

class AlreadyActive extends Error {}
class AlreadyPending extends Error {}

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
      { status: 400 },
    );
  }
  const data = parsed.data;

  const clientId = getClientId(request);
  const rl = checkRateLimit('newsletter', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Subscription service unavailable.' }, { status: 503 });
  }

  // Transactional duplicate-check + create as 'pending'. The check + insert run
  // inside a single Firestore transaction so two concurrent POSTs from the same
  // email cannot both pass an empty-result check and both write (the TOCTOU race
  // a non-atomic query-then-write would leave). A soft-deleted doc does NOT
  // block a fresh re-subscribe (it stays as a suppression record).
  const newId = 'sub_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const newRef = db.collection('newsletterSubscribers').doc(newId);
  let created = false;
  try {
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(
        db.collection('newsletterSubscribers').where('email', '==', data.email).limit(10),
      );
      for (const d of existing.docs) {
        const dd = d.data() as { deletedAt?: unknown; status?: string };
        if (dd && dd.deletedAt == null) {
          if (dd.status === 'active') throw new AlreadyActive();
          if (dd.status === 'pending') throw new AlreadyPending();
        }
      }
      tx.set(newRef, {
        email: data.email,
        source: 'Website Footer',
        subscribedAt: new Date(),
        deletedAt: null,
        status: 'pending',
      });
    });
    created = true;
  } catch (err) {
    if (err instanceof AlreadyActive) {
      return NextResponse.json({ error: 'You are already subscribed.' }, { status: 409 });
    }
    if (err instanceof AlreadyPending) {
      // Already pending: do NOT re-send the confirmation (prevents duplicate
      // confirmation sends). The rate limiter caps the POST frequency.
      return NextResponse.json(
        {
          message:
            'You are already subscribed but have not confirmed your email. Check your inbox for the confirmation link.',
        },
        { status: 202 },
      );
    }
    console.error('[newsletter] store failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not store subscription.' }, { status: 500 });
  }

  if (!created) {
    // Defensive: transaction did not create + did not throw a known class.
    return NextResponse.json({ error: 'Could not store subscription.' }, { status: 500 });
  }

  // Send the double-opt-in confirmation email with a signed confirm link +
  // a one-click unsubscribe link. Best-effort: a failed email never discards the
  // stored (pending) subscription; the status is recorded for diagnosis/retry.
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const confirmUrl = newsletterConfirmUrl(data.email, baseUrl);
  const unsubUrl = newsletterUnsubscribeUrl(data.email, baseUrl);
  const confirmation = await sendNewsletterConfirmation({
    to: data.email,
    confirmUrl,
    unsubscribeUrl: unsubUrl,
  });
  try {
    await newRef.update({
      confirmationEmail: { status: confirmation.status, detail: confirmation.detail || null, at: new Date() },
    });
  } catch {
    // Non-fatal: the subscription is already stored; this is diagnostic only.
  }

  return NextResponse.json(
    { success: true, status: 'pending', notification: confirmation.status },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
