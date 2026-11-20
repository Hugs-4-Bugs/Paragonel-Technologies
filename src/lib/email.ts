/**
 * Server-side email service (Phase 1B).
 *
 * Uses Nodemailer with an env-driven SMTP transport. In local development the
 * default transport points at Mailpit (localhost:1025) so generated emails can be
 * inspected in Mailpit's web UI without reaching any real mailbox.
 *
 * Resilience contract:
 *   - The app MUST start even when production SMTP credentials are absent. The
 *     transport is created lazily on first send, so import-time never throws.
 *   - A failed email notification MUST NOT silently discard a successfully stored
 *     CRM lead. Callers store the lead first, then call sendNotifications() and
 *     record the returned status on the lead document for diagnosis/retry.
 *   - No secrets are logged or returned. Errors are surfaced as a short code.
 *
 * Env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS  -> production SMTP
 *   SMTP_FROM        -> sender address for outgoing mail (e.g. Paragonel <noreply@...>)
 *   COMPANY_INBOX    -> recipient for enquiry notifications (provided later; if
 *                       absent, the company notification is skipped, not faked)
 *   APP_BASE_URL     -> public base URL used in email body links
 *   MAILPIT_HOST/MAILPIT_SMTP_PORT -> local override (default localhost:1025)
 */
import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailResult {
  status: 'sent' | 'skipped' | 'failed';
  /** Short, non-sensitive diagnostic code. Never contains secrets or PII. */
  detail?: string;
  messageId?: string;
}

let cachedTransport: Transporter | null = null;
let cachedMode: string | null = null;

function isLocalDev(): boolean {
  // Local dev = emulator active OR explicit preview flag OR no production SMTP host.
  return (
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.NODE_ENV !== 'production'
  );
}

function buildTransport(): { transport: Transporter | null; mode: string } {
  if (cachedTransport && cachedMode) return { transport: cachedTransport, mode: cachedMode };

  const host = process.env.SMTP_HOST;
  if (host && host.trim() !== '') {
    // Explicit SMTP config (production or self-hosted). Requires creds.
    const port = Number(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
      // SMTP host set but no creds: cannot send. Do not guess/fake.
      cachedMode = 'smtp-incomplete';
      cachedTransport = null;
      return { transport: null, mode: cachedMode };
    }
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    cachedMode = 'smtp';
    return { transport: cachedTransport, mode: cachedMode };
  }

  // No SMTP_HOST: in local dev, fall back to Mailpit. In production, skip sending.
  if (isLocalDev()) {
    const mpHost = process.env.MAILPIT_HOST || 'localhost';
    const mpPort = Number(process.env.MAILPIT_SMTP_PORT || '1025');
    cachedTransport = nodemailer.createTransport({
      host: mpHost,
      port: mpPort,
      secure: false,
      // Mailpit ignores auth.
      ignoreTLS: true,
    });
    cachedMode = 'mailpit';
    return { transport: cachedTransport, mode: cachedMode };
  }

  // Production with no SMTP configured: cannot send. App still starts.
  cachedMode = 'smtp-unconfigured';
  cachedTransport = null;
  return { transport: null, mode: cachedMode };
}

export function emailMode(): string {
  return buildTransport().mode;
}

function senderAddress(): string {
  return (
    process.env.SMTP_FROM ||
    (isLocalDev() ? 'Paragonel <noreply@paragonel.local>' : '')
  );
}

async function sendSingle(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  const { transport, mode } = buildTransport();
  if (!transport) {
    return { status: 'skipped', detail: `transport:${mode}` };
  }
  const from = senderAddress();
  if (!from) {
    return { status: 'skipped', detail: 'no-sender-address' };
  }
  try {
    const info = await transport.sendMail({ from, to, subject, text, html });
    return { status: 'sent', messageId: info.messageId, detail: `via:${mode}` };
  } catch (err: unknown) {
    // Non-sensitive short code only.
    const code = err instanceof Error ? err.message.slice(0, 80) : 'unknown';
    return { status: 'failed', detail: `send-error:${code}` };
  }
}

/** Paragonel-branded HTML email wrapper. */
function brandedHtml(title: string, bodyHtml: string): string {
  const baseUrl = process.env.APP_BASE_URL || 'https://paragonel.com';
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#0f172a;padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Paragonel</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px 24px;color:#71717a;font-size:12px;border-top:1px solid #e4e4e7;">
          Paragonel Technologies &middot; <a href="${baseUrl}" style="color:#71717a;">${baseUrl}</a><br/>
          This message was sent by the Paragonel website. Reply directly to reach our team.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export interface ContactNotificationResult {
  acknowledgement: EmailResult;   // to the submitter
  companyNotification: EmailResult; // to the company inbox
}

/**
 * Sends a contact-form acknowledgement to the submitter and an enquiry
 * notification to the company inbox. Returns per-recipient status so the caller
 * can persist it on the lead document for diagnosis/retry.
 */
export async function sendContactNotifications(input: {
  submitterName: string;
  submitterEmail: string;
  company?: string;
  message: string;
}): Promise<ContactNotificationResult> {
  const companyInbox = process.env.COMPANY_INBOX;

  // 1. Acknowledgement to submitter.
  const ackBody = brandedHtml(
    'We received your message',
    `<p>Hi ${escapeHtml(input.submitterName)},</p>
     <p>Thank you for reaching out to Paragonel. We have received your enquiry and our team will get back to you shortly.</p>
     <p style="margin-top:24px;padding:16px;background:#f4f4f5;border-radius:8px;font-size:13px;color:#3f3f46;">
       <strong>Your message:</strong><br/>${escapeHtml(input.message)}
     </p>`
  );
  const acknowledgement = await sendSingle(
    input.submitterEmail,
    'We received your message — Paragonel',
    ackBody,
    `Hi ${input.submitterName}, thank you for contacting Paragonel. We received your enquiry and will reply shortly.`
  );

  // 2. Company notification (only if an inbox is configured — never invented).
  if (!companyInbox || companyInbox.trim() === '') {
    return {
      acknowledgement,
      companyNotification: { status: 'skipped', detail: 'no-company-inbox' },
    };
  }
  const notifyBody = brandedHtml(
    'New website enquiry',
    `<p>A new enquiry was submitted through the contact form.</p>
     <table style="width:100%;font-size:13px;color:#18181b;border-collapse:collapse;margin-top:12px;">
       <tr><td style="padding:6px 0;width:120px;color:#71717a;">Name</td><td>${escapeHtml(input.submitterName)}</td></tr>
       <tr><td style="padding:6px 0;color:#71717a;">Email</td><td>${escapeHtml(input.submitterEmail)}</td></tr>
       <tr><td style="padding:6px 0;color:#71717a;">Company</td><td>${escapeHtml(input.company || '—')}</td></tr>
     </table>
     <p style="margin-top:16px;padding:16px;background:#f4f4f5;border-radius:8px;font-size:13px;color:#3f3f46;">
       ${escapeHtml(input.message)}
     </p>`
  );
  const companyNotification = await sendSingle(
    companyInbox,
    `New enquiry from ${input.submitterName} — Paragonel`,
    notifyBody,
    `New enquiry.\nName: ${input.submitterName}\nEmail: ${input.submitterEmail}\nCompany: ${input.company || '-'}\nMessage: ${input.message}`
  );

  return { acknowledgement, companyNotification };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
