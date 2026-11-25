/**
 * notifications.ts — candidate-facing recruitment email notifications (Phase 9).
 *
 * Sends branded emails for the candidate-visible status transitions that the
 * notification policy requires: shortlisting, assessment request, rejection,
 * offer extended, hired, withdrawal confirmation. (Application submission is
 * handled by sendApplicationConfirmation in email.ts. Interview
 * scheduled/rescheduled/cancelled is handled by sendInterviewEmail here.)
 *
 * `under_review` is intentionally NOT emailed by default (configurable) — avoids
 * excessive emails for internal churn.
 *
 * Idempotency / safety:
 *   - The DB is the source of truth. A failed email NEVER reverts the status
 *     change (callers await-but-catch).
 *   - Duplicate emails during retries are prevented by the caller (the admin
 *     route appends the timeline entry once; the email is sent once per action).
 *   - No internal/confidential details ever appear in these emails: no reviewer
 *     identities, no internal notes, no scores, no compensation discussions.
 */
import { sendBrandedEmail, type EmailResult } from '@/lib/email';
import {
  type CandidateStatus,
  CANDIDATE_STATUS_LABELS,
  shouldEmailForCandidateStatus,
} from './status';

const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://paragonel.com';
const DASHBOARD_URL = `${BASE_URL}/candidate/applications`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CandidateEmailInput {
  to: string;
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  status: CandidateStatus;
  /** Optional context (e.g. assessment link, offer details). Never internal notes. */
  contextNote?: string;
}

/** Per-status email subject lines. */
function subjectFor(status: CandidateStatus, jobTitle: string): string {
  const job = jobTitle ? ` — ${jobTitle}` : '';
  switch (status) {
    case 'shortlisted':
      return `You've been shortlisted${job} — Paragonel`;
    case 'assessment_requested':
      return `Assessment requested${job} — Paragonel`;
    case 'rejected':
    case 'not_selected':
      return `Update on your application${job} — Paragonel`;
    case 'offer_extended':
      return `Offer from Paragonel${job} — Paragonel`;
    case 'hired':
      return `Welcome to Paragonel${job} — Paragonel`;
    case 'withdrawn':
      return `Application withdrawn${job} — Paragonel`;
    default:
      return `Update on your application${job} — Paragonel`;
  }
}

/** Per-status email body (HTML). Builds only candidate-approved content. */
function bodyFor(input: CandidateEmailInput): string {
  const { candidateName, jobTitle, applicationId, status, contextNote } = input;
  const name = escapeHtml(candidateName || 'there');
  const job = escapeHtml(jobTitle);
  const ref = escapeHtml(applicationId);
  const label = CANDIDATE_STATUS_LABELS[status];
  const ctx = contextNote ? `<p style="margin-top:16px;padding:16px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#3f3f46;">${escapeHtml(contextNote)}</p>` : '';
  const dashboard = `<p style="margin-top:24px;font-size:14px;"><a href="${DASHBOARD_URL}" style="color:#2563eb;">Track your application</a> in your candidate dashboard.</p>`;

  const intro = `<p>Hi ${name},</p>`;
  const refLine = `<p style="font-size:13px;color:#71717a;">Application reference: <strong>${ref}</strong>${job ? ` &middot; ${job}` : ''}</p>`;

  let body = '';
  switch (status) {
    case 'shortlisted':
      body = `<p>Thank you for applying for <strong>${job}</strong>. We're pleased to let you know your application has been shortlisted, and our team will be in touch regarding next steps.</p>`;
      break;
    case 'assessment_requested':
      body = `<p>As part of your application for <strong>${job}</strong>, we'd like to invite you to complete an assessment. Please review the details below and complete it at your earliest convenience.</p>`;
      break;
    case 'rejected':
    case 'not_selected':
      body = `<p>Thank you for your interest in <strong>${job}</strong> at Paragonel. After careful review, we have decided not to move forward with your application at this time. We appreciate the time you invested and encourage you to apply for future openings.</p>`;
      break;
    case 'offer_extended':
      body = `<p>Congratulations! We are delighted to extend an offer for <strong>${job}</strong> at Paragonel. Please review the offer details and respond at your earliest convenience.</p>`;
      break;
    case 'hired':
      body = `<p>Welcome to Paragonel! We're thrilled to confirm your hire for <strong>${job}</strong>. Our team will be in touch shortly with your onboarding details.</p>`;
      break;
    case 'withdrawn':
      body = `<p>This is to confirm that your application for <strong>${job}</strong> has been withdrawn as requested. Thank you for your interest in Paragonel — we hope you'll consider us again in the future.</p>`;
      break;
    default:
      body = `<p>The status of your application for <strong>${job}</strong> has been updated to: <strong>${escapeHtml(label)}</strong>.</p>`;
  }
  return `${intro}${refLine}${body}${ctx}${dashboard}`;
}

/** Plain-text body (for clients without HTML + for deliverability). */
function textFor(input: CandidateEmailInput): string {
  const { candidateName, jobTitle, applicationId, status, contextNote } = input;
  const label = CANDIDATE_STATUS_LABELS[status];
  const ctx = contextNote ? `\n\nNote: ${contextNote}` : '';
  return `Hi ${candidateName || 'there'},\n\nUpdate on your application for ${jobTitle} (ref: ${applicationId}).\nStatus: ${label}.${ctx}\n\nTrack your application: ${DASHBOARD_URL}\n\n— Paragonel Technologies`;
}

/**
 * Send a candidate status email. Returns the EmailResult so the caller can
 * persist it for diagnosis. Callers MUST await-but-catch: a failed email does
 * not revert the status change (the DB is the source of truth).
 */
export async function sendCandidateStatusEmail(input: CandidateEmailInput): Promise<EmailResult> {
  // Honor the notification policy: not every status is emailed (under_review is
  // skipped by default). The caller should still call this for every published
  // transition; the policy decides here whether to actually send.
  if (!shouldEmailForCandidateStatus(input.status)) {
    return { status: 'skipped', detail: 'policy:no-email-for-status' };
  }
  const subject = subjectFor(input.status, input.jobTitle);
  const bodyHtml = bodyFor(input);
  const text = textFor(input);
  return sendBrandedEmail({
    to: input.to,
    subject,
    title: subject.replace(' — Paragonel', ''),
    bodyHtml,
    text,
  });
}

/** Interview details shown to the candidate (approved fields only). */
export interface InterviewEmailDetails {
  stage: string;
  date: string; // ISO
  startTime: string;
  timeZone: string;
  mode: string;
  meetingLink?: string;
  instructions?: string;
}

/**
 * Send an interview email (scheduled / rescheduled / cancelled). Includes the
 * candidate-approved interview details. No internal interviewer notes or feedback.
 */
export async function sendInterviewEmail(input: {
  to: string;
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  kind: 'scheduled' | 'rescheduled' | 'cancelled';
  details: InterviewEmailDetails;
}): Promise<EmailResult> {
  const { kind, details, candidateName, jobTitle, applicationId } = input;
  const name = escapeHtml(candidateName || 'there');
  const job = escapeHtml(jobTitle);
  const ref = escapeHtml(applicationId);
  const subject =
    kind === 'scheduled' ? `Interview scheduled${job ? ` — ${jobTitle}` : ''} — Paragonel`
    : kind === 'rescheduled' ? `Interview rescheduled${job ? ` — ${jobTitle}` : ''} — Paragonel`
    : `Interview cancelled${job ? ` — ${jobTitle}` : ''} — Paragonel`;
  const title = subject.replace(' — Paragonel', '');

  const detailRows = [
    ['Stage', details.stage],
    ['Date', details.date],
    ['Time', `${details.startTime} ${details.timeZone}`],
    ['Mode', details.mode],
    ...(details.meetingLink ? [['Join', details.meetingLink]] : []),
  ];
  const detailsHtml = detailRows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#71717a;font-size:13px;width:90px;">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(v)}</td></tr>`)
    .join('');
  const instr = details.instructions
    ? `<p style="margin-top:12px;font-size:13px;color:#3f3f46;">${escapeHtml(details.instructions)}</p>`
    : '';

  const bodyHtml =
    kind === 'cancelled'
      ? `<p>Hi ${name},</p><p style="font-size:13px;color:#71717a;">Application reference: <strong>${ref}</strong>${job ? ` &middot; ${job}` : ''}</p><p>We're writing to let you know that your interview for <strong>${job}</strong> has been cancelled. Our team will reach out regarding next steps.</p>`
      : `<p>Hi ${name},</p><p style="font-size:13px;color:#71717a;">Application reference: <strong>${ref}</strong>${job ? ` &middot; ${job}` : ''}</p><p>Your interview for <strong>${job}</strong> has been ${kind === 'rescheduled' ? 'rescheduled' : 'scheduled'}. Here are the details:</p><table style="margin-top:8px;">${detailsHtml}</table>${instr}<p style="margin-top:24px;font-size:14px;"><a href="${DASHBOARD_URL}" style="color:#2563eb;">Track your application</a> in your candidate dashboard.</p>`;

  const text =
    kind === 'cancelled'
      ? `Hi ${candidateName},\n\nYour interview for ${jobTitle} (ref: ${applicationId}) has been cancelled. Our team will reach out.\n\n${DASHBOARD_URL}`
      : `Hi ${candidateName},\n\nYour interview for ${jobTitle} (ref: ${applicationId}) has been ${kind === 'rescheduled' ? 'rescheduled' : 'scheduled'}.\nStage: ${details.stage}\nDate: ${details.date}\nTime: ${details.startTime} ${details.timeZone}\nMode: ${details.mode}${details.meetingLink ? `\nJoin: ${details.meetingLink}` : ''}${details.instructions ? `\n\n${details.instructions}` : ''}\n\n${DASHBOARD_URL}`;

  return sendBrandedEmail({ to: input.to, subject, title, bodyHtml, text });
}
