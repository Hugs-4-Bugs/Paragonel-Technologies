/**
 * Startup environment validation (Phase 8).
 *
 * Centralizes the previously-scattered fail-closed env checks into one module
 * that runs once at server startup (via src/instrumentation.ts) and surfaces
 * missing/empty required variables with CLEAR, NON-SENSITIVE messages.
 *
 * Contract:
 *   - NEVER prints secret VALUES — only presence / empty / missing + a length
 *     bucket for secrets. A missing JWT_SECRET is reported as "missing", not
 *     echoed.
 *   - NEVER throws — the app must still start. Missing vars are logged as
 *     warnings; the routes that depend on them already fail-closed per-request
 *     (getJwtSecret/getOtpSecret/getSmtpConfig/initAdmin return null → 500/503).
 *     This module makes those failures VISIBLE at boot instead of mysterious.
 *   - Distinguishes local-dev (FIRESTORE_EMULATOR_HOST set) from production:
 *     Firebase Admin service-account creds + CAPTCHA keys are only REQUIRED in
 *     production; in dev the emulator + test-mode CAPTCHA are expected.
 *
 * Output: a structured EnvReport (also returned for tests) + a console summary.
 */
export type EnvStatus = 'set' | 'empty' | 'missing';
export type EnvRequirement = 'always' | 'prod' | 'dev' | 'optional';

interface VarSpec {
  name: string;
  category: string;
  requirement: EnvRequirement;
  /** True for secrets — only presence + length bucket are reported, never the value. */
  secret: boolean;
  /** Minimum length for secret values (e.g. JWT_SECRET ≥ 32). */
  minLen?: number;
  /** Human-readable note on where to obtain it / what happens if missing. */
  note: string;
}

const VAR_SPECS: VarSpec[] = [
  // --- Security (auth) ---
  { name: 'JWT_SECRET', category: 'Security', requirement: 'always', secret: true, minLen: 32, note: 'Session JWT signing key (≥32 chars). Without it, login/admin return 500.' },
  { name: 'OTP_SECRET', category: 'Security', requirement: 'always', secret: true, minLen: 32, note: 'OTP/HMAC token signing key (≥32 chars). Without it, OTP auth returns 500.' },
  { name: 'SUPERADMIN_BOOTSTRAP_EMAIL', category: 'Security', requirement: 'always', secret: false, note: 'The founder email that may bootstrap the first super_admin.' },
  { name: 'CRON_SECRET', category: 'Security', requirement: 'optional', secret: true, note: 'Verifies Vercel Cron invocations of /api/cron/process-match-events. Vercel auto-provisions it when vercel.json has a crons entry; if unset, the cron route returns honest 503.' },

  // --- Supabase (primary backend) ---
  { name: 'NEXT_PUBLIC_SUPABASE_URL', category: 'Supabase', requirement: 'prod', secret: false, note: 'Supabase project URL (browser + server). Required once routes are cut over to Supabase.' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', category: 'Supabase', requirement: 'prod', secret: false, note: 'Supabase anon/publishable key (public, RLS-enforced).' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', category: 'Supabase', requirement: 'prod', secret: true, note: 'Supabase service-role key (server only, bypasses RLS). NEVER in NEXT_PUBLIC_*.' },
  { name: 'SUPABASE_URL', category: 'Supabase', requirement: 'optional', secret: false, note: 'Server-side fallback for NEXT_PUBLIC_SUPABASE_URL (supabase/server.ts). Optional — set NEXT_PUBLIC_SUPABASE_URL instead.' },

  // --- Firebase Admin (RETAINED during cutover — remove after route migration) ---
  { name: 'FIREBASE_ADMIN_PROJECT_ID', category: 'Firebase (cutover)', requirement: 'prod', secret: false, note: 'Firebase project id. RETAINED — the 50 Firebase routes are still active until the Supabase cutover.' },
  { name: 'FIREBASE_ADMIN_CLIENT_EMAIL', category: 'Firebase (cutover)', requirement: 'prod', secret: false, note: 'Service-account client email. RETAINED during cutover.' },
  { name: 'FIREBASE_ADMIN_PRIVATE_KEY', category: 'Firebase (cutover)', requirement: 'prod', secret: true, note: 'Service-account private key (escaped \\n). RETAINED during cutover.' },

  // --- Email / SMTP ---
  { name: 'SMTP_HOST', category: 'Email', requirement: 'optional', secret: false, note: 'SMTP host. If unset, dev falls back to Mailpit; prod skips sending (honest).' },
  { name: 'SMTP_PORT', category: 'Email', requirement: 'optional', secret: false, note: 'SMTP port (e.g. 587 / 465).' },
  { name: 'SMTP_SECURE', category: 'Email', requirement: 'optional', secret: false, note: "Set 'true' for port 465 (implicit TLS); omit/empty for 587 (STARTTLS). Parsed as === 'true'." },
  { name: 'SMTP_USER', category: 'Email', requirement: 'optional', secret: true, note: 'SMTP username. Required with SMTP_HOST to send.' },
  { name: 'SMTP_PASS', category: 'Email', requirement: 'optional', secret: true, note: 'SMTP password. Required with SMTP_HOST to send.' },
  { name: 'SMTP_FROM', category: 'Email', requirement: 'optional', secret: false, note: 'Verified sender address (e.g. "Paragonel <noreply@domain>").' },
  { name: 'COMPANY_INBOX', category: 'Email', requirement: 'optional', secret: false, note: 'Recipient for enquiry notifications. If unset, company notifications are skipped.' },
  { name: 'APP_BASE_URL', category: 'Email', requirement: 'optional', secret: false, note: 'Public base URL used in email body links (server-only). Defaults vary by call site — set to https://paragonel.com in production.' },
  { name: 'NEXT_PUBLIC_SITE_URL', category: 'URLs', requirement: 'optional', secret: false, note: 'Canonical site apex for metadataBase, sitemap, robots, OG/canonical URLs. Set to https://paragonel.com in production (fallback is the apex).' },

  // --- AI ---
  { name: 'GEMINI_API_KEY', category: 'AI', requirement: 'optional', secret: true, minLen: 10, note: 'Google AI / Gemini key for chatbot + resume parsing. If empty, chatbot returns honest fallback (503) + resume parse is skipped.' },
  { name: 'GOOGLE_API_KEY', category: 'AI', requirement: 'optional', secret: true, minLen: 10, note: 'Alternative to GEMINI_API_KEY (Genkit accepts either).' },
  { name: 'GEMINI_MODEL', category: 'AI', requirement: 'optional', secret: false, note: 'Gemini model id (without provider prefix). Defaults to gemini-flash-latest. Pin to gemini-2.0-flash if your key lacks the latest.' },
  { name: 'GEMINI_REQUEST_TIMEOUT_MS', category: 'AI', requirement: 'optional', secret: false, note: 'Bounded model-request timeout in ms (default 25000). Prevents perpetual loading.' },
  { name: 'NEXT_PUBLIC_GA4_MEASUREMENT_ID', category: 'Analytics', requirement: 'optional', secret: false, note: 'Google Analytics 4 measurement id (G-XXXXXXXXXX). If unset, the GA4 component is a no-op (the site runs analytics-free).' },

  // --- CAPTCHA (prod) ---
  { name: 'TURNSTILE_SECRET_KEY', category: 'CAPTCHA', requirement: 'prod', secret: true, note: 'Cloudflare Turnstile server secret. Without it, prod registration/login fail-closed.' },
  { name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', category: 'CAPTCHA', requirement: 'prod', secret: false, note: 'Cloudflare Turnstile site key (public). Renders the challenge widget.' },

  // --- Firebase client (RETAINED during cutover — public) ---
  { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', category: 'Firebase Client (cutover)', requirement: 'always', secret: false, note: 'Public Firebase API key. RETAINED until route cutover.' },
  { name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', category: 'Firebase Client (cutover)', requirement: 'always', secret: false, note: 'Firebase auth domain. RETAINED during cutover.' },
  { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', category: 'Firebase Client (cutover)', requirement: 'always', secret: false, note: 'Firebase project id (client). RETAINED during cutover.' },
  { name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', category: 'Firebase Client (cutover)', requirement: 'always', secret: false, note: 'Firebase Storage bucket. RETAINED during cutover.' },
  { name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', category: 'Firebase Client (cutover)', requirement: 'always', secret: false, note: 'Firebase messaging sender id. RETAINED during cutover.' },
  { name: 'NEXT_PUBLIC_FIREBASE_APP_ID', category: 'Firebase Client (cutover)', requirement: 'always', secret: false, note: 'Firebase app id. RETAINED during cutover.' },
  { name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', category: 'Firebase Client (cutover)', requirement: 'optional', secret: false, note: 'Firebase measurement id (optional, for GA4-style analytics).' },

  // --- Dev-only ---
  { name: 'FIRESTORE_EMULATOR_HOST', category: 'Dev', requirement: 'dev', secret: false, note: 'Points the Admin SDK at the local emulator (e.g. localhost:8080).' },
  { name: 'MAILPIT_HOST', category: 'Dev', requirement: 'dev', secret: false, note: 'Mailpit host for local email capture (dev fallback when SMTP_HOST is unset).' },
  { name: 'MAILPIT_SMTP_PORT', category: 'Dev', requirement: 'dev', secret: false, note: 'Mailpit SMTP port (e.g. 1025) for local email capture.' },
];

export interface VarReport {
  name: string;
  category: string;
  requirement: EnvRequirement;
  status: EnvStatus;
  /** For secrets: a length bucket only (never the value). For non-secrets: null. */
  lengthBucket?: string | null;
  appliesInThisEnv: boolean;
  note: string;
}

export interface EnvReport {
  isProduction: boolean;
  isEmulator: boolean;
  checked: VarReport[];
  /** Vars that apply in this env + are missing/empty/too-short. */
  problems: VarReport[];
  ok: boolean;
}

function isEmulatorEnv(): boolean {
  return !!process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST.trim() !== '';
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production' && !isEmulatorEnv();
}

function lengthBucket(len: number): string {
  if (len === 0) return '0';
  if (len < 8) return '1-7';
  if (len < 20) return '8-19';
  if (len < 32) return '20-31';
  return '32+';
}

function checkVar(spec: VarSpec, isProd: boolean): VarReport {
  const raw = process.env[spec.name];
  const present = typeof raw === 'string' && raw.length > 0;
  let status: EnvStatus = present ? 'set' : (raw === '' ? 'empty' : 'missing');
  if (!present && raw === undefined) status = 'missing';
  if (!present && typeof raw === 'string' && raw.length === 0) status = 'empty';

  // Does this requirement apply in the current env?
  let applies = true;
  if (spec.requirement === 'prod' && !isProd) applies = false;
  if (spec.requirement === 'dev' && isProd) applies = false; // dev-only var shouldn't be set in prod

  // For secrets with a minLen, "set but too short" is a problem.
  let tooShort = false;
  if (present && spec.secret && spec.minLen && raw.length < spec.minLen) {
    tooShort = true;
  }

  return {
    name: spec.name,
    category: spec.category,
    requirement: spec.requirement,
    status: tooShort ? 'empty' : status, // report too-short as a problem (shown as empty/short)
    lengthBucket: spec.secret && present ? (tooShort ? `<${spec.minLen}` : lengthBucket(raw.length)) : null,
    appliesInThisEnv: applies,
    note: spec.note + (tooShort ? ` (currently shorter than ${spec.minLen} chars — treated as not-configured.)` : ''),
  };
}

/**
 * Validate all environment variables. Logs a non-sensitive summary to the
 * console + returns the structured report. Safe to call once at startup.
 */
export function validateEnvironment(): EnvReport {
  const isEmu = isEmulatorEnv();
  const isProd = isProductionEnv();
  const checked = VAR_SPECS.map((s) => checkVar(s, isProd));

  const problems = checked.filter((r) => {
    if (!r.appliesInThisEnv) return false;
    // Missing or empty or (secret too-short, reported as 'empty').
    return r.status === 'missing' || r.status === 'empty';
  });

  const ok = problems.length === 0;

  // Non-sensitive console summary. NEVER prints values.
  const mode = isProd ? 'production' : isEmu ? 'local-dev (emulator)' : 'development';
  console.log(`[env-validation] mode=${mode}  problems=${problems.length}  checked=${checked.length}`);
  if (problems.length > 0) {
    console.warn('[env-validation] Missing or not-configured variables (values are NOT shown):');
    for (const p of problems) {
      const lb = p.lengthBucket ? ` len=${p.lengthBucket}` : '';
      console.warn(`  - ${p.name} [${p.category}] status=${p.status}${lb}  → ${p.note}`);
    }
    if (isProd) {
      console.warn('[env-validation] Production-deploying with missing required vars will cause auth/email/AI/CAPTCHA routes to fail-closed. Fill them in Vercel project settings.');
    } else {
      console.warn('[env-validation] Local-dev: some vars (SMTP, Gemini, Turnstile) are optional in emulator mode — affected features will degrade honestly (skip/fallback) rather than crash.');
    }
  } else {
    console.log('[env-validation] All required variables for this environment are configured.');
  }

  return { isProduction: isProd, isEmulator: isEmu, checked, problems, ok };
}
