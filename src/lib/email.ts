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

/* -------------------------------------------------------------------------- */
/* Job-match alert (Prompt 05R §8)                                             */
/* -------------------------------------------------------------------------- */
/*
 * Sent to a candidate's verified account email when a genuinely published job
 * scores at or above their threshold AND they have opted in. The content uses
 * ONLY the candidate's own match result + the real published job fields — never
 * another candidate's information, never a resume, never internal scoring detail
 * beyond the percentage + the human-readable reasons already in the MatchResult.
 *
 * Delivery honesty: sendJobMatchAlert returns the EmailResult from sendSingle,
 * which is 'sent' ONLY when the transport accepted the message (a real provider
 * messageId is captured). It is 'skipped' when no transport is configured and
 * 'failed' on a transport error. Callers MUST NOT treat 'skipped'/'failed' as
 * 'sent' (Prompt 05R §8: "Never send a notification if the email provider reports
 * failure and claim it succeeded").
 */
import type { MatchResult, JobForMatching } from '@/lib/matching/match-engine';

export interface JobMatchAlertInput {
  to: string;
  job: JobForMatching;
  match: MatchResult;
  threshold: number;
  /** Login-gated manage-preferences page (the candidate's own profile). */
  manageUrl: string;
  /** Signed one-click unsubscribe URL (bound to this candidate only). */
  unsubscribeUrl: string;
}

/** Subject line for the job-match alert (Prompt 05R §8 suggested subject). */
export const JOB_MATCH_ALERT_SUBJECT = 'A new Paragonel opportunity may match your profile';

/** Build the branded HTML body for a job-match alert. Exported for tests. */
export function buildJobMatchAlertHtml(input: JobMatchAlertInput): string {
  const { job, match, threshold, manageUrl, unsubscribeUrl } = input;
  const jobUrl = `${process.env.APP_BASE_URL || ''}/careers/${encodeURIComponent(job.id)}`;
  const matchedSkills = match.matchedRequiredSkills;
  const missingSkills = match.missingRequiredSkills;
  const whyBits: string[] = [];
  if (matchedSkills.length) {
    whyBits.push(`Your profile matches ${matchedSkills.length} required skill${matchedSkills.length > 1 ? 's' : ''}: ${matchedSkills.map(escapeHtml).join(', ')}.`);
  }
  for (const ev of match.otherEvidence.slice(0, 3)) whyBits.push(escapeHtml(ev));
  const whyHtml = whyBits.length
    ? `<ul style="margin:8px 0 0;padding-left:20px;font-size:13px;color:#3f3f46;">${whyBits.map((b) => `<li>${b}</li>`).join('')}</ul>`
    : '';
  const gapsHtml = missingSkills.length
    ? `<p style="margin-top:16px;padding:14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:12px;color:#9a3412;">
        <strong>Heads up — gaps:</strong> this role also lists skills you have not added to your profile
        (${missingSkills.map(escapeHtml).join(', ')}). Adding them could improve future matches, but you may still
        apply if you meet the core requirements.
      </p>`
    : '';
  const meta = [
    job.department ? `Department: ${job.department}` : '',
    job.location ? `Location: ${job.location}` : '',
    job.employmentType ? `Type: ${job.employmentType}` : '',
    job.workArrangement ? `Work mode: ${job.workArrangement}` : '',
  ].filter(Boolean).join(' &middot; ');

  const body = `
    <p>A new role at Paragonel Technologies may fit your saved candidate profile.</p>
    <p style="font-size:16px;color:#0f172a;font-weight:700;margin:4px 0 2px;">${escapeHtml(job.title)}</p>
    <p style="margin:0 0 12px;font-size:12px;color:#71717a;">${meta}</p>
    <p style="margin-top:12px;padding:14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:14px;color:#065f46;">
      <strong>Profile match: ${match.overallScore}%</strong>
      &nbsp;<span style="font-size:12px;color:#047857;">(your alert threshold: ${threshold}%)</span>
    </p>
    <p style="font-size:13px;color:#3f3f46;margin-top:12px;"><strong>Why we thought of you</strong></p>
    ${whyHtml}
    ${gapsHtml}
    <p style="margin-top:20px;">
      <a href="${escapeHtml(jobUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">View role &amp; apply</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#71717a;">
      These alerts are based on how well new roles match your saved profile — they are separate from marketing emails.
      <br/>
      <a href="${escapeHtml(manageUrl)}" style="color:#71717a;">Manage your preferences</a>
      &nbsp;&middot;&nbsp;
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#71717a;">Turn off job alerts</a>
    </p>`;
  return brandedHtml('A new opportunity may match your profile', body);
}

/** Plain-text fallback for the job-match alert. */
export function buildJobMatchAlertText(input: JobMatchAlertInput): string {
  const { job, match, threshold } = input;
  const jobUrl = `${process.env.APP_BASE_URL || ''}/careers/${encodeURIComponent(job.id)}`;
  const lines = [
    `A new Paragonel opportunity may match your profile`,
    ``,
    `${job.title}`,
    [job.department, job.location, job.employmentType, job.workArrangement].filter(Boolean).join(' | '),
    ``,
    `Profile match: ${match.overallScore}% (your threshold: ${threshold}%)`,
    ``,
    `Why we thought of you:`,
    ...match.otherEvidence.slice(0, 3),
    ...(match.matchedRequiredSkills.length ? [`Matched skills: ${match.matchedRequiredSkills.join(', ')}`] : []),
    ...(match.missingRequiredSkills.length ? [`Also lists (gaps): ${match.missingRequiredSkills.join(', ')}`] : []),
    ``,
    `View role & apply: ${jobUrl}`,
    ``,
    `These alerts match your saved profile and are separate from marketing emails.`,
    `Manage preferences: ${input.manageUrl}`,
    `Turn off job alerts: ${input.unsubscribeUrl}`,
  ];
  return lines.join('\n');
}

/**
 * Send a job-match alert email to a candidate's verified address. Returns the
 * honest EmailResult (sent/skipped/failed) — callers record it on the
 * jobAlertsSent doc and never claim success on a non-'sent' status.
 */
export async function sendJobMatchAlert(input: JobMatchAlertInput): Promise<EmailResult> {
  const html = buildJobMatchAlertHtml(input);
  const text = buildJobMatchAlertText(input);
  return sendSingle(input.to, JOB_MATCH_ALERT_SUBJECT, html, text);
}

/* -------------------------------------------------------------------------- */
/* Application confirmation (Phase 5.2 / Prompt 05Q §9)                        */
/* -------------------------------------------------------------------------- */
/*
 * Sent to the candidate's verified account email immediately after a successful
 * application submission. Includes the job title, company, application reference
 * (the APP_ id), and the server-recorded submission time.
 *
 * Resume attachment policy (Prompt 05Q §9): the candidate's own resume is
 * attached ONLY when (a) the resume path resolves from the authenticated
 * application record (never the request body — another candidate's resume can
 * never be attached), (b) the file downloads successfully from private Storage,
 * and (c) its size is within the safe SMTP attachment limit. If any of those
 * fail, the email is still sent with a secure authenticated reference (a link
 * to the candidate's own profile where the resume can be viewed) instead of an
 * attachment. A public, permanent resume URL is NEVER included.
 *
 * Delivery honesty: returns the same EmailResult contract (sent/skipped/failed)
 * so the caller can record the real status on the application document.
 */

/** Conservative max attachment size — well under common SMTP (~10MB) limits. */
export const SAFE_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB

export interface ApplicationConfirmationInput {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  applicationId: string;
  appliedAt: Date;
  /** Optional resume attachment (Buffer + filename). Attached only if provided. */
  resumeBuffer?: Buffer;
  resumeFileName?: string;
  /** Candidate's own profile URL (where the resume + application can be viewed). */
  profileUrl?: string;
}

export const APPLICATION_CONFIRMATION_SUBJECT = 'Application received — Paragonel';

/** Build the branded HTML body for the application confirmation. Exported for tests. */
export function buildApplicationConfirmationHtml(input: ApplicationConfirmationInput): string {
  const company = input.companyName || 'Paragonel Technologies';
  const baseUrl = process.env.APP_BASE_URL || 'https://paragonel.com';
  const profileUrl = input.profileUrl || `${baseUrl}/candidate/profile`;
  const appliedAtStr = input.appliedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
  const resumeNote = input.resumeBuffer
    ? `<p style="margin-top:16px;font-size:12px;color:#71717a;">Your resume (${escapeHtml(input.resumeFileName || 'resume')}) is attached to this email for your records.</p>`
    : `<p style="margin-top:16px;font-size:12px;color:#71717a;">Your resume is saved securely with your application — you can view it any time in your <a href="${escapeHtml(profileUrl)}" style="color:#71717a;">candidate profile</a>.</p>`;
  const body = `
    <p>Hi ${escapeHtml(input.candidateName || 'there')},</p>
    <p>Thank you for applying. We have received your application for the following role:</p>
    <p style="font-size:16px;color:#0f172a;font-weight:700;margin:4px 0 2px;">${escapeHtml(input.jobTitle)}</p>
    <p style="margin:0 0 12px;font-size:12px;color:#71717a;">${escapeHtml(company)}</p>
    <table style="width:100%;font-size:13px;color:#18181b;border-collapse:collapse;margin-top:12px;">
      <tr><td style="padding:6px 0;width:170px;color:#71717a;">Application reference</td><td><strong>${escapeHtml(input.applicationId)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#71717a;">Submitted</td><td>${escapeHtml(appliedAtStr)}</td></tr>
    </table>
    ${resumeNote}
    <p style="margin-top:20px;">
      <a href="${escapeHtml(profileUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">View your application</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#71717a;">
      Our team reviews every application. We will contact you only if your profile is shortlisted for this role.
      You can apply for other roles any time from the <a href="${escapeHtml(baseUrl)}/careers" style="color:#71717a;">Careers page</a>.
    </p>`;
  return brandedHtml('We received your application', body);
}

/** Plain-text fallback for the application confirmation. Exported for tests. */
export function buildApplicationConfirmationText(input: ApplicationConfirmationInput): string {
  const company = input.companyName || 'Paragonel Technologies';
  const baseUrl = process.env.APP_BASE_URL || 'https://paragonel.com';
  const profileUrl = input.profileUrl || `${baseUrl}/candidate/profile`;
  const appliedAtStr = input.appliedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
  return [
    `Application received — ${company}`,
    ``,
    `Hi ${input.candidateName || 'there'},`,
    ``,
    `Thank you for applying. We received your application for:`,
    `${input.jobTitle}`,
    company,
    ``,
    `Application reference: ${input.applicationId}`,
    `Submitted: ${appliedAtStr}`,
    ``,
    input.resumeBuffer
      ? `Your resume (${input.resumeFileName || 'resume'}) is attached.`
      : `Your resume is saved securely with your application — view it in your candidate profile: ${profileUrl}`,
    ``,
    `View your application: ${profileUrl}`,
    ``,
    `Our team reviews every application. We will contact you only if your profile is shortlisted.`,
  ].join('\n');
}

/**
 * Send the application confirmation email. Attaches the candidate's own resume
 * (Buffer) when provided; otherwise sends a secure-reference email. Returns the
 * honest EmailResult — callers record it on the application document.
 */
export async function sendApplicationConfirmation(input: ApplicationConfirmationInput): Promise<EmailResult> {
  const html = buildApplicationConfirmationHtml(input);
  const text = buildApplicationConfirmationText(input);
  const { transport, mode } = buildTransport();
  if (!transport) return { status: 'skipped', detail: `transport:${mode}` };
  const from = senderAddress();
  if (!from) return { status: 'skipped', detail: 'no-sender-address' };
  try {
    const attachments =
      input.resumeBuffer && input.resumeFileName
        ? [{
            filename: input.resumeFileName.slice(0, 100),
            content: input.resumeBuffer,
            contentType: 'application/octet-stream',
          }]
        : [];
    const info = await transport.sendMail({ from, to: input.to, subject: APPLICATION_CONFIRMATION_SUBJECT, text, html, attachments });
    return { status: 'sent', messageId: info.messageId, detail: `via:${mode}` };
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message.slice(0, 80) : 'unknown';
    return { status: 'failed', detail: `send-error:${code}` };
  }
}

/* -------------------------------------------------------------------------- */
/* Newsletter confirmation (Phase 7)                                          */
/* -------------------------------------------------------------------------- */
/*
 * Sent to a subscriber immediately after a successful subscription. Confirms
 * the subscription, sets expectations (occasional product/company updates),
 * and includes a one-click unsubscribe link (signed token bound to the
 * subscriber's email). This is NOT marketing email — it is a transactional
 * confirmation of the subscription action the user just took, so it is sent
 * even before any campaign exists.
 *
 * The unsubscribe link is generated by the caller (which has the OTP_SECRET)
 * and passed in; this module stays decoupled from the token-signing logic.
 */

export interface NewsletterConfirmationInput {
  to: string;
  /** Signed one-click unsubscribe URL (bound to this email). Empty if unavailable. */
  unsubscribeUrl?: string;
  /** Signed confirmation URL for double opt-in (bound to this email). When
   *  present the email is a "confirm your subscription" request; when absent
   *  it falls back to a plain welcome. Empty if unavailable. */
  confirmUrl?: string;
}

export const NEWSLETTER_CONFIRMATION_SUBJECT = 'Confirm your Paragonel newsletter subscription';

export function buildNewsletterConfirmationHtml(input: NewsletterConfirmationInput): string {
  const baseUrl = process.env.APP_BASE_URL || 'https://paragonel.com';
  const unsub = input.unsubscribeUrl || '';
  const confirm = input.confirmUrl || '';
  const confirmHtml = confirm
    ? `<p style="margin-top:16px;"><a href="${escapeHtml(confirm)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;font-weight:600;">Confirm your subscription</a></p>
       <p style="margin-top:12px;font-size:13px;color:#52525b;">If you did not subscribe, you can safely ignore this email — no subscription is activated until you click the link above.</p>`
    : '';
  const headline = confirm
    ? 'You are almost subscribed'
    : 'You are subscribed';
  const intro = confirm
    ? 'Click the button below to confirm your subscription to the Paragonel newsletter. We will send occasional updates about our products, services, and company news.'
    : 'You are now subscribed to the Paragonel newsletter. Thank you for your interest — we will send occasional updates about our products, services, and company news.';
  const unsubHtml = unsub
    ? `<p style="margin-top:24px;font-size:12px;color:#71717a;">You can <a href="${escapeHtml(unsub)}" style="color:#71717a;">unsubscribe anytime</a>. These emails are separate from job-match alerts and from any enquiry you may submit.</p>`
    : `<p style="margin-top:24px;font-size:12px;color:#71717a;">You can unsubscribe anytime by replying to this email. These emails are separate from job-match alerts and from any enquiry you may submit.</p>`;
  const body = `
    <p>Hi,</p>
    <p>${escapeHtml(intro)}</p>
    ${confirmHtml}
    <p style="margin-top:16px;">
      <a href="${escapeHtml(baseUrl)}" style="color:#0f172a;text-decoration:underline;font-size:14px;">Visit paragonel.com</a>
    </p>
    ${unsubHtml}`;
  return brandedHtml(headline, body);
}

export function buildNewsletterConfirmationText(input: NewsletterConfirmationInput): string {
  const baseUrl = process.env.APP_BASE_URL || 'https://paragonel.com';
  const lines = [
    input.confirmUrl ? 'Confirm your Paragonel newsletter subscription' : 'Welcome to the Paragonel newsletter',
    ``,
    input.confirmUrl
      ? 'Click the link below to confirm your subscription. We will send occasional updates about our products, services, and company news.'
      : 'You are now subscribed. We will send occasional updates about our products, services, and company news.',
    ``,
    input.confirmUrl ? `Confirm your subscription: ${input.confirmUrl}` : `Visit ${baseUrl}`,
    ``,
    input.unsubscribeUrl
      ? `Unsubscribe anytime: ${input.unsubscribeUrl}`
      : `You can unsubscribe anytime by replying to this email.`,
    ``,
    `These emails are separate from job-match alerts and from any enquiry you may submit.`,
  ];
  return lines.join('\n');
}

export async function sendNewsletterConfirmation(input: NewsletterConfirmationInput): Promise<EmailResult> {
  const html = buildNewsletterConfirmationHtml(input);
  const text = buildNewsletterConfirmationText(input);
  return sendSingle(input.to, NEWSLETTER_CONFIRMATION_SUBJECT, html, text);
}
