/**
 * GET /api/newsletter/unsubscribe — one-click newsletter unsubscribe (Phase 7).
 *
 * The `token` query param is an HMAC-signed token bound to a single subscriber
 * email (see src/lib/newsletter/unsubscribe.ts). On verification, the route
 * soft-deletes (sets `deletedAt`) every `newsletterSubscribers` doc matching
 * that email — it cannot modify any other subscriber, any other collection, or
 * any other field. The token is unforgeable without the app's OTP_SECRET, and
 * the endpoint is rate-limited to block brute-force/enumeration.
 *
 * Returns a small HTML confirmation page (email clients' one-click unsubscribe
 * expects a GET that returns a page). No PII (the email is not echoed back).
 *
 * Suppression: any future campaign send MUST filter `deletedAt == null`. This
 * route is what produces that filter's data. Re-subscribing is allowed (the
 * subscribe route only blocks when an ACTIVE subscription exists).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyNewsletterUnsubscribeToken } from '@/lib/newsletter/unsubscribe';
import { checkRateLimit, getClientId } from '@/lib/submission-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function htmlPage(title: string, message: string, ok: boolean): NextResponse {
  const status = ok ? 200 : 400;
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
  .card{max-width:480px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;text-align:center;}
  .brand{color:#0f172a;font-weight:800;font-size:20px;margin-bottom:12px;}
  h1{font-size:18px;margin:0 0 8px;}
  p{font-size:14px;color:#52525b;margin:8px 0 0;line-height:1.5;}
  a{color:#0f172a;}
</style></head><body>
<div class="card">
  <div class="brand">Paragonel</div>
  <h1>${title}</h1>
  <p>${message}</p>
</div></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';

  // Rate-limit (token is unguessable, but block brute-force/enumeration anyway).
  const clientId = getClientId(request);
  const rl = checkRateLimit('jobAlertUnsub', clientId);
  if (!rl.allowed) {
    return htmlPage('Too many attempts', 'Please try again later.', false);
  }

  const email = verifyNewsletterUnsubscribeToken(token);
  if (!email) {
    return htmlPage('Invalid link', 'This unsubscribe link is invalid or expired. You can also manage your subscription by replying to any newsletter email.', false);
  }

  const db = getAdminDb();
  if (!db) {
    return htmlPage('Service unavailable', 'Your subscription could not be updated right now. Please try again later.', false);
  }

  // Soft-delete every matching doc for this email (subscribe may have created
  // multiple over time). Only `deletedAt` + `unsubscribedAt` are written — no
  // other field, no other collection.
  try {
    const snap = await db
      .collection('newsletterSubscribers')
      .where('email', '==', email)
      .get();
    const now = new Date();
    const batch = db.batch();
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d && d.deletedAt == null) {
        batch.update(doc.ref, { deletedAt: now, unsubscribedAt: now });
      }
    }
    await batch.commit();
  } catch (err) {
    console.error('[newsletter/unsubscribe] failed:', err instanceof Error ? err.message : err);
    return htmlPage('Service unavailable', 'Your subscription could not be updated right now. Please try again later.', false);
  }

  return htmlPage(
    'Unsubscribed',
    "You have been unsubscribed from the Paragonel newsletter. You will no longer receive these emails. This only affects the newsletter — it does not change any job-match alerts, enquiry, or account setting. You can re-subscribe anytime from the website footer.",
    true
  );
}
