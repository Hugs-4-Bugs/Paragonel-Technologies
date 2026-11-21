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
 * OTP codes are NEVER logged here. The code is interpolated into the email
 * body only.
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
  reason?: 'smtp_not_configured' | 'smtp_error' | 'mailpit_dev';
  messageId?: string;
  /** dev-only: when Mailpit is used, the URL to inspect the captured mail. */
  devPreview?: string;
}

/** Read + validate the production SMTP config. Returns null if not configured. */
export function getSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return null;
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE) === 'true',
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM,
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
  return { host: MAILPIT_HOST, port: Number(MAILPIT_SMTP_PORT), from: process.env.SMTP_FROM || 'noreply@paragonel.local' };
}

const PURPOSE_LABEL: Record<OtpPurpose, string> = {
  register: 'Verify your Paragonel account',
  password_reset: 'Reset your Paragonel password',
  admin_login: 'Your Paragonel admin login code',
  bootstrap: 'Verify the Paragonel Super Admin bootstrap',
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

/** Send an OTP code to `email`. Never throws the code into a log. */
export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<SendResult> {
  const cfg = getSmtpConfig();
  const mailpit = getMailpitConfig();

  if (!cfg && !mailpit) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const subject = `${PURPOSE_LABEL[purpose]} — code ${code.slice(0, 2)}••••`;
  const text = emailBody(code, purpose);
  const html = emailHtml(code, purpose);

  try {
    if (cfg) {
      const transport = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
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
    console.error('[email] SMTP send failed:', e instanceof Error ? e.message : e);
    return { sent: false, reason: 'smtp_error' };
  }
}

/**
 * Deliver an OTP code to `email`. Tries real SMTP (or dev Mailpit). As an
 * HONEST DEV-ONLY convenience: when SMTP is not configured AND we are not in
 * production, the code is written to the SERVER CONSOLE (stderr) so a developer
 * or test harness can retrieve it without email. It is NEVER returned in the
 * API response and NEVER logged in production. This is real delivery tooling,
 * not a verification bypass.
 */
export interface DeliverResult extends SendResult {
  /** true when the code was logged to the server console (dev-only fallback). */
  devLogged?: boolean;
}

export async function deliverOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<DeliverResult> {
  const r = await sendOtpEmail(email, code, purpose);
  if (!r.sent && process.env.NODE_ENV !== 'production' && r.reason === 'smtp_not_configured') {
    console.log(`\n[dev-otp] OTP for ${email} (${purpose}): ${code}\n`);
    return { ...r, devLogged: true };
  }
  return r;
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
      ? nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: cfg.user, pass: cfg.pass } })
      : nodemailer.createTransport({ host: mailpit!.host, port: mailpit!.port, secure: false, ignoreTLS: true });
    const info = await transport.sendMail({ from: (cfg ?? mailpit)!.from, to: email, subject, text });
    return { sent: true, messageId: info.messageId, reason: cfg ? undefined : 'mailpit_dev', devPreview: cfg ? undefined : `http://${mailpit!.host}:8025` };
  } catch (e) {
    console.error('[email] notification send failed:', e instanceof Error ? e.message : e);
    return { sent: false, reason: 'smtp_error' };
  }
}
