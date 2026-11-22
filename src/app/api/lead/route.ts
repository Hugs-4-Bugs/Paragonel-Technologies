/**
 * POST /api/lead — Paragonel AI lead submission endpoint (Prompt 05P §4–6).
 *
 * Extends the existing /api/contact pattern (NOT a duplicate contact system):
 *   - Reuses submission-security (checkRateLimit, fingerprint, isLikelyDuplicate,
 *     consent versions, getClientId).
 *   - Writes to the SAME `leads` Firestore collection (Admin SDK) with
 *     source='Paragonel AI' + AI-specific fields (enquiryCategory, qualification
 *     summary, requirements, etc.).
 *
 * Flow: validate (leadSchema) → honeypot → rate limit → dedupe → Admin SDK
 *       write → notification (if configured) → honest confirmation.
 *
 * Consent (Phase 4):
 *   - consentAcknowledged MUST be true (enforced server-side by leadSchema.refine).
 *   - marketingConsent is SEPARATE + optional — never bundled with enquiry
 *     submission, never a condition of it.
 *   - Consent/policy versions are SERVER constants (not client-forged) + a
 *     server-captured UTC timestamp is attached.
 *
 * Honest confirmation (Phase 6):
 *   - The lead is stored BEFORE any notification attempt (the CRM record is the
 *     source of truth; a notification failure never discards it).
 *   - The response reports the actual notification status (sent/skipped/failed).
 *   - NEVER claims a human was notified when no notification was delivered.
 *
 * Status codes: 201 created, 400 invalid, 429 rate-limited, 409 duplicate,
 *               503 admin SDK not configured.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  getClientId,
  checkRateLimit,
  isLikelyDuplicate,
  fingerprint,
  CONSENT_NOTICE_VERSION,
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
} from '@/lib/submission-security';
import { sendContactNotifications } from '@/lib/email';
import { leadSchema } from '@/lib/ai/lead-qualification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Rate-limit policy for AI lead submission (separate from chat + contact). */
const LEAD_RATE_KEY = 'lead';

export async function POST(request: Request) {
  // 1. Parse + validate.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Honeypot: if the hidden "website" field is filled, silently accept + drop (bots).
  if (typeof body === 'object' && body && 'website' in body && (body as { website?: string }).website) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // 2. Rate limit + dedupe (reuse submission-security).
  const clientId = getClientId(request);
  const rl = checkRateLimit(LEAD_RATE_KEY, clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }
  const fp = fingerprint(data.email, data.name, data.businessProblem);
  if (isLikelyDuplicate(LEAD_RATE_KEY, fp)) {
    return NextResponse.json(
      { error: 'This enquiry was already received. Please wait before submitting again.' },
      { status: 409 },
    );
  }

  // 3. Admin SDK must be configured (emulator locally / real creds in prod).
  const db = getAdminDb();
  if (!db) {
    // Never attempt a production write without credentials.
    return NextResponse.json({ error: 'Submission service unavailable.' }, { status: 503 });
  }

  // 4. Store lead FIRST (CRM record is the source of truth). Extends the existing
  //    `leads` collection with AI-specific fields. Consent evidence is attached
  //    SERVER-side (versions + timestamp come from server constants, not the
  //    client body, so they cannot be forged). No raw IP/fingerprint is stored
  //    as PII (dedupeFingerprint is a non-crypto hash for dedupe only).
  const consentTimestamp = new Date().toISOString();
  let leadRef;
  try {
    leadRef = await db.collection('leads').add({
      name: data.name,
      email: data.email,
      company: data.company || '',
      // `message` is the canonical enquiry field used by /api/contact + the
      // admin leads CRM. For AI leads, it carries the businessProblem.
      message: data.businessProblem,
      source: 'Paragonel AI',
      status: 'New',
      createdAt: new Date(),
      deletedAt: null,
      notificationStatus: 'pending',
      dedupeFingerprint: fp,
      // AI-specific qualification fields (Phase 5).
      enquiryCategory: data.enquiryCategory,
      role: data.role || '',
      requiredService: data.requiredService || '',
      projectDescription: data.projectDescription || '',
      scope: data.scope || '',
      budget: data.budget || '',
      timeline: data.timeline || '',
      preferredContact: data.preferredContact || '',
      additionalInfo: data.additionalInfo || '',
      // Consent evidence (Phase 4). marketingConsent is recorded SEPARATELY so a
      // marketing message is never sent merely because an enquiry was submitted.
      consent: {
        acknowledged: true, // guaranteed true by leadSchema.refine()
        marketingConsent: data.marketingConsent === true,
        consentNoticeVersion: CONSENT_NOTICE_VERSION,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        termsVersion: TERMS_VERSION,
        timestampUtc: consentTimestamp,
      },
    });
  } catch (err) {
    console.error('[lead] store failed:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Could not store submission.' }, { status: 500 });
  }

  // 5. Email notification (acknowledgement to submitter + enquiry to company).
  //    Reuses sendContactNotifications. Failure does NOT delete the lead; the
  //    status is recorded for retry. The response NEVER claims a human was
  //    notified unless the notification actually succeeded.
  let notifStatus = 'sent';
  let notifDetail = '';
  try {
    const result = await sendContactNotifications({
      submitterName: data.name,
      submitterEmail: data.email,
      company: data.company,
      message: data.businessProblem,
    });
    const parts = [
      `ack:${result.acknowledgement.status}`,
      `company:${result.companyNotification.status}`,
    ];
    notifDetail = parts.concat(
      result.acknowledgement.detail ? [`ack:${result.acknowledgement.detail}`] : [],
      result.companyNotification.detail ? [`company:${result.companyNotification.detail}`] : [],
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

  // 6. Honest confirmation. The notification field reports the ACTUAL status so
  //    the UI never claims a human was notified when no notification succeeded.
  return NextResponse.json(
    {
      success: true,
      id: leadRef.id,
      notification: notifStatus, // 'sent' | 'skipped' | 'failed' — honest
      enquiryCategory: data.enquiryCategory,
    },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
