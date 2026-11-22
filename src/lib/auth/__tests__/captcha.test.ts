/**
 * captcha.test.ts — CAPTCHA verification tests (Prompt 05Q §3).
 *
 * Covers: mode resolution (live/test/misconfigured), fail-closed when
 * misconfigured, missing-token rejection, test-mode behavior, live-mode
 * siteverify (mocked).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCaptchaConfig, verifyCaptcha, captchaStatusMessage } from '../captcha';

describe('captcha (Prompt 05Q §3)', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  describe('getCaptchaConfig', () => {
    it('returns "test" mode in non-production without keys', () => {
      process.env.NODE_ENV = 'development';
      const cfg = getCaptchaConfig();
      expect(cfg.mode).toBe('test');
      expect(cfg.siteKey).toBeTruthy();
      expect(cfg.secret).toBeTruthy();
    });

    it('returns "live" mode when both keys are set', () => {
      process.env.NODE_ENV = 'production';
      process.env.TURNSTILE_SECRET_KEY = '0x' + 'a'.repeat(40);
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0x' + 'b'.repeat(40);
      const cfg = getCaptchaConfig();
      expect(cfg.mode).toBe('live');
      expect(cfg.secret).toBe('0x' + 'a'.repeat(40));
    });

    it('returns "misconfigured" in production without keys (fail-closed)', () => {
      process.env.NODE_ENV = 'production';
      const cfg = getCaptchaConfig();
      expect(cfg.mode).toBe('misconfigured');
      expect(cfg.secret).toBeNull();
      expect(cfg.siteKey).toBeNull();
    });
  });

  describe('verifyCaptcha', () => {
    it('rejects a missing token (any mode)', async () => {
      process.env.NODE_ENV = 'development';
      const r = await verifyCaptcha('');
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('missing_token');
    });

    it('rejects a null token', async () => {
      process.env.NODE_ENV = 'development';
      const r = await verifyCaptcha(null);
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('missing_token');
    });

    it('passes in test mode with a non-empty token', async () => {
      process.env.NODE_ENV = 'development';
      const r = await verifyCaptcha('any-token');
      expect(r.ok).toBe(true);
    });

    it('FAILS CLOSED in misconfigured mode (production, no keys) — never bypasses', async () => {
      process.env.NODE_ENV = 'production';
      const r = await verifyCaptcha('any-token');
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('misconfigured');
    });

    it('calls the Turnstile siteverify in live mode (mocked success)', async () => {
      process.env.NODE_ENV = 'production';
      process.env.TURNSTILE_SECRET_KEY = '0x' + 'a'.repeat(40);
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0x' + 'b'.repeat(40);
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
      const r = await verifyCaptcha('valid-token');
      expect(r.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('rejects when siteverify returns success:false', async () => {
      process.env.NODE_ENV = 'production';
      process.env.TURNSTILE_SECRET_KEY = '0x' + 'a'.repeat(40);
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0x' + 'b'.repeat(40);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }),
      );
      const r = await verifyCaptcha('bad-token');
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('failed');
    });
  });

  describe('captchaStatusMessage', () => {
    it('never exposes the secret', () => {
      process.env.NODE_ENV = 'production';
      process.env.TURNSTILE_SECRET_KEY = '0xTOPSECRET';
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xSITEKEY';
      const msg = captchaStatusMessage();
      expect(msg).not.toContain('TOPSECRET');
    });
  });
});
