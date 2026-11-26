/**
 * paragonel-tools.test.ts — verifies the 4 AI tools execute correctly + return
 * honest results (PHASE 4+7). The tools are Genkit ToolActions whose functions
 * are defined inline; this test mocks @/ai/genkit's defineTool to CAPTURE each
 * (config, fn) pair, then calls the fn directly with mocked data sources. This
 * verifies the tool LOGIC (80% threshold, no fabrication, honest empty results)
 * without needing a live Gemini key (the model→tool loop is Genkit-internal).
 */
import { describe, it, expect, vi } from 'vitest';

// Capture each tool's config + fn so we can invoke the fn directly. Must be
// hoisted (vi.hoisted) because the vi.mock factory below references it + mock
// factories are hoisted above plain declarations.
const { toolFns } = vi.hoisted(() => ({ toolFns: new Map<string, Function>() }));
vi.mock('@/ai/genkit', () => ({
  ai: {
    defineTool: vi.fn((config: { name: string }, fn: (input: unknown) => Promise<unknown>) => {
      toolFns.set(config.name, fn);
      return { ...config, fn };
    }),
  },
}));

// Mock the data sources the tools read from.
vi.mock('@/lib/ai/knowledge-retrieval', () => ({
  getKnowledgeBase: vi.fn(async () => [
    { id: 'company-overview', title: 'Paragonel — Company Overview', content: 'AI-native product-engineering company.', category: 'company', canonicalPath: '/about', sourceType: 'company-static' },
    { id: 'policy-privacy', title: 'Privacy Policy', content: 'Privacy policy content mentions job applications.', category: 'policies', canonicalPath: '/privacy', sourceType: 'policy' },
  ]),
  retrieve: vi.fn((q: string) => {
    // Simulate the fixed retrieval: a 'job' query returns a careers entry, not Privacy.
    if (/job|career/i.test(q)) return [{ entry: { id: 'careers-no-openings', title: 'Careers — No current open positions', content: 'No open job positions listed at this time.', category: 'careers', canonicalPath: '/careers', sourceType: 'company-static' }, score: 100 }];
    if (/privacy/i.test(q)) return [{ entry: { id: 'policy-privacy', title: 'Privacy Policy', content: 'Privacy policy content.', category: 'policies', canonicalPath: '/privacy', sourceType: 'policy' }, score: 17 }];
    return [];
  }),
  sanitizeUntrusted: vi.fn((s: string) => s),
}));

const MOCK_JOBS = [
  { id: 'job-1', jobId: 'PARA-001', title: 'Senior Backend Engineer', department: 'Engineering', location: 'Bangalore', jobType: 'Full Time', workArrangement: 'Remote', description: 'Build scalable backends.', skills: ['Java', 'Spring Boot', 'AWS'], experienceRequired: '5+ years', seniority: 'Senior' },
  { id: 'job-2', jobId: 'PARA-002', title: 'Frontend Developer', location: 'Bangalore', jobType: 'Full Time', workArrangement: 'Onsite', description: 'Build UIs.', skills: ['React', 'TypeScript'], experienceRequired: '3+ years' },
];
vi.mock('@/lib/public-data', () => ({
  getVerifiedJobs: vi.fn(async () => MOCK_JOBS),
  getVerifiedJobsWithStatus: vi.fn(async () => ({ status: 'ok', jobs: MOCK_JOBS })),
}));

vi.mock('@/lib/matching/global-threshold', () => ({
  // Default admin-configurable global floor is 80 (matches CHATBOT_MATCH_THRESHOLD).
  // Individual tests override with mockResolvedValueOnce to raise it (e.g. 85).
  getGlobalMatchingThreshold: vi.fn(async () => 80),
}));

vi.mock('@/lib/matching/match-engine', () => ({
  scoreJobCandidate: vi.fn((_job: unknown, profile: { skills: string[] }) => {
    // Simulate scoring: a profile with Java+AWS scores high (85); a React-only profile scores low (60).
    const has = profile.skills.map((s) => s.toLowerCase());
    if (has.includes('java') && has.includes('aws')) {
      return { overallScore: 85, matchedRequiredSkills: ['Java', 'AWS'], missingRequiredSkills: ['Spring Boot'], otherEvidence: ['Strong backend experience.'] };
    }
    return { overallScore: 60, matchedRequiredSkills: [], missingRequiredSkills: ['Java', 'Spring Boot', 'AWS'], otherEvidence: [] };
  }),
  meetsThreshold: vi.fn((result: { overallScore: number }, threshold: number) => ({
    pass: result.overallScore >= threshold,
    reason: result.overallScore >= threshold ? `Score ${result.overallScore} >= ${threshold}.` : `Score ${result.overallScore} below ${threshold}.`,
  })),
}));

import { PARAGONEL_TOOLS } from '@/ai/tools/paragonel-tools';
import { CHATBOT_MATCH_THRESHOLD } from '@/ai/tools/paragonel-tools';

describe('Paragonel AI tools — execution + honesty (PHASE 4+7)', () => {
  it('defines exactly 4 read-only tools', () => {
    // Re-import triggers the defineTool captures. Since the mock module is cached,
    // the tools were registered on first import; PARAGONEL_TOOLS has 4 entries.
    expect(PARAGONEL_TOOLS).toHaveLength(4);
    expect(PARAGONEL_TOOLS.map((t) => (t as { name: string }).name).sort()).toEqual(
      ['find_jobs', 'get_job_details', 'match_jobs_to_profile', 'search_company_knowledge'].sort(),
    );
  });

  it('CHATBOT_MATCH_THRESHOLD is 80 (PHASE 7)', () => {
    expect(CHATBOT_MATCH_THRESHOLD).toBe(80);
  });

  it('search_company_knowledge returns retrieved entries (honest, not fabricated)', async () => {
    const fn = toolFns.get('search_company_knowledge')!;
    const out = await fn({ query: 'privacy policy' }) as { results: unknown[]; count: number };
    expect(out.count).toBeGreaterThan(0);
    expect(out.results[0]).toMatchObject({ canonicalPath: '/privacy' });
  });

  it('search_company_knowledge returns empty honestly when nothing matches', async () => {
    const fn = toolFns.get('search_company_knowledge')!;
    const out = await fn({ query: 'xyzzy qwerty' }) as { results: unknown[]; count: number };
    expect(out.count).toBe(0);
    expect(out.results).toEqual([]);
  });

  it('find_jobs returns REAL published jobs (not fabricated)', async () => {
    const fn = toolFns.get('find_jobs')!;
    const out = await fn({}) as { jobs: Array<{ id: string; title: string }>; count: number };
    expect(out.count).toBe(2);
    expect(out.jobs.map((j) => j.title)).toEqual(expect.arrayContaining(['Senior Backend Engineer', 'Frontend Developer']));
  });

  it('find_jobs filters by skill (coarse pre-filter)', async () => {
    const fn = toolFns.get('find_jobs')!;
    const out = await fn({ skills: 'Java' }) as { jobs: Array<{ title: string }>; count: number };
    expect(out.count).toBe(1);
    expect(out.jobs[0].title).toBe('Senior Backend Engineer');
  });

  it('find_jobs distinguishes retrieval failure (status unavailable) from "no jobs" — the core honesty fix', async () => {
    const { getVerifiedJobsWithStatus } = await import('@/lib/public-data');
    (getVerifiedJobsWithStatus as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({ status: 'query_failed', reason: 'firestore down' });
    const fn = toolFns.get('find_jobs')!;
    const out = await fn({}) as { jobs: unknown[]; count: number; status: string; statusMessage?: string };
    expect(out.count).toBe(0);
    expect(out.jobs).toEqual([]);
    // CRITICAL: a query failure is reported as "unavailable", NOT as "no openings".
    expect(out.status).toBe('unavailable');
    expect(out.statusMessage).toContain('could not be verified');
  });

  it('find_jobs reports status "ok" (not unavailable) when the DB is up but empty', async () => {
    const { getVerifiedJobsWithStatus } = await import('@/lib/public-data');
    (getVerifiedJobsWithStatus as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({ status: 'ok', jobs: [] });
    const fn = toolFns.get('find_jobs')!;
    const out = await fn({}) as { jobs: unknown[]; count: number; status: string };
    expect(out.count).toBe(0);
    expect(out.status).toBe('ok'); // distinguishable from retrieval failure
  });

  it('match_jobs_to_profile recommends ONLY jobs ≥ 80% (PHASE 7 threshold)', async () => {
    const fn = toolFns.get('match_jobs_to_profile')!;
    // Profile with Java+AWS → scores 85 on the Senior Backend Engineer (≥80 → recommended).
    const out = await fn({ skills: ['Java', 'AWS'] }) as { matches: Array<{ title: string; score: number }>; count: number; threshold: number };
    expect(out.threshold).toBe(80);
    expect(out.count).toBeGreaterThan(0);
    expect(out.matches.every((m) => m.score >= 80)).toBe(true);
    expect(out.matches[0].title).toBe('Senior Backend Engineer');
    expect(out.matches[0].score).toBe(85);
  });

  it('match_jobs_to_profile does NOT recommend sub-80% jobs (no threshold manipulation)', async () => {
    const fn = toolFns.get('match_jobs_to_profile')!;
    // React-only profile → scores 60 on every job (< 80 → NOT recommended).
    const out = await fn({ skills: ['React'] }) as { matches: unknown[]; count: number; note?: string };
    expect(out.count).toBe(0);
    expect(out.matches).toEqual([]);
    expect(out.note).toContain('80%');
  });

  it('match_jobs_to_profile returns honest "no openings" when no jobs published', async () => {
    const { getVerifiedJobsWithStatus } = await import('@/lib/public-data');
    (getVerifiedJobsWithStatus as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({ status: 'ok', jobs: [] });
    const fn = toolFns.get('match_jobs_to_profile')!;
    const out = await fn({ skills: ['Java'] }) as { count: number; note?: string; status: string };
    expect(out.count).toBe(0);
    expect(out.status).toBe('ok'); // empty-but-verified, NOT unavailable
    expect(out.note).toContain('No current openings');
  });

  it('match_jobs_to_profile reports status "unavailable" (not "no matches") when the DB is unreachable', async () => {
    const { getVerifiedJobsWithStatus } = await import('@/lib/public-data');
    (getVerifiedJobsWithStatus as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({ status: 'admin_unconfigured' });
    const fn = toolFns.get('match_jobs_to_profile')!;
    const out = await fn({ skills: ['Java', 'AWS'] }) as { count: number; status: string; statusMessage?: string };
    expect(out.count).toBe(0);
    expect(out.status).toBe('unavailable'); // NOT reported as "no qualifying match"
    expect(out.statusMessage).toContain('could not be verified');
  });

  it('match_jobs_to_profile threshold follows the admin-configurable global floor (raise to 85)', async () => {
    const { getGlobalMatchingThreshold } = await import('@/lib/matching/global-threshold');
    (getGlobalMatchingThreshold as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce(85);
    const fn = toolFns.get('match_jobs_to_profile')!;
    const out = await fn({ skills: ['Java', 'AWS'] }) as { threshold: number; status: string };
    expect(out.threshold).toBe(85); // admin raised floor → chatbot tightens from 80 → 85
    expect(out.status).toBe('ok');
  });

  it('get_job_details returns the full job when found', async () => {
    const fn = toolFns.get('get_job_details')!;
    const out = await fn({ jobId: 'job-1' }) as { found: boolean; job?: { title: string; description: string } };
    expect(out.found).toBe(true);
    expect(out.job?.title).toBe('Senior Backend Engineer');
    expect(out.job?.description).toContain('scalable backends');
  });

  it('get_job_details returns found:false honestly when the id does not exist', async () => {
    const fn = toolFns.get('get_job_details')!;
    const out = await fn({ jobId: 'nonexistent' }) as { found: boolean; job?: unknown };
    expect(out.found).toBe(false);
    expect(out.job).toBeUndefined();
  });
});
