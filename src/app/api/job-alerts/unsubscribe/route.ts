/**
 * GET /api/job-alerts/unsubscribe — one-click unsubscribe (Prompt 05R §9).
 *
 * The `token` query param is an HMAC-signed token bound to a single candidate
 * email (see src/lib/job-alerts/unsubscribe.ts). On verification, the route sets
 * `jobAlertPreference = false` for THAT candidate only — it cannot modify any
 * other account or any other field. The token is unforgeable without the app's
 * OTP_SECRET, and the endpoint is rate-limited to block brute-force/enumeration.
 *
 * Returns a small HTML confirmation page (email clients' one-click unsubscribe
 * expects a GET that returns a page). No PII (the email is not echoed back).
 *
 * This is a PUBLIC, token-authenticated route (no session cookie required) — a
 * candidate can click "Turn off job alerts" from an archived email without
 * logging in.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyUnsubscribeToken } from '@/lib/job-alerts/unsubscribe';
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
  <p style="margin-top:20px;font-size:12px;color:#a1a1aa;"><a href="/candidate/profile">Manage your profile &amp; preferences</a></p>
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

  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return htmlPage('Invalid link', 'This unsubscribe link is invalid or expired. You can also turn off job alerts from your candidate profile.', false);
  }

  const db = getAdminDb();
  if (!db) {
    return htmlPage('Service unavailable', 'Job-alert preferences could not be updated right now. Please try again later.', false);
  }

  // Disable alerts for the bound candidate only. Merge so we never clobber the
  // rest of the profile, and set email so a merge-create preserves the id.
  try {
    await db
      .collection('candidates')
      .doc(email)
      .set(
        { jobAlertPreference: false, updatedAt: Timestamp.fromMillis(Date.now()) },
        { merge: true }
      );
  } catch (err) {
    console.error('[job-alerts/unsubscribe] failed:', err instanceof Error ? err.message : err);
    return htmlPage('Service unavailable', 'Job-alert preferences could not be updated right now. Please try again later.', false);
  }

  return htmlPage(
    'Job alerts turned off',
    "You will no longer receive job-match alert emails from Paragonel. You can re-enable them anytime from your candidate profile. This only affects job-match alerts and does not change any other account setting.",
    true
  );
}
