/**
 * POST /api/chat/career-assist — secure server-side job matching for the
 * Paragonel AI career-assistant flow (Phase 6.3).
 *
 * WHY THIS EXISTS: the chatbot previously read `jobs` via the client Firestore
 * SDK (denied by firestore.rules → 0 jobs) and scored them with a divergent
 * stub matcher (`calculateMatchScore`, max 85, threshold 60). This route moves
 * matching to the server, uses the REAL `scoreJobCandidate` engine (the same
 * one the job-alerts pipeline uses), and returns only jobs meeting the
 * candidate's threshold — so the chatbot's recommendations are consistent with
 * the rest of the product.
 *
 * Security + privacy:
 *   - PUBLIC route (no auth) — a visitor exploring matches before registering.
 *     It reads ONLY published, active, non-deleted jobs (getVerifiedJobs — no
 *     dummy/sample fallback). The candidate profile is the visitor's own parsed
 *     resume data; it is NEVER stored here (no Firestore write). Persistence
 *     happens only after the candidate registers + uploads via the
 *     authenticated /api/candidate/resume route.
 *   - Honeypot + per-client rate limit (abuse protection).
 *   - The response exposes only: job title, department, location, type, work
 *     mode, the integer score, and the top human-readable reasons already in
 *     MatchResult.otherEvidence. No internal rubric detail, no other
 *     candidates' data, no resume content.
 *
 * Threshold: defaults to DEFAULT_MATCHING_THRESHOLD (80), clamped to 25–100
 * (same bounds as the candidate-preference setting). The caller may pass the
 * candidate's saved threshold if they are logged in.
 *
 * Status codes: 200 matches, 400 invalid, 429 rate-limited, 503 unavailable.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedJobs } from '@/lib/public-data';
import { scoreJobCandidate, meetsThreshold, type JobForMatching, type ProfileForMatching } from '@/lib/matching/match-engine';
import { DEFAULT_MATCHING_THRESHOLD, MIN_THRESHOLD, MAX_THRESHOLD } from '@/lib/matching/preferences';
import { checkRateLimit, getClientId } from '@/lib/submission-security';
import { jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Bounded platform timeout for the server-side match (no AI call, but a
// bounded scan of published jobs + scoring — cap so a pathological input
// cannot hold the function).
export const maxDuration = 15;

/** Minimal shape of a CMS job doc as returned by getVerifiedJobs. */
interface JobDoc {
  id?: string;
  jobId?: string;
  title?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  workArrangment?: string;
  workArrangement?: string;
  experienceRequired?: string;
  experience?: string;
  skills?: unknown[];
  preferredSkills?: unknown[];
  seniority?: string;
  educationRequired?: string;
  description?: string;
}

// Lenient profile schema: the parsed-resume data may be partial. The engine
// scores missing fields as 0 with an honest reason (never a false match), so a
// partial profile simply produces lower scores, not errors. String fields are
// length-bounded; array fields are count-bounded to prevent abuse.
const profileSchema = z.object({
  skills: z.array(z.string().max(80)).max(100).optional(),
  techStack: z.array(z.string().max(80)).max(100).optional(),
  totalExperienceYears: z.number().min(0).max(80).optional(),
  currentDesignation: z.string().max(120).optional(),
  employmentHistory: z.array(z.any()).max(50).optional(),
  education: z.array(z.any()).max(50).optional(),
  projects: z.array(z.any()).max(50).optional(),
  certifications: z.array(z.any()).max(50).optional(),
  currentLocation: z.string().max(120).optional(),
  preferredJobLocation: z.string().max(120).optional(),
  preferredLocations: z.array(z.string().max(120)).max(20).optional(),
  preferredEmploymentType: z.string().max(60).optional(),
  workModePreference: z.string().max(60).optional(),
  headline: z.string().max(200).optional(),
  summary: z.string().max(3000).optional(),
});

const bodySchema = z.object({
  profile: profileSchema,
  threshold: z.number().int().min(MIN_THRESHOLD).max(MAX_THRESHOLD).optional(),
  website: z.string().max(0).optional().or(z.literal('')), // honeypot
});

/** Map a CMS job doc to the matcher's JobForMatching shape. */
function toJobForMatching(doc: JobDoc): JobForMatching | null {
  if (!doc || typeof doc.title !== 'string' || !doc.title) return null;
  const stringArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  return {
    id: String(doc.id || ''),
    jobId: doc.jobId || undefined,
    title: doc.title,
    department: doc.department || undefined,
    location: String(doc.location || ''),
    employmentType: String(doc.employmentType || ''),
    workArrangement: String(doc.workArrangement || doc.workArrangment || ''),
    experienceRequired: String(doc.experienceRequired || doc.experience || ''),
    skills: stringArr(doc.skills),
    preferredSkills: doc.preferredSkills ? stringArr(doc.preferredSkills) : undefined,
    seniority: doc.seniority || undefined,
    educationRequired: doc.educationRequired || undefined,
    description: doc.description || undefined,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }

  // Honeypot (silent accept — bots get a 200, real users never fill it).
  if (typeof body === 'object' && body && 'website' in body && (body as { website?: string }).website) {
    return NextResponse.json({ matches: [] }, { status: 200 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const { profile, threshold } = parsed.data;

  // Rate limit (public route — protect against scraping/abuse).
  const clientId = getClientId(request);
  const rl = checkRateLimit('chatCareerAssist', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // Resolve threshold (default 80, clamped). Same bounds as candidate prefs.
  const effectiveThreshold = Math.min(Math.max(Math.round(threshold ?? DEFAULT_MATCHING_THRESHOLD), MIN_THRESHOLD), MAX_THRESHOLD);

  // Load ONLY genuine published jobs — never dummy/sample data.
  const jobsDocs: JobDoc[] = await getVerifiedJobs(50);
  if (jobsDocs.length === 0) {
    // Honest: no current openings could be verified. Do not fabricate matches.
    return NextResponse.json({ matches: [], reason: 'No current openings could be verified.' }, { status: 200 });
  }

  const matches: Array<{
    id: string;
    jobId?: string;
    title: string;
    department?: string;
    location: string;
    employmentType: string;
    workArrangement: string;
    score: number;
    reasons: string[];
  }> = [];

  for (const doc of jobsDocs) {
    const job = toJobForMatching(doc);
    if (!job) continue;
    const result = scoreJobCandidate(job, profile as ProfileForMatching);
    const gate = meetsThreshold(result, effectiveThreshold);
    if (!gate.pass) continue;
    matches.push({
      id: job.id,
      jobId: job.jobId,
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      workArrangement: job.workArrangement,
      score: result.overallScore,
      // Top 3 human-readable reasons already in the MatchResult (matched
      // skills + evidence). No internal rubric detail is exposed.
      reasons: [
        ...(result.matchedRequiredSkills.length
          ? [`Matches ${result.matchedRequiredSkills.length} required skill${result.matchedRequiredSkills.length > 1 ? 's' : ''}: ${result.matchedRequiredSkills.slice(0, 5).join(', ')}`]
          : []),
        ...result.otherEvidence.slice(0, 2),
      ].slice(0, 3),
    });
  }

  matches.sort((a, b) => b.score - a.score);

  return NextResponse.json(
    { matches, threshold: effectiveThreshold, count: matches.length },
    { status: 200 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
