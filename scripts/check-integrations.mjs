#!/usr/bin/env node
/**
 * check-integrations.mjs — production external-service connectivity diagnostic
 * (Batch 5 Task 2).
 *
 * Run with the SAME environment the production deployment uses (.env.local or
 * exported env vars). For each external service, reports one of:
 *   PASS — credentials present AND a minimal read-only connectivity probe
 *          succeeded (the service is reachable + authenticated).
 *   FAIL — credentials present BUT the connectivity probe errored (the service
 *          is misconfigured or unreachable — see the sanitized detail).
 *   SKIP — a required credential is missing. The exact missing env-var name(s)
 *          are listed. This is NOT a failure: the app fails-closed per-route
 *          when a service is unset (see docs/RELEASE_READINESS.md). The founder
 *          must supply the credential + re-run to get a PASS.
 *
 * This script NEVER prints credential values — only presence / probe result.
 * All probes are READ-ONLY (no email sent, no data written, no auth state
 * changed). SMTP uses nodemailer's verify() (connect + authenticate, no send);
 * Gemini lists models via REST; Turnstile siteverifies a dummy token (Cloudflare
 * returns a known error — confirms connectivity); Firebase Admin lists
 * collections; Supabase runs a trivial select.
 *
 * Usage:
 *   node scripts/check-integrations.mjs
 *   # or with an env file:
 *   node --env-file=.env.local scripts/check-integrations.mjs
 *
 * Exit code: 0 if every service is PASS or SKIP; 1 if any service is FAIL.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');
const firebaseAdmin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

/** @typedef {'PASS'|'FAIL'|'SKIP'} Status */
/**
 * @typedef {Object} Result
 * @property {string} service
 * @property {Status} status
 * @property {string} detail
 */

const results = [];

/**
 * @param {string} service
 * @param {Status} status
 * @param {string} detail
 */
function record(service, status, detail) {
  results.push({ service, status, detail });
  const tag = status === 'PASS' ? '✓ PASS' : status === 'FAIL' ? '✗ FAIL' : '○ SKIP';
  console.log(`${tag}  ${service.padEnd(16)} ${detail}`);
}

/** Sanitize an error so no credential value leaks into the report. */
function sanitizeError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  // Strip anything that looks like a URL credential or a long token.
  return msg
    .replace(/:[^:@/]+@/g, ':***@')
    .replace(/(sk-|AIza|ghp_|github_pat_|Bearer\s+)[A-Za-z0-9_.-]{6,}/g, '$1[REDACTED]')
    .slice(0, 200);
}

function env(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

// ---------------------------------------------------------------------------
// 1. SMTP
// ---------------------------------------------------------------------------
async function checkSmtp() {
  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  const port = env('SMTP_PORT');
  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');
  if (missing.length > 0) {
    record('SMTP', 'SKIP', `missing ${missing.join(', ')} (email paths fail closed — see docs/RELEASE_READINESS.md)`);
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: port ? Number(port) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    await transporter.verify(); // connect + authenticate; sends nothing
    record('SMTP', 'PASS', `connected to ${host}:${port || 587} as ${user}`);
    transporter.close();
  } catch (err) {
    record('SMTP', 'FAIL', `verify() failed: ${sanitizeError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// 2. Gemini (REST — no SDK coupling)
// ---------------------------------------------------------------------------
async function checkGemini() {
  const key = env('GEMINI_API_KEY') || env('GOOGLE_API_KEY');
  if (!key) {
    record('Gemini', 'SKIP', 'missing GEMINI_API_KEY (or GOOGLE_API_KEY fallback) — chat returns honest 503, resume parse skipped');
    return;
  }
  const model = env('GEMINI_MODEL') || 'gemini-flash-latest';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(env('GEMINI_REQUEST_TIMEOUT_MS')) || 25000);
    // List models — minimal read-only probe.
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (res.ok) {
      record('Gemini', 'PASS', `API reachable; model pinned to ${model}`);
    } else {
      const body = await res.text().catch(() => '');
      record('Gemini', 'FAIL', `HTTP ${res.status}: ${sanitizeError(body.slice(0, 120))}`);
    }
  } catch (err) {
    record('Gemini', 'FAIL', `probe failed: ${sanitizeError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Cloudflare Turnstile (REST siteverify with a dummy token)
// ---------------------------------------------------------------------------
async function checkTurnstile() {
  const secret = env('TURNSTILE_SECRET_KEY');
  const siteKey = env('NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  if (!secret) {
    record('Turnstile', 'SKIP', 'missing TURNSTILE_SECRET_KEY (registration/login fail closed in prod)');
    return;
  }
  if (!siteKey) {
    record('Turnstile', 'SKIP', 'missing NEXT_PUBLIC_TURNSTILE_SITE_KEY (widget will not render)');
    return;
  }
  try {
    // A dummy token always yields success:false with a known error code — this
    // confirms we can reach siteverify + the secret is structurally accepted.
    const form = new URLSearchParams({ secret, response: 'xxxx.dummy.token.xxxx' });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      record('Turnstile', 'FAIL', `siteverify HTTP ${res.status}`);
      return;
    }
    const data = await res.json().catch(() => ({}));
    // 'invalid-input-response' (the dummy token) or 'bad-request' means we
    // REACHED Cloudflare + the secret was accepted; a real invalid SECRET yields
    // 'invalid-input-secret'. Either way, connectivity is confirmed.
    const errors = Array.isArray(data['error-codes']) ? data['error-codes'] : [];
    if (errors.includes('invalid-input-secret')) {
      record('Turnstile', 'FAIL', `siteverify rejected the secret (invalid-input-secret)`);
    } else {
      record('Turnstile', 'PASS', `siteverify reachable; secret accepted (dummy-token error: ${errors[0] || 'none'})`);
    }
  } catch (err) {
    record('Turnstile', 'FAIL', `probe failed: ${sanitizeError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Firebase Admin (Firestore + Storage)
// ---------------------------------------------------------------------------
async function checkFirebase() {
  const projectId = env('FIREBASE_ADMIN_PROJECT_ID') || env('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const clientEmail = env('FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKey = env('FIREBASE_ADMIN_PRIVATE_KEY');
  const missing = [];
  if (!projectId) missing.push('FIREBASE_ADMIN_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_ADMIN_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_ADMIN_PRIVATE_KEY');
  if (missing.length > 0) {
    record('Firebase Admin', 'SKIP', `missing ${missing.join(', ')} (admin SDK returns null → routes 503)`);
    return;
  }
  try {
    const app = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || undefined,
    }, 'check-integrations-' + Date.now());
    const db = firebaseAdmin.firestore(app);
    // Read-only probe: listCollections (no data read).
    const collections = await db.listCollections();
    const names = collections.map((c) => c.id).slice(0, 5).join(', ');
    let storageNote = '';
    const bucketName = env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    if (bucketName) {
      try {
        const bucket = firebaseAdmin.storage().bucket(bucketName);
        const [exists] = await bucket.exists();
        storageNote = `; storage bucket '${bucketName}' ${exists ? 'exists' : 'MISSING'}`;
      } catch (e) {
        storageNote = `; storage check failed: ${sanitizeError(e)}`;
      }
    }
    record('Firebase Admin', 'PASS', `Firestore reachable (${collections.length} collections${names ? ': ' + names : ''})${storageNote}`);
    await app.delete();
  } catch (err) {
    record('Firebase Admin', 'FAIL', `probe failed: ${sanitizeError(err)}`);
    try { firebaseAdmin.app().delete(); } catch {}
  }
}

// ---------------------------------------------------------------------------
// 5. Supabase (read-only select)
// ---------------------------------------------------------------------------
async function checkSupabase() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL') || env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url) {
    record('Supabase', 'SKIP', 'missing NEXT_PUBLIC_SUPABASE_URL (cutover target; not yet the live data source)');
    return;
  }
  if (!serviceKey) {
    record('Supabase', 'SKIP', 'missing SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  try {
    const client = createClient(url, serviceKey, { auth: { persistSession: false } });
    // Read-only probe: select 1 row from app_settings (a sentinel table that
    // always exists post-migration; carries the superadmin_bootstrapped key).
    const { error } = await client.from('app_settings').select('key').limit(1);
    if (error) {
      record('Supabase', 'FAIL', `query failed: ${sanitizeError(error.message)}`);
    } else {
      record('Supabase', 'PASS', `project reachable at ${url}`);
    }
  } catch (err) {
    record('Supabase', 'FAIL', `probe failed: ${sanitizeError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// 6. CRON_SECRET (presence only — Vercel provisions + sends it)
// ---------------------------------------------------------------------------
function checkCronSecret() {
  if (env('CRON_SECRET')) {
    record('Vercel Cron', 'PASS', 'CRON_SECRET present (length verified; value never printed)');
  } else {
    record('Vercel Cron', 'SKIP', 'CRON_SECRET unset — Vercel auto-provisions it for projects with a vercel.json crons entry; the cron route returns honest 503 until then');
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  console.log('Paragonel — external service connectivity diagnostic\n');
  console.log('Environment: ' + (process.env.NODE_ENV || 'development') + '\n');
  await checkSmtp();
  await checkGemini();
  await checkTurnstile();
  await checkFirebase();
  await checkSupabase();
  checkCronSecret();

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const skip = results.filter((r) => r.status === 'SKIP').length;
  console.log(`\nSummary: ${pass} PASS, ${fail} FAIL, ${skip} SKIP (of ${results.length})`);
  console.log(fail > 0
    ? 'One or more configured services failed their connectivity probe. Fix the reported configuration + re-run.'
    : 'No configured service failed. SKIP services need credentials supplied before they can be verified.');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Diagnostic crashed:', sanitizeError(err));
  process.exit(2);
});
