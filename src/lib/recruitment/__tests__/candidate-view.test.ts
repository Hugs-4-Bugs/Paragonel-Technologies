/**
 * candidate-view.test.ts — candidate-safe serializer security tests (Phase 15).
 *
 * The CRITICAL security property: internal/confidential fields NEVER reach the
 * candidate API/frontend/email. The serializer is an EXPLICIT ALLOWLIST — any
 * internal field added to the doc is automatically excluded. This test
 * verifies that internalStage, internalNotes, notes (private), interviewer,
 * feedback, outcome, scores, reviewer identities, and compensation discussions
 * are stripped from the candidate view.
 */
import { describe, it, expect } from 'vitest';
import { toCandidateApplication } from '../candidate-view';

describe('toCandidateApplication — candidate-safe serialization', () => {
  const fullDoc = {
    applicationId: 'APP_abc123',
    candidateId: 'cand@example.com',
    candidateName: 'Jane Doe',
    candidateEmail: 'cand@example.com',
    candidatePhone: '555-0100',
    currentLocation: 'Bangalore',
    preferredJobLocation: 'Remote',
    linkedin: 'https://linkedin.com/in/jane',
    portfolio: 'https://github.com/jane',
    currentDesignation: 'Senior Engineer',
    yearsExperience: '5',
    skills: ['React', 'Node.js'],
    coverLetter: 'I am a great fit.',
    expectedSalary: '₹12 LPA',
    noticePeriod: '30 days',
    jobId: 'job-react',
    jobTitle: 'Senior React Engineer',
    company: 'Paragonel Technologies',
    resumeStoragePath: 'candidates/cand@example.com/resumes/1.pdf',
    resumeFileName: '1.pdf',
    // Status architecture
    status: 'New',
    candidateStatus: 'shortlisted',
    internalStage: 'recruiter_screening',
    statusTimeline: [
      { status: 'submitted', label: 'Application submitted', at: '2026-11-01T00:00:00Z', actor: 'system' },
      { status: 'under_review', label: 'Under review', at: '2026-11-02T00:00:00Z', actor: 'recruiter@paragonel.com' },
      { status: 'shortlisted', label: 'Shortlisted', at: '2026-11-03T00:00:00Z', actor: 'recruiter@paragonel.com' },
    ],
    appliedAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-03T00:00:00Z',
    withdrawnAt: null,
    // CONFIDENTIAL INTERNAL FIELDS — must NEVER appear in the candidate view.
    internalNotes: 'Candidate seems strong but salary expectation is high. Internal comp discussion: offer 10 LPA.',
    notes: [
      { id: 'note_1', body: 'Screening call: positive on culture fit.', kind: 'screening', author: 'recruiter@paragonel.com', at: '2026-11-02T00:00:00Z' },
    ],
    matchScore: 87,
    aiReasoning: 'Strong React + Node match. Senior level.',
    // Interview with INTERNAL fields that must be stripped.
    interviews: [
      {
        id: 'iv_1',
        stage: 'Technical Round 1',
        date: '2026-11-05T00:00:00Z',
        startTime: '14:00',
        timeZone: 'Asia/Kolkata',
        mode: 'video',
        meetingLink: 'https://meet.example.com/xyz',
        instructions: 'Prepare a system design.',
        status: 'scheduled',
        candidateVisible: true,
        // INTERNAL — must be stripped:
        interviewer: 'eng@paragonel.com',
        internalNotes: 'Internal: probe on distributed systems weakness.',
        feedback: 'Candidate struggled with consistency models.',
        outcome: 'neutral',
      },
    ],
    recruiter: 'recruiter@paragonel.com',
    hiringManager: 'hm@paragonel.com',
    rejectionReason: 'Salary too high (internal deliberation).',
    deletedAt: null,
  };

  const view = toCandidateApplication(fullDoc, 'doc-id');

  it('returns the candidate-visible identity + snapshot fields', () => {
    expect(view.candidateName).toBe('Jane Doe');
    expect(view.candidateEmail).toBe('cand@example.com');
    expect(view.candidatePhone).toBe('555-0100');
    expect(view.currentLocation).toBe('Bangalore');
    expect(view.skills).toEqual(['React', 'Node.js']);
    expect(view.coverLetter).toBe('I am a great fit.');
    expect(view.jobTitle).toBe('Senior React Engineer');
    expect(view.applicationId).toBe('APP_abc123');
  });

  it('exposes hasResume + fileName ONLY — never the storage path', () => {
    expect(view.hasResume).toBe(true);
    expect(view.resumeFileName).toBe('1.pdf');
    expect((view as unknown as Record<string, unknown>).resumeStoragePath).toBeUndefined();
  });

  it('exposes the candidate-visible status + label', () => {
    expect(view.candidateStatus).toBe('shortlisted');
    expect(view.candidateStatusLabel).toBe('Shortlisted');
  });

  it('NEVER exposes internalStage, internalNotes, notes, scores, reviewer identities, or internal compensation', () => {
    const v = view as unknown as Record<string, unknown>;
    expect(v.internalStage).toBeUndefined();
    expect(v.internalNotes).toBeUndefined();
    expect(v.notes).toBeUndefined();
    expect(v.matchScore).toBeUndefined();
    expect(v.aiReasoning).toBeUndefined();
    expect(v.recruiter).toBeUndefined();
    expect(v.hiringManager).toBeUndefined();
    expect(v.rejectionReason).toBeUndefined();
    expect(v.candidateId).toBeUndefined();
  });

  it('builds the candidate-visible timeline (only approved statuses + labels; no actor)', () => {
    expect(view.timeline).toHaveLength(3);
    expect(view.timeline[0]).toEqual({
      status: 'submitted',
      label: 'Application submitted',
      at: '2026-11-01T00:00:00Z',
    });
    // The actor field from the internal timeline entry is NEVER in the candidate view.
    view.timeline.forEach((entry) => {
      expect((entry as unknown as Record<string, unknown>).actor).toBeUndefined();
    });
  });

  it('exposes only candidate-approved interview fields — never interviewer, internalNotes, feedback, outcome', () => {
    expect(view.interviews).toHaveLength(1);
    const iv = view.interviews[0];
    expect(iv.stage).toBe('Technical Round 1');
    expect(iv.mode).toBe('video');
    expect(iv.meetingLink).toBe('https://meet.example.com/xyz');
    expect(iv.status).toBe('scheduled');
    const ivRecord = iv as unknown as Record<string, unknown>;
    expect(ivRecord.interviewer).toBeUndefined();
    expect(ivRecord.internalNotes).toBeUndefined();
    expect(ivRecord.feedback).toBeUndefined();
    expect(ivRecord.outcome).toBeUndefined();
    expect(ivRecord.candidateVisible).toBeUndefined();
  });

  it('omits interviews marked candidateVisible:false (internal draft feedback)', () => {
    const docWithInternal = {
      ...fullDoc,
      interviews: [
        ...(fullDoc.interviews || []),
        { id: 'iv_2', stage: 'Internal sync', date: '2026-11-06', startTime: '10:00', timeZone: 'Asia/Kolkata', mode: 'video', status: 'completed', candidateVisible: false, feedback: 'internal deliberation' },
      ],
    };
    const v = toCandidateApplication(docWithInternal, 'id');
    expect(v.interviews.find((iv) => iv.id === 'iv_2')).toBeUndefined();
  });

  it('derives the candidate status from the legacy status field if candidateStatus is absent', () => {
    const legacyDoc = { ...fullDoc, candidateStatus: undefined, status: 'Hired' };
    const v = toCandidateApplication(legacyDoc, 'id');
    expect(v.candidateStatus).toBe('hired');
    expect(v.candidateStatusLabel).toBe('Hired');
  });

  it('handles a minimal doc (no timeline, no interviews, no snapshot fields)', () => {
    const minimal = {
      applicationId: 'APP_x',
      candidateEmail: 'a@b.com',
      jobId: 'j1',
      jobTitle: 'Role',
      appliedAt: '2026-11-01',
    };
    const v = toCandidateApplication(minimal, 'id');
    expect(v.candidateStatus).toBe('submitted');
    expect(v.timeline).toEqual([]);
    expect(v.interviews).toEqual([]);
    expect(v.skills).toEqual([]);
    expect(v.hasResume).toBe(false);
  });
});
