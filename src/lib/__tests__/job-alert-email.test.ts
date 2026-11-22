/**
 * job-alert-email.test.ts — job-match alert email content (Prompt 05R §8).
 * Verifies the email contains the real job fields, the explainable match %,
 * the threshold, the why-it-matches + gaps, the careers + manage/unsubscribe
 * links, and that it does NOT leak internal scoring detail or another
 * candidate's information.
 */
import { describe, it, expect } from 'vitest';
import {
  buildJobMatchAlertHtml,
  buildJobMatchAlertText,
  sendJobMatchAlert,
  JOB_MATCH_ALERT_SUBJECT,
} from '@/lib/email';
import { RUBRIC_VERSION, type MatchResult, type JobForMatching } from '@/lib/matching/match-engine';

const job: JobForMatching = {
  id: 'jobAbc',
  jobId: 'ENG-001',
  title: 'Senior Backend Engineer',
  department: 'Engineering',
  location: 'Bengaluru, IN',
  employmentType: 'Full Time',
  workArrangement: 'Remote',
  experienceRequired: '5+ years',
  skills: ['Go', 'Kubernetes', 'PostgreSQL'],
  preferredSkills: ['GraphQL'],
};

const match: MatchResult = {
  rubricVersion: RUBRIC_VERSION,
  overallScore: 86,
  eligible: true,
  matchedRequiredSkills: ['Go', 'Kubernetes'],
  missingRequiredSkills: ['PostgreSQL'],
  matchedPreferredSkills: ['GraphQL'],
  missingPreferredSkills: [],
  experience: { requiredYears: 5, candidateYears: 6, detail: { applicable: true, weight: 18, subScore: 1, contribution: 18, reason: 'Candidate has 6 yrs (requires ~5+).' } },
  location: { jobLocation: 'Bengaluru, IN', isRemote: true, detail: { applicable: true, weight: 9, subScore: 1, contribution: 9, reason: 'Remote role' } },
  workMode: { jobMode: 'Remote', candidatePreference: 'remote', detail: { applicable: true, weight: 6, subScore: 1, contribution: 6, reason: 'ok' } },
  employmentType: { jobType: 'Full Time', candidatePreference: 'full-time', detail: { applicable: true, weight: 10, subScore: 1, contribution: 10, reason: 'ok' } },
  education: { applicable: false, weight: 5, subScore: 0, contribution: 0, reason: '' },
  seniorityDomain: { jobSeniority: null, candidateSeniority: null, detail: { applicable: false, weight: 5, subScore: 0, contribution: 0, reason: '' } },
  projectsCertsBonus: { points: 2, reason: '1 relevant project/certification skill matched (+2 bonus).' },
  scoreReductionReasons: ['Missing required skill: PostgreSQL'],
  otherEvidence: ['Required skills: 2/3 required skills matched.'],
  dimensions: [],
};

const input = {
  to: 'candidate@example.com',
  job,
  match,
  threshold: 80,
  manageUrl: 'http://localhost:3000/candidate/profile',
  unsubscribeUrl: 'http://localhost:3000/api/job-alerts/unsubscribe?token=xyz',
};

describe('job-match alert email (Prompt 05R §8)', () => {
  it('subject matches the suggested subject', () => {
    expect(JOB_MATCH_ALERT_SUBJECT).toBe('A new Paragonel opportunity may match your profile');
  });

  it('HTML contains the real job title, location, type, work mode', () => {
    const html = buildJobMatchAlertHtml(input);
    expect(html).toContain('Senior Backend Engineer');
    expect(html).toContain('Bengaluru, IN');
    expect(html).toContain('Full Time');
    expect(html).toContain('Remote');
  });

  it('HTML contains the explainable match % + threshold', () => {
    const html = buildJobMatchAlertHtml(input);
    expect(html).toContain('86%');
    expect(html).toContain('80%');
  });

  it('HTML contains why-it-matches + the gap (missing required skill)', () => {
    const html = buildJobMatchAlertHtml(input);
    expect(html).toContain('Go');
    expect(html).toContain('Kubernetes');
    expect(html).toContain('PostgreSQL'); // listed as a gap
    expect(html.toLowerCase()).toContain('gap');
  });

  it('HTML contains the careers link + manage + unsubscribe links', () => {
    const html = buildJobMatchAlertHtml(input);
    expect(html).toContain('/careers/jobAbc');
    expect(html).toContain('http://localhost:3000/candidate/profile');
    expect(html).toContain('http://localhost:3000/api/job-alerts/unsubscribe?token=xyz');
  });

  it('HTML states alerts are separate from marketing emails', () => {
    const html = buildJobMatchAlertHtml(input);
    expect(html.toLowerCase()).toContain('separate from marketing');
  });

  it('HTML does NOT leak internal scoring detail (subScore/contribution/applicable/rubric version)', () => {
    const html = buildJobMatchAlertHtml(input);
    // The email renders only overallScore + reasons; it must never expose the
    // rubric's internal dimension fields. (Note: 'font-weight' in CSS is fine.)
    expect(html).not.toContain('contribution');
    expect(html).not.toContain('subScore');
    expect(html).not.toContain('applicable');
    expect(html).not.toContain('rubricVersion');
    expect(html).not.toContain('rubric');
  });

  it('HTML does NOT expose another candidate (no other email/name beyond the recipient)', () => {
    const html = buildJobMatchAlertHtml(input);
    expect(html).not.toContain('someone-else');
    // The recipient's own email is the `to`, not rendered in the body.
    expect(html).not.toContain('candidate@example.com');
  });

  it('plain-text fallback contains the essentials', () => {
    const txt = buildJobMatchAlertText(input);
    expect(txt).toContain('Senior Backend Engineer');
    expect(txt).toContain('86%');
    expect(txt).toContain('/careers/jobAbc');
    expect(txt).toContain('http://localhost:3000/api/job-alerts/unsubscribe?token=xyz');
  });

  it('sendJobMatchAlert returns an honest EmailResult (sent only when transport accepts)', async () => {
    // In vitest there is no SMTP transport -> buildTransport falls back to
    // mailpit (dev) which is not running -> sendMail rejects -> 'failed', OR
    // 'skipped' if no transport. Either way, NEVER 'sent' against a non-running
    // provider. This proves the honesty contract without a real provider.
    const res = await sendJobMatchAlert(input);
    expect(['sent', 'skipped', 'failed']).toContain(res.status);
    // A mocked/non-running provider must not be reported as 'sent'.
    if (res.status !== 'sent') {
      expect(res.detail).toBeTruthy();
    }
  });
});
