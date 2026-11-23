/**
 * GET /api/newsletter/confirm — double-opt-in confirmation (Batch 2 Task 5).
 *
 * The subscriber clicks the signed confirm link in the confirmation email. The
 * HMAC token (`newsletter:confirm:<email>`) is verified server-side; on success
 * the matching 'pending' subscriber is activated (`status:'active'` +
 * `confirmedAt`). Idempotent: re-clicking the link on an already-active
 * subscription is a no-op (returns the confirmation page). A token for
 * subscriber A can only activate subscriber A (the signature is bound to the
 * email).
 *
 * Rate-limited per client (abuse protection). Returns a small HTML confirmation
 * page (no PII echoed beyond the email the visitor already owns). Public /
 * token-authenticated — no session required.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';
import { getClientId, checkRateLimit } from '@/lib/submission-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function htmlPage(title: string, message: string, ok: boolean): NextResponse {
  const status = ok ? 200 : 400;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem}.card{max-width:32rem;text-align:center;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px}h1{font-size:1.25rem;margin:0 0 8px}p{color:#475569;line-height:1.6;margin:8px 0}a{color:#0f172a}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: Request) {
  const clientId = getClientId(request);
  const rl = checkRateLimit('newsletterConfirm', clientId);
  if (!rl.allowed) {
    return htmlPage(
      'Too many attempts',
      'Please try again shortly.',
      false,
    );
  }

  const token = new URL(request.url).searchParams.get('token') ?? '';
  const email = verifyNewsletterConfirmToken(token);
  if (!email) {
    return htmlPage(
      'Invalid confirmation link',
      'This confirmation link is invalid or was tampered with. Please subscribe again to receive a new link.',
      false,
    );
  }

  const db = getAdminDb();
  if (!db) {
    return htmlPage(
      'Service unavailable',
      'Subscription confirmation is temporarily unavailable. Please try again later.',
      false,
    );
  }

  try {
    const snap = await db
      .collection('newsletterSubscribers')
      .where('email', '==', email)
      .limit(20)
      .get();
    let activated = false;
    let alreadyActive = false;
    const batch = db.batch();
    for (const d of snap.docs) {
      const dd = d.data() as { deletedAt?: unknown; status?: string };
      if (dd && dd.deletedAt == null) {
        if (dd.status === 'pending') {
          // Activate the pending subscription (idempotent across docs — only
          // pending ones are touched).
          batch.update(d.ref, { status: 'active', confirmedAt: new Date() });
          activated = true;
        } else if (dd.status === 'active') {
          alreadyActive = true;
        }
      }
    }
    if (activated) {
      await batch.commit();
      return htmlPage(
        'Subscription confirmed',
        'Thank you — your Paragonel newsletter subscription is now active.',
        true,
      );
    }
    if (alreadyActive) {
      return htmlPage(
        'Already confirmed',
        'Your subscription is already active — no further action is needed.',
        true,
      );
    }
    // No matching pending/active doc: don't reveal whether the email exists.
    return htmlPage(
      'Subscription not found',
      'We could not find a pending subscription for this link. It may have expired or already been confirmed. Please subscribe again if needed.',
      false,
    );
  } catch (err) {
    console.error('[newsletter/confirm] failed:', err instanceof Error ? err.message : err);
    return htmlPage(
      'Service unavailable',
      'Subscription confirmation is temporarily unavailable. Please try again later.',
      false,
    );
  }
}
