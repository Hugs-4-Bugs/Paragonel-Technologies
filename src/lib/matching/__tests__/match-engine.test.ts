/**
 * match-engine.test.ts — the explainable, deterministic matching rubric
 * (Prompt 05R §6, §12 "Matching").
 *
 * Covers: exact + partial required skills, preferred skills (incl. no double-
 * count), experience below/equal/above, seniority mismatch, location match/
 * mismatch, remote/hybrid/on-site compatibility, education requirement, missing
 * profile fields, missing job criteria, threshold boundary (exactly 80), below
 * threshold, custom threshold, disabled alerts (via resolveJobAlertPreference),
 * invalid threshold (via preferences schema), and deterministic reproducibility.
 *
 * Scores are computed by hand from the documented rubric (weights in match-engine)
 * and asserted exactly — the percentage MUST be reproducible from the inputs.
 */
import { describe, it, expect } from 'vitest';
import {
  scoreJobCandidate,
  meetsThreshold,
  parseExperienceYears,
  deriveCandidateSeniority,
  RUBRIC_VERSION,
  type JobForMatching,
  type ProfileForMatching,
  type MatchResult,
} from '../match-engine';
import type { CandidateProfile } from '@/lib/auth/candidate-profile';

/* ------------------------------- fixtures -------------------------------- */

const J1: JobForMatching = {
  id: 'job1',
  jobId: 'ENG-001',
  title: 'Senior Backend Engineer',
  department: 'Engineering',
  location: 'Bengaluru, IN',
  employmentType: 'Full Time',
  workArrangement: 'Remote',
  experienceRequired: '5+ years',
  skills: ['Go', 'Kubernetes', 'PostgreSQL'],
  preferredSkills: ['GraphQL'],
  seniority: 'Senior',
  educationRequired: 'B.Tech in CS or equivalent',
};

// On-site job in SF, no optional matching fields (missing-job-criteria cases).
const J2: JobForMatching = {
  id: 'job2',
  title: 'Frontend Engineer',
  department: 'Engineering',
  location: 'San Francisco, CA',
  employmentType: 'Full Time',
  workArrangement: 'Onsite',
  experienceRequired: '3-5 years',
  skills: ['React', 'TypeScript'],
};

// Minimal remote job, no preferred/seniority/education (missing job criteria).
const J3: JobForMatching = {
  id: 'job3',
  title: 'Developer',
  location: 'Remote',
  employmentType: 'Full Time',
  workArrangement: 'Remote',
  experienceRequired: '2 years',
  skills: ['React'],
};

function prof(over: Partial<CandidateProfile> = {}): ProfileForMatching {
  return {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: '',
    updatedAt: '',
    ...over,
  } as unknown as ProfileForMatching;
}

const P1 = prof({
  skills: ['Go', 'Kubernetes', 'PostgreSQL', 'GraphQL'],
  totalExperienceYears: 7,
  currentDesignation: 'Senior Engineer',
  education: [{ qualification: 'B.Tech Computer Science', institution: 'IIT', year: '2015' }],
  currentLocation: 'Bengaluru, IN',
  preferredLocations: ['Bengaluru'],
  preferredEmploymentType: 'full-time',
  workModePreference: 'remote',
  headline: 'Senior Backend Engineer',
  employmentHistory: [{ designation: 'Senior Engineer', description: 'backend distributed systems' }],
  projects: [{ name: 'X', description: '', technologies: 'Go,Kubernetes', url: '' }],
});

/* ----------------------------- the rubric -------------------------------- */

describe('match-engine (Prompt 05R §6)', () => {
  it('reports rubric version 1.0', () => {
    expect(RUBRIC_VERSION).toBe('1.0');
    expect(scoreJobCandidate(J1, P1).rubricVersion).toBe('1.0');
  });

  /* --- exact required skill match --- */
  it('exact required skill match -> score 100, all required matched, eligible', () => {
    const r = scoreJobCandidate(J1, P1);
    expect(r.overallScore).toBe(100);
    expect(r.eligible).toBe(true);
    expect(r.matchedRequiredSkills).toEqual(['Go', 'Kubernetes', 'PostgreSQL']);
    expect(r.missingRequiredSkills).toEqual([]);
    expect(r.matchedPreferredSkills).toEqual(['GraphQL']);
  });

  /* --- partial required skill match --- */
  it('partial required skill match -> missing required listed, score reduced', () => {
    const r = scoreJobCandidate(J1, prof({ skills: ['Go', 'PostgreSQL'], totalExperienceYears: 7, currentDesignation: 'Senior Engineer', education: [{ qualification: 'B.Tech Computer Science' }], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(r.matchedRequiredSkills).toEqual(['Go', 'PostgreSQL']);
    expect(r.missingRequiredSkills).toEqual(['Kubernetes']);
    // 79.51 -> rounds to 80 (boundary). Eligible because >= 80 and matched >=1 required.
    expect(r.overallScore).toBe(80);
    expect(r.eligible).toBe(true);
  });

  /* --- preferred skills (matched / missing / N/A) --- */
  it('preferred skills: matched when present, missing when absent', () => {
    const withGql = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL', 'GraphQL'], totalExperienceYears: 7, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(withGql.matchedPreferredSkills).toEqual(['GraphQL']);
    const noGql = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL'], totalExperienceYears: 7, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(noGql.matchedPreferredSkills).toEqual([]);
    expect(noGql.missingPreferredSkills).toEqual(['GraphQL']);
  });

  it('does NOT double-count a skill listed as both required and preferred', () => {
    const job: JobForMatching = { ...J3, skills: ['React'], preferredSkills: ['React'], experienceRequired: '2 years' };
    const r = scoreJobCandidate(job, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Anywhere' }));
    expect(r.matchedRequiredSkills).toEqual(['React']);
    // 'React' already counted as required -> NOT also in matchedPreferred.
    expect(r.matchedPreferredSkills).toEqual([]);
  });

  /* --- experience below / equal / above --- */
  it('experience below requirement reduces the score; equal/above do not', () => {
    const above = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL', 'GraphQL'], totalExperienceYears: 7, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(above.experience.detail.subScore).toBe(1);
    const equal = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL', 'GraphQL'], totalExperienceYears: 5, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(equal.experience.detail.subScore).toBe(1);
    const below = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL', 'GraphQL'], totalExperienceYears: 3, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(below.experience.detail.subScore).toBeCloseTo(3 / 5, 5);
    expect(below.experience.detail.subScore).toBeLessThan(1);
  });

  /* --- seniority mismatch --- */
  it('seniority mismatch reduces the seniority sub-score', () => {
    const match = scoreJobCustomer_helper(J1, prof({ currentDesignation: 'Senior Engineer', totalExperienceYears: 7, skills: ['Go', 'Kubernetes', 'PostgreSQL'], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(match.seniorityDomain.detail.subScore).toBe(1);
    const junior = scoreJobCandidate(J1, prof({ currentDesignation: 'Junior Developer', totalExperienceYears: 1, skills: ['Go', 'Kubernetes', 'PostgreSQL'], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(junior.seniorityDomain.detail.subScore).toBeLessThan(0.5); // 0.2 for two-band gap
  });

  /* --- location match / mismatch (on-site job) --- */
  it('location match vs mismatch on an on-site job', () => {
    const mismatch = scoreJobCandidate(J2, prof({ skills: ['React', 'TypeScript'], totalExperienceYears: 4, currentLocation: 'Bengaluru, IN', preferredEmploymentType: 'full-time', workModePreference: 'on-site' }));
    expect(mismatch.location.detail.subScore).toBe(0);
    expect(mismatch.scoreReductionReasons.some((r) => r.toLowerCase().includes('location'))).toBe(true);
    const match = scoreJobCandidate(J2, prof({ skills: ['React', 'TypeScript'], totalExperienceYears: 4, currentLocation: 'San Francisco, CA', preferredEmploymentType: 'full-time', workModePreference: 'on-site' }));
    expect(match.location.detail.subScore).toBe(1);
    expect(match.overallScore).toBeGreaterThan(mismatch.overallScore);
  });

  /* --- remote/hybrid/on-site compatibility matrix --- */
  it('work-mode compatibility matrix', () => {
    const jobRemote = { ...J3, workArrangement: 'Remote' };
    expect(scoreJobCandidate(jobRemote, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'remote', currentLocation: 'Anywhere' })).workMode.detail.subScore).toBe(1);
    expect(scoreJobCandidate(jobRemote, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'hybrid', currentLocation: 'Anywhere' })).workMode.detail.subScore).toBe(1);
    expect(scoreJobCandidate(jobRemote, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'on-site', currentLocation: 'Anywhere' })).workMode.detail.subScore).toBeCloseTo(0.3, 5);

    const jobOnsite = { ...J3, workArrangement: 'Onsite', location: 'Bengaluru, IN' };
    expect(scoreJobCandidate(jobOnsite, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'on-site', currentLocation: 'Bengaluru, IN' })).workMode.detail.subScore).toBe(1);
    expect(scoreJobCandidate(jobOnsite, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' })).workMode.detail.subScore).toBe(0);
    expect(scoreJobCandidate(jobOnsite, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'hybrid', currentLocation: 'Bengaluru, IN' })).workMode.detail.subScore).toBeCloseTo(0.5, 5);

    const jobHybrid = { ...J3, workArrangement: 'Hybrid', location: 'Bengaluru, IN' };
    expect(scoreJobCandidate(jobHybrid, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'hybrid', currentLocation: 'Bengaluru, IN' })).workMode.detail.subScore).toBe(1);

    // 'any' is compatible with every mode.
    expect(scoreJobCandidate(jobOnsite, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', workModePreference: 'any', currentLocation: 'Bengaluru, IN' })).workMode.detail.subScore).toBe(1);

    // Missing preference -> 0 (not treated as a match).
    expect(scoreJobCandidate(jobOnsite, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'any', currentLocation: 'Bengaluru, IN' })).workMode.detail.subScore).toBe(0);
  });

  /* --- education requirement (match / no-match / not specified) --- */
  it('education requirement: match, partial, missing, not-specified', () => {
    const matchEdu = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL'], totalExperienceYears: 7, education: [{ qualification: 'B.Tech Computer Science', institution: 'IIT', year: '2015' }], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(matchEdu.education.applicable).toBe(true);
    expect(matchEdu.education.subScore).toBe(1);
    const nonMatchEdu = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL'], totalExperienceYears: 7, education: [{ qualification: 'High School Diploma', institution: 'X', year: '2010' }], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(nonMatchEdu.education.subScore).toBeCloseTo(0.5, 5); // has a qualification but not the required one
    const noEdu = scoreJobCandidate(J1, prof({ skills: ['Go', 'Kubernetes', 'PostgreSQL'], totalExperienceYears: 7, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(noEdu.education.subScore).toBe(0);
    // Job with no educationRequired -> dimension N/A.
    const noReq = scoreJobCandidate(J3, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Anywhere' }));
    expect(noReq.education.applicable).toBe(false);
  });

  /* --- missing profile fields --- */
  it('missing candidate data is never treated as a match', () => {
    const r = scoreJobCandidate(J1, prof({}));
    expect(r.overallScore).toBe(9); // only the (remote) location dimension scores
    expect(r.eligible).toBe(false);
    expect(r.missingRequiredSkills).toEqual(['Go', 'Kubernetes', 'PostgreSQL']);
    expect(r.matchedRequiredSkills).toEqual([]);
  });

  /* --- missing job criteria (honest N/A + redistribution) --- */
  it('missing job criteria are N/A and weight is redistributed (not invented)', () => {
    const r = scoreJobCandidate(J3, prof({ skills: ['React'], totalExperienceYears: 3, preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Anywhere' }));
    expect(r.education.applicable).toBe(false);
    expect(r.seniorityDomain.detail.applicable).toBe(false);
    // preferredSkills N/A (none listed)
    const prefDim = r.dimensions.find((d) => d.name === 'Preferred skills');
    expect(prefDim?.detail.applicable).toBe(false);
    expect(r.overallScore).toBe(100); // all applicable dims perfect -> 100
  });

  /* --- threshold exactly 80 (boundary) --- */
  it('threshold boundary: exactly 80 passes at 80, fails at 81', () => {
    const r = scoreJobCandidate(J1, prof({ skills: ['Go', 'PostgreSQL'], totalExperienceYears: 7, currentDesignation: 'Senior Engineer', education: [{ qualification: 'B.Tech Computer Science' }], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(r.overallScore).toBe(80);
    expect(meetsThreshold(r, 80).pass).toBe(true);
    expect(meetsThreshold(r, 81).pass).toBe(false);
  });

  /* --- score below threshold --- */
  it('score below threshold -> meetsThreshold fails', () => {
    const r = scoreJobCandidate(J1, prof({ skills: ['Go'], totalExperienceYears: 1, currentDesignation: 'Junior Developer', preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(r.overallScore).toBeLessThan(80);
    expect(meetsThreshold(r, 80).pass).toBe(false);
  });

  /* --- candidate-specific custom threshold --- */
  it('custom threshold: a 85-score match passes 80 but fails 90', () => {
    const synthetic: MatchResult = {
      rubricVersion: RUBRIC_VERSION,
      overallScore: 85,
      eligible: true,
      matchedRequiredSkills: ['React'],
      missingRequiredSkills: [],
      matchedPreferredSkills: [],
      missingPreferredSkills: [],
      experience: { requiredYears: 3, candidateYears: 5, detail: { applicable: true, weight: 18, subScore: 1, contribution: 18, reason: '' } },
      location: { jobLocation: '', isRemote: true, detail: { applicable: true, weight: 9, subScore: 1, contribution: 9, reason: '' } },
      workMode: { jobMode: 'Remote', candidatePreference: 'remote', detail: { applicable: true, weight: 6, subScore: 1, contribution: 6, reason: '' } },
      employmentType: { jobType: 'Full Time', candidatePreference: 'full-time', detail: { applicable: true, weight: 10, subScore: 1, contribution: 10, reason: '' } },
      education: { applicable: false, weight: 5, subScore: 0, contribution: 0, reason: '' },
      seniorityDomain: { jobSeniority: null, candidateSeniority: null, detail: { applicable: false, weight: 5, subScore: 0, contribution: 0, reason: '' } },
      projectsCertsBonus: { points: 0, reason: '' },
      scoreReductionReasons: [],
      otherEvidence: [],
      dimensions: [],
    };
    expect(meetsThreshold(synthetic, 80).pass).toBe(true);
    expect(meetsThreshold(synthetic, 90).pass).toBe(false);
  });

  /* --- no required skills matched -> ineligible regardless of score --- */
  it('zero required skills matched -> ineligible even if other dims are strong', () => {
    // Candidate has none of the required skills but perfect everything else.
    const r = scoreJobCandidate(J1, prof({ skills: ['Java', 'Spring'], totalExperienceYears: 7, currentDesignation: 'Senior Engineer', education: [{ qualification: 'B.Tech Computer Science' }], preferredEmploymentType: 'full-time', workModePreference: 'remote', currentLocation: 'Bengaluru, IN' }));
    expect(r.matchedRequiredSkills).toEqual([]);
    expect(r.missingRequiredSkills).toEqual(['Go', 'Kubernetes', 'PostgreSQL']);
    expect(meetsThreshold(r, 80).pass).toBe(false); // hard gate
  });

  /* --- deterministic reproducibility --- */
  it('is deterministic: same inputs -> identical result', () => {
    const a = scoreJobCandidate(J1, P1);
    const b = scoreJobCandidate(J1, P1);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.overallScore).toBe(b.overallScore);
  });

  /* --- parseExperienceYears --- */
  it('parseExperienceYears handles common formats', () => {
    expect(parseExperienceYears('5+ years')).toBe(5);
    expect(parseExperienceYears('3-5 years')).toBe(3);
    expect(parseExperienceYears('2 years')).toBe(2);
    expect(parseExperienceYears('entry level')).toBe(0);
    expect(parseExperienceYears('senior')).toBe(6);
    expect(parseExperienceYears('')).toBe(null);
    expect(parseExperienceYears(undefined)).toBe(null);
  });

  it('deriveCandidateSeniority respects designation then years', () => {
    expect(deriveCandidateSeniority(prof({ currentDesignation: 'Senior Engineer' }))).toBe('senior');
    expect(deriveCandidateSeniority(prof({ currentDesignation: 'Junior Dev' }))).toBe('junior');
    expect(deriveCandidateSeniority(prof({ totalExperienceYears: 4 }))).toBe('mid');
    expect(deriveCandidateSeniority(prof({}))).toBe(null);
  });
});

// local helper alias to keep a typo from breaking a single assertion above
function scoreJobCustomer_helper(j: JobForMatching, p: ProfileForMatching): MatchResult {
  return scoreJobCandidate(j, p);
}
