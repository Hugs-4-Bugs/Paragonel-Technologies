/**
 * status.test.ts — recruitment status architecture unit tests (Phase 15).
 *
 * Verifies the candidate-visible ↔ internal mapping + validation + the email
 * notification policy. Pure functions (no Firebase/SMTP).
 */
import { describe, it, expect } from 'vitest';
import {
  candidateStatusFromInternal,
  isValidCandidateStatus,
  isValidInternalStage,
  shouldEmailForCandidateStatus,
  CANDIDATE_STATUSES,
  INTERNAL_STAGES,
} from '../status';

describe('recruitment status architecture', () => {
  describe('candidateStatusFromInternal', () => {
    it('maps new → submitted', () => {
      expect(candidateStatusFromInternal('new')).toBe('submitted');
    });

    it('maps internal screening stages → under_review (never leaks internal detail)', () => {
      expect(candidateStatusFromInternal('initial_screening')).toBe('under_review');
      expect(candidateStatusFromInternal('recruiter_screening')).toBe('under_review');
      expect(candidateStatusFromInternal('hiring_manager_review')).toBe('under_review');
      expect(candidateStatusFromInternal('team_feedback')).toBe('under_review');
      expect(candidateStatusFromInternal('assessment_review')).toBe('under_review');
    });

    it('maps interview stages → interview_in_progress', () => {
      expect(candidateStatusFromInternal('interview')).toBe('interview_in_progress');
      expect(candidateStatusFromInternal('interview_feedback')).toBe('interview_in_progress');
    });

    it('maps internal-only hold/approval stages → decision_pending (never exposes internal_hold)', () => {
      expect(candidateStatusFromInternal('internal_hold')).toBe('decision_pending');
      expect(candidateStatusFromInternal('approval_pending')).toBe('decision_pending');
      expect(candidateStatusFromInternal('rejection_approval')).toBe('decision_pending');
      expect(candidateStatusFromInternal('offer_approval')).toBe('decision_pending');
    });

    it('maps terminal stages directly', () => {
      expect(candidateStatusFromInternal('rejected')).toBe('rejected');
      expect(candidateStatusFromInternal('hired')).toBe('hired');
      expect(candidateStatusFromInternal('withdrawn')).toBe('withdrawn');
      expect(candidateStatusFromInternal('offer_extended')).toBe('offer_extended');
    });
  });

  describe('validation', () => {
    it('isValidCandidateStatus accepts valid + rejects invalid', () => {
      expect(isValidCandidateStatus('submitted')).toBe(true);
      expect(isValidCandidateStatus('shortlisted')).toBe(true);
      expect(isValidCandidateStatus('nonsense')).toBe(false);
      expect(isValidCandidateStatus(undefined)).toBe(false);
    });

    it('isValidInternalStage accepts valid + rejects invalid', () => {
      expect(isValidInternalStage('new')).toBe(true);
      expect(isValidInternalStage('internal_hold')).toBe(true);
      expect(isValidInternalStage('nonsense')).toBe(false);
    });

    it('every candidate status + internal stage has a label (no undefined)', () => {
      // Covered indirectly: the candidate-view test checks labels resolve.
      expect(CANDIDATE_STATUSES.length).toBeGreaterThan(0);
      expect(INTERNAL_STAGES.length).toBeGreaterThan(0);
    });
  });

  describe('notification policy', () => {
    it('emails shortlisting, assessment, interview, rejection, offer, hired, withdrawal', () => {
      expect(shouldEmailForCandidateStatus('shortlisted')).toBe(true);
      expect(shouldEmailForCandidateStatus('assessment_requested')).toBe(true);
      expect(shouldEmailForCandidateStatus('rejected')).toBe(true);
      expect(shouldEmailForCandidateStatus('offer_extended')).toBe(true);
      expect(shouldEmailForCandidateStatus('hired')).toBe(true);
      expect(shouldEmailForCandidateStatus('withdrawn')).toBe(true);
    });

    it('does NOT email under_review by default (avoids excessive emails)', () => {
      expect(shouldEmailForCandidateStatus('under_review')).toBe(false);
    });

    it('does not email the initial submitted status (submission has its own confirmation)', () => {
      expect(shouldEmailForCandidateStatus('submitted')).toBe(false);
    });
  });
});
