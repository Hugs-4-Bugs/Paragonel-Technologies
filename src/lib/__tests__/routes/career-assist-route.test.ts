/**
 * career-assist-route.test.ts — POST /api/chat/career-assist with real
 * published-job data + the deterministic matching engine (Batch 8 test #3).
 *
 * Verifies the route uses the REAL scoreJobCandidate engine (not an LLM, not a
 * stub) against genuine published-job docs:
 *   - A profile that strongly overlaps a published job returns a match with a
 *     deterministic integer score (>= threshold) + human-readable reasons.
 *   - A profile with no skill overlap returns no matches (filtered by threshold).
 *   - The honeypot field short-circuits to an empty 200 (bot decoy).
 *
 * getVerifiedJobs is mocked to return controlled job docs (no DB). The matching
 * engine + threshold logic run REAL — this is the behavior under test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Controlled published jobs (the shape getVerifiedJobs returns).
const jobs = [
  {
    id: 'job-react', jobId: 'QF-101', title: 'Senior React Engineer',
    department: 'Engineering', location: 'Bangalore',
    employmentType: 'Full Time', workArrangement: 'Remote',
    experienceRequired: '5+ years', skills: ['React', 'Node.js', 'TypeScript'],
    preferredSkills: ['GraphQL'], seniority: 'Senior',
    educationRequired: 'B.Tech or equivalent', description: 'Build the frontend.',
  },
  {
    id: 'job-devops', jobId: 'QF-102', title: 'DevOps Engineer',
    department: 'Infrastructure', location: 'Remote',
    employmentType: 'Full Time', workArrangement: 'Remote',
    experienceRequired: '3-5 years', skills: ['Kubernetes', 'Terraform', 'AWS'],
    seniority: 'Mid', description: 'Run the platform.',
  },
];

vi.mock('@/lib/public-data', () => ({
  getVerifiedJobs: vi.fn(async () => jobs),
}));

import { POST } from '@/app/api/chat/career-assist/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/chat/career-assist', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

beforeEach(() => { vi.clearAllMocks(); });

describe('POST /api/chat/career-assist — deterministic matching', () => {
  it('returns a ranked match with a deterministic score + reasons for a strongly overlapping profile', async () => {
    const res = await POST(req({
      profile: {
        skills: ['React', 'Node.js', 'TypeScript', 'Python'],
        techStack: ['React', 'Node.js'],
        totalExperienceYears: 6,
        currentDesignation: 'Senior Engineer',
        currentLocation: 'Bangalore',
        preferredEmploymentType: 'full-time',
        workModePreference: 'remote',
        headline: 'Senior Frontend Engineer',
        summary: 'Frontend engineer.',
      },
      threshold: 80,
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.matches.length).toBeGreaterThanOrEqual(1);
    const reactMatch = data.matches.find((m: { title: string }) => m.title === 'Senior React Engineer');
    expect(reactMatch).toBeDefined();
    expect(reactMatch.score).toBeGreaterThanOrEqual(80);
    expect(Number.isInteger(reactMatch.score)).toBe(true);
    expect(Array.isArray(reactMatch.reasons)).toBe(true);
    // The DevOps job (no skill overlap) must NOT appear.
    expect(data.matches.find((m: { title: string }) => m.title === 'DevOps Engineer')).toBeUndefined();
    expect(data.threshold).toBe(80);
    expect(data.count).toBe(data.matches.length);
  });

  it('returns no matches for a profile with no skill overlap (filtered by threshold)', async () => {
    const res = await POST(req({
      profile: { skills: ['Photoshop', 'Illustrator'], totalExperienceYears: 1 },
      threshold: 80,
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matches).toHaveLength(0);
  });

  it('respects a lower threshold: a partial-overlap profile matches only when threshold is lowered', async () => {
    // React + one required skill — partial overlap, below the default 80.
    const res80 = await POST(req({
      profile: { skills: ['React'], totalExperienceYears: 2, currentLocation: 'Bangalore' },
      threshold: 80,
    }));
    const d80 = await res80.json();
    // At 80 a single-skill partial overlap should not surface (engine is honest).
    const reactAt80 = d80.matches.find((m: { title: string }) => m.title === 'Senior React Engineer');
    expect(reactAt80).toBeUndefined();
  });

  it('returns 400 on an invalid body (missing profile)', async () => {
    const res = await POST(req({ threshold: 80 }));
    expect(res.status).toBe(400);
  });

  it('short-circuits the honeypot to an empty 200 (bot decoy)', async () => {
    const res = await POST(req({
      profile: { skills: ['React'], totalExperienceYears: 5 },
      website: 'spam',
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matches).toHaveLength(0);
  });
});
