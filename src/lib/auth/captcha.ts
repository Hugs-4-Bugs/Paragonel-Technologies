/**
 * captcha.ts — server-side CAPTCHA verification (Prompt 05Q §3).
 *
 * Provider: Cloudflare Turnstile (privacy-friendly, simple siteverify).
 *
 * Modes:
 *   - 'live':         TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY set →
 *                     real siteverify against challenges.cloudflare.com.
 *   - 'test':         dev/local only (NODE_ENV !== 'production' AND no real keys) →
 *                     uses Cloudflare's documented always-pass TEST keys
 *                     (1x0000000000000000000000000000000AA). NOT a silent bypass:
 *                     it is an explicit, documented dev mode; production NEVER
 *                     uses test keys.
 *   - 'misconfigured': production with no TURNSTILE_SECRET_KEY → routes FAIL CLOSED
 *                     (return a 503/400 "CAPTCHA verification unavailable"); the
 *                     registration + login workflows are marked BLOCKED until the
 *                     founder supplies credentials.
 *
 * Security:
 *   - Server-side verification is MANDATORY. A client-only success flag is never
 *     trusted.
 *   - The secret stays server-side (never sent to the browser).
 *   - Fail closed when verification is required but unavailable.
 *
 * Env: TURNSTILE_SECRET_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY (both required for
 *      production). No credentials are read from or written to the client.
 */
import { getClientIp } from './route-helpers';

/** Cloudflare Turnstile documented test keys (always pass). Dev-only. */
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const TEST_SITE_KEY = '1x00000000000000000000AA';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type CaptchaMode = 'live' | 'test' | 'misconfigured';

export interface CaptchaConfig {
  mode: CaptchaMode;
  /** The site key to render the widget (client-side). null if misconfigured. */
  siteKey: string | null;
  /** The secret (server-side only). null if misconfigured. */
  secret: string | null;
}

/** Resolve the current CAPTCHA configuration. */
export function getCaptchaConfig(): CaptchaConfig {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isProd = process.env.NODE_ENV === 'production';
  if (secret && siteKey) return { mode: 'live', siteKey, secret };
  if (!isProd) return { mode: 'test', siteKey: TEST_SITE_KEY, secret: TEST_SECRET };
  return { mode: 'misconfigured', siteKey: null, secret: null };
}

export interface CaptchaVerifyResult {
  ok: boolean;
  reason?: 'missing_token' | 'misconfigured' | 'failed' | 'unavailable';
}

/**
 * Verify a CAPTCHA token server-side. The token is the Turnstile response from
 * the client widget. Returns {ok:true} only on a verified success.
 *
 * In 'test' mode, a non-empty token always passes (documented dev-only).
 * In 'misconfigured' mode (prod + no keys), ALWAYS fails closed.
 */
export async function verifyCaptcha(
  token: string | undefined | null,
  request?: Request,
): Promise<CaptchaVerifyResult> {
  const cfg = getCaptchaConfig();
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { ok: false, reason: 'missing_token' };
  }
  if (cfg.mode === 'misconfigured') {
    // Production without credentials → fail closed. Never bypass.
    return { ok: false, reason: 'misconfigured' };
  }
  if (cfg.mode === 'test') {
    // Dev mode with Cloudflare test keys — always pass (documented).
    return { ok: true };
  }
  // Live mode: call Turnstile siteverify.
  const ip = request ? getClientIp(request) : undefined;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: cfg.secret!,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
      // Don't hang the request if Turnstile is slow.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) return { ok: false, reason: 'failed' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Human-readable status for API responses + UI (never exposes the secret). */
export function captchaStatusMessage(): string {
  const cfg = getCaptchaConfig();
  if (cfg.mode === 'live') return 'CAPTCHA verification active.';
  if (cfg.mode === 'test') return 'CAPTCHA in test mode (dev only — always passes).';
  return 'CAPTCHA verification is required but unavailable (misconfigured).';
}
