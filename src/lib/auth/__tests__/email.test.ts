/**
 * email.test.ts — SMTP hardening coverage (Task 1).
 *
 * Covers: sender validation, config presence, bounded-timeout transport
 * construction, sanitized failure handling, the OTP code NEVER appearing in
 * the subject or any log, and the removal of the dev plaintext-OTP console
 * fallback.
 *
 * These are pure unit tests — no Firestore emulator, no real SMTP. nodemailer
 * is mocked so we can assert on the constructed transport options + the
 * sendMail arguments.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidSender,
  getSmtpConfig,
  sendOtpEmail,
  deliverOtp,
} from '../email';

// We capture the options passed to createTransport + the args passed to
// sendMail so we can assert on timeouts, subject, and From header.
let createdOpts: Record<string, unknown> | null = null;
let sentArgs: { subject: string; from: string; to: string; text: string } | null = null;

vi.mock('nodemailer', () => ({
  default: {
    createTransport: (opts: Record<string, unknown>) => {
      createdOpts = opts;
      return {
        sendMail: (args: { subject: string; from: string; to: string; text: string }) => {
          sentArgs = args;
          return Promise.resolve({ messageId: '<test@example.com>' });
        },
      };
    },
  },
}));

const VALID_SENDER = 'Paragonel <noreply@paragonel.com>';

const ENV_KEYS = [
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS',
  'SMTP_FROM', 'MAILPIT_HOST', 'MAILPIT_SMTP_PORT', 'NODE_ENV',
] as const;

const BASE_ENV: Record<string, string> = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  SMTP_USER: 'user',
  SMTP_PASS: 'pass',
  SMTP_FROM: VALID_SENDER,
  NODE_ENV: 'production',
};

function setSmtpEnv(overrides: Record<string, string | undefined> = {}): void {
  // Start clean so prior tests' env does not leak in.
  for (const k of ENV_KEYS) delete process.env[k];
  // Apply the valid base config.
  for (const [k, v] of Object.entries(BASE_ENV)) process.env[k] = v;
  // Apply per-test overrides (undefined => delete).
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

beforeEach(() => {
  createdOpts = null;
  sentArgs = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isValidSender', () => {
  it('accepts a bare email address', () => {
    expect(isValidSender('noreply@paragonel.com')).toBe(true);
  });
  it('accepts a Display Name <email> form', () => {
    expect(isValidSender('Paragonel <noreply@paragonel.com>')).toBe(true);
  });
  it('rejects an empty / missing sender', () => {
    expect(isValidSender(undefined)).toBe(false);
    expect(isValidSender('')).toBe(false);
  });
  it('rejects a sender with no valid email', () => {
    expect(isValidSender('not-an-email')).toBe(false);
    expect(isValidSender('Paragonel')).toBe(false);
  });
});

describe('getSmtpConfig', () => {
  it('returns a validated config when all required vars are present', () => {
    setSmtpEnv();
    const cfg = getSmtpConfig();
    expect(cfg).not.toBeNull();
    expect(cfg?.host).toBe('smtp.example.com');
    expect(cfg?.port).toBe(587);
    expect(cfg?.secure).toBe(false);
    expect(cfg?.from).toBe(VALID_SENDER);
  });

  it('returns null when HOST/USER/PASS are missing', () => {
    setSmtpEnv({ SMTP_HOST: undefined });
    expect(getSmtpConfig()).toBeNull();
  });

  it('returns null when SMTP_FROM is an invalid sender', () => {
    setSmtpEnv({ SMTP_FROM: 'broken' });
    expect(getSmtpConfig()).toBeNull();
  });

  it('defaults port to 587 when SMTP_PORT is absent', () => {
    setSmtpEnv({ SMTP_PORT: undefined });
    expect(getSmtpConfig()?.port).toBe(587);
  });
});

describe('sendOtpEmail', () => {
  it('returns smtp_not_configured when no SMTP + no Mailpit', async () => {
    setSmtpEnv({ SMTP_HOST: undefined, NODE_ENV: 'production' });
    const r = await sendOtpEmail('a@b.com', '123456', 'register');
    expect(r.sent).toBe(false);
    expect(r.reason).toBe('smtp_not_configured');
  });

  it('builds the transport with bounded timeouts', async () => {
    setSmtpEnv();
    await sendOtpEmail('a@b.com', '123456', 'register');
    expect(createdOpts).not.toBeNull();
    expect(createdOpts?.connectionTimeout).toBe(10_000);
    expect(createdOpts?.greetingTimeout).toBe(10_000);
    expect(createdOpts?.socketTimeout).toBe(20_000);
  });

  it('NEVER puts the OTP code (or any prefix of it) in the subject', async () => {
    setSmtpEnv();
    const code = '482910';
    await sendOtpEmail('a@b.com', code, 'register');
    expect(sentArgs).not.toBeNull();
    expect(sentArgs!.subject).not.toContain(code);
    expect(sentArgs!.subject).not.toContain(code.slice(0, 2));
    // subject is the purpose label only
    expect(sentArgs!.subject).toBe('Verify your Paragonel account');
  });

  it('places the code in the body (so delivery still works) but not the subject', async () => {
    setSmtpEnv();
    const code = '778899';
    await sendOtpEmail('a@b.com', code, 'password_reset');
    expect(sentArgs!.text).toContain(code);
    expect(sentArgs!.subject).not.toContain(code);
  });

  it('returns a sanitized smtp_error when the transport throws (no credentials leak)', async () => {
    setSmtpEnv();
    // Re-mock createTransport to throw on construction.
    const nodemailer = (await import('nodemailer')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodemailer as any).createTransport = () => {
      throw new Error('connect ECONNREFUSED 10.0.0.1:465 [secret: should-not-leak]');
    };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await sendOtpEmail('a@b.com', '123456', 'register');
    expect(r.sent).toBe(false);
    expect(r.reason).toBe('smtp_error');
    // The returned object must not carry the raw error message / secret.
    expect(JSON.stringify(r)).not.toContain('should-not-leak');
    expect(JSON.stringify(r)).not.toContain('ECONNREFUSED');
    errSpy.mockRestore();
  });
});

describe('deliverOtp', () => {
  it('does NOT log the OTP code to the server console when SMTP is unconfigured', async () => {
    setSmtpEnv({ SMTP_HOST: undefined, NODE_ENV: 'development' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = '555111';
    const r = await deliverOtp('a@b.com', code, 'register');
    expect(r.sent).toBe(false);
    expect(r.reason).toBe('smtp_not_configured');
    // No plaintext OTP may appear in any console.log call.
    const allCalls = logSpy.mock.calls.flat().join(' ');
    expect(allCalls).not.toContain(code);
    logSpy.mockRestore();
  });
});
