/**
 * POST /api/contact  — secure server-side contact-form submission (Phase 1B).
 *
 * Flow: input validation -> honeypot -> rate limit -> duplicate detection ->
 *       server-side Firestore write (Admin SDK) -> email notifications ->
 *       notification status recorded on the lead document.
 *
 * The browser never touches Firestore. The lead is stored BEFORE email sending,
 * so a notification failure can never discard a stored CRM record. Notification
 * status (sent/skipped/failed + short code) is written back to the lead for
 * diagnosis and safe retry.
 *
 * Status codes: 201 created, 400 invalid, 429 rate-limited, 409 duplicate,
 *               503 admin SDK not configured (production w/o service account).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  contactSchema,
  getClientId,
  checkRateLimit,
  isLikelyDuplicate,
  fingerprint,
} from '@/lib/submission-security';
import { sendContactNotifications } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. Parse + validate.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Honeypot: if the hidden "website" field is filled, silently accept and drop
  // (bots). Returns 201 so the bot cannot tell it was rejected.
  if (typeof body === 'object' && body && 'website' in body && (body as any).website) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 2. Rate limit + dedupe.
  const clientId = getClientId(request);
  const rl = checkRateLimit('contact', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }
  const fp = fingerprint(data.email, data.name, data.message);
  if (isLikelyDuplicate('contact', fp)) {
    return NextResponse.json(
      { error: 'This message was already received. Please wait before sending again.' },
      { status: 409 }
    );
  }

  // 3. Admin SDK must be configured (emulator locally / real creds in prod).
  const db = getAdminDb();
  if (!db) {
    // Never attempt a production write without credentials.
    return NextResponse.json(
      { error: 'Submission service unavailable.' },
      { status: 503 }
    );
  }

  // 4. Store lead FIRST (CRM record is the source of truth). Field set matches
  //    the existing admin /admin/leads CRM for compatibility.
  let leadRef;
  try {
    leadRef = await db.collection('leads').add({
      name: data.name,
      email: data.email,
      company: data.company || '',
      message: data.message,
      source: 'Contact Page',
      status: 'New',
      createdAt: new Date(), // server timestamp; emulator/SDK serializes
      deletedAt: null,
      notificationStatus: 'pending',
      dedupeFingerprint: fp,
    });
  } catch (err) {
    console.error('[contact] lead store failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not store submission.' }, { status: 500 });
  }

  // 5. Email notifications (acknowledgement to submitter + enquiry to company).
  //    Failure here does NOT delete the lead; status is recorded for retry.
  let notifStatus = 'sent';
  let notifDetail = '';
  try {
    const result = await sendContactNotifications({
      submitterName: data.name,
      submitterEmail: data.email,
      company: data.company,
      message: data.message,
    });
    const parts = [
      `ack:${result.acknowledgement.status}`,
      `company:${result.companyNotification.status}`,
    ];
    notifDetail = parts.concat(
      result.acknowledgement.detail ? [`ack:${result.acknowledgement.detail}`] : [],
      result.companyNotification.detail ? [`company:${result.companyNotification.detail}`] : []
    ).join('|');
    if (result.acknowledgement.status === 'failed' || result.companyNotification.status === 'failed') {
      notifStatus = 'failed';
    } else if (
      result.acknowledgement.status === 'skipped' &&
      result.companyNotification.status === 'skipped'
    ) {
      notifStatus = 'skipped';
    }
  } catch (err) {
    notifStatus = 'failed';
    notifDetail = `exception:${err instanceof Error ? err.message.slice(0, 80) : 'unknown'}`;
  }

  try {
    await leadRef.update({ notificationStatus: notifStatus, notificationDetail: notifDetail });
  } catch {
    // Non-fatal: the lead is already stored. Status update is best-effort.
  }

  return NextResponse.json(
    { success: true, id: leadRef.id, notification: notifStatus },
    { status: 201 }
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
