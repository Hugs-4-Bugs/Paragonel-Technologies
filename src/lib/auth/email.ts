/**
 * email.ts — outbound SMTP for OTP / account emails (Part E).
 *
 * Uses nodemailer with a transport built from SMTP_* env. If SMTP credentials
 * are absent, `sendOtpEmail` returns `{sent:false, reason:'smtp_not_configured'}`
 * — NO fake delivery, NO development OTP bypass in production. The route layer
 * surfaces this honestly to the founder ("email delivery cannot be verified
 * until SMTP credentials are supplied").
 *
 * Local-dev option: when NODE_ENV !== 'production' AND MAILPIT_* env is set,
 * mail is routed to Mailpit (a real local SMTP catcher) so the OTP email can
 * be inspected during development. This is real delivery to a local mailbox,
 * never a bypass of verification.
 *
 * HARDENING:
 *   - OTP codes are NEVER placed in the email subject (the subject is the
 *     purpose label only) and NEVER written to any log (server console
 *     included). The code appears only inside the email body.
 *   - The SMTP sender (`SMTP_FROM`) is validated before use; an invalid sender
 *     is treated as "not configured" rather than emitting mail with a broken
 *     From header.
 *   - The transport is built with bounded connection/greeting/socket timeouts
 *     so a slow or unresponsive SMTP server cannot hang the request until the
 *     platform timeout. Send failures return a sanitized `{sent:false,
 *     reason:'smtp_error'}` — no credentials, no SMTP response codes, no stack
 *     traces are returned to the caller (a truncated, non-sensitive message is
 *     written to the server log only).
 */
import nodemailer from 'nodemailer';
import type { OtpPurpose } from './otp';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface SendResult {
  sent: boolean;
  reason?: 'smtp_not_configured' | 'smtp_error' | 'invalid_sender' | 'mailpit_dev';
  messageId?: string;
  /** dev-only: when Mailpit is used, the URL to inspect the captured mail. */
  devPreview?: string;
}

/**
 * Bounded SMTP timeouts (ms). A slow/unresponsive server is aborted well
 * before the platform request timeout so the caller can fail fast + the
 * request thread is not held indefinitely.
 */
const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 20_000;

/** Accepts either `addr@host` or `Display Name <addr@host>`. */
const SENDER_RE = /^(?:(?:[^<]*)<)?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}>?\s*$/;

/** Validate the SMTP_FROM sender. Returns true for a usable address form. */
export function isValidSender(from: string | undefined): boolean {
  return !!from && SENDER_RE.test(from.trim());
}

/** Read + validate the production SMTP config. Returns null if not configured. */
export function getSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  // Sender must be present AND a valid address form — otherwise the message
  // would be sent with a broken/empty From header (bounced or rejected).
  if (!isValidSender(SMTP_FROM)) return null;
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE) === 'true',
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM as string,
  };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

/** True when local-dev Mailpit routing is explicitly enabled (never in prod). */
function getMailpitConfig(): { host: string; port: number; from: string } | null {
  if (process.env.NODE_ENV === 'production') return null;
  const { MAILPIT_HOST, MAILPIT_SMTP_PORT } = process.env;
  if (!MAILPIT_HOST || !MAILPIT_SMTP_PORT) return null;
  const from = isValidSender(process.env.SMTP_FROM)
    ? (process.env.SMTP_FROM as string)
    : 'noreply@paragonel.local';
  return { host: MAILPIT_HOST, port: Number(MAILPIT_SMTP_PORT), from };
}

const PURPOSE_LABEL: Record<OtpPurpose, string> = {
  register: 'Verify your Paragonel account',
  password_reset: 'Reset your Paragonel password',
  admin_login: 'Your Paragonel admin login code',
  bootstrap: 'Verify the Paragonel Super Admin bootstrap',
  recovery: 'Recover your Paragonel Super Admin account',
};

function emailBody(code: string, purpose: OtpPurpose): string {
  const label = PURPOSE_LABEL[purpose];
  const expiry = '10 minutes';
  return [
    `Paragonel Technologies — ${label}`,
    ``,
    `Your one-time verification code is:`,
    ``,
    `    ${code}`,
    ``,
    `This code expires in ${expiry}. It is single-use: it stops working once you verify it.`,
    `If you did not request this, you can safely ignore this email — no action will be taken.`,
    ``,
    `— Paragonel Technologies`,
  ].join('\n');
}

function emailHtml(code: string, purpose: OtpPurpose): string {
  const label = PURPOSE_LABEL[purpose];
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
    <h2 style="margin-top:0;color:#0f172a;">Paragonel Technologies</h2>
    <p style="color:#334155;">${label}</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#eff6ff;border:1px dashed #93c5fd;border-radius:8px;padding:16px;text-align:center;color:#1d4ed8;">${code}</p>
    <p style="color:#475569;font-size:14px;">This code expires in 10 minutes and is single-use. If you did not request it, ignore this email.</p>
  </div>`;
}

/** Send an OTP code to `email`. Never puts the code in a log or the subject. */
export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<SendResult> {
  const cfg = getSmtpConfig();
  const mailpit = getMailpitConfig();

  if (!cfg && !mailpit) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  // Subject is the purpose label ONLY — never the code or any prefix of it.
  const subject = PURPOSE_LABEL[purpose];
  const text = emailBody(code, purpose);
  const html = emailHtml(code, purpose);

  try {
    if (cfg) {
      const transport = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
        connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
        socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
      });
      const info = await transport.sendMail({
        from: cfg.from,
        to: email,
        subject,
        text,
        html,
      });
      return { sent: true, messageId: info.messageId };
    } else {
      // mailpit (dev-only)
      const transport = nodemailer.createTransport({
        host: mailpit!.host,
        port: mailpit!.port,
        secure: false,
        // no auth for local Mailpit
        ignoreTLS: true,
        connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
        socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
      });
      const info = await transport.sendMail({
        from: mailpit!.from,
        to: email,
        subject,
        text,
        html,
      });
      return { sent: true, reason: 'mailpit_dev', messageId: info.messageId, devPreview: `http://${mailpit!.host}:8025` };
    }
  } catch (e) {
    // Sanitized: never return credentials, SMTP response codes, or a stack
    // trace to the caller. A short, non-sensitive message goes to the server
    // log only.
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[email] SMTP send failed:', msg.slice(0, 120));
    return { sent: false, reason: 'smtp_error' };
  }
}

/**
 * Deliver an OTP code to `email`. Tries real SMTP (or dev Mailpit). When SMTP
 * is not configured, returns `{sent:false, reason:'smtp_not_configured'}` —
 * the code is NEVER written to the server console. Dev/test OTP retrieval is
 * via Mailpit (set MAILPIT_*) or by calling `issueOtp` directly in the unit
 * tests (it returns the plaintext code to the caller for emailing).
 */
export interface DeliverResult extends SendResult {
  /**
   * Always `undefined` now. Retained on the type so existing callers that
   * branched on a dev-mode console log still compile; that log was removed
   * (OTP codes are never written to any log), so this field is never set.
   */
  devLogged?: boolean;
}

export async function deliverOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<DeliverResult> {
  return sendOtpEmail(email, code, purpose);
}

/** Send a plain notification email (e.g. admin invitation). */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  text: string
): Promise<SendResult> {
  const cfg = getSmtpConfig();
  const mailpit = getMailpitConfig();
  if (!cfg && !mailpit) return { sent: false, reason: 'smtp_not_configured' };
  try {
    const transport = cfg
      ? nodemailer.createTransport({
          host: cfg.host,
          port: cfg.port,
          secure: cfg.secure,
          auth: { user: cfg.user, pass: cfg.pass },
          connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
          greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
          socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
        })
      : nodemailer.createTransport({
          host: mailpit!.host,
          port: mailpit!.port,
          secure: false,
          ignoreTLS: true,
          connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
          greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
          socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
        });
    const info = await transport.sendMail({ from: (cfg ?? mailpit)!.from, to: email, subject, text });
    return { sent: true, messageId: info.messageId, reason: cfg ? undefined : 'mailpit_dev', devPreview: cfg ? undefined : `http://${mailpit!.host}:8025` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[email] notification send failed:', msg.slice(0, 120));
    return { sent: false, reason: 'smtp_error' };
  }
}
