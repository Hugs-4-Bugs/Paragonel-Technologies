/**
 * paragonel-tools.ts — server-side AI tools for the Paragonel AI assistant
 * (Prompt PHASE 4: genuine tool-based assistant, not keyword retrieval).
 *
 * These tools let the Gemini model decide WHEN to retrieve live company
 * knowledge, discover published jobs, match a candidate profile to jobs, or
 * fetch a specific job's details — instead of the flow pre-stuffing all context
 * into the prompt. The model calls a tool only when the conversation needs it;
 * for general questions it answers directly. This is the transformation from a
 * "retrieve-then-generate" chatbot to a "model-decides-when-to-tool" assistant.
 *
 * Design constraints (per the prompt):
 *   - READ-ONLY tools only here (knowledge search, job discovery, matching, job
 *     details). Application SUBMISSION is never a model tool — it requires
 *     explicit user confirmation + authentication + is handled by the existing
 *     secure /api/job-applications route (PHASE 8). The model may GUIDE an
 *     application, never execute one.
 *   - Server-side only. Tool execution never bypasses API authorization; the
 *     model cannot directly write to databases, create leads/accounts, send
 *     email, or access another candidate's data.
 *   - Honest: every tool returns real data from the actual data sources
 *     (getKnowledgeBase, getVerifiedJobs, scoreJobCandidate). No fabricated
 *     jobs, scores, or company facts. Empty results are returned honestly
 *     ("no current openings") — never padded with dummy data.
 *   - The 80% recommendation threshold (PHASE 7) is enforced inside
 *     matchJobsToProfile: jobs scoring below 80% are NOT returned as
 *     recommendations. The Career Page matching (career-assist route) is
 *     preserved unchanged — it uses its own configurable threshold.
 *   - Resume text + visitor input are untrusted (prompt-injection defense);
 *     tool inputs are zod-validated + bounded.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getKnowledgeBase, retrieve, sanitizeUntrusted, type KnowledgeEntry } from '@/lib/ai/knowledge-retrieval';
import { getVerifiedJobsWithStatus } from '@/lib/public-data';
import { getGlobalMatchingThreshold } from '@/lib/matching/global-threshold';
import {
  scoreJobCandidate,
  meetsThreshold,
  type JobForMatching,
  type ProfileForMatching,
  type MatchResult,
} from '@/lib/matching/match-engine';

/** Chatbot recommendation threshold default (PHASE 7): jobs below 80% are NOT
 *  recommended by the assistant. This is the FALLBACK used when the
 *  admin-configurable global floor cannot be read; the effective threshold at
 *  runtime is `await getGlobalMatchingThreshold()` (Supabase-backed, default 80,
 *  clamped [75,100], super-admin-configurable) — so raising the admin floor to
 *  85/90/100 also tightens chatbot recommendations. Kept exported (=== 80) for
 *  backward compatibility with existing tests + as the catch-all default. */
export const CHATBOT_MATCH_THRESHOLD = 80;

/** Honest status signal returned to the model when the jobs database is
 *  unreachable (admin unconfigured OR query failed after index-free fallback).
 *  The model is instructed (SYSTEM_PROMPT) to report this as "verification
 *  unavailable" — NOT as "no openings" — and never to fabricate jobs. */
const STATUS_UNAVAILABLE =
  'unavailable' as const;
const STATUS_UNAVAILABLE_MSG =
  'Current job openings could not be verified right now (the jobs database is unreachable). Do NOT claim there are no openings — say verification is temporarily unavailable and suggest trying again shortly or contacting /contact.';

/** Minimal shape of a CMS job doc as returned by getVerifiedJobs (mirrors the
 *  career-assist route's JobDoc — kept local to avoid coupling). */
interface JobDoc {
  id?: string;
  jobId?: string;
  title?: string;
  department?: string;
  location?: string | null;
  jobType?: string | null;
  workArrangement?: string | null;
  employmentType?: string | null;
  description?: string;
  skills?: string[] | string;
  experienceRequired?: string | null;
  techStack?: string[] | string;
  seniority?: string | null;
  educationRequired?: string | null;
  updatedAt?: string;
}

/** Convert a CMS job doc to the JobForMatching shape (same logic as the
 *  career-assist route's toJobForMatching — reused so the chatbot + Career Page
 *  match identically). Returns null if the job has no title (not a real job).
 *  Required string fields default to 'unspecified' when the CMS doc omits them
 *  (the engine treats them as empty — never fabricated). */
function toJobForMatching(doc: JobDoc): JobForMatching | null {
  const title = (doc.title || '').trim();
  if (!title) return null;
  const skills = Array.isArray(doc.skills) ? doc.skills : doc.skills ? String(doc.skills).split(',').map((s) => s.trim()).filter(Boolean) : [];
  return {
    id: doc.id || doc.jobId || title,
    jobId: doc.jobId || doc.id || undefined,
    title,
    department: doc.department || undefined,
    location: doc.location && String(doc.location).trim() ? String(doc.location).trim() : 'unspecified',
    employmentType: doc.employmentType || doc.jobType || 'unspecified',
    workArrangement: doc.workArrangement || 'unspecified',
    experienceRequired: doc.experienceRequired || 'unspecified',
    skills,
    seniority: doc.seniority || undefined,
    educationRequired: doc.educationRequired || undefined,
    description: doc.description || undefined,
  };
}

/** A compact job summary returned to the model (bounded so the prompt stays
 *  within token limits even with many jobs). Typed to match the find_jobs +
 *  get_job_details output schemas exactly. */
interface JobSummary {
  id: string;
  jobId?: string;
  title: string;
  department?: string;
  location: string;
  employmentType: string;
  workArrangement: string;
  skills: string[];
  experienceRequired?: string;
  description?: string;
  applyPath: string;
}
function jobSummary(job: JobForMatching, doc: JobDoc): JobSummary {
  const desc = (doc.description || '').slice(0, 280);
  return {
    id: job.id,
    jobId: job.jobId,
    title: job.title,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType,
    workArrangement: job.workArrangement,
    skills: job.skills.slice(0, 8),
    experienceRequired: job.experienceRequired === 'unspecified' ? undefined : job.experienceRequired,
    description: desc ? desc + (doc.description && doc.description.length > 280 ? '…' : '') : undefined,
    applyPath: '/careers',
  };
}

// === TOOL 1: search_company_knowledge ===
// Retrieves approved, published company knowledge by query. The model calls
// this for Paragonel-specific questions (services, products, policies, contact,
// company overview) instead of relying solely on pre-retrieved context.
export const searchCompanyKnowledge = ai.defineTool(
  {
    name: 'search_company_knowledge',
    description:
      'Search approved, published Paragonel company knowledge (company overview, services, products including AcquisitionOS/SystemFoundry/CodeGuard AI, technology ecosystem, policies, contact info, careers page). Use this for ANY Paragonel-specific question so the answer is grounded in verified company data, not guessed. Returns up to 5 relevant knowledge entries with title, content, category, and canonical page path for citations. If nothing relevant is found, returns an empty list (say so honestly — do not fabricate company facts).',
    inputSchema: z.object({
      query: z.string().min(1).max(500).describe('The topic or question to search company knowledge for (e.g. "services", "AcquisitionOS", "privacy policy", "contact").'),
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string(),
        canonicalPath: z.string(),
      })),
      count: z.number(),
    }),
  },
  async (input) => {
    try {
      const cleanQuery = sanitizeUntrusted(input.query);
      const base = await getKnowledgeBase();
      const hits = retrieve(cleanQuery, base, 5);
      return {
        results: hits.map((h) => ({
          title: h.entry.title,
          content: h.entry.content,
          category: h.entry.category,
          canonicalPath: h.entry.canonicalPath,
        })),
        count: hits.length,
      };
    } catch {
      // Honest empty — never fabricate. The model says it could not verify.
      return { results: [], count: 0 };
    }
  },
);

// === TOOL 2: find_jobs ===
// Discovers REAL published job openings. The model calls this when the user
// asks about jobs/careers/openings/hiring. Returns honest "no openings" when
// none are published — never fabricates jobs.
export const findJobs = ai.defineTool(
  {
    name: 'find_jobs',
    description:
      'Discover REAL, currently-published Paragonel job openings from the live jobs database. Use this whenever the user asks about jobs, careers, openings, hiring, vacancies, or roles — do NOT answer from memory (job openings change). Returns a list of open roles with title, location, type, required skills, and a short description. If no openings are published, returns an empty list with status "ok" — say honestly "no current openings" and direct the user to /careers. If the jobs database is unreachable, returns status "unavailable" — do NOT claim there are no openings; say verification is temporarily unavailable and suggest trying again or contacting /contact. NEVER invent job titles, locations, or requirements.',
    inputSchema: z.object({
      skills: z.string().max(300).optional().describe('Optional comma-separated skills to filter by (e.g. "Java, AWS").'),
      location: z.string().max(100).optional().describe('Optional location filter (e.g. "Bangalore").'),
    }),
    outputSchema: z.object({
      jobs: z.array(z.object({
        id: z.string(),
        jobId: z.string().optional(),
        title: z.string(),
        department: z.string().optional(),
        location: z.string(),
        employmentType: z.string(),
        workArrangement: z.string(),
        skills: z.array(z.string()),
        experienceRequired: z.string().optional(),
        description: z.string().optional(),
        applyPath: z.string(),
      })),
      count: z.number(),
      status: z.enum(['ok', 'unavailable']).describe('"ok" = the jobs database was queried (jobs may be empty); "unavailable" = verification failed (database unreachable) — do NOT report as "no openings".'),
      statusMessage: z.string().optional().describe('Honest guidance to surface when status is "unavailable".'),
    }),
  },
  async (input) => {
    try {
      const result = await getVerifiedJobsWithStatus(50);
      if (result.status !== 'ok') {
        return { jobs: [], count: 0, status: STATUS_UNAVAILABLE, statusMessage: STATUS_UNAVAILABLE_MSG };
      }
      const docs: JobDoc[] = result.jobs;
      let jobs = docs.map(toJobForMatching).filter((j): j is JobForMatching => j !== null);
      // Optional lightweight filter by skill/location (the matching tool does
      // proper scoring; this is just a coarse pre-filter for "show me Java jobs").
      if (input.skills) {
        const want = input.skills.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
        jobs = jobs.filter((j) => want.some((w) => j.skills.some((s) => s.toLowerCase().includes(w))));
      }
      if (input.location) {
        const loc = input.location.toLowerCase();
        jobs = jobs.filter((j) => j.location && j.location.toLowerCase().includes(loc));
      }
      const docsById = new Map(docs.map((d) => [d.id || d.jobId || (d.title || ''), d] as const));
      return {
        jobs: jobs.slice(0, 10).map((j) => jobSummary(j, docsById.get(j.id) || ({} as JobDoc))),
        count: jobs.length,
        status: 'ok' as const,
      };
    } catch {
      // Unexpected error — honest unavailable, never fabricate.
      return { jobs: [], count: 0, status: STATUS_UNAVAILABLE, statusMessage: STATUS_UNAVAILABLE_MSG };
    }
  },
);

// === TOOL 3: match_jobs_to_profile ===
// Matches a candidate profile (skills/experience) to published jobs using the
// REAL scoreJobCandidate engine. Enforces the 80% chatbot recommendation
// threshold (PHASE 7): jobs below 80% are NOT recommended. Returns matched
// jobs with the score + human-readable reasons. Never fabricates scores.
export const matchJobsToProfile = ai.defineTool(
  {
    name: 'match_jobs_to_profile',
    description:
      'Match a candidate profile (from their stated skills/experience OR an uploaded+parsed resume) to REAL published Paragonel jobs using the actual matching engine. Returns ONLY jobs that score at or above the chatbot recommendation threshold (the `threshold` field reports the exact threshold applied — it is the admin-configurable global floor, default 80, never lowered below 75), with the verified match score and human-readable reasons (matched skills, evidence). If no job reaches the threshold, returns an empty list with status "ok" — say honestly "no qualifying match found at the recommendation threshold" and suggest profile improvements. If the jobs database is unreachable, returns status "unavailable" — say matching is temporarily unavailable, do NOT claim no matches exist. NEVER lower the threshold, fabricate a score, or recommend a below-threshold job. The score is an aid, not a guarantee of suitability.',
    inputSchema: z.object({
      skills: z.array(z.string().max(60)).max(30).describe('Candidate skills (from their message or parsed resume).'),
      totalExperienceYears: z.number().min(0).max(60).optional().describe('Total years of experience if stated.'),
      preferredJobLocation: z.string().max(100).optional().describe('Preferred location if stated.'),
      preferredEmploymentType: z.string().max(60).optional().describe('Preferred employment type if stated.'),
      currentDesignation: z.string().max(100).optional().describe('Current job title if stated.'),
      summary: z.string().max(500).optional().describe('Brief professional summary / headline if available.'),
    }),
    outputSchema: z.object({
      matches: z.array(z.object({
        id: z.string(),
        title: z.string(),
        location: z.string(),
        employmentType: z.string(),
        score: z.number(),
        reasons: z.array(z.string()),
        applyPath: z.string(),
      })),
      count: z.number(),
      threshold: z.number(),
      note: z.string().optional(),
      status: z.enum(['ok', 'unavailable']).describe('"ok" = matching ran (matches may be empty); "unavailable" = the jobs database was unreachable — do NOT report as "no matches".'),
      statusMessage: z.string().optional().describe('Honest guidance to surface when status is "unavailable".'),
    }),
  },
  async (input) => {
    // The effective threshold is the admin-configurable global floor (Supabase
    // app_settings, default 80, clamped [75,100]). Fall back to the constant if
    // the floor cannot be read — never lower below the floor.
    let threshold = CHATBOT_MATCH_THRESHOLD;
    try {
      threshold = await getGlobalMatchingThreshold();
    } catch {
      threshold = CHATBOT_MATCH_THRESHOLD; // never throw — matching still runs
    }
    try {
      const result = await getVerifiedJobsWithStatus(50);
      if (result.status !== 'ok') {
        return {
          matches: [],
          count: 0,
          threshold,
          status: STATUS_UNAVAILABLE,
          statusMessage: STATUS_UNAVAILABLE_MSG,
        };
      }
      const docs: JobDoc[] = result.jobs;
      if (docs.length === 0) {
        return {
          matches: [],
          count: 0,
          threshold,
          status: 'ok' as const,
          note: 'No current openings could be verified. Direct the user to /careers for future opportunities.',
        };
      }
      const profile: ProfileForMatching = {
        skills: input.skills,
        techStack: input.skills, // skills + techStack overlap; the engine dedupes
        totalExperienceYears: input.totalExperienceYears,
        currentDesignation: input.currentDesignation,
        preferredJobLocation: input.preferredJobLocation,
        preferredEmploymentType: input.preferredEmploymentType,
        headline: input.summary,
        summary: input.summary,
      } as ProfileForMatching;
      const matches: Array<{ id: string; title: string; location: string; employmentType: string; score: number; reasons: string[]; applyPath: string }> = [];
      for (const doc of docs) {
        const job = toJobForMatching(doc);
        if (!job) continue;
        const resultScore: MatchResult = scoreJobCandidate(job, profile);
        const gate = meetsThreshold(resultScore, threshold);
        if (!gate.pass) continue; // below threshold → not recommended
        matches.push({
          id: job.id,
          title: job.title,
          location: job.location || 'unspecified',
          employmentType: job.employmentType || 'unspecified',
          score: resultScore.overallScore,
          reasons: [
            ...(resultScore.matchedRequiredSkills.length
              ? [`Matches ${resultScore.matchedRequiredSkills.length} required skill${resultScore.matchedRequiredSkills.length > 1 ? 's' : ''}: ${resultScore.matchedRequiredSkills.slice(0, 5).join(', ')}`]
              : []),
            ...resultScore.otherEvidence.slice(0, 2),
          ].slice(0, 3),
          applyPath: '/careers',
        });
      }
      matches.sort((a, b) => b.score - a.score);
      return {
        matches: matches.slice(0, 5),
        count: matches.length,
        threshold,
        status: 'ok' as const,
        note: matches.length === 0 ? `No job reached the ${threshold}% recommendation threshold. Suggest the user strengthen their profile (add more skills, experience) or check /careers for all openings.` : undefined,
      };
    } catch {
      return {
        matches: [],
        count: 0,
        threshold,
        status: STATUS_UNAVAILABLE,
        statusMessage: STATUS_UNAVAILABLE_MSG,
      };
    }
  },
);

// === TOOL 4: get_job_details ===
// Fetches the full details of a specific job by id. The model calls this when
// the user asks about a specific role (after find_jobs returned a list).
export const getJobDetails = ai.defineTool(
  {
    name: 'get_job_details',
    description:
      'Fetch full details of a SPECIFIC published Paragonel job by its id (returned by find_jobs or match_jobs_to_profile). Use this when the user asks about a particular role, its requirements, responsibilities, or how to apply. Returns the full job description, skills, experience, location, and apply path. If the id is not found among published jobs, returns found=false with status "ok" — say so honestly, do not invent details. If the jobs database is unreachable, returns status "unavailable" with found=false — do NOT claim the job does not exist; say it could not be verified right now.',
    inputSchema: z.object({
      jobId: z.string().min(1).max(120).describe('The job id (or jobId) returned by find_jobs / match_jobs_to_profile.'),
    }),
    outputSchema: z.object({
      found: z.boolean(),
      job: z.object({
        id: z.string(),
        jobId: z.string().optional(),
        title: z.string(),
        department: z.string().optional(),
        location: z.string(),
        employmentType: z.string(),
        workArrangement: z.string(),
        skills: z.array(z.string()),
        experienceRequired: z.string().optional(),
        description: z.string(),
        applyPath: z.string(),
      }).optional(),
      status: z.enum(['ok', 'unavailable']).describe('"ok" = the jobs database was queried (found may be false); "unavailable" = database unreachable — do NOT report as "not found".'),
      statusMessage: z.string().optional().describe('Honest guidance to surface when status is "unavailable".'),
    }),
  },
  async (input) => {
    try {
      const result = await getVerifiedJobsWithStatus(50);
      if (result.status !== 'ok') {
        return { found: false, status: STATUS_UNAVAILABLE, statusMessage: STATUS_UNAVAILABLE_MSG };
      }
      const docs: JobDoc[] = result.jobs;
      const doc = docs.find((d) => d.id === input.jobId || d.jobId === input.jobId);
      if (!doc) return { found: false, status: 'ok' as const };
      const job = toJobForMatching(doc);
      if (!job) return { found: false, status: 'ok' as const };
      return {
        found: true,
        status: 'ok' as const,
        job: {
          id: job.id,
          jobId: job.jobId,
          title: job.title,
          department: job.department,
          location: job.location || 'unspecified',
          employmentType: job.employmentType || 'unspecified',
          workArrangement: job.workArrangement || 'unspecified',
          skills: job.skills,
          experienceRequired: job.experienceRequired,
          description: (doc.description || '').slice(0, 1200),
          applyPath: '/careers',
        },
      };
    } catch {
      return { found: false, status: STATUS_UNAVAILABLE, statusMessage: STATUS_UNAVAILABLE_MSG };
    }
  },
);

/** All Paragonel AI tools, exported for wiring into the flow + for testing. */
export const PARAGONEL_TOOLS = [searchCompanyKnowledge, findJobs, matchJobsToProfile, getJobDetails];
