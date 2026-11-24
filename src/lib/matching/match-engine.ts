/**
 * match-engine.ts — explainable, deterministic job/candidate matching engine.
 * (Prompt 05R §6.)
 *
 * Design contract (enforced by tests in __tests__/match-engine.test.ts):
 *
 *   1. PURE + DETERMINISTIC. No Firestore, no env, no randomness, no LLM. The
 *      same (job, profile) inputs always produce the same score. The percentage
 *      is reproducible from the stored inputs + this rubric (§6: "Do not ask an
 *      LLM to invent a percentage").
 *
 *   2. REQUIRED qualifications carry more weight than optional preferences.
 *      Required skills = 35 (highest single weight).
 *
 *   3. Missing JOB criteria are never invented. If a job has no preferredSkills
 *      / educationRequired / seniority, that dimension is "not applicable" and
 *      its weight is redistributed proportionally across the applicable core
 *      dimensions (so the score is still out of 100 and meaningful). §6:
 *      "Handle jobs with incomplete or missing criteria honestly."
 *
 *   4. Missing CANDIDATE data is never treated as a successful match. On any
 *      applicable dimension, missing candidate data yields subScore 0 + a
 *      reduction reason. An explicit candidate preference of 'any' is NOT
 *      "missing" — it is a positive acceptance and scores 1.0.
 *
 *   5. Required skills are distinguished from preferred skills, and a skill is
 *      never double-counted under both: matchedPreferred excludes any skill
 *      already counted as matchedRequired.
 *
 *   6. Irrelevant profile fields are not rewarded. Projects/certifications only
 *      add a BONUS when they overlap the job's required/preferred skills; they
 *      can never reduce the score below the core weighted average.
 *
 *   7. Skill equivalence is normalized via the conservative skill-aliases table
 *      (no unrelated-tech assumptions). Unrelated technologies never match.
 *
 *   8. Eligibility = (overallScore >= threshold) AND (the candidate matched at
 *      least one required skill, when the job lists any). A candidate with ZERO
 *      of the required skills is not eligible regardless of other dimensions.
 *
 * The result is fully structured so an email/UI can explain matched/missing
 * criteria, the experience comparison, location/work-mode compatibility,
 * education, score-reduction reasons, and the rubric version.
 */
import { canonicalSkill, canonicalSkillSet } from './skill-aliases';
import type { CandidateProfile } from '@/lib/auth/candidate-profile';
import { DEFAULT_MATCHING_THRESHOLD } from './preferences';

export const RUBRIC_VERSION = '1.0';

/* ----------------------------- input shapes ----------------------------- */

/**
 * The subset of a published CMS job document the matcher reads. Optional fields
 * (preferredSkills, seniority, educationRequired, version) are extended by 05R
 * on the job schema but are absent on legacy jobs — the engine treats absent
 * optional fields as "not applicable" honestly.
 */
export interface JobForMatching {
  id: string;
  jobId?: string;
  title: string;
  department?: string;
  location: string;
  employmentType: string; // 'Full Time' | 'Part Time' | 'Contract' | 'Internship'
  workArrangement: string; // 'Remote' | 'Onsite' | 'Hybrid'
  experienceRequired: string; // free text, e.g. "3-5 years", "5+ years"
  skills: string[]; // REQUIRED skills (the CMS skills list)
  preferredSkills?: string[]; // optional, 05R-extended
  seniority?: string; // optional, e.g. 'Senior'
  educationRequired?: string; // optional, e.g. 'B.Tech in CS or equivalent'
  description?: string;
}

/** Candidate profile shape for matching (a subset of CandidateProfile). */
export type ProfileForMatching = Pick<
  CandidateProfile,
  | 'skills'
  | 'techStack'
  | 'totalExperienceYears'
  | 'currentDesignation'
  | 'employmentHistory'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'currentLocation'
  | 'preferredJobLocation'
  | 'preferredLocations'
  | 'preferredEmploymentType'
  | 'workModePreference'
  | 'headline'
  | 'summary'
>;

/* ------------------------------- weights -------------------------------- */
/*
 * Core dimensions (weights sum to 96). Applicable dimensions are normalized to
 * 100 by redistribution over their total weight. The projects/certs bonus (4)
 * is added on top and capped at 100, so it can only help, never hurt.
 */
const WEIGHTS = {
  requiredSkills: 35,
  experience: 18,
  location: 9,
  workMode: 6,
  employmentType: 10,
  preferredSkills: 8,
  education: 5,
  seniorityDomain: 5,
} as const;
const BONUS_MAX = 4; // projects/certs relevance bonus, additive, capped

/* ------------------------------ result type ----------------------------- */

export interface DimensionDetail {
  applicable: boolean;
  weight: number;
  subScore: number; // 0..1 (only meaningful when applicable)
  contribution: number; // points contributed to the core weighted average
  reason: string;
}

export interface MatchResult {
  rubricVersion: string;
  overallScore: number; // 0..100 integer
  eligible: boolean; // threshold + hard-gate checked by caller; here it is the
                     // "would pass at the default 80%" indicator (score>=80 AND
                     // matched at least one required skill)
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  experience: {
    requiredYears: number | null;
    candidateYears: number | null;
    detail: DimensionDetail;
  };
  location: {
    jobLocation: string;
    isRemote: boolean;
    detail: DimensionDetail;
  };
  workMode: {
    jobMode: string;
    candidatePreference: string | null;
    detail: DimensionDetail;
  };
  employmentType: {
    jobType: string;
    candidatePreference: string | null;
    detail: DimensionDetail;
  };
  education: DimensionDetail;
  seniorityDomain: {
    jobSeniority: string | null;
    candidateSeniority: string | null;
    detail: DimensionDetail;
  };
  projectsCertsBonus: { points: number; reason: string };
  scoreReductionReasons: string[];
  otherEvidence: string[];
  dimensions: { name: string; detail: DimensionDetail }[];
}

/* ------------------------------ helpers --------------------------------- */

/**
 * Parse a free-text experience requirement into a minimum number of years.
 * Returns null when no numeric signal can be extracted honestly.
 * Handles: "3-5 years", "5+ years", "2 years", "0-2 years", "3 to 5 yrs",
 * "5+ years of experience", "entry level", "junior".
 */
export function parseExperienceYears(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (/entry|fresher|intern/.test(s)) return 0;
  // "N+" or "N+ years"
  const plus = s.match(/(\d+)\s*\+/);
  if (plus) return parseInt(plus[1], 10);
  // "N-M years" -> min N
  const range = s.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  if (range) return parseInt(range[1], 10);
  // "N years" / "N yrs"
  const single = s.match(/(\d+)/);
  if (single) return parseInt(single[1], 10);
  if (/senior|lead|staff|principal/.test(s)) return 6;
  if (/mid|middle/.test(s)) return 3;
  return null;
}

/** Derive a candidate seniority band from experience years + current designation. */
export function deriveCandidateSeniority(profile: ProfileForMatching): string | null {
  const yrs = typeof profile.totalExperienceYears === 'number' ? profile.totalExperienceYears : null;
  const desig = (profile.currentDesignation || '').toLowerCase();
  if (/principal|staff|distinguished|vp|chief|cto|cio/.test(desig)) return 'principal';
  if (/lead|manager|head|director/.test(desig)) return 'lead';
  if (/senior|sr\.?/.test(desig)) return 'senior';
  if (/junior|jr\.?|intern|trainee/.test(desig)) return 'junior';
  if (/mid|middle|ii\b/.test(desig)) return 'mid';
  if (yrs === null || yrs === undefined) {
    // No years and no designation signal — unknown, do not guess.
    return null;
  }
  if (yrs <= 2) return 'junior';
  if (yrs <= 5) return 'mid';
  if (yrs <= 9) return 'senior';
  return 'lead';
}

/** Seniority distance: 0 = exact, 1 = adjacent band, 2+ = further. -1 if unknown. */
function seniorityDistance(job: string, candidate: string | null): number {
  const order = ['junior', 'mid', 'senior', 'lead', 'principal'];
  const j = order.indexOf(normalizeSeniority(job));
  if (j < 0) return -1; // job seniority not recognized -> dimension N/A
  if (!candidate) return 2; // unknown candidate -> treated as far (subScore 0)
  const c = order.indexOf(candidate);
  if (c < 0) return 2;
  return Math.abs(j - c);
}
function normalizeSeniority(s: string): string {
  const t = (s || '').toLowerCase().trim();
  if (/entry|fresher|intern|trainee/.test(t)) return 'junior';
  if (/junior|jr/.test(t)) return 'junior';
  if (/mid|middle|ii\b/.test(t)) return 'mid';
  if (/senior|sr/.test(t)) return 'senior';
  if (/lead|manager|head|director/.test(t)) return 'lead';
  if (/principal|staff|distinguished|vp|chief|cto|cio/.test(t)) return 'principal';
  return '';
}

/** Normalize an employment-type string for comparison. */
function normalizeEmploymentType(s: string | undefined | null): string {
  if (!s) return '';
  return (s || '').toLowerCase().replace(/[\s-]/g, '').trim();
}

/** Normalize a location string for token comparison. */
function normalizeLocation(s: string | undefined | null): string {
  if (!s) return '';
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function locationTokens(s: string): string[] {
  return normalizeLocation(s).split(' ').filter((t) => t.length > 1);
}
/** Compare job location vs candidate location set. Returns {subScore, reason}. */
function compareLocation(
  job: JobForMatching,
  profile: ProfileForMatching
): { subScore: number; reason: string } {
  const jobMode = (job.workArrangement || '').toLowerCase();
  const isRemoteJob = jobMode === 'remote' || normalizeLocation(job.location) === 'remote';
  if (isRemoteJob) {
    // A remote job has no location barrier — every candidate is location-compatible.
    return { subScore: 1, reason: 'Remote role — location is not a constraint.' };
  }
  const jobLoc = job.location || '';
  if (!jobLoc.trim()) {
    return { subScore: 1, reason: 'Job has no location specified — location not scored.' };
  }
  const candidateLocs = [
    profile.currentLocation,
    profile.preferredJobLocation,
    ...(profile.preferredLocations || []),
  ].filter((v): v is string => !!v && typeof v === 'string' && v.trim() !== '');
  if (candidateLocs.length === 0) {
    return { subScore: 0, reason: 'Candidate location not provided — cannot confirm location fit.' };
  }
  const jobTokens = new Set(locationTokens(jobLoc));
  let best = 0;
  let bestReason = 'Candidate location does not overlap the job location.';
  for (const cl of candidateLocs) {
    const cTokens = locationTokens(cl);
    const overlap = cTokens.filter((t) => jobTokens.has(t));
    // City/region exact token overlap (e.g. "bengaluru" in both) -> 1.0
    if (overlap.length > 0) {
      const score = overlap.length >= 1 ? 1 : 0;
      if (score > best) {
        best = score;
        bestReason = `Candidate location "${cl}" matches the job location "${jobLoc}".`;
      }
    }
  }
  // Country-level fallback: if any candidate location and the job location
  // share a country token (last meaningful token) but no city overlap, give 0.5.
  if (best < 1) {
    const jobLast = [...jobTokens].pop() || '';
    for (const cl of candidateLocs) {
      const cLast = locationTokens(cl).pop() || '';
      if (jobLast && cLast && jobLast === cLast) {
        best = 0.5;
        bestReason = `Same broader region/country ("${jobLast}") — partial location fit.`;
        break;
      }
    }
  }
  return { subScore: best, reason: bestReason };
}

/** Work-mode compatibility matrix. */
function compareWorkMode(
  job: JobForMatching,
  profile: ProfileForMatching
): { subScore: number; reason: string; candidatePref: string | null } {
  const jobMode = (job.workArrangement || '').toLowerCase();
  const pref = profile.workModePreference || null;
  if (!pref) {
    return { subScore: 0, reason: 'Candidate work-mode preference not provided.', candidatePref: null };
  }
  if (pref === 'any') {
    return { subScore: 1, reason: "Candidate accepts any work mode ('any').", candidatePref: pref };
  }
  const candidate = pref.toLowerCase();
  let sub = 0;
  let reason = '';
  if (jobMode === 'remote') {
    if (candidate === 'remote' || candidate === 'hybrid') sub = 1;
    else sub = 0.3; // on-site-preferring candidate vs remote job — compatible but not ideal
    reason = `Remote job vs candidate "${candidate}" preference.`;
  } else if (jobMode === 'onsite') {
    if (candidate === 'on-site' || candidate === 'onsite') sub = 1;
    else if (candidate === 'hybrid') sub = 0.5;
    else sub = 0; // remote-preferring candidate vs on-site job — mismatch
    reason = `On-site job vs candidate "${candidate}" preference.`;
  } else if (jobMode === 'hybrid') {
    if (candidate === 'hybrid') sub = 1;
    else if (candidate === 'on-site' || candidate === 'onsite') sub = 0.7;
    else sub = 0.5;
    reason = `Hybrid job vs candidate "${candidate}" preference.`;
  } else {
    // Unknown job mode — do not penalize; mark neutral/full.
    sub = 1;
    reason = 'Job work mode not specified — work-mode not scored.';
  }
  return { subScore: sub, reason, candidatePref: pref };
}

/* ------------------------------ the engine ------------------------------ */

/**
 * Score a published job against a candidate's confirmed profile.
 * Pure + deterministic. Returns a fully-structured, explainable result.
 */
export function scoreJobCandidate(
  job: JobForMatching,
  profile: ProfileForMatching
): MatchResult {
  /* --- required + preferred skills (deduped, no double-counting) --- */
  const requiredSkills = Array.isArray(job.skills) ? job.skills : [];
  const candidatePool = canonicalSkillSet(profile.skills, profile.techStack);

  const matchedRequiredSkills: string[] = [];
  const missingRequiredSkills: string[] = [];
  const matchedRequiredCanonical = new Set<string>();
  for (const r of requiredSkills) {
    const c = canonicalSkill(r);
    if (!c) continue;
    if (candidatePool.has(c)) {
      matchedRequiredSkills.push(r);
      matchedRequiredCanonical.add(c);
    } else {
      missingRequiredSkills.push(r);
    }
  }
  const requiredSub =
    requiredSkills.length === 0
      ? null // no required skills listed -> dimension N/A
      : matchedRequiredSkills.length / requiredSkills.length;

  const preferredSkills = Array.isArray(job.preferredSkills) ? job.preferredSkills : [];
  const matchedPreferredSkills: string[] = [];
  const missingPreferredSkills: string[] = [];
  for (const p of preferredSkills) {
    const c = canonicalSkill(p);
    if (!c) continue;
    if (matchedRequiredCanonical.has(c)) continue; // no double-count
    if (candidatePool.has(c)) matchedPreferredSkills.push(p);
    else missingPreferredSkills.push(p);
  }
  const preferredSub =
    preferredSkills.length === 0 ? null : matchedPreferredSkills.length / preferredSkills.length;

  /* --- experience --- */
  const requiredYears = parseExperienceYears(job.experienceRequired);
  const candidateYears =
    typeof profile.totalExperienceYears === 'number' && Number.isFinite(profile.totalExperienceYears)
      ? profile.totalExperienceYears
      : null;
  let experienceSub: number | null;
  let experienceReason: string;
  if (requiredYears === null) {
    experienceSub = null; // job has no parseable experience requirement
    experienceReason = 'Job has no parseable experience requirement — experience not scored.';
  } else if (candidateYears === null) {
    experienceSub = 0;
    experienceReason = `Job requires ~${requiredYears}+ years; candidate experience not provided.`;
  } else if (candidateYears >= requiredYears) {
    experienceSub = 1;
    experienceReason = `Candidate has ${candidateYears} yrs (requires ~${requiredYears}+).`;
  } else if (requiredYears > 0) {
    experienceSub = candidateYears / requiredYears; // partial — below requirement
    experienceReason = `Candidate has ${candidateYears} yrs (requires ~${requiredYears}+) — below requirement.`;
  } else {
    experienceSub = 1; // requires 0 years (entry) — any experience matches
    experienceReason = `Entry-level requirement; candidate has ${candidateYears} yrs.`;
  }

  /* --- location --- */
  const loc = compareLocation(job, profile);
  const locationSub = loc.subScore;

  /* --- work mode --- */
  const wm = compareWorkMode(job, profile);
  const workModeSub = wm.subScore;

  /* --- employment type --- */
  const jobTypeNorm = normalizeEmploymentType(job.employmentType);
  const candidateTypePref = profile.preferredEmploymentType || null;
  let employmentSub: number;
  let employmentReason: string;
  if (!candidateTypePref) {
    employmentSub = 0;
    employmentReason = 'Candidate employment-type preference not provided.';
  } else if (candidateTypePref === 'any') {
    employmentSub = 1;
    employmentReason = "Candidate accepts any employment type ('any').";
  } else {
    const candNorm = normalizeEmploymentType(candidateTypePref);
    // Map CMS job labels to profile enum labels: "Full Time" -> "fulltime" vs "full-time" -> "fulltime"
    if (candNorm === jobTypeNorm) {
      employmentSub = 1;
      employmentReason = `Job type "${job.employmentType}" matches candidate preference.`;
    } else {
      employmentSub = 0;
      employmentReason = `Job type "${job.employmentType}" does not match candidate preference "${candidateTypePref}".`;
    }
  }

  /* --- education (only if job specifies) --- */
  let educationApplicable = false;
  let educationSub = 0;
  let educationReason = 'Job has no education requirement — education not scored.';
  const eduReq = job.educationRequired;
  if (eduReq && eduReq.trim()) {
    educationApplicable = true;
    const eduEntries = Array.isArray(profile.education) ? profile.education : [];
    if (eduEntries.length === 0) {
      educationSub = 0;
      educationReason = `Job requires "${eduReq}"; candidate education not provided.`;
    } else {
      // Keyword overlap between the requirement and candidate qualifications.
      const reqTokens = new Set(
        eduReq.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2)
      );
      let bestOverlap = 0;
      for (const e of eduEntries) {
        const q = (e.qualification || '').toLowerCase();
        const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
        const overlap = tokens.filter((t) => reqTokens.has(t)).length;
        bestOverlap = Math.max(bestOverlap, overlap);
      }
      if (bestOverlap >= 1) {
        educationSub = 1;
        educationReason = `Candidate qualification overlaps the required "${eduReq}".`;
      } else {
        educationSub = 0.5;
        educationReason = `Candidate has a qualification but it does not clearly match "${eduReq}".`;
      }
    }
  }

  /* --- seniority / domain (only if job specifies seniority) --- */
  const jobSeniority = job.seniority && job.seniority.trim() ? job.seniority : null;
  const candidateSeniority = deriveCandidateSeniority(profile);
  let seniorityApplicable = false;
  let senioritySub = 0;
  let seniorityReason = 'Job has no seniority requirement — seniority not scored.';
  if (jobSeniority) {
    seniorityApplicable = true;
    const dist = seniorityDistance(jobSeniority, candidateSeniority);
    if (candidateSeniority === null) {
      senioritySub = 0;
      seniorityReason = `Job seniority "${jobSeniority}"; candidate seniority could not be derived.`;
    } else if (dist === 0) {
      senioritySub = 1;
      seniorityReason = `Candidate seniority "${candidateSeniority}" matches "${jobSeniority}".`;
    } else if (dist === 1) {
      senioritySub = 0.6;
      seniorityReason = `Candidate seniority "${candidateSeniority}" is adjacent to "${jobSeniority}".`;
    } else {
      senioritySub = 0.2;
      seniorityReason = `Candidate seniority "${candidateSeniority}" is below "${jobSeniority}".`;
    }
    // Light domain signal: job department/title keywords vs candidate headline/
    // employment history. Adds into the reason only (no separate weight) to avoid
    // double-counting skills.
    const domainHit = domainMatches(job, profile);
    if (domainHit) seniorityReason += ' Relevant domain background detected.';
  }

  /* --- assemble core weighted average (redistribution over applicable) --- */
  const dims: { name: string; detail: DimensionDetail }[] = [];
  const reasons: string[] = [];
  const otherEvidence: string[] = [];

  function addDim(
    name: string,
    weight: number,
    sub: number | null,
    reason: string
  ): DimensionDetail {
    const applicable = sub !== null;
    const detail: DimensionDetail = {
      applicable,
      weight,
      subScore: applicable ? (sub as number) : 0,
      contribution: 0, // filled after redistribution
      reason,
    };
    dims.push({ name, detail });
    if (applicable) {
      if ((sub as number) < 1) reasons.push(`${name}: ${reason}`);
      if ((sub as number) >= 1) otherEvidence.push(`${name}: ${reason}`);
    }
    return detail;
  }

  addDim('Required skills', WEIGHTS.requiredSkills, requiredSub,
    requiredSub === null
      ? 'No required skills listed on the job.'
      : `${matchedRequiredSkills.length}/${requiredSkills.length} required skills matched.` +
        (missingRequiredSkills.length ? ` Missing: ${missingRequiredSkills.join(', ')}.` : ''));
  const expDetail = addDim('Experience', WEIGHTS.experience, experienceSub, experienceReason);
  const locDetail = addDim('Location', WEIGHTS.location, locationSub, loc.reason);
  const wmDetail = addDim('Work mode', WEIGHTS.workMode, workModeSub, wm.reason);
  const etDetail = addDim('Employment type', WEIGHTS.employmentType, employmentSub, employmentReason);
  addDim('Preferred skills', WEIGHTS.preferredSkills, preferredSub,
    preferredSub === null
      ? 'No preferred skills listed on the job.'
      : `${matchedPreferredSkills.length}/${preferredSkills.length} preferred skills matched.`);
  const eduDetail = addDim('Education', WEIGHTS.education, educationApplicable ? educationSub : null, educationReason);
  const senDetail = addDim('Seniority/domain', WEIGHTS.seniorityDomain, seniorityApplicable ? senioritySub : null, seniorityReason);

  // Redistribute over applicable core dimensions.
  const applicable = dims.filter((d) => d.detail.applicable);
  const totalApplicableWeight = applicable.reduce((s, d) => s + d.detail.weight, 0);
  let coreScore = 0;
  if (totalApplicableWeight > 0) {
    for (const d of applicable) {
      const contrib = (d.detail.subScore * d.detail.weight) / totalApplicableWeight * 100;
      d.detail.contribution = Math.round(contrib * 100) / 100;
      coreScore += contrib;
    }
  }

  /* --- projects/certs bonus (additive, capped, relevance-gated) --- */
  const bonus = computeProjectsCertsBonus(job, profile);
  let overall = coreScore + bonus.points;
  if (overall > 100) overall = 100;
  if (overall < 0) overall = 0;
  const overallScore = Math.round(overall);
  if (bonus.points > 0) otherEvidence.push(`Projects/certifications: ${bonus.reason}`);

  /* --- eligibility (at the default threshold + hard gate on required skills) ---
   * The `eligible` boolean is a pre-pass using DEFAULT_MATCHING_THRESHOLD (80).
   * It is NOT the authoritative threshold decision — alert flows re-check via
   * meetsThreshold(result, threshold) with the admin-configurable global floor
   * (resolveMatchingThreshold). Wiring to the constant (not a literal 80) guards
   * against drift if the default ever changes. */
  const hasRequiredSkills = requiredSkills.length > 0;
  const matchedAnyRequired = matchedRequiredSkills.length > 0;
  const hardGatePass = !hasRequiredSkills || matchedAnyRequired;
  const eligible = overallScore >= DEFAULT_MATCHING_THRESHOLD && hardGatePass;
  if (hasRequiredSkills && !matchedAnyRequired) {
    reasons.push('No required skills matched — ineligible regardless of score.');
  }

  return {
    rubricVersion: RUBRIC_VERSION,
    overallScore,
    eligible,
    matchedRequiredSkills,
    missingRequiredSkills,
    matchedPreferredSkills,
    missingPreferredSkills,
    experience: { requiredYears, candidateYears, detail: expDetail },
    location: { jobLocation: job.location, isRemote: loc.reason.startsWith('Remote role'), detail: locDetail },
    workMode: { jobMode: job.workArrangement, candidatePreference: wm.candidatePref, detail: wmDetail },
    employmentType: { jobType: job.employmentType, candidatePreference: candidateTypePref, detail: etDetail },
    education: eduDetail,
    seniorityDomain: { jobSeniority, candidateSeniority, detail: senDetail },
    projectsCertsBonus: bonus,
    scoreReductionReasons: reasons,
    otherEvidence,
    dimensions: dims,
  };
}

/** Light domain signal: job department/title vs candidate headline/employment. */
function domainMatches(job: JobForMatching, profile: ProfileForMatching): boolean {
  const jobText = `${job.department || ''} ${job.title || ''}`.toLowerCase();
  const candText =
    `${profile.headline || ''} ${profile.summary || ''} ${(profile.employmentHistory || [])
      .map((e) => `${e.designation || ''} ${e.description || ''}`)
      .join(' ')}`.toLowerCase();
  if (!jobText.trim() || !candText.trim()) return false;
  // Match on meaningful department/role tokens.
  const tokens = jobText.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  let hits = 0;
  for (const t of tokens) if (candText.includes(t)) hits++;
  return hits >= 1;
}

/** Projects/certifications relevance bonus (additive, capped at BONUS_MAX). */
function computeProjectsCertsBonus(
  job: JobForMatching,
  profile: ProfileForMatching
): { points: number; reason: string } {
  const jobSkillCanonical = new Set<string>();
  for (const s of [...(job.skills || []), ...(job.preferredSkills || [])]) {
    const c = canonicalSkill(s);
    if (c) jobSkillCanonical.add(c);
  }
  if (jobSkillCanonical.size === 0) return { points: 0, reason: 'No job skills to match projects/certs against.' };
  const projectTechs = canonicalSkillSet(
    ...(profile.projects || []).map((p) => (p.technologies || '').split(','))
  );
  const certs = canonicalSkillSet(profile.certifications);
  const projectHits = [...projectTechs].filter((t) => jobSkillCanonical.has(t)).length;
  const certHits = [...certs].filter((t) => jobSkillCanonical.has(t)).length;
  const totalHits = projectHits + certHits;
  if (totalHits === 0) {
    return { points: 0, reason: 'No relevant projects or certifications matched the job skills.' };
  }
  // 1 hit -> 2 pts, 2+ hits -> 4 pts (capped).
  const points = Math.min(BONUS_MAX, totalHits >= 2 ? BONUS_MAX : 2);
  return {
    points,
    reason: `${totalHits} relevant project/certification skill${totalHits > 1 ? 's' : ''} matched (+${points} bonus).`,
  };
}

/**
 * Decide whether a match result clears a candidate's threshold. Pure helper used
 * by the notification engine so the threshold decision lives in one place and is
 * reproducible. Honors the required-skills hard gate.
 */
export function meetsThreshold(
  result: MatchResult,
  threshold: number
): { pass: boolean; reason: string } {
  if (result.matchedRequiredSkills.length === 0 && result.missingRequiredSkills.length > 0) {
    return { pass: false, reason: 'No required skills matched.' };
  }
  if (result.overallScore >= threshold) {
    return { pass: true, reason: `Score ${result.overallScore} >= threshold ${threshold}.` };
  }
  return { pass: false, reason: `Score ${result.overallScore} below threshold ${threshold}.` };
}
